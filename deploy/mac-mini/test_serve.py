"""Run with /usr/bin/python3 -m unittest discover -s deploy/mac-mini."""

from concurrent.futures import ThreadPoolExecutor
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import tempfile
import threading
import unittest
from unittest.mock import patch
from urllib.error import HTTPError
from urllib.request import Request, urlopen

from serve import GameStaticServer


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass


class StaticServerTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        root = Path(self.temp.name)
        self.release = root / "release"
        self.release.mkdir()
        self.current = root / "current"
        self.current.symlink_to(self.release, target_is_directory=True)
        (self.release / "index.html").write_bytes(b"<html>game</html>")
        self.image = b"RIFF" + bytes(range(256)) * 256
        (self.release / "postcard.webp").write_bytes(self.image)
        self.server = GameStaticServer(
            ("127.0.0.1", 0), partial(QuietHandler, directory=str(self.current))
        )
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.base = "http://127.0.0.1:{}/".format(self.server.server_port)

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join(timeout=5)
        self.temp.cleanup()

    def read(self, path):
        with urlopen(self.base + path, timeout=10) as response:
            return response.status, response.read()

    def test_only_queue_is_overridden_and_listen_uses_128(self):
        overrides = {key for key in GameStaticServer.__dict__ if not key.startswith("__")}
        self.assertEqual(overrides, {"request_queue_size"})
        self.assertIs(GameStaticServer.__bases__[0], ThreadingHTTPServer)
        with patch.object(self.server, "socket") as listener:
            self.server.server_activate()
            listener.listen.assert_called_once_with(128)

    def test_200_concurrent_images_in_five_bursts(self):
        with ThreadPoolExecutor(max_workers=40) as pool:
            for round_index in range(5):
                paths = ["postcard.webp?round={}&n={}".format(round_index, n) for n in range(40)]
                for status, body in pool.map(self.read, paths):
                    self.assertEqual(status, 200)
                    self.assertEqual(body, self.image)

    def test_get_head_conditional_and_errors_keep_standard_behavior(self):
        self.assertEqual(self.read(""), (200, b"<html>game</html>"))
        with urlopen(Request(self.base + "postcard.webp", method="HEAD"), timeout=10) as response:
            self.assertEqual(response.status, 200)
            self.assertEqual(int(response.headers["Content-Length"]), len(self.image))
            self.assertEqual(response.read(), b"")
            modified = response.headers["Last-Modified"]
        with self.assertRaises(HTTPError) as error:
            urlopen(Request(self.base + "postcard.webp", headers={"If-Modified-Since": modified}), timeout=10)
        self.assertEqual(error.exception.code, 304)
        error.exception.close()
        for path, method, code in [("missing.webp", "GET", 404), ("", "POST", 501)]:
            with self.assertRaises(HTTPError) as error:
                urlopen(Request(self.base + path, method=method), timeout=10)
            self.assertEqual(error.exception.code, code)
            error.exception.close()

    def test_current_symlink_still_supports_release_switch_and_rollback(self):
        alternate = Path(self.temp.name) / "alternate"
        alternate.mkdir()
        (alternate / "index.html").write_bytes(b"previous release")
        self.current.unlink()
        self.current.symlink_to(alternate, target_is_directory=True)
        self.assertEqual(self.read(""), (200, b"previous release"))
        self.current.unlink()
        self.current.symlink_to(self.release, target_is_directory=True)
        self.assertEqual(self.read(""), (200, b"<html>game</html>"))


if __name__ == "__main__":
    unittest.main()

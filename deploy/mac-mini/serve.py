"""The existing Python static server, with room for a full postcard wall burst."""

import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer, test


class GameStaticServer(ThreadingHTTPServer):
    # This is the pending TCP accept queue, not a limit on player sessions.
    request_queue_size = 128


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("port", type=int, nargs="?", default=8788)
    parser.add_argument("--bind", default="0.0.0.0")
    parser.add_argument("--directory", required=True)
    args = parser.parse_args()
    print("Static server accept queue: {}".format(GameStaticServer.request_queue_size), flush=True)
    test(
        HandlerClass=partial(SimpleHTTPRequestHandler, directory=args.directory),
        ServerClass=GameStaticServer,
        port=args.port,
        bind=args.bind,
    )


if __name__ == "__main__":
    main()

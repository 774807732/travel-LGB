import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SaveNotice } from "../components/SaveNotice";

test("存档提示常驻、明确不自动同步，并提供备份迁移按钮而非弹窗", () => {
  const html = renderToStaticMarkup(createElement(SaveNotice, { onOpenSettings: () => {} }));
  assert.match(html, /<aside class="save-notice" aria-label="存档提示">/);
  assert.match(html, /更换手机或浏览器，<strong>不会自动同步存档<\/strong>。/);
  assert.match(html, /<button type="button">存档备份与迁移<\/button>/);
  assert.doesNotMatch(html, /role="(?:alert|dialog)"|aria-live/);
});

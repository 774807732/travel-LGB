import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Sheet } from "../components/Sheet";

test("手账复用宽弹窗，普通弹窗仍使用默认宽度类别", () => {
  const props = { title: "疙宝的手账", onClose: () => {}, children: "见闻" };
  assert.match(renderToStaticMarkup(createElement(Sheet, { ...props, wide: true })), /<dialog class="sheet sheet-wide"/);
  assert.match(renderToStaticMarkup(createElement(Sheet, props)), /<dialog class="sheet"/);
});

test("手账三标签统一加宽；桌面四列，窄屏保留原三列", async () => {
  const app = await readFile("src/App.tsx", "utf8");
  const css = await readFile("src/styles.css", "utf8");
  assert.match(app, /wide=\{\["journal", "souvenirs", "records"\]\.includes\(panel\)\}/);
  assert.match(css, /\.card-grid\s*\{[^}]*grid-template-columns:\s*repeat\(3, 1fr\)/);
  const desktop = css.slice(css.lastIndexOf("@media (min-width: 960px)"));
  assert.match(desktop, /\.sheet\s*\{[^}]*width:\s*min\(560px, calc\(100vw - 64px\)\)/);
  assert.match(desktop, /\.sheet-wide\s*\{[^}]*width:\s*min\(760px, calc\(100vw - 64px\)\)/);
  assert.match(desktop, /\.sheet-wide \.card-grid\s*\{[^}]*grid-template-columns:\s*repeat\(4, minmax\(0, 1fr\)\)/);
});

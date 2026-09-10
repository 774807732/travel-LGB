import test from "node:test";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import sharp from "sharp";
import { CARDS, FOODS, GEARS, SOUVENIRS } from "./content";

type Asset = { id: string; source: string; output: string; width: number };
const manifest = JSON.parse(
  await readFile("outputs/art/manifest.json", "utf8"),
) as Asset[];

test("30 个正式素材 ID 齐全，源图与网页资源均存在", async () => {
  const ids = [
    "home",
    "yard",
    "idle",
    "packing",
    "eating",
    "dozing",
    "walking",
    "satchel",
    "mail-clip",
    "harvest-tray",
    ...CARDS.map((x) => x.id),
    ...FOODS.map((x) => x.id),
    ...GEARS.map((x) => x.id),
    ...SOUVENIRS.map((x) => x.id),
  ];
  assert.equal(manifest.length, 30);
  assert.deepEqual(manifest.map((x) => x.id).sort(), ids.sort());
  for (const asset of manifest) {
    assert.ok((await stat(asset.source)).size > 0);
    assert.ok((await stat(asset.output)).size > 0);
  }
});
test("场景 3:4、见闻 3:2、单件 1:1，WebP 总包小于 5 MB", async () => {
  let bytes = 0;
  for (const asset of manifest) {
    const meta = await sharp(asset.output).metadata();
    assert.equal(meta.format, "webp");
    assert.equal(meta.width, asset.width);
    const ratio = asset.output.includes("/backgrounds/")
      ? 3 / 4
      : asset.output.includes("/cards/")
        ? 3 / 2
        : 1;
    assert.equal(meta.width! / meta.height!, ratio);
    bytes += (await stat(asset.output)).size;
  }
  assert.ok(bytes < 5 * 1024 * 1024, "网页不带高分辨率概念板和源 PNG");
});
test("直接叠景的角色和道具具备真实 alpha，四角全透明", async () => {
  const ids = new Set([
    "idle",
    "packing",
    "eating",
    "dozing",
    "walking",
    "satchel",
    "mail-clip",
    "harvest-tray",
  ]);
  for (const asset of manifest.filter((a) => ids.has(a.id))) {
    const meta = await sharp(asset.output).metadata();
    assert.equal(meta.hasAlpha, true, asset.id + " 不能使用伪透明棋盘或白底");
    for (const [left, top] of [
      [0, 0],
      [meta.width! - 1, 0],
      [0, meta.height! - 1],
      [meta.width! - 1, meta.height! - 1],
    ]) {
      const pixel = await sharp(asset.output)
        .extract({ left, top, width: 1, height: 1 })
        .ensureAlpha()
        .raw()
        .toBuffer();
      assert.equal(pixel[3], 0, asset.id + " 角落必须透明");
    }
  }
});

import test from "node:test";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import sharp from "sharp";
import { CARDS, FOODS, GEARS, SOUVENIRS } from "./content";

type Asset = { id: string; source: string; output: string; width: number };
const manifest = JSON.parse(
  await readFile("outputs/art/manifest.json", "utf8"),
) as Asset[];

test("32 个正式素材 ID 齐全，源图与网页资源均存在", async () => {
  const ids = [
    "home",
    "yard",
    "idle",
    "packing",
    "eating",
    "dozing",
    "walking",
    "jump-atlas",
    "departure-note",
    "satchel",
    "mail-clip",
    "harvest-tray",
    ...CARDS.map((x) => x.id),
    ...FOODS.map((x) => x.id),
    ...GEARS.map((x) => x.id),
    ...SOUVENIRS.map((x) => x.id),
  ];
  assert.equal(manifest.length, 32);
  assert.deepEqual(manifest.map((x) => x.id).sort(), ids.sort());
  for (const asset of manifest) {
    assert.ok((await stat(asset.source)).size > 0);
    assert.ok((await stat(asset.output)).size > 0);
  }
});
test("场景 3:4、见闻/图集/信笺 3:2、单件 1:1，WebP 总包小于 5 MB", async () => {
  let bytes = 0;
  for (const asset of manifest) {
    const meta = await sharp(asset.output).metadata();
    assert.equal(meta.format, "webp");
    assert.equal(meta.width, asset.width);
    const ratio = asset.output.includes("/backgrounds/")
      ? 3 / 4
      : asset.output.includes("/cards/") ||
          ["jump-atlas", "departure-note"].includes(asset.id)
        ? 3 / 2
        : 1;
    assert.equal(meta.width! / meta.height!, ratio);
    bytes += (await stat(asset.output)).size;
  }
  assert.ok(bytes < 5 * 1024 * 1024, "网页不带高分辨率概念板和源 PNG");
});
test("六个跳跃姿态各占完整单元，四条格边全透明且每格有实色角色", async () => {
  const { data, info } = await sharp("public/art/characters/jump-atlas.webp")
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const cell = info.width / 3;
  assert.equal(info.height, cell * 2);
  for (let frame = 0; frame < 6; frame++) {
    const left = (frame % 3) * cell,
      top = Math.floor(frame / 3) * cell;
    let solid = 0;
    for (let y = 0; y < cell; y++)
      for (let x = 0; x < cell; x++) {
        const alpha = data[((top + y) * info.width + left + x) * 4 + 3];
        if (x === 0 || y === 0 || x === cell - 1 || y === cell - 1)
          assert.equal(alpha, 0, `frame ${frame} 边缘不能裁掉后腿或混入邻帧`);
        if (alpha > 200) solid++;
      }
    assert.ok(solid > cell * cell * 0.08, `frame ${frame} 不能空白`);
  }
});
test("直接叠景的角色和道具具备真实 alpha，四角全透明", async () => {
  const ids = new Set([
    "idle",
    "packing",
    "eating",
    "dozing",
    "walking",
    "jump-atlas",
    "departure-note",
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

import test from "node:test";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { CARDS, FOODS, GEARS, SOUVENIRS, itemImage } from "./content";
import { SCENE_ASPECTS, sceneImage } from "./walkable";

type Asset = { id: string; source: string; output: string; width: number };
const manifest = JSON.parse(
  await readFile("outputs/art/manifest.json", "utf8"),
) as Asset[];

test("正式素材 ID 齐全，横竖场景与源图均存在", async () => {
  const ids = [
    "home",
    "yard",
    "home-web",
    "yard-web",
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
  assert.equal(manifest.length, 49);
  assert.deepEqual(manifest.map((x) => x.id).sort(), ids.sort());
  for (const asset of manifest) {
    assert.ok((await stat(asset.source)).size > 0);
    assert.ok((await stat(asset.output)).size > 0);
  }
});
test("横版约 16:9 / 竖版 3:4，纪念物 PNG，十六卡完整资源小于 6 MiB", async () => {
  let bytes = 0;
  for (const asset of manifest) {
    const meta = await sharp(asset.output).metadata();
    assert.equal(
      meta.format,
      asset.id.startsWith("souvenir_") ? "png" : "webp",
    );
    assert.equal(meta.width, asset.width);
    const ratio = asset.output.includes("/backgrounds/")
      ? asset.id.endsWith("-web")
        ? SCENE_ASPECTS.wide
        : SCENE_ASPECTS.portrait
      : asset.output.includes("/cards/") ||
          ["jump-atlas", "departure-note"].includes(asset.id)
        ? 3 / 2
        : 1;
    assert.equal(meta.width! / meta.height!, ratio);
    bytes += (await stat(asset.output)).size;
  }
  // 四张新增 1200×800 卡约 0.96 MiB；原图不降质，整包预算相应增加 1 MiB。
  assert.ok(bytes < 6 * 1024 * 1024, "网页只带交付图，不带概念板和源 PNG");
  for (const layout of ["portrait", "wide"] as const) {
    for (const scene of ["home", "yard"] as const) {
      const asset = manifest.find(
        (a) => a.output === `public${sceneImage(scene, layout)}`,
      );
      assert.ok(asset, `${layout}/${scene} 必须有独立交付图`);
      if (layout === "wide")
        assert.ok(asset.width >= 1536, "横版必须使用模型重绘的大图");
    }
  }
  for (const item of [...FOODS, ...GEARS, ...SOUVENIRS]) {
    assert.equal(
      manifest.find((a) => a.id === item.id)?.output,
      `public${itemImage(item.id)}`,
    );
  }
});
test("四张定稿与用户选定源图逐字节一致，交付保持完整 3:2 且单图小于 300 KiB", async () => {
  const selected = {
    card_daoming_04: ["cards-fourth-v2/card_daoming_04.png", "a7de951df9dcf4da2d34b22ccaf72e44aa9b44b5640b638c8651b69bb860aeff"],
    card_tea_04: ["cards-fourth-v7/card_tea_04.png", "52bbcfdb66a7316f649daaf1614c2ade7e29d0e2481a38ec53101d58660f2d3f"],
    card_river_04: ["cards-fourth-v1/card_river_04-v2.png", "60ea2623ccbd3434ef27d2f7dfc1232b3db7cef5f45bf069814c80ec6898dcf4"],
    card_tianba_04: ["cards-fourth-v7/card_tianba_04.png", "ec74dae287596c3753a327f35fdcf18451f1662e91ea166039656e38cd36b3bc"],
  };
  for (const [id, [candidate, hash]] of Object.entries(selected)) {
    const asset = manifest.find((a) => a.id === id)!;
    const source = await readFile(asset.source);
    assert.equal(createHash("sha256").update(source).digest("hex"), hash);
    assert.deepEqual(source, await readFile(`outputs/art/candidates/${candidate}`));
    const meta = await sharp(source).metadata();
    assert.equal(meta.width, 1536);
    assert.equal(meta.height, 1024);
    const encoded = await sharp(asset.output).raw().toBuffer({ resolveWithObject: true });
    assert.equal(encoded.info.width, 1200);
    assert.equal(encoded.info.height, 800);
    assert.ok((await stat(asset.output)).size < 300 * 1024);
  }
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
    ...SOUVENIRS.map((x) => x.id),
    "food_sweet_potato_congee",
    "gear_straw_hat",
    "gear_oilpaper_umbrella",
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
    if (asset.id.startsWith("souvenir_") || asset.id === "gear_oilpaper_umbrella") {
      const { data, info } = await sharp(asset.output)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
      let transparent = 0,
        solid = 0;
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] === 0) transparent++;
        if (data[i] > 240) solid++;
      }
      assert.ok(
        transparent > info.width * info.height * 0.15,
        asset.id + " 外围应真实镂空",
      );
      assert.ok(
        solid > info.width * info.height * 0.08,
        asset.id + " 物件本身应保留实色",
      );
    }
  }
});

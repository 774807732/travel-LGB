// 仅做交付编码、缩放与动画帧对齐；不重绘、不移除背景，保留真实 alpha。
import { createRequire } from "node:module";
import { mkdir, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
const require = createRequire(import.meta.url);
const sharp = require("sharp");
const manifest = JSON.parse(
  await readFile(
    resolve(process.argv[2] ?? "outputs/art/manifest.json"),
    "utf8",
  ),
);
for (const asset of manifest) {
  if (process.argv[3] && asset.id !== process.argv[3]) continue;
  const source = resolve(asset.source),
    target = resolve(asset.output);
  await mkdir(dirname(target), { recursive: true });
  const meta = await sharp(source).metadata();
  let pipeline = sharp(source);
  if (asset.atlas) {
    const { cellSize, columns, rows, frames } = asset.atlas;
    if (!meta.hasAlpha) throw new Error(asset.id + " 必须为真透明图集");
    const layers = await Promise.all(
      frames.map(async (frame, index) => ({
        input: await sharp(source).extract(frame.extract).png().toBuffer(),
        left: (index % columns) * cellSize + frame.left,
        top: Math.floor(index / columns) * cellSize + frame.top,
      })),
    );
    // 生成图没有严格遵守网格；只把完整姿态重新对齐到等大透明格。
    pipeline = sharp(
      await sharp({
        create: {
          width: columns * cellSize,
          height: rows * cellSize,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        },
      })
        .composite(layers)
        .png()
        .toBuffer(),
    );
  }
  pipeline = pipeline.resize({
    width: asset.width ?? 960,
    withoutEnlargement: true,
  });
  if (target.endsWith(".png")) {
    if (!meta.hasAlpha) throw new Error(asset.id + " PNG 必须保留真实透明通道");
    await pipeline.png({ compressionLevel: 9 }).toFile(target);
  } else {
    await pipeline.webp({ quality: 88, alphaQuality: 100 }).toFile(target);
  }
  console.log(
    JSON.stringify({
      id: asset.id,
      output: asset.output,
      width: meta.width,
      height: meta.height,
      hasAlpha: meta.hasAlpha,
    }),
  );
}

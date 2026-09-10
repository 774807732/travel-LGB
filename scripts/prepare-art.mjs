// 仅做交付编码与缩放；不生成内容、不手工移除背景。
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
  const source = resolve(asset.source),
    target = resolve(asset.output);
  await mkdir(dirname(target), { recursive: true });
  const meta = await sharp(source).metadata();
  await sharp(source)
    .resize({ width: asset.width ?? 960, withoutEnlargement: true })
    .webp({ quality: 88, alphaQuality: 100 })
    .toFile(target);
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

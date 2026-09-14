// 将内置生图的筒靴定稿去掉假透明棋盘，并为现有物品展示位补足留白。
// 原图与第一次编辑保留；不重绘鞋体，不删除靴口/鞋面的原始颜色。
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve("outputs/art/source/rain-boots-v2");
const source = `${root}/gear_rain_boots-generated.png`;
const { data, info } = await sharp(source).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const { width, height } = info;
const n = width * height;
const foreground = new Uint8Array(n);
for (let i = 0; i < n; i++) {
  const r = data[i * 3], g = data[i * 3 + 1], b = data[i * 3 + 2];
  // 棋盘是明亮中性灰；黑胶、深褐轮廓与棕赭/米黄口沿均落在主体侧。
  foreground[i] = Math.max(r, g, b) - Math.min(r, g, b) > 18 || Math.min(r, g, b) < 150 ? 1 : 0;
}
const visited = new Uint8Array(n);
const components = [];
for (let start = 0; start < n; start++) {
  if (!foreground[start] || visited[start]) continue;
  const component = [start];
  visited[start] = 1;
  for (let p = 0; p < component.length; p++) {
    const i = component[p], x = i % width, y = Math.floor(i / width);
    for (const j of [x > 0 ? i - 1 : -1, x < width - 1 ? i + 1 : -1, y > 0 ? i - width : -1, y < height - 1 ? i + width : -1]) {
      if (j >= 0 && foreground[j] && !visited[j]) { visited[j] = 1; component.push(j); }
    }
  }
  if (component.length > n * 0.03) components.push(component);
}
if (components.length < 1 || components.length > 2) throw new Error("筒靴主体连通片异常，停止交付");
const rgba = Buffer.alloc(n * 4);
let left = width, top = height, right = 0, bottom = 0, opaque = 0;
for (const component of components) for (const i of component) {
  data.copy(rgba, i * 4, i * 3, i * 3 + 3);
  rgba[i * 4 + 3] = 255;
  const x = i % width, y = Math.floor(i / width);
  left = Math.min(left, x); right = Math.max(right, x);
  top = Math.min(top, y); bottom = Math.max(bottom, y); opaque++;
}
if (opaque < n * 0.2 || opaque > n * 0.8) throw new Error("筒靴遮罩占比异常，停止交付");
await mkdir(root, { recursive: true });
const cutout = await sharp(rgba, { raw: { width, height, channels: 4 } }).png().toBuffer();
await sharp(cutout).toFile(`${root}/gear_rain_boots-cutout.png`);
const side = Math.min(width, height), inset = Math.round(side * 0.1), target = side - inset * 2;
const boots = await sharp(cutout).extract({ left, top, width: right - left + 1, height: bottom - top + 1 })
  .resize({ width: target, height: target, fit: "inside" }).png().toBuffer();
const bootsMeta = await sharp(boots).metadata();
await sharp({ create: { width: side, height: side, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite([{ input: boots, left: Math.floor((side - bootsMeta.width) / 2), top: Math.floor((side - bootsMeta.height) / 2) }])
  .png().toFile(`${root}/gear_rain_boots.png`);

// 浅/深底及真实展示尺寸，仅用于验收。
const tile = await sharp(`${root}/gear_rain_boots.png`).resize(300, 300).toBuffer();
const dark = await sharp({ create: { width: 500, height: 300, channels: 4, background: "#27384a" } }).png().toBuffer();
const layers = [{ input: dark, left: 500, top: 0 }, { input: tile, left: 0, top: 0 }, { input: tile, left: 500, top: 0 }];
for (const offset of [0, 500]) {
  let top = 14;
  for (const size of [65, 68, 93]) {
    layers.push({ input: await sharp(`${root}/gear_rain_boots.png`).resize(size, size).toBuffer(), left: offset + 350, top });
    top += size + 15;
  }
}
await sharp({ create: { width: 1000, height: 300, channels: 4, background: "#f3ebdd" } })
  .composite(layers).png().toFile(`${root}/浅深底与小尺寸验收.png`);
await writeFile(`${root}/透明处理记录.json`, JSON.stringify({
  updatedAt: "2026-09-14", source: "outputs/art/source/rain-boots-v2/gear_rain_boots-generated.png",
  originalMode: "RGB", outputMode: "RGBA", width: side, height: side,
  generatedAlpha: false, method: "明亮中性背景与深色/彩色主体分离，保留主体连通片原始 RGB；透明裁边后等比缩至 80% 画布并补足留白",
  sourceBounds: { left, top, right, bottom }, foregroundPixelsBeforeResize: opaque,
  sourceUnchanged: true, redrawByScript: false,
}, null, 2) + "\n");
console.log(JSON.stringify({ source, output: `${root}/gear_rain_boots.png`, width: side, height: side, opaque, left, top, right, bottom }));

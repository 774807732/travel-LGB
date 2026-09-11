// 用户于 2026-09-11 明确授权程序抠图。只移除已画入的灰色棋盘背景，原图不覆盖。
// 主体的彩色闭合轮廓作为边界，填回轮廓内部的白色/灰色材质与高光。
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve("outputs/art");
const ids = ["glass_panda", "corn", "sweet_potato", "bamboo_dragonfly", "palm_fan", "wooden_boat", "small_pumpkin"].map(x => `souvenir_${x}`);
// 田坝条件见闻接入所需的既有配套素材；不重新生成、仅清背景。
if (process.argv.includes("--tianba")) ids.push("food_sweet_potato_congee", "gear_straw_hat");
const outputDir = `${root}/source/souvenirs-alpha-v1`;
await mkdir(outputDir, { recursive: true });

function neighbors(i, w, h) {
  const x = i % w, y = Math.floor(i / w);
  return [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, y > 0 ? i - w : -1, y < h - 1 ? i + w : -1].filter(n => n >= 0);
}

const records = [];
for (const id of ids) {
  const source = `${root}/candidates/${id.startsWith("souvenir_") ? "souvenirs-twelve-v1" : "tianba-v1"}/${id}.png`;
  const { data, info: { width: w, height: h } } = await sharp(source).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const n = w * h, colored = new Uint8Array(n), visited = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const r = data[i * 3], g = data[i * 3 + 1], b = data[i * 3 + 2];
    colored[i] = Math.max(r, g, b) - Math.min(r, g, b) > 18 ? 1 : 0;
    // 去掉画在背景上的半透明蒸气；保留碗沿和右侧木勺。
    if (id === "food_sweet_potato_congee" && Math.floor(i / w) < 316 && i % w < 920) colored[i] = 0;
  }
  // 排除背景中的零星压缩色差，仅保留主体最大连通片。
  let largest = [];
  for (let start = 0; start < n; start++) {
    if (!colored[start] || visited[start]) continue;
    const component = [start]; visited[start] = 1;
    for (let p = 0; p < component.length; p++) {
      for (const next of neighbors(component[p], w, h)) {
        if (colored[next] && !visited[next]) { visited[next] = 1; component.push(next); }
      }
    }
    if (component.length > largest.length) largest = component;
  }
  if (largest.length < n * .05) throw new Error(`${id}: 主体识别失败`);
  const outline = new Uint8Array(n);
  for (const i of largest) outline[i] = 1;
  // 从四周灌入背景，保留主体内部的浅色琉璃、高光，保留与外部相连的叶片空隙。
  const outside = new Uint8Array(n), queue = [];
  function add(i) { if (!outline[i] && !outside[i]) { outside[i] = 1; queue.push(i); } }
  for (let x = 0; x < w; x++) { add(x); add((h - 1) * w + x); }
  for (let y = 0; y < h; y++) { add(y * w); add(y * w + w - 1); }
  // 草帽下颏绳的两个闭合空隙也属于背景，并非帽子本体。
  if (id === "gear_straw_hat") { add(890 * w + 560); add(1100 * w + 551); }
  for (let p = 0; p < queue.length; p++) for (const j of neighbors(queue[p], w, h)) add(j);
  const rgba = Buffer.alloc(n * 4);
  let opaque = 0, left = w, top = h, right = 0, bottom = 0;
  for (let i = 0; i < n; i++) {
    if (outside[i]) continue;
    data.copy(rgba, i * 4, i * 3, i * 3 + 3); rgba[i * 4 + 3] = 255; opaque++;
    const x = i % w, y = Math.floor(i / w);
    left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y);
  }
  const output = `${outputDir}/${id}.png`;
  await sharp(rgba, { raw: { width: w, height: h, channels: 4 } }).png().toFile(output);
  records.push({ id, source, output, width: w, height: h, mode: "RGBA", transparentPixels: n - opaque, opaquePixels: opaque, subjectBounds: { left, top, right, bottom }, sourceUnchanged: true, method: "彩色主体最大连通片+外部背景灌填；保留内部原始 RGB；交付缩小采用预乘 alpha 抗锯齿" });
  console.log(id, "transparent:", n - opaque);
}
await writeFile(`${outputDir}/透明处理记录.json`, JSON.stringify({ updatedAt: "2026-09-11", authorization: "这7张素材你抠出透明png再用啊", generatedNewArt: false, records }, null, 2) + "\n");

// 浅色与深色双底验收板，仅用于检查，不作为游戏素材。
const layers = [], columns = ids.length;
for (let row = 0; row < 2; row++) for (let col = 0; col < ids.length; col++) {
  const tile = await sharp(`${outputDir}/${ids[col]}.png`).resize(200, 200).toBuffer();
  layers.push({ input: tile, left: col * 200, top: row * 220 + 10 });
}
const dark = await sharp({ create: { width: columns * 200, height: 220, channels: 4, background: "#27384a" } }).png().toBuffer();
await sharp({ create: { width: columns * 200, height: 440, channels: 4, background: "#f6eedc" } }).composite([{ input: dark, top: 220, left: 0 }, ...layers]).png().toFile(`${outputDir}/浅深底验收.png`);

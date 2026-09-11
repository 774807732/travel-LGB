# 纪念物透明 PNG

更新：2026-09-11｜1.2.2；使用 imagegen 内置工具，三件各一次背景提取，无重试。只缩放与 PNG 编码，不手工抠图；原图保留。

## 最终素材

| 物件 | 源图（outputs/art/source/） | 网页透明 PNG（public/art/items/） |
|---|---|---|
| 小竹垫 | souvenir_bamboo_mat-alpha.png（复用） | souvenir_bamboo_mat.png |
| 小竹篮 | souvenir_bamboo_basket-alpha.png（复用） | souvenir_bamboo_basket.png |
| 盖碗 | souvenir_gaiwan-alpha-v2.png | souvenir_gaiwan.png |
| 小竹凳 | souvenir_tea_stool-alpha.png（复用） | souvenir_tea_stool.png |
| 河街小画 | souvenir_river_sketch-alpha-v2.png | souvenir_river_sketch.png |
| 卵石 | souvenir_pebble-alpha-v2.png | souvenir_pebble.png |

源图 1254×1254，交付图 300×300，均有真实 alpha，四角为 0。六张交付图完全透明比例依次为 63.04% / 54.88% / 50.86% / 58.40% / 59.27% / 58.71%。新三件主体采样 alpha=253（约 99.2% 不透明），白色瓷面、整张画纸及石头高光完整。盖碗与石头源图外围各有 26 / 2 个 alpha=1 的微弱噪点，保留原样，未手工涂改。

所有显示位置由 `itemImage` 取 PNG，正常合成；去掉 UI 白底、边框、内距与卡片旋转，架上仅保留轮廓投影。旧 WebP 和白底源图仅保留历史，不被当前界面引用。

## 三件新处理的原样提示词

### souvenir_gaiwan_transparent

输入：`souvenir_gaiwan.png`（原始白底源图）。

```text
Use case: background-extraction
Asset type: transparent PNG game souvenir cutout
Input images: Image 1 is the sole edit target: the original blue and cream ceramic gaiwan illustration.
Primary request: Remove ONLY the surrounding white backdrop and output the same entire gaiwan as a clean isolated cutout with a genuinely transparent RGBA background. Pixels outside the object must have alpha exactly zero.
Subject invariants: Preserve the complete lid with its knob, bowl, foot, and saucer; preserve the same silhouette, composition, blue botanical decoration, cream-white porcelain, original brown contours, muted colors, and flat gouache brush texture. Every porcelain interior, including white and cream regions, remains opaque.
Composition/framing: One centered object in the same square composition, full silhouette visible with transparent padding.
Constraints: Change only the exterior white background. Preserve all object pixels and appearance as closely as possible. No checkerboard or simulated transparency; no white matte, backdrop, ground, cast shadow, halo, extra objects, accessories, text, watermark, collage, or montage. True alpha transparency outside; opaque subject inside. Return a transparent PNG.
```

### souvenir_river_sketch_transparent

输入：`souvenir_river_sketch.png`（原始白底源图）。

```text
Use case: background-extraction
Asset type: transparent PNG game souvenir cutout
Input images: Image 1 is the sole edit target: the original tilted physical cream paper sheet with a river and rural rooftops painting.
Primary request: Remove ONLY the surrounding white backdrop OUTSIDE the paper sheet and output this same paper object as a clean isolated cutout with a genuinely transparent RGBA background. Pixels outside the paper's brown perimeter must have alpha exactly zero.
Subject invariants: The entire cream sheet itself is the physical object and MUST remain opaque, including its blank cream margins and all light regions of the painting. Preserve the exact paper silhouette, tilt, rounded corners, brown contour, river scene, bridge, rural tiled rooftops, foliage, muted colors, and original flat gouache brush texture. Do not extract the landscape from the paper; keep the whole paper with its image.
Composition/framing: One centered paper object in the same square composition, full silhouette visible with transparent padding.
Constraints: Change only the exterior white background. Preserve all object pixels and appearance as closely as possible. No checkerboard or simulated transparency; no white matte, extra card, backdrop, ground, cast shadow, halo, added objects, accessories, text, watermark, collage, or montage. True alpha transparency outside the paper; opaque paper inside. Return a transparent PNG.
```

### souvenir_pebble_transparent

输入：`souvenir_pebble.png`（原始白底源图）。

```text
Use case: background-extraction
Asset type: transparent PNG game souvenir cutout
Input images: Image 1 is the sole edit target: the original single oval gray pebble illustration.
Primary request: Remove ONLY the surrounding white backdrop and output the same pebble as a clean isolated cutout with a genuinely transparent RGBA background. Pixels outside the pebble must have alpha exactly zero.
Subject invariants: Preserve the single oval pebble, exact silhouette and composition, pale upper-left highlight, gray and taupe shading, original brown contour, muted colors, and flat gouache brush texture. All of the stone including its pale highlight remains fully opaque.
Composition/framing: One centered object in the same square composition, full silhouette visible with transparent padding.
Constraints: Change only the exterior white background. Preserve all object pixels and appearance as closely as possible. No checkerboard or simulated transparency; no white matte, backdrop, ground, cast shadow, halo, extra objects, accessories, text, watermark, collage, or montage. True alpha transparency outside; opaque subject inside. Return a transparent PNG.
```

复用三件的历史生成提示词见 `纪念物透明处理记录.json` 与 `动作与物品提示词.json`。

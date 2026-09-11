# Web 横版场景重绘

更新：2026-09-11｜1.3；使用 imagegen 内置生图模型，两景各一次请求，无重试。旧竖版仅为风格与物件参考，新场景重新构图。

## 实际交付

| 场景 | 原图 | 网页图 | 原生/交付尺寸 |
|---|---|---|---|
| 屋里 | source/home-web.png | ../../public/art/backgrounds/home-web.webp | 1672×941 |
| 院坝 | source/yard-web.png | ../../public/art/backgrounds/yard-web.webp | 1672×941 |

以上网页路径以项目根的 `public/art/backgrounds/` 为准。生成请求写明 2560×1440，工具实际返回 1672×941；未放大、裁切、拉伸，只做 WebP 编码。完整保留原图，按 1672:941 比例显示（约16:9）。屋里 178,970 字节、院坝 399,846 字节。角色、行囊、纪念物、信封和收成仍为独立素材，背景未混入角色/UI。

## 原图目测坐标

以左上为原点、全图宽高归一化；碰撞在画面边界上再为身体留出空间，并非直接照抄矩形。

| 元素 | 范围/接地点 |
|---|---|
| 屋里桌面 | x=.606–.851，y=.659–.781；行囊接地点 (.729,.731) |
| 左下小架顶面 | x=.075–.202，y=.704–.742；纪念物接地点 (.136,.723) |
| 屋里门洞 | x=.700–.836，y=.156–.471 |
| 院坝门扇 | x=.159–.273，y=.214–.527 |
| 院坝信桩含底座 | x=.678–.720，y=.414–.679；信夹中心 (.697,.470) |
| 院坝货架 | x=.748–.922，y=.277–.551 |

已查看两张原图并核对上述位置。室内床沿/右柜靠边，院坝木桩有小侧榫；不影响中心空地与独立信夹。此为图片核对，不是浏览器试玩。

## 原样提示词

### 屋里

```text
Use case: stylized-concept
Asset type: finished character-free interactive background illustration for a desktop Web Sichuan travel-toad game.
Input images: Image 1 (/Users/jojo/Documents/ChatGPT/旅行癞疙宝/public/art/backgrounds/home.webp) is a STYLE AND CONTENT REFERENCE ONLY: use its specific rural wooden room, bamboo bed, cream bedding, indigo bamboo-pattern cloth, warm wood colors, fine linework and gentle gouache brushwork. It is not a pixel editing or stretching target.
Primary request: DRAW A NEW spacious 16:9 landscape composition of the SAME HOME, requested native canvas 2560 × 1440 pixels, highest appropriate native resolution. Redesign the composition across a wide desktop frame while keeping natural furniture proportions. Do not stretch, crop, pad, mirror, or merely extend the portrait reference.
Scene/backdrop: calm rural Sichuan timber-and-plaster room, seen with the reference's gently elevated frontal / mild isometric perspective. Back wall in upper half, and broad walkable warm wooden floor taking roughly the lower 55% of the canvas. Timber ceiling and beams, pale plaster wall, bamboo and a blue-green canal visible outside.
Layout: all positions are approximate normalized coordinates (x from left, y from top).
- Bamboo bed with cream quilt, small muted indigo pillow/bolster, and cream gauzy drape in the upper-left, within x .03–.25, y .22–.60. Entire bed visible with safe margins.
- Wooden lattice window and rolled bamboo blind centered on back wall at x .30–.58, y .12–.33. A plain low warm-wood cupboard directly under it at x .30–.58, y .34–.45.
- Open timber door onto a bamboo courtyard at upper-right, x .75–.90, y .12–.52, indigo cloth with simple bamboo leaf decoration above door; entire doorway visible. Small plain wood cupboard at far right with indigo fabric cover.
- An EMPTY low rectangular wooden table, fully visible, in lower-right-middle around x .59–.78, y .63–.86, resting on one small straw mat edged in muted indigo blue. Clear bare tabletop, enough visual room for the game to overlay a separate 58-pixel satchel later. DO NOT draw the satchel.
- An EMPTY small two-tier wooden souvenir shelf in lower-left, around x .06–.21, y .66–.87. Upper horizontal surface clearly visible so the game can later overlay a small souvenir. DO NOT draw souvenirs.
- A few modest potted green plants only at outer edges, never blocking the central floor.
Composition: keep a broad uninterrupted path across the middle and routes around the low table. Large uncluttered floor center and lower half. Every essential furniture item fully inside the frame with safe outer margins. No foreground railing, threshold beam or foreground wall cutting off the floor. Reference object identities and materials remain recognizable.
Style/medium: match the reference's soft hand-painted gouache, delicate dark warm outlines, restrained brush texture, pale warm wood, muted indigo cloth, soft cream fabric, gentle greens. Cozy readable 2D game scenery, calm daylight, soft contact shadows, coherent simple perspective.
Constraints: environment only. NO toad, frog, human, animal, character, sprite, UI, interface, lettering, numbers, signs, logos, watermark, floating objects, satchel, backpack, bag, envelope, letters, souvenir objects, harvest trays or crops on trays. Table and souvenir shelf must be completely EMPTY. No extra set dressing. Opaque full-bleed 16:9 landscape illustration.
```

### 院坝

```text
Use case: stylized-concept
Asset type: finished character-free interactive background illustration for a desktop Web Sichuan travel-toad game.
Input images: Image 1 (/Users/jojo/Documents/ChatGPT/旅行癞疙宝/public/art/backgrounds/yard.webp) is a STYLE AND CONTENT REFERENCE ONLY: use its exact rural house identity, gray curved tile roof, pale plaster and warm timber, indigo bamboo-pattern door cloth, stone paving, empty bamboo shop shelf, bare wooden post, and soft gouache brushwork. It is not a pixel editing or stretching target.
Primary request: DRAW A NEW spacious 16:9 landscape composition of the SAME COURTYARD, requested native canvas 2560 × 1440 pixels, highest appropriate native resolution. Recompose the landscape across a wide desktop frame with natural architectural proportions. Do not stretch, crop, pad, mirror, or merely extend the portrait reference.
Scene/backdrop: rural Sichuan home courtyard in calm daylight, gently elevated frontal / mild isometric view consistent with reference. One-story house with gently curved gray tiled roof, pale plaster infill and warm timber framing on the LEFT HALF. Indigo cloth with simple bamboo leaf decoration above its open door. Door reveals a quiet wooden room.
Layout: all positions are approximate normalized coordinates (x from left, y from top).
- House on left half, open doorway around x .20–.30, y .25–.55; short pale stone steps end around y .62. Whole essential doorway and steps safely inside frame.
- Bamboo, a low white plaster boundary wall with tiled cap, an irrigation canal, rice fields, distant rural houses and soft green mountains occupy the upper background and continue naturally across the widened frame.
- An EMPTY small roofed bamboo shop shelf at right-back, fully visible inside x .76–.94, y .35–.60; two bare shelf levels and a light bamboo canopy, no goods or hanging items.
- Exactly ONE plain bare upright wooden mail post to the right of the open center, center x .70, top y .45, foot y .72. Modest square wooden post on a small stone footing. NO envelope, mailbox, lettering, hooks, sign or accessory on the post.
- A large uninterrupted paved stone courtyard spans the center and lower half, pale warm irregular rectangular flagstones. Leave the patch near x .48, y .79 fully clear for the game to overlay separate harvest trays later. DO NOT paint trays or harvested items.
- Shrubs, bamboo, flowering greenery and modest potted plants confined to extreme outer edges and back boundary. Clear foreground, no fence or railing across the path.
Composition: generous walkable empty stone ground; broad unobstructed paths to house door, post and shop. All essential objects fully inside frame with safe margins. Match original architecture and brushwork, correct scale and coherent simple perspective.
Style/medium: match soft hand-painted gouache, fine dark warm outlines, pale warm wood and plaster, muted indigo cloth, gray roof tiles, calm fresh greens, gently textured stone, soft daylight and leaf shadows. Readable cozy 2D game scenery.
Constraints: environment only. NO toad, frog, human, animal, character, sprite, UI, interface, lettering, numbers, signs, logos, watermark, floating objects, satchel, backpack, bag, envelope, letters, souvenir objects, harvest trays or crops on trays. Shop shelf completely EMPTY. Mail post completely BARE. No extra set dressing. Opaque full-bleed 16:9 landscape illustration.
```

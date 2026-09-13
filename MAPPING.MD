# 元素映射

更新：2026-09-13。1.4.1 HTTP 存档兼容待发布 Mac mini；原 Sites 已删除。补记互斥租约与只读原因。

| 俗称 | 学名 / 职责 | 变量、组件或定位 |
|---|---|---|
| 疙宝、癞疙宝 | 角色精灵 / 日常回应 | `Scene`、`.toad-hotspot`、`.toad-sprite` |
| 筒靴鞋、农用雨靴、黑胶筒靴 | 油纸伞的替换候选，仍属永久用具，不是新增一项；首图假透明待修 | 候选 `gear_rain_boots`，目录 `outputs/art/candidates/rain-boots-v1/`；现用/旧存档仍是 `gear_oilpaper_umbrella`，接入时需兼容迁移 |
| 田坝地头、田坝、田坎 | 第四个旅行目的地，不是第三个可操作家场景 | `route_tianba` |
| 幺姑婆、地头吃晌午 | 农妇在田边吃午饭；不是低头动作或独立可点 NPC | `card_tianba_01`，用 `card_tianba_01-v2.png` |
| 红烧稀饭胀多了、吃撑见闻 | 食物条件卡；标题保留用户原文「红烧」 | `card_tianba_02.requiredFood`，按 `Trip.loadout.food` 筛选 |
| 草帽底下，眯一哈 | 田坝普通见闻，帽檐遮阴打盹 | `card_tianba_03`，不强制携带草帽 |
| 红苕稀饭、红薯粥 | 8 文吃食，描述「不要胀太多哦」 | `food_sweet_potato_congee`，提高田坝倾向，不等于收藏红苕 |
| 草帽、宽檐帽 | 24 文永久用具，圆冠宽扁檐 | `gear_straw_hat`，提高田坝倾向，透明 WebP |
| Web 版、桌面大画面 | ≥960px 横向约 16:9 场景；角色仍 96px | `layout='wide'`、`DESKTOP_MEDIA`、`SCENE_ASPECTS.wide=1672/941`、`data-layout` |
| 手机版、竖版 | <960px 的原 3:4 构图 | `layout='portrait'` |
| 原 Sites 版、旧私密网址 | 已永久删除的历史站点，不再发布 | `outputs/release/发布记录.MD` 保留历史；`.openai/hosting.json` 已移除 |
| 正式环境、Mac mini 版 | Mac mini 上的常驻静态站点 | `brand-mini.local`、`http://10.131.75.39:8788/`、`com.jojo.travel-lgb.web` |
| 源码仓库、GitHub 仓库 | 项目代码与素材的版本库 | `origin=git@github.com:774807732/travel-LGB.git`，主分支 `main` |
| 同时在线、并发、访问流量 | Mac mini 的服务与网络承载能力 | 当前无游戏侧并发配置或压力测试；不再按 Sites 配额判断 |
| 刷新仍是旧图、改了没变化 | 先核对正式网址与发布目录，不清玩家存档 | Mac mini 的 `current` 链接、设置页 `1.4.0`、手账 12 卡/12 物；场景仍用 `yard-web-wall.webp` |
| 点地、跳过去 | 点击目标，经完整小跳到达 | `moveToad`、`hopCommand`、`ToadActor` |
| 蓄力、蹬后腿、收腿、接地 | 六帧姿态图集与分段时序 | `jump-atlas.webp`、`sampleHop / HOP_TIMING`、`.toad-jump-sprite` |
| 弧线、跳高 | 单次腾空的离地高度 | `sampleHop.lift`、`--hop-lift` |
| 朝哪边、转身 | 起跳前左右朝向 | `--toad-facing` |
| 绕桌子、分几跳 | 按布局避障、每跳最多 74px | `findWalkPath / isClearSegment / splitIntoHops`、`HOP_STRIDE_PX` |
| 地板、可走区 | 当前构图允许落脚的多边形 | `getWalkMap(scene, layout).floor`、`isWalkable` |
| 碰撞体、挡住 | 当前构图家具/道具的不可落脚矩形 | `WALK_MAPS / WIDE_WALK_MAPS`、`getWalkMap(...).blockers` |
| 脚底点、落脚点 | 各布局/场景独立位置，不是图片左上角 | `ScenePoint`、`toadPositions[layout][scene]`、`--toad-x / --toad-y` |
| 地面影子 | 帮助判断角色站在地面 | `.toad-ground-shadow` |
| 发呆/收包/吃饭/瞌睡/出门 | 表现姿态，不是游戏阶段 | `idle/packing/eating/dozing/walking`、`idlePose/leaving` |
| 屋头、屋里 | 室内家景 | `state.scene='home'`、`.scene-home`；`sceneImage` 选择 `home.webp / home-web.webp` |
| 院坝、坝子 | 室外家景 | `state.scene='yard'`、`.scene-yard`；`sceneImage` 选择 `yard.webp / yard-web-wall.webp` |
| 门、回屋 | 双向换景热点 | `.home-door / .yard-door`、`changeScene` |
| 木窗、竹榻、矮桌 | 背景绘画，不是按钮 | `.scene-background` |
| 桌上的包、蓝布包、挎包 | 默认放在矮桌的独立行囊入口 | `.satchel-prop`；竖版 (50%,72%)，横版 (72.9%,73.1%+10px)；`props/satchel.webp` |
| 行囊、准备栏 | 一吃食一用具的配置 | `panel='bag'`、`draft`、`state.bag` |
| 吃的、干粮 | 必选槽 | `Loadout.food`、`panel='food'` |
| 家伙什、工具 | 可选永久槽 | `Loadout.gear`、`panel='gear'` |
| 收拾好了 | 预留后等待自行出发 | `prepareTrip` |
| 先不出门 | 取消预留、不耗库存 | `cancelPreparation` |
| 簸箕、晒谷子、收成 | 定时积累 / 换盘缠；桌面左下斜排，手机不变 | 横版 `.harvest-wide / .harvest-tray`、`WIDE_HARVEST_TRAYS`（共用图像/碰撞中心）；竖版 `.harvest-props`；层级 3，`availableHarvests / harvest` |
| 簸箕大小、素材放大 20% | 三簸箕显示宽高各 ×1.2，非移动中心或重绘图片 | `.harvest-tray` 宽 `clamp(69.12px,7.68%,92.16px)`，`aspect-ratio:1`；点击框随按钮尺寸，碰撞在 `WIDE_WALK_MAPS.yard` |
| 收成提示条、慢慢来 | 独立点击收成入口，桌面底部居中 | `.harvest-caption`，中心横向 50% / 顶部 91%，仍调用 `onHarvest` |
| 货架、小铺 | 采购面板 | `.yard-shop`、`panel='shop'`、`buyItem` |
| 钱、盘缠、文 | 唯一货币 | `state.coins`、`.coin-balance` |
| 信夹、有信了 | 每趟来信入口 / 未读 | `.mail-prop / .letter-ribbon`、`unread`、`panel='inbox'`；横版信封中心 (70.2%,39.2%)，宽 56px |
| 信封的柱子、信桩、蓝框位置 | 小铺左侧靠墙的木柱和石底座，不是信封按钮 | `yard-web-wall.webp`、`WIDE_WALK_MAPS.yard.blockers` 中的 `信夹木桩`；移动时同步 `.mail-prop` |
| 旅行照、见闻卡 | 带插画的旅途故事 | `CARDS`、`selectedCard`、`panel='card'`、`.travel-letter` |
| 斑驳、碎斑、点状纹理、画面太花 | 材质与阴影的高频碎色块；第二轮以第一轮为底再减约 60% | 九张 `public/art/cards/card_*.webp`；重点树叶/草丛/大青砖，不等同于角色主要疙瘩或石板接缝 |
| 减纹理版、干净版见闻、第二轮 | 当前九张重绘图，卡片 ID 与存档不变 | `outputs/art/source/cards-clean-v2/` → 原 WebP 路径；`cardImage(id)` 加 `?v=clean-v2` |
| 上一版、第一轮、对照底图 | 本次编辑基准，不是最初原图 | 原生源图 `outputs/art/source/cards-clean-v1/`；网页备份 `outputs/art/review/cards-clean-v1/`；最初原图仍在 `review/cards-original-v1/` |
| 收齐几张、图鉴进度 | 不同卡种数 / 当前总数 12 | `state.unlockedCards.length / CARDS.length`、`.collection-heading` |
| 第几次收到 | 每种卡的累计记录 | `state.cardCollection[cardId]` |
| 手账、相册 | 三类收藏 | `panel='journal/souvenirs/records'`、`.journal-tabs` |
| 小格子、陈列架、架上物件 | 最近纪念物入口 / 无白框透明物件 | `.gift-prop`、`.item-art[src*="/souvenir_"]`、`state.completed.at(-1).souvenirId` |
| 透明抠图、物品白底 | 十二纪念物 PNG，不是按钮底色 | `itemImage`、`public/art/items/souvenir_*.png`；`scripts/extract-souvenirs.mjs` 去背景 |
| 手信、礼物、土货、小东西 | 12 件；每趟本地 1 件，未收集优先，不与见闻固定绑定 | `SOUVENIRS`、`state.souvenirs`、`panel='object'` |
| 竹乡手信 | 小竹垫、小竹篮、竹蜻蜓 | `route_daoming` → `souvenir_bamboo_mat / souvenir_bamboo_basket / souvenir_bamboo_dragonfly` |
| 坝坝茶手信 | 小盖碗、小竹凳、小蒲扇 | `route_chengdu_tea` → `souvenir_gaiwan / souvenir_tea_stool / souvenir_palm_fan` |
| 河街手信 | 河街速写、琉璃熊猫、小木船 | `route_huanglongxi` → `souvenir_river_sketch / souvenir_glass_panda / souvenir_wooden_boat` |
| 琉璃摆件、玻璃熊猫 | 替换圆石的收藏品，不是角色 | `souvenir_glass_panda`；`decodeSave` 迁移旧 `souvenir_pebble` 数量和旅程 |
| 田坝手信 | 包谷、红苕、小南瓜，已接入奖励池 | `route_tianba` → `souvenir_corn / souvenir_sweet_potato / souvenir_small_pumpkin` |
| 红苕、包谷、南瓜 | 原料收藏，不可消耗或做饭 | `souvenir_sweet_potato / souvenir_corn / souvenir_small_pumpkin` |
| 出门纸条、屋里留的信 | 离家留言，非见闻卡/收件信夹；整体盖过簸箕 | `.away-note`（层级 5、点击穿透），角色和独立包同时隐藏 |
| 留言信纸、花布信笺 | 生图纸张插画层 | `.away-note-art`、`props/departure-note.webp` |
| 留言内容、疙宝落款 | 正文与署名统一 14px 的独立文字层 | `.away-note-copy` 设置字号，`p / span` 继承 |
| 在家/备妥/旅行 | 规则阶段 | `GameState.phase='home/packed/traveling'` |
| 回来咯、小红点 | 归来未读 | `hasUnreadReturn`、`.dot / .nav-dot` |
| 纸页、弹层 | 单层原生弹窗 | `Sheet`、`panel`、`viewKey` |
| 环境声 / 少动一点 | 保存的偏好 | `soundEnabled / reducedMotion`、`audio.ts` |
| 备份、恢复、重新开始 | 本地存档操作 | `panel='settings/import/confirm'`、`candidate`、`decodeSave / replace` |
| 另一个窗口、这里只查看 | 其他页占用写权限；可看景，关闭原页或租约过期后接续 | `mode === "reader"`、`readerScene`、`READER_NOTICE` |
| 存储不可用、暂停操作 | 浏览器存储或协调失败，不是其他页占用；刷新前可导出备份 | `mode === "unavailable"`、`STORAGE_NOTICE`、`game.readOnlyNotice` |
| HTTP 存档锁、窗口接续 | 原生 Web Locks 优先，否则 IndexedDB 租约；每次写入同步核验 | `writer.ts`、`createBrowserWriter`、`createLeaseWriter`、`Writer.run`、`LEASE_MS=12000`、`HEARTBEAT_MS=2000` |
| 时间试验台、快进 | 独立测试工具 | `?debug=1`、`advanceDebug` |

## 内容 ID

- 地点：`route_daoming / route_chengdu_tea / route_huanglongxi / route_tianba`。
- 十二卡：`card_daoming_01–03 / card_tea_01–03 / card_river_01–03 / card_tianba_01–03`。
- 吃食：`food_home_meal / food_yeerba / food_guokui / food_sweet_potato_congee`；用具：`gear_bamboo_flask / gear_oilpaper_umbrella / gear_straw_hat`。
- 十二纪念物 ID 见上方四地手信映射；旧 `souvenir_pebble` 仅作为迁移输入。
- 完整定义在 `src/game/content.ts`；素材 ID 对应 `outputs/art/manifest.json`。

白肚皮是角色色块，纸底是 UI；布包是场景配件，行囊是配置面板；“三地”不是可点击选目的地的地图。

见闻图文件映射：`card_daoming_01–03.webp` 为竹乡三图，`card_tea_01–03.webp` 为坝坝茶三图，`card_river_01–03.webp` 为河街三图，均在 `public/art/cards/`。

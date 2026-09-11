# 元素映射

更新：2026-09-11。1.3.1 Web 信桩按最新蓝框放在小铺左侧靠墙；区分信封入口与背景木柱。

| 俗称 | 学名 / 职责 | 变量、组件或定位 |
|---|---|---|
| 疙宝、癞疙宝 | 角色精灵 / 日常回应 | `Scene`、`.toad-hotspot`、`.toad-sprite` |
| Web 版、桌面大画面 | ≥960px 横向约 16:9 场景；角色仍 96px | `layout='wide'`、`DESKTOP_MEDIA`、`SCENE_ASPECTS.wide=1672/941`、`data-layout` |
| 手机版、竖版 | <960px 的原 3:4 构图 | `layout='portrait'` |
| 线上环境、线上游戏 | ChatGPT Sites 托管站点，不是本地预览 | `.openai/hosting.json` → `project_id`、`static.directory='dist'`；进度仍为浏览器 localStorage |
| 同时在线、并发、访问流量 | 在线人数、请求速率与传输量不同，不等同于 AI Token 配额 | Sites 套餐用量限制；当前无游戏侧并发配置，具体平台数值待账号界面或官方确认 |
| 刷新仍是旧图、改了没变化 | 先核对网址与版本，不清玩家存档 | 原线上网址已发布 1.3.1 / 版本 7：`yard-web-wall.webp`；设置页版本文字 `1.3.1` |
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
| 收成提示条、慢慢来 | 独立点击收成入口，桌面底部居中 | `.harvest-caption`，中心横向 50% / 顶部 91%，仍调用 `onHarvest` |
| 货架、小铺 | 采购面板 | `.yard-shop`、`panel='shop'`、`buyItem` |
| 钱、盘缠、文 | 唯一货币 | `state.coins`、`.coin-balance` |
| 信夹、有信了 | 每趟来信入口 / 未读 | `.mail-prop / .letter-ribbon`、`unread`、`panel='inbox'`；横版信封中心 (70.2%,39.2%)，宽 56px |
| 信封的柱子、信桩、蓝框位置 | 小铺左侧靠墙的木柱和石底座，不是信封按钮 | `yard-web-wall.webp`、`WIDE_WALK_MAPS.yard.blockers` 中的 `信夹木桩`；移动时同步 `.mail-prop` |
| 旅行照、见闻卡 | 带插画的旅途故事 | `CARDS`、`selectedCard`、`panel='card'`、`.travel-letter` |
| 收齐几张、图鉴进度 | 不同卡种数 / 总数 9 | `state.unlockedCards.length`、`.collection-heading` |
| 第几次收到 | 每种卡的累计记录 | `state.cardCollection[cardId]` |
| 手账、相册 | 三类收藏 | `panel='journal/souvenirs/records'`、`.journal-tabs` |
| 小格子、陈列架、架上物件 | 最近纪念物入口 / 无白框透明物件 | `.gift-prop`、`.item-art[src*="/souvenir_"]`、`state.completed.at(-1).souvenirId` |
| 透明抠图、物品白底 | 六种纪念物的 PNG 图像，不是手账按钮底色 | `itemImage`、`public/art/items/souvenir_*.png`；正常 alpha 合成 |
| 土货、小东西 | 六种归来收藏 | `SOUVENIRS`、`state.souvenirs`、`panel='object'` |
| 出门纸条、屋里留的信 | 离家留言，非见闻卡/收件信夹；整体盖过簸箕 | `.away-note`（层级 5、点击穿透），角色和独立包同时隐藏 |
| 留言信纸、花布信笺 | 生图纸张插画层 | `.away-note-art`、`props/departure-note.webp` |
| 留言内容、疙宝落款 | 正文与署名统一 14px 的独立文字层 | `.away-note-copy` 设置字号，`p / span` 继承 |
| 在家/备妥/旅行 | 规则阶段 | `GameState.phase='home/packed/traveling'` |
| 回来咯、小红点 | 归来未读 | `hasUnreadReturn`、`.dot / .nav-dot` |
| 纸页、弹层 | 单层原生弹窗 | `Sheet`、`panel`、`viewKey` |
| 环境声 / 少动一点 | 保存的偏好 | `soundEnabled / reducedMotion`、`audio.ts` |
| 备份、恢复、重新开始 | 本地存档操作 | `panel='settings/import/confirm'`、`candidate`、`decodeSave / replace` |
| 另一个窗口 | 只读与自动接续 | `useGame.mode`、`readerScene`、Web Locks |
| 时间试验台、快进 | 独立测试工具 | `?debug=1`、`advanceDebug` |

## 内容 ID

- 地点：`route_daoming / route_chengdu_tea / route_huanglongxi`。
- 九卡：`card_daoming_01–03 / card_tea_01–03 / card_river_01–03`。
- 吃食：`food_home_meal / food_yeerba / food_guokui`；用具：`gear_bamboo_flask / gear_oilpaper_umbrella`。
- 纪念物：`souvenir_bamboo_mat / bamboo_basket / gaiwan / tea_stool / river_sketch / pebble`（每项均有 `souvenir_` 前缀）。
- 完整定义在 `src/game/content.ts`；素材 ID 对应 `outputs/art/manifest.json`。

白肚皮是角色色块，纸底是 UI；布包是场景配件，行囊是配置面板；“三地”不是可点击选目的地的地图。

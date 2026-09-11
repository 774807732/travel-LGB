# 元素映射

更新：2026-09-11。1.2 补齐蹬腿姿态、时序、朝向和绕行名词。

| 俗称 | 学名 / 职责 | 变量、组件或定位 |
|---|---|---|
| 疙宝、癞疙宝 | 角色精灵 / 日常回应 | `Scene`、`.toad-hotspot`、`.toad-sprite` |
| 点地、跳过去 | 点击目标，经完整小跳到达 | `moveToad`、`hopCommand`、`ToadActor` |
| 蓄力、蹬后腿、收腿、接地 | 六帧姿态图集与分段时序 | `jump-atlas.webp`、`sampleHop / HOP_TIMING`、`.toad-jump-sprite` |
| 弧线、跳高 | 单次腾空的离地高度 | `sampleHop.lift`、`--hop-lift` |
| 朝哪边、转身 | 起跳前左右朝向 | `--toad-facing` |
| 绕桌子、分几跳 | 避障路径与小跳落点序列 | `findWalkPath / isClearSegment / splitIntoHops` |
| 地板、可走区 | 允许落脚的场景多边形 | `WALK_MAPS[scene].floor`、`isWalkable` |
| 碰撞体、挡住 | 家具/道具的不可落脚矩形 | `WALK_MAPS[scene].blockers` |
| 脚底点、落脚点 | 角色位置基准，不是图片左上角 | `ScenePoint`、`--toad-x / --toad-y` |
| 地面影子 | 帮助判断角色站在地面 | `.toad-ground-shadow` |
| 发呆/收包/吃饭/瞌睡/出门 | 表现姿态，不是游戏阶段 | `idle/packing/eating/dozing/walking`、`idlePose/leaving` |
| 屋头、屋里 | 室内家景 | `state.scene='home'`、`.scene-home`、`home.webp` |
| 院坝、坝子 | 室外家景 | `state.scene='yard'`、`.scene-yard`、`yard.webp` |
| 门、回屋 | 双向换景热点 | `.home-door / .yard-door`、`changeScene` |
| 木窗、竹榻、矮桌 | 背景绘画，不是按钮 | `.scene-background` |
| 蓝布包、挎包 | 独立场景道具 / 行囊入口 | `.satchel-prop`、`props/satchel.webp` |
| 行囊、准备栏 | 一吃食一用具的配置 | `panel='bag'`、`draft`、`state.bag` |
| 吃的、干粮 | 必选槽 | `Loadout.food`、`panel='food'` |
| 家伙什、工具 | 可选永久槽 | `Loadout.gear`、`panel='gear'` |
| 收拾好了 | 预留后等待自行出发 | `prepareTrip` |
| 先不出门 | 取消预留、不耗库存 | `cancelPreparation` |
| 簸箕、晒谷子、收成 | 定时积累 / 换盘缠 | `.harvest-props`、`harvestAt`、`availableHarvests / harvest` |
| 货架、小铺 | 采购面板 | `.yard-shop`、`panel='shop'`、`buyItem` |
| 钱、盘缠、文 | 唯一货币 | `state.coins`、`.coin-balance` |
| 信夹、有信了 | 每趟来信入口 / 未读 | `.mail-prop / .letter-ribbon`、`unread`、`panel='inbox'` |
| 旅行照、见闻卡 | 带插画的旅途故事 | `CARDS`、`selectedCard`、`panel='card'`、`.travel-letter` |
| 收齐几张、图鉴进度 | 不同卡种数 / 总数 9 | `state.unlockedCards.length`、`.collection-heading` |
| 第几次收到 | 每种卡的累计记录 | `state.cardCollection[cardId]` |
| 手账、相册 | 三类收藏 | `panel='journal/souvenirs/records'`、`.journal-tabs` |
| 小格子、陈列架、收藏纸签 | 最近纪念物入口 / 白底图签 | `.gift-prop`、`.item-art[src*="/souvenir_"]`、`state.completed.at(-1).souvenirId` |
| 土货、小东西 | 六种归来收藏 | `SOUVENIRS`、`state.souvenirs`、`panel='object'` |
| 出门纸条 | 离家反馈 | `.away-note`，角色和独立包同时隐藏 |
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

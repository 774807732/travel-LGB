# 元素映射

2026-09-17 Git交付边界：运行时映射以两层`shelfTop/shelfLower`为准，窗边`window`仅在旧档校验/读取迁移中出现，不再有UI/CSS落点；代码已推送`main`（`e5ad380`）。尚未执行的“缩小20%＋2.5D调位”预计只涉及`.display-prop`横竖宽高与两层`top/left`锚点；当前映射和构建仍是下方93测试版本，不新增存档字段、内容ID或素材文件。本批未切Mini `current`。

2026-09-16最新本地映射：`DISPLAY_SLOTS`/`HomeDisplay`只含`shelfTop`、`shelfLower`；`window`操作被拒绝，横竖CSS锚点与帮助中的窗边说明移除，`.display-slots`改两列。`isHomeDisplay`仅为兼容旧档继续校验历史window，`decodeSave`完整校验后投影为两位并标记迁移，`homeDisplay`展示也忽略退役字段；收藏数量/旅程/version=2/两个存档键不变。新增两项退役兼容回归，共93测试/构建与独立档通过；本地产物JS `game-BJe5XJ1W.js`、CSS `game-C-JPA4im.css`，未提交推送或发布。下方三位字段为历史映射。

2026-09-16本地收藏摆放映射：`src/game/homeDisplay.ts`定义`DISPLAY_SLOTS`、`homeDisplay`兼容展示、`placeSouvenir`搬动/替换/收回和`isHomeDisplay`校验；`GameState.homeDisplay?`为`{shelfTop, shelfLower, window}`，各值`SouvenirId|null`，只允许已拥有且不重复的物品。缺字段沿用最近一件；首次编辑写齐3位，全null表示明确收空。`storage.ts`验证后接入原保存/备份/导入导出及写锁，不改两个存档键/version=2。`HomeDisplayEditor.tsx`与`App.tsx/.display-prop[data-slot]`复用14件原PNG，横竖位置独立；无新内容ID/素材/后端。新增9项回归，共91测试和构建/独立档通过；最终本地JS `game-U6cmu2-t.js`、CSS `game-BOCOK1vM.css`。版本仍1.4.8且未发布，Mini应用仍5590421，其他候选没有运行时映射。

2026-09-16玩法讨论仅作候选：陈列/来客/捎带/连续见闻/小玩具尚无运行时映射，不新增内容ID、存档字段、货币、接口或后端。待用户选定后另行设计；当前仍为1.4.8，未推送或部署本轮文档。

2026-09-16最新：版本`package.json/package-lock.json/App.tsx`为1.4.8；Mini `current → releases/55904218a74827c052ec521dfa53a1c2c5dab230`，代码已推Git。JS `game-C_8WaFS_.js`、CSS `game-DBatHZqe.css`，本地/Mini构建/发布目录69文件哈希一致；本地82测试/4服务测试/独立档、Mini76测试/构建和正式HTTPS资源/60图并发/相关独立档扣费与备份检查通过。原357d63b保留回滚，服务三PID不变；收尾文档另同步源码、不切应用，内容ID/存档键/version=2不迁移。

2026-09-16本地扣费映射：`engine.ts / TRIP_COST=12`统一每趟路费；`prepareTrip`校验余额但不扣，`spendableCoins`仅在packed时扣除12文预留供`buyItem`和小铺按钮共用；`advanceGame`仅在packed→traveling扣`state.coins`，`cancelPreparation`释放预留且不扣款。不新增扣费存档字段，正常/独立档键及version=2不变；旧在途不追扣，旧不足额准备档到点回home并清空bag/departureAt，保留吃食，收成后需手动重备。新增`trip-cost.test.ts`/`fixtures/travel-budget.ts`与合成验收脚本，82测试/构建及独立档通过；尚未提交推送或部署，Mini应用仍357d63b。

2026-09-16最新映射：队列修复`f4901aa`已推送/同步Mini，`deploy/mac-mini/serve.py → /Users/jojo/Sites/travel-LGB/web/queue128-v1/serve.py`（SHA-256 `4dc5787144b7a15f344711cdcb293b9ad73db2d9fa3ef0654e9973202445f448`），仅覆盖`request_queue_size=128`。web服务重载，旧plist在Mini `service-backups/web-before-queue128-20260916/`；8788/0.0.0.0/current及alias/https不变。正式20卡×10轮哈希与独立档桌面/390px/收藏/刷新通过，1.4.7本次缺口关闭；应用357d63b及69文件保持原哈希，所有内容ID/存档映射不改，1.4.6回滚保留。

2026-09-16正式映射：Mini `current → releases/357d63ba17460d1870863fd7f955f8b7de985684`（1.4.7），Git已推送；本地72/Mini66测试、两次69文件哈希核对及正式四趟彩蛋/两新收藏/备份去重通过。正式并发手账图片偶发502已复现，默认静态服务连接队列5，调整待确认，HTTPS整体验收仍未关闭。1.4.6 db87df6留作回滚；下方准备/未接入记录为历史。

2026-09-16｜1.4.7映射已落地，用户明确推送Git并只发布Mini：`category_jojo`为跨原四地点的彩蛋分类，不是`RouteId`。`card_jojo_01–04`依次对应竹乡/坝坝茶/河街/田坝，源图依次抓虫v3/豌杂面v2/水车/等风，网页`/art/cards/card_jojo_01–04.webp?v=jojo-v1`；旧16卡顺序/缓存路径不变。`cards[].souvenirId`绑定`01→souvenir_caterpillar`、`02→souvenir_wanza_noodles`，`souvenirsForCard`统一抽取及存档验证；其他卡用原地点三物未收优先，每趟一件。两PNG在`public/art/items/`，不进入FOODS/GEARS；存档键/version=2不变。72项本地测试/构建和独立档通过，待推送发布；后续以[验收记录](outputs/release/1.4.7-叫叫彩蛋发布验收.MD)为准，下面未接入记录为历史。

2026-09-16 收藏草案映射：`card_jojo_01 → souvenir_caterpillar（猪儿虫）`，`card_jojo_02 → souvenir_wanza_noodles（豌杂面）`，后两则无新增收藏。对应透明PNG在 `outputs/art/source/jojo-souvenirs-v1/`；`jojo-stories-v1/content-draft.json` 的 `souvenirs / cards[].souvenirId / souvenirAssociation` 记录关系，交付清单同步。新9文件ZIP包含四见闻与两收藏，旧7文件ZIP为历史快照。该关联不表示已实现必得或额外掉落；运行时 `SouvenirId / SOUVENIRS / CARDS / ROUTES / manifest`、12件收藏、吃食/存档均不变，无发布。

2026-09-16 交付映射：`outputs/art/delivery/jojo-four-latest-20260916/素材清单.json` 逐项记录草案 `card_jojo_01–04` 到四个带序号中文PNG文件的映射、当前版本、原来源和SHA-256；来源依次为 `card_jojo_01-caterpillar-v3.png`、`card_jojo_02-noodles-v2.png`、`card_jojo_03.png`、`card_jojo_04.png`。ZIP仅含四图、故事MD、清单JSON、预览HTML，未混入旧图；这是独立交付副本，不修改原草案或运行时 `CARDS / ROUTES / public/art / manifest`，无接入或发布。

2026-09-16 第二则映射：草案 `card_jojo_02 / route_chengdu_tea` 标题改为「树下那碗豌杂面」，图片为 `outputs/art/source/jojo-stories-v1/card_jojo_02-noodles-v2.png`。正文/构图说明/预览同步，原 `card_jojo_02.png` 保留；第一则仍抓虫v3，其余两则不变。两则当前修订记录列在 `content-draft.json / 生成记录.json` 的 `activeRevisionRecords`；运行时类别、ID、manifest、存档不改，无发布。

2026-09-16 最新映射：草案 `card_jojo_01 / route_daoming` 仍为「竹林里，抓猪儿虫」，图片现指向 `outputs/art/source/jojo-stories-v1/card_jojo_01-caterpillar-v3.png`（虫体清楚、右侧构图）；四则文字和其他三图不变。当前映射以 `content-draft.json` 为准，v3实际提示词/来源见 `card_jojo_01-猪儿虫构图v3记录.json`，原减纹理底图、v2及初始清理记录保留作溯源/回退。运行时、manifest、存档不变，无发布。

2026-09-16 选稿映射：`card_jojo_01–04.png` 依次仍为等蜗牛／等包子凉／看水车／田埂等风，四张减纹理版均为用户指定的后续底图。初稿原生路径与废纸篓恢复路径、保留图SHA-256见 `outputs/art/source/jojo-stories-v1/清理与底图确认.json`；截图的展示顺序不改变编号。生成记录保留历史路径但不作为当前编辑输入；`runtimeIntegration.enabled=false`、游戏资源及运行时ID不变，未发布。

2026-09-16｜「叫叫」分类草案在 `outputs/art/source/jojo-stories-v1/content-draft.json`：`category_jojo` 下拟用 `card_jojo_01–04`，分别为等蜗牛过路／包子还烫，先闻一哈／水车又转了一圈／田埂上，等一阵风，对应同目录四张PNG。暂按原竹乡/坝坝茶/河街/田坝取景，分类与第5目的地的区别待明确；`runtimeIntegration.enabled=false`，不是已新增后端或运行时类别。未修改 `RouteId / CardId / CARDS / ROUTES / public/art / manifest`、抽取规则或存档，运行内容仍四地十六卡，未发布。

2026-09-16 人物定位确认：「叫叫／彩蛋角色」对应独立背景客串，详细规则见 `outputs/ip-concept/jojo-cameo-v1/角色设定.MD` 的「人物设定（用户确认）」；不是跟随者、可点击NPC、任务或奖励系统，不映射新增运行时ID/交互/存档字段。仅文档修订，三张概念图和现有游戏资源均不变，未推送或部署。

2026-09-16｜叫叫彩蛋仅概念归档：`outputs/ip-concept/jojo-cameo-v1/01-turnaround.png`（多视图）、`02-construction-proportions.png`（结构比例）、`03-expressions-actions.png`（表情动作）。七张原参考在同目录 `references/`，规则/实际提示词/检查分别见 `角色设定.MD`、`生成记录.json`、`验收记录.MD`。三图为不透明纸底设定板，不是精灵或已接入资源；未加入 `public/`、素材manifest、`CARDS`、角色ID或存档，未提交/发布，Mini仍运行1.4.6。

2026-09-15｜1.4.6（`db87df6`）已推送并发布Mini；版本在 `package.json / package-lock.json / App.tsx` 统一。手账 `Sheet.wide` 和桌面四列映射现为正式实现，ID/素材/存档键/格式不变。先通过本地65项测试/构建和独立档，再经Mini60项测试/构建、63文件哈希核对发布；HTTPS资源/TLS及Chrome独立档布局、详情返回、刷新接续/提示入口通过。旧四卡与日常旅程完整验收仍待补，不以本轮首趟冒烟替代。

2026-09-15 本地手账四列：`App.tsx` 对 `journal / souvenirs / records` 传入 `Sheet.wide`；`styles.css` 的≥960px断点将 `.sheet-wide` 设为760px，`.sheet-wide .card-grid` 设为4列，窄屏基础3列不变。新增 `journal-layout.test.ts`，共65项测试及构建/独立档验收通过；不改ID、素材、存档、奖励或普通弹窗，未推送/发布Mini。

2026-09-15 Git同步范围：最新封面、四卡定稿来源、旧候选删除及素材测试/文档；`manifest.json`、内容ID、`public/art/`与运行时映射不变。63项测试和构建复验通过，仅GitHub `main`交付，不同步Mini源码或发布应用。

2026-09-15 素材清理：四张最终PNG及 `素材说明.MD / 定稿记录.json` 在 `outputs/art/source/cards-fourth-v1/`；游戏仍引用 `public/art/cards/<id>.webp`，manifest路径不变。封面只保留 `outputs/art/promo/cover-3x2-v10/` 的最终PNG、8层自包含SVG及说明，1536×1024。旧过程文件149个已移入废纸篓；素材测试直接核验定稿固定SHA-256。63项测试/构建通过，成品与运行时资源不变，不发布Mini。

2026-09-15 用户授权发布后，1.4.5 应用 `1735608` 已上线 Mini，本地与正式均为十六卡。四地第四卡已进入 `CardId`、`CARDS`、图片映射与素材清单；定稿原图逐字节归档到 `outputs/art/source/cards-fourth-v1/`，只编码四张 WebP，不重绘。先通过本地 63 项测试/构建与独立档试玩，再经 Mini 58 项非原画归档测试/构建、63 文件哈希一致后发布。HTTPS 资源/TLS 通过，正式 Chrome 连接关闭，交互与旧 HTTPS 缺口仍待补；1.4.4 保留回滚。

| 已发布的新故事 | 稳定 ID / 所属路线 | 定稿文件（outputs/art/source/cards-fourth-v1/ 下） |
|---|---|---|
| 竹林边，抓天牛 | `card_daoming_04` / `route_daoming` | `card_daoming_04.png` |
| 看人采耳，自己也眯了眼 | `card_tea_04` / `route_chengdu_tea` | `card_tea_04.png` |
| 送片叶子顺水走 | `card_river_04` / `route_huanglongxi` | `card_river_04.png` |
| 坝坝宴，安逸～（用户指定新标题，正文/图不变） | `card_tianba_04` / `route_tianba` | `card_tianba_04.png` |

四卡各补一则普通故事，不新增目的地、道具、收藏、条件或收费玩法；祝寿为已选的虚构主题。`cardImage` 对 `_04` 返回 `/art/cards/<id>.webp?v=fourth-v1`，原十二卡 `?v=clean-v2` 不变。图鉴、调试和导入预览由 `CARDS.length` 显示十六；旧存档键/version=2、已定在途及旧记录不变。旧竹蜻蜓/蒲扇/鸭队、本人采耳与过大体型宴席候选已按用户要求移出工作区，不再使用。

2026-09-15 1.4.4（`e0177d4`）已发布 Mini：新增主界面常驻存档提醒，入口只打开既有设置；存档机制不变。先通过本地 58 项测试/构建及桌面/390/360px/只读独立档页面验收，再经 Mini 54 项测试/构建和 59 文件哈希核对后发布；HTTPS 资源/TLS 通过，正式内置浏览器连接失败，交互冒烟待补。

2026-09-15 1.4.3 已发布 Mini（`d0287e3`）。时间口径：准备＝确认行囊至 `departureAt`（首趟 15 秒，后续 120–300 秒）；旅行＝`returnsAt - departedAt`（首趟 90 秒，后续改为 3600–14400 整秒，含两端）。`tripResult` 用 `3600 + floor(rng() * 10801)`；来信为 `departedAt + duration / 2`。只在新出发时抽取，已保存 `Trip` 的三时间戳/路线/卡/物不重算，存档键与 version=2 不变。帮助文案同步，57/53 项测试及构建、HTTPS 资源校验通过；独立档浏览器交互受安全拦截/连接失败影响待补验。

2026-09-15 名词补充：大陆公网入口＝大陆公网 IP/接入服务；域名＝解析到入口的名称；ICP备案＝大陆网站/CDN 接入需核对的要求，三者不同。可评估现成授权域名的子域名，不必新注册；DuckDNS 不自带公网入口，所有方案仍未实施。

2026-09-15 方案补充：VPN 开启不等于所有流量都经 VPN；「像百度一样直连」指命中客户端已有的域名/中国大陆 IP 直连策略，并非网站控制路由。大陆公网入口＋受控加密回源 Mini 仅在讨论，未购买/部署；此前本机例外只代表当时的单机修复，不是面向全部访问者的通用方案。

上一轮：2026-09-14｜筒靴鞋与正式 HTTPS 独立档验收完成，应用 `3a636fe`（1.4.2）现为回滚版；正式入口仍为 `https://travel-lgb.duckdns.org/`。旧伞 ID 不改，历史和在途无需迁移。

| 俗称 | 学名 / 职责 | 变量、组件或定位 |
|---|---|---|
| 疙宝、癞疙宝 | 角色精灵 / 日常回应 | `Scene`、`.toad-hotspot`、`.toad-sprite` |
| travel-lgb.duckdns.org、免费游戏网址 | 正式内网 HTTPS 入口，公开 DNS 指向 Mini 私网地址，不支持手机流量直达 | `https://travel-lgb.duckdns.org/`；`com.jojo.travel-lgb.https`、Caddy `:443 → 127.0.0.1:8788`；HTTP 别名 `:80` 保留 |
| 安全网址、证书 | HTTPS 连接与自动续期，不是外网开放或游戏账号 | `Caddyfile.https`、`run-https.sh`；DuckDNS Token 仅在 Mini 的用户目录，绝不提交 Git |
| www.travellgb.com、travel-lgb.co | 历史拟议名称，均未启用 | 无线上配置或前端变量 |
| brand-mini.local、Mini 的名字 | 已在当前 MacBook 验通的 Bonjour 内网别名，不保证所有设备可解析；与 IP 存档独立 | `http://brand-mini.local:8788/`；Mac mini LocalHostName |
| JOJO-Office、办公室 Wi-Fi | Mini 当前连接的 SSID，不是游戏的访问白名单 | en1；服务监听 `0.0.0.0:8788`，实际可达性由路由/防火墙决定 |
| 筒靴鞋、农用雨靴、黑胶筒靴 | 已替换油纸伞的 24 文永久用具，不新增格子、不要求重买，河街权重不变 | 稳定 `GearId=gear_oilpaper_umbrella`；`itemImage` 映射 `/art/items/gear_rain_boots.webp`；源图 `outputs/art/source/rain-boots-v2/` |
| 代理下打不开、直连可访问 | 私网 Mini 无法经外部代理访问时，仅对本游戏域名加直连例外 | 本机 Wi-Fi / AX88179A 追加 `travel-lgb.duckdns.org`；保留原代理与规则，不是改服务器 HTTPS 或清存档 |
| 田坝地头、田坝、田坎 | 第四个旅行目的地，不是第三个可操作家场景 | `route_tianba` |
| 幺姑婆、地头吃晌午 | 农妇在田边吃午饭；不是低头动作或独立可点 NPC | `card_tianba_01`，用 `card_tianba_01-v2.png` |
| 红烧稀饭胀多了、吃撑见闻 | 食物条件卡；标题保留用户原文「红烧」 | `card_tianba_02.requiredFood`，按 `Trip.loadout.food` 筛选 |
| 草帽底下，眯一哈 | 田坝普通见闻，帽檐遮阴打盹 | `card_tianba_03`，不强制携带草帽 |
| 红苕稀饭、红薯粥 | 8 文吃食，描述「不要胀太多哦」 | `food_sweet_potato_congee`，提高田坝倾向，不等于收藏红苕 |
| 草帽、宽檐帽 | 24 文永久用具，圆冠宽扁檐 | `gear_straw_hat`，提高田坝倾向，透明 WebP |
| Web 版、桌面大画面 | ≥960px 横向约 16:9 场景；角色仍 96px | `layout='wide'`、`DESKTOP_MEDIA`、`SCENE_ASPECTS.wide=1672/941`、`data-layout` |
| 手机版、竖版 | <960px 的原 3:4 构图 | `layout='portrait'` |
| 原 Sites 版、旧私密网址 | 已永久删除的历史站点，不再发布 | `outputs/release/发布记录.MD` 保留历史；`.openai/hosting.json` 已移除 |
| 正式环境、Mac mini 版 | Mac mini 上的常驻静态站点 | `https://travel-lgb.duckdns.org/`；旧 `http://10.131.75.39:8788/`；`com.jojo.travel-lgb.web` |
| 源码仓库、GitHub 仓库 | 项目代码与素材的版本库 | `origin=git@github.com:774807732/travel-LGB.git`，主分支 `main` |
| 最新提交、线上版本、漏部署 | 源码提交可包含文档，不能只凭哈希不同判断漏部署 | `main`与Mini `source`跟踪最新文档；`current → releases/55904218a74827c052ec521dfa53a1c2c5dab230`是现用1.4.8应用，69文件哈希一致，`357d63b`及更早版本留作回滚 |
| 同时在线、并发、访问流量 | Mac mini 的服务与网络承载能力 | 静态服务TCP待接入队列128（非人数上限），1.4.7已验200/200图并发，1.4.8复验60/60图；不按Sites配额判断 |
| 刷新仍是旧图、改了没变化 | 先核对正式网址与发布目录，不清玩家存档 | Mini `current`、设置页1.4.8、每次出门12文、桌面760px四列、20卡/14物、叫叫分类、存档提示；场景仍用`yard-web-wall.webp` |
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
| 收拾好了 | 校验余额≥12文；预留吃食/路费后等待出发，不立即扣款 | `prepareTrip` |
| 先不出门 | 取消预留、不耗吃食或盘缠 | `cancelPreparation` |
| 出游路费、出门12文 | 每次packed→traveling消耗12文，首趟同样；归来仍+8 | `TRIP_COST`、`advanceGame`、`state.coins` |
| 小铺可用盘缠 | 准备时从总余额留出12文；取消后解除，不增存档字段 | `spendableCoins`、`buyItem`、`App.tsx`小铺/行囊/帮助 |
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
| 收齐几张、图鉴进度 | 不同卡种数 / 总数20（本地与Mini一致） | `state.unlockedCards.length / CARDS.length`、`.collection-heading` |
| 第几次收到 | 每种卡的累计记录 | `state.cardCollection[cardId]` |
| 手账、相册 | 三类收藏 | `panel='journal/souvenirs/records'`、`.journal-tabs` |
| 见闻墙、全部见闻 | 手账连续排列20张，桌面4列、窄屏3列，不按地点分组；路线ID仍用于旅行规则 | `panel='journal'`、`CARDS.map`、`Sheet.wide`、`.sheet-wide .card-grid`、`.postcard-thumb`；叫叫4卡追加末尾 |
| 等一封来信、未解锁卡 | 隐藏地点和插画的占位卡，解锁后可打开详情 | `.postcard-thumb.undiscovered`、`state.unlockedCards`、`readCard` |
| 小格子、陈列架、架上物件 | 最近纪念物入口 / 无白框透明物件 | `.gift-prop`、`.item-art[src*="/souvenir_"]`、`state.completed.at(-1).souvenirId` |
| 透明抠图、物品白底 | 14纪念物PNG，不是按钮底色 | `itemImage`、`public/art/items/souvenir_*.png`；旧物去背景使用`extract-souvenirs.mjs`，新两件保留模型原生alpha |
| 手信、礼物、土货、小东西 | 14种，每趟1件；抓虫/面卡绑定新物，其他卡用原地点3物未收优先 | `CARDS[].souvenirId`、`souvenirsForCard`、`SOUVENIRS`、`state.souvenirs`、`panel='object'` |
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
| 存档提示、换手机不自动同步 | 主界面底部常驻提醒，非弹窗或云同步功能；只读时仍可查看 | `SaveNotice`、`.save-notice`、`aria-label="存档提示"`；「存档备份与迁移」→ `open("settings")`；`save-notice.test.ts` |
| 个人存档、没有账号也记得进度 | 当前设备的浏览器用户配置＋来源隔离，不按玩家身份/IP 识别；同配置共用，换设备不自动同步 | `useGame` → `window.localStorage`；`saveGame` 将完整状态序列化为 JSON，正常 `travel-toad:v1` / 调试 `travel-toad:review:v1`；本地备份随网站数据清除而丢失，迁移用 `exportGame / decodeSave`。2026-09-15 仅核对说明 |
| 另一个窗口、这里只查看 | 其他页占用写权限；可看景，关闭原页或租约过期后接续 | `mode === "reader"`、`readerScene`、`READER_NOTICE` |
| 存储不可用、暂停操作 | 浏览器存储或协调失败，不是其他页占用；刷新前可导出备份 | `mode === "unavailable"`、`STORAGE_NOTICE`、`game.readOnlyNotice` |
| HTTP 存档锁、窗口接续 | 原生 Web Locks 优先，否则 IndexedDB 租约；每次写入同步核验 | `writer.ts`、`createBrowserWriter`、`createLeaseWriter`、`Writer.run`、`LEASE_MS=12000`、`HEARTBEAT_MS=2000` |
| 时间试验台、快进 | 独立测试工具 | `?debug=1`、`advanceDebug` |
| 本地测试、试玩、上线验收 | 用户固定四步发布顺序，各步结果独立记录 | 本地自动化与构建 → 本地独立档试玩通过 → 发布 Mini → 正式 HTTPS 检查；前两步未通过不切 `current`，HTTPS 资源/TLS 不替代交互；仅文档不部署（2026-09-15 用户确认） |

## 内容 ID

- 地点：`route_daoming / route_chengdu_tea / route_huanglongxi / route_tianba`。
- 十六卡：`card_daoming_01–04 / card_tea_01–04 / card_river_01–04 / card_tianba_01–04`；新增 `_04` 已随 1.4.5 发布 Mini。
- 1.4.7追加叫叫4卡：`card_jojo_01–04`，分类`category_jojo`；新增收藏` souvenir_caterpillar / souvenir_wanza_noodles`（均非吃食），总计20卡/14物。
- 吃食：`food_home_meal / food_yeerba / food_guokui / food_sweet_potato_congee`；用具：`gear_bamboo_flask / gear_oilpaper_umbrella / gear_straw_hat`。
- 十二纪念物 ID 见上方四地手信映射；旧 `souvenir_pebble` 仅作为迁移输入。
- 完整定义在 `src/game/content.ts`；素材 ID 对应 `outputs/art/manifest.json`。

白肚皮是角色色块，纸底是 UI；布包是场景配件，行囊是配置面板；“三地”不是可点击选目的地的地图。

见闻图文件映射：`public/art/cards/` 内 `card_daoming_01–04.webp` 为竹乡四图，`card_tea_01–04.webp` 为坝坝茶四图，`card_river_01–04.webp` 为河街四图，`card_tianba_01–04.webp` 为田坝四图。人工验收档生成器为 `scripts/create-card-review.ts`，只供本地 `?debug=1` 导入。

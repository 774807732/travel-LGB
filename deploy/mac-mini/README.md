# Mac mini 部署

## 当前应用：1.5.0（2026-09-21）

小铺三食物/三道具及双页签已发布，`current → releases/5cb8cb0211d322cfe6528a63d11b5a7df928355e`；原1.4.9 `08ebbda0b48516be841cce79b28ef9711eaf2aab`完整保留回滚。本地102游戏测试/4服务测试/构建和独立档先通过，Mini Node22.23.1下96项非原画测试/4服务测试/构建及75文件两次一致后原子切换。正式TLS、首页/JS/CSS/六张商品图、HTTP/8788入口、60/60并发图和宽窄独立档通过。三服务PID仍为32838/76382/99668，无重启；队列128、代理和网络配置不变。详见`outputs/release/1.5.0-小铺扩充发布验收.MD`。以下1.4.9与更早记录为历史。

## 当前应用：1.4.9（2026-09-21）

收藏品两层摆放、退役窗边柜兼容与摆件缩小20%/2.5D调位已发布，`current → releases/08ebbda0b48516be841cce79b28ef9711eaf2aab`；原1.4.8 `55904218a74827c052ec521dfa53a1c2c5dab230`完整保留回滚。本地93游戏测试/4服务测试/构建和独立档先通过，Mini Node22.23.1下87项非原画归档测试/4服务测试/构建及69文件两次一致后原子切换。正式TLS/资源哈希、HTTP/8788入口、60/60并发图和相关独立档通过。无需重启，web32838/alias76382/https99668保持；队列128、代理和网络配置不变。详见`outputs/release/1.4.9-收藏品摆放发布验收.MD`。以下1.4.8与更早记录为历史。

## 当前应用：1.4.8（2026-09-16）

每次出门12文已推送/发布，`current → releases/55904218a74827c052ec521dfa53a1c2c5dab230`；原1.4.7 `357d63ba17460d1870863fd7f955f8b7de985684`完整保留回滚。本地82游戏测试/4服务测试/构建与独立档先通过，Mini Node22.23.1下76项非原画归档测试/构建及两次69文件哈希一致后原子切换，6项原画归档测试仅本地执行。正式TLS/6资源哈希、两HTTP入口、60/60并发卡图与相关独立档通过，见`outputs/release/1.4.8-出游盘缠发布验收.MD`。无需重启，web32838/alias76382/https99668保持；队列128和配置不变。收尾仅快进同步文档，不重新部署。以下旧版与服务修复为历史记录。

## 静态服务队列修复（2026-09-16，已完成）

用户明确授权仅调整游戏静态服务队列、备份并重启该服务。`serve.py`沿用Python标准`SimpleHTTPRequestHandler`和线程服务器，只覆盖待接入TCP队列为128；不是新后端或玩家人数上限。现有8788、绑定地址和`current`目录保持。应用仍1.4.7/357d63b，不重新复制成品或切换current。

- 本地先运行`npm test`（72项）、`npm run build`、`PYTHONDONTWRITEBYTECODE=1 /usr/bin/python3 -m unittest discover -s deploy/mac-mini -p 'test_*.py' -v`（4项，含40并发×5轮、GET/HEAD/304/404/501和current切换回滚）。
- 本地使用`/usr/bin/python3 deploy/mac-mini/serve.py 5173 --bind 127.0.0.1 --directory dist`服务构建；独立档桌面与390px、20图/14物/详情返回/刷新通过。`node scripts/check-static-resources.mjs http://127.0.0.1:5173/ 10`真实20卡×10轮全部匹配SHA-256。
- 修复提交`f4901aad06c53b137ea376ed091ceaa8bf745f04`已推送并快进同步Mini。Mini四项服务测试通过，旧web plist已备份至`/Users/jojo/Sites/travel-LGB/service-backups/web-before-queue128-20260916/com.jojo.travel-lgb.web.plist`，SHA-256 `a3eb7e887abf1bd76a4e6bd1be24f230b6100cd5707478b309d2df61c3bd3e28`与旧仓库模板完全一致。脚本安装至`/Users/jojo/Sites/travel-LGB/web/queue128-v1/serve.py`（444；后续修订另建版本目录，不覆盖），哈希与本地相同。仅bootout/bootstrap web重读argv，PID22979→32838；alias76382和https99668均未变，8788健康检查200。current仍357d63b，全部69文件哈希不变，db87df6回滚保留。
- 正式并发检查：`node scripts/check-static-resources.mjs https://travel-lgb.duckdns.org/ 10`（逐轮20并发，附唯一查询串、正常TLS和逐字节哈希；仅这条命令直连该域名，不改代理）。再用正式`?debug=1`复查桌面/窄屏卡墙与收藏。

实际复验：正式200/200并发卡图哈希正确、无502；首页/JS/CSS/六新素材TLS和哈希、HTTP域名与8788通过。正式独立档桌面四列与390px三列、全部20图/14物、两收藏详情、窄屏豌杂面/返回及两次刷新通过，20趟/184文不变，控制台无警告错误。视口恢复，未操作正常档、Token或网络；本次1.4.7并发图片缺口关闭。仅收尾文档同步不重复部署/重启。

如需回滚此次服务调整，在Mini执行以下命令；只还原web启动配置，不切应用current、不动代理。先核对上述备份哈希，保留`queue128-v1`文件便于复查：

```sh
set -eu
plutil -lint /Users/jojo/Sites/travel-LGB/service-backups/web-before-queue128-20260916/com.jojo.travel-lgb.web.plist
game_uid=$(id -u)
launchctl bootout "gui/$game_uid/com.jojo.travel-lgb.web"
cp -p /Users/jojo/Sites/travel-LGB/service-backups/web-before-queue128-20260916/com.jojo.travel-lgb.web.plist /Users/jojo/Library/LaunchAgents/com.jojo.travel-lgb.web.plist
launchctl bootstrap "gui/$game_uid" /Users/jojo/Library/LaunchAgents/com.jojo.travel-lgb.web.plist
curl --fail --retry 5 --retry-connrefused --retry-delay 1 --max-time 5 --noproxy 127.0.0.1 http://127.0.0.1:8788/ -o /dev/null
```

修复前历史：1.4.7应用`357d63ba17460d1870863fd7f955f8b7de985684`上线时，本地72测试/构建/独立档先通过，Mini66项非原画归档测试/构建及两次69文件哈希一致后原子切换；1.4.6 db87df6保留，当时无重启。HTTPS玩法通过后并发图片复现502，随后按上文授权修复并复验。详见`outputs/release/1.4.7-叫叫彩蛋发布验收.MD`。以下1.4.6为历史，当前素材测试6项仅本地执行。

2026-09-12 起作为正式环境；原 Sites 站点已永久删除，后续不重建 Sites。

- 正式内网入口：`https://travel-lgb.duckdns.org/`；HTTP 别名与旧入口 `http://10.131.75.39:8788/` 保留。
- 主机：`brand-mini.local`（SSH `jojo@10.131.75.39`）。
- 源码：`/Users/jojo/Sites/travel-LGB/source`，跟踪 GitHub `main`。
- 成品：`/Users/jojo/Sites/travel-LGB/releases/<commit>`；`current` 原子指向当前版本。
- 服务：LaunchAgent `com.jojo.travel-lgb.web` 在 `8788` 提供静态文件；`com.jojo.travel-lgb.alias` 监听 `80`；`com.jojo.travel-lgb.https` 用带 DuckDNS DNS 插件的 Caddy 2.11.4 监听 `443`。后两者均反代至 `127.0.0.1:8788`。
- 日志：`~/Library/Logs/travel-lgb-web.log` 与 `.error.log`。
- 更新：源码执行 `git pull --ff-only`、`npm ci`、测试、`npm run build`，复制到新提交目录后切换 `current`；验证新资源，只有必要时才重启对应 LaunchAgent。

仅文档变更只同步 `source`，不构建、切换 `current` 或重启。2026-09-15最新发布：应用 `db87df67675d56b1a035e74e812fd5e1281cc6e8`（1.4.6，手账760px与桌面四列见闻）。先通过本地65项测试/构建和独立档试玩，再经Mini Node22.23.1下60项非原画归档测试/构建、构建与发布目录两次63文件SHA-256核对后原子切换。旧 `17356086be460d970854ec5c3af81ad5c2c8a3ba`（1.4.5）及更早版本保留回滚，无重启/配置或数据迁移。HTTPS首页、新JS/CSS、角色和四张新图共8文件哈希一致，TLS通过；HTTP域名和8788均200。专用浏览器接口失败，但原生Chrome正式独立档布局、三标签、详情返回、首趟/刷新去重、提示入口与设置1.4.6已通过；旧1.4.3日常旅程/1.4.5四卡完整验收不因此关闭。未修改网络、读取Token或操作正常档。详见 `outputs/release/1.4.6-Mini发布验收.MD`。

构建时显式使用已安装的 `/Users/jojo/.nvm/versions/node/v22.23.1/bin` 置于 PATH 首位；Mini 默认登录 Node 20 不是本项目本轮验证的构建运行时。原画归档不在 Mini 稀疏工作区，`assets.test.ts` 的5项归档测试在本地完整执行，Mini运行其余60项；不能把未运行归档测试写成全部65项通过。

固定发布流程（2026-09-15 用户确认）：**本地自动化与构建 → 本地独立档试玩通过 → 发布 Mini → 正式 HTTPS 检查。** 前两步未通过或受阻，不切正式 `current`；不允许先发布再补本地试玩。发布后的 HTTPS 资源/TLS 与相关独立档交互分别验收记录，不以资源 200 或旧版结果替代交互；未完成不得宣称全部验收通过。仅文档变更只同步源码，不构建、发布或重启游戏。

GitHub SSH 22 超时，可临时使用官方 443 入口，保留原 `origin` 与严格主机校验（当前机器已信任 GitHub 主机密钥）：

```sh
GIT_SSH_COMMAND='ssh -p 443 -o HostName=ssh.github.com -o HostKeyAlias=github.com -o StrictHostKeyChecking=yes -o BatchMode=yes -o ConnectTimeout=8' git push origin main
```

macOS 原子切换符号链接须用 `mv -fh <新链接> current`；少了 `-h` 会沿着旧 `current` 所指目录移动，导致线上仍停留旧版。切换后立刻 `readlink current` 核对，再测 HTTPS 新资源。

若本机到 GitHub 22/443 的直连均失败，但已有本机 HTTP 代理可用，可仅对当前 Git 命令临时加 `ProxyCommand=nc -X connect -x 127.0.0.1:7890 %h %p`，保留上述 GitHub 443、HostKeyAlias 与严格主机校验；不持久修改全局 SSH/代理设置，不输出凭据。

新代理使用项目自有的 Caddy 可执行文件与配置，不修改 Mini 上其他 Caddy 服务；未配置公网入口或访问鉴权。HTTPS 经 DuckDNS DNS 验证签发并由 Caddy 自动续期，证书只覆盖 `travel-lgb.duckdns.org`。Token 存放在 Mini 的 `~/Library/Application Support/travel-lgb/duckdns.token`，权限 600，禁止提交 Git 或贴入聊天。

HTTPS 部署文件为本目录的 `Caddyfile.https`、`run-https.sh`、`install-duckdns-token.sh`、`com.jojo.travel-lgb.https.plist`；Mini 专用可执行文件为 `~/Sites/travel-LGB/bin/caddy-duckdns`（Caddy v2.11.4，模块 `dns.providers.duckdns`）。重建时使用官方 Caddy 构建器添加 `github.com/caddy-dns/duckdns`；普通版 Caddy 不含此模块。证书和 Token 均不进仓库。

首次安装或更换 Token：先在 DuckDNS 账号取得新 Token，再从自己的终端执行 `ssh -tt jojo@10.131.75.39 '/Users/jojo/Sites/travel-LGB/alias/install-duckdns-token.sh'`，等出现隐藏输入提示后粘贴，不要直接当命令输入。随后启动/重启 `com.jojo.travel-lgb.https`。若 Token 曾出现在普通终端或日志中，先在 DuckDNS 重新生成，旧值作废。Mini 私网 IP 改变时仍需手动更新 DuckDNS A 记录。

验收：`curl -I https://travel-lgb.duckdns.org/` 应返回 200 且不使用 `-k`；同时检查 JS/CSS/角色图及 `http://` 旧入口。HTTPS、HTTP、IP 均是不同浏览器存档来源，切换前先导出进度。

若命令行 HTTPS 校验正常，而 Chrome 经系统代理报 `ERR_CONNECTION_CLOSED`，先比较直连/代理路径，不据此重启 Mini 或关闭证书校验。2026-09-14 用户授权仅将 `travel-lgb.duckdns.org` 追加至本机 Wi-Fi、AX88179A 的代理绕过列表后，Chrome HTTPS 恢复；原代理和所有既有例外保留。其他设备需各自确认网络情况，不能覆盖整份例外列表或改成全局直连。代理客户端重写系统配置后可能需要重新核对。

1.4.2 正式 HTTPS Chrome 独立档功能验收及 HTTP→HTTPS 文本导出/导入已通过，包含双页同步/接续和导入前备份恢复；见 `outputs/release/1.4.2-筒靴与HTTPS验收.MD`。内置浏览器本轮仍连接超时，未计通过；真机 Safari/Android 与真实玩家隔日回访未做，不以桌面或调试时间替代。

1.4.1 起支持内网 HTTP 存档：无 Web Locks 时使用 IndexedDB 租约互斥，存档仍在原 localStorage。验收必须在非 localhost 的 HTTP 地址测试实际操作与双页接续，不能仅以 HTTP 200 判定可玩；调试入口 `/?debug=1` 与正常存档隔离。

内网别名 `http://brand-mini.local:8788/` 仍可用；与新域名及 IP 入口的浏览器存档彼此独立。Wi-Fi 名称本身不构成访问控制。

2026-09-14 用户改选免费二级域名并在 DuckDNS 设置 `travel-lgb.duckdns.org → 10.131.75.39`。Mini 将现有 Caddy 2.11.4 复制到项目 `bin/caddy`，使用本目录的 `Caddyfile.intranet-alias` 和 `com.jojo.travel-lgb.alias.plist` 独立启动；不接触原游戏和其他站点。公开及公司 DNS、新旧入口与主要静态资源均验通。若 Mini 内网 IP 变更，需在 DuckDNS 手动更新 A 记录；浏览器存档需导出/导入，外网不能直达。

# Mac mini 部署

2026-09-12 起作为正式环境；原 Sites 站点已永久删除，后续不重建 Sites。

- 正式内网入口：`https://travel-lgb.duckdns.org/`；HTTP 别名与旧入口 `http://10.131.75.39:8788/` 保留。
- 主机：`brand-mini.local`（SSH `jojo@10.131.75.39`）。
- 源码：`/Users/jojo/Sites/travel-LGB/source`，跟踪 GitHub `main`。
- 成品：`/Users/jojo/Sites/travel-LGB/releases/<commit>`；`current` 原子指向当前版本。
- 服务：LaunchAgent `com.jojo.travel-lgb.web` 在 `8788` 提供静态文件；`com.jojo.travel-lgb.alias` 监听 `80`；`com.jojo.travel-lgb.https` 用带 DuckDNS DNS 插件的 Caddy 2.11.4 监听 `443`。后两者均反代至 `127.0.0.1:8788`。
- 日志：`~/Library/Logs/travel-lgb-web.log` 与 `.error.log`。
- 更新：源码执行 `git pull --ff-only`、`npm ci`、测试、`npm run build`，复制到新提交目录后切换 `current`；验证新资源，只有必要时才重启对应 LaunchAgent。

仅文档变更只同步 `source`，不构建、切换 `current` 或重启。2026-09-15 最新发布：应用 `17356086be460d970854ec5c3af81ad5c2c8a3ba`（1.4.5，四地第四卡与「坝坝宴，安逸～」标题），先通过本地 63 项测试、构建及独立档浏览器验收，再经 Mini Node 22.23.1 下 58 项非原画归档测试/构建、63 文件与本地 SHA-256 一致后原子切换。旧 `e0177d42399662a1824c848cf27853e196705303`（1.4.4）及更早版本保留回滚；无需重启，无数据库、上传服务或环境变量迁移。HTTPS 首页、新 JS/CSS、四张新图均 200 且哈希一致，TLS 校验通过，HTTP 域名和旧入口 200。正式浏览器专用接口超时，原生 Chrome 新测试页 ERR_CONNECTION_CLOSED，交互验收待补；未读取 Token、修改网络或操作正常档。详见 `outputs/release/1.4.5-Mini发布验收.MD`。

构建时显式使用已安装的 `/Users/jojo/.nvm/versions/node/v22.23.1/bin` 置于 PATH 首位；Mini 默认登录 Node 20 不是本项目本轮验证的构建运行时。原画归档不在 Mini 稀疏工作区，`assets.test.ts` 的 5 项归档测试在本地完整执行，Mini 运行其余 58 项；不能把跳过归档测试写成全部测试通过。

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

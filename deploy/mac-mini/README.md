# Mac mini 部署

2026-09-12 起作为正式环境；原 Sites 站点已永久删除，后续不重建 Sites。

- 正式内网入口：`http://travel-lgb.duckdns.org/`；旧入口 `http://10.131.75.39:8788/` 保留。
- 主机：`brand-mini.local`（SSH `jojo@10.131.75.39`）。
- 源码：`/Users/jojo/Sites/travel-LGB/source`，跟踪 GitHub `main`。
- 成品：`/Users/jojo/Sites/travel-LGB/releases/<commit>`；`current` 原子指向当前版本。
- 服务：LaunchAgent `com.jojo.travel-lgb.web` 监听 `8788`；独立 `com.jojo.travel-lgb.alias` 用 Caddy 2.11.4 监听 `80` 并反代至 `127.0.0.1:8788`。
- 日志：`~/Library/Logs/travel-lgb-web.log` 与 `.error.log`。
- 更新：源码执行 `git pull --ff-only`、`npm ci`、`npm run build`，复制到新提交目录后切换 `current`，再重启 LaunchAgent。

新代理使用项目自有的 Caddy 可执行文件与配置，不修改 Mini 上其他 Caddy 服务；未配置公网入口、TLS 或访问鉴权。

1.4.1 起支持内网 HTTP 存档：无 Web Locks 时使用 IndexedDB 租约互斥，存档仍在原 localStorage。验收必须在非 localhost 的 HTTP 地址测试实际操作与双页接续，不能仅以 HTTP 200 判定可玩；调试入口 `/?debug=1` 与正常存档隔离。

内网别名 `http://brand-mini.local:8788/` 仍可用；与新域名及 IP 入口的浏览器存档彼此独立。Wi-Fi 名称本身不构成访问控制。

2026-09-14 用户改选免费二级域名并在 DuckDNS 设置 `travel-lgb.duckdns.org → 10.131.75.39`。Mini 将现有 Caddy 2.11.4 复制到项目 `bin/caddy`，使用本目录的 `Caddyfile.intranet-alias` 和 `com.jojo.travel-lgb.alias.plist` 独立启动；不接触原游戏和其他站点。公开及公司 DNS、新旧入口与主要静态资源均验通。若 Mini 内网 IP 变更，需在 DuckDNS 手动更新 A 记录；浏览器存档需导出/导入，外网不能直达。

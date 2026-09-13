# Mac mini 部署

2026-09-12 起作为正式环境；原 Sites 站点已永久删除，后续不重建 Sites。

- 正式入口：`http://10.131.75.39:8788/`。
- 主机：`brand-mini.local`（SSH `jojo@10.131.75.39`）。
- 源码：`/Users/jojo/Sites/travel-LGB/source`，跟踪 GitHub `main`。
- 成品：`/Users/jojo/Sites/travel-LGB/releases/<commit>`；`current` 原子指向当前版本。
- 服务：LaunchAgent `com.jojo.travel-lgb.web`，监听 `8788`。
- 日志：`~/Library/Logs/travel-lgb-web.log` 与 `.error.log`。
- 更新：源码执行 `git pull --ff-only`、`npm ci`、`npm run build`，复制到新提交目录后切换 `current`，再重启 LaunchAgent。

此部署不修改 Mac mini 上已有 Caddy；未配置公网域名、TLS 或访问鉴权。

1.4.1 起支持内网 HTTP 存档：无 Web Locks 时使用 IndexedDB 租约互斥，存档仍在原 localStorage。验收必须在非 localhost 的 HTTP 地址测试实际操作与双页接续，不能仅以 HTTP 200 判定可玩；调试入口 `/?debug=1` 与正常存档隔离。

# 配置与部署

## 1. 数据边界

| 层级         | 权威来源                                        | 是否进入公开仓库           | 是否进入浏览器产物             |
| :----------- | :---------------------------------------------- | :------------------------- | :----------------------------- |
| 公开源码     | GitHub `main`                                   | 是                         | 按前端打包规则                 |
| 公开站点配置 | `shared/config/site.yaml`                       | 仅提交 `site.example.yaml` | 仅 Schema 白名单字段           |
| 公开根资产   | `shared/legacy/root-assets/favicon/`            | 否                         | 复制到 `/favicon/`             |
| 私有内容     | `shared/content/`                               | 否                         | 仅生成页面、公开索引及媒体 URL |
| 服务端密钥   | `shared/secrets/secrets.env` 或 Secret 管理平台 | 否                         | 否                             |

所有 `VITE_*` 均视为浏览器可见。本项目不再使用 `VITE_*` 保存站点配置、内容路径或密钥。

原有 `.env` 公开字段已迁入 `config/site.example.yaml`，原有 `static/data` 与 `static/posts` 示例已迁入 `fixtures/content/`。开发与 CI 直接使用迁移后的公开演示数据；生产构建只读取外部 YAML 与内容目录。

## 2. 服务器目录

```text
/srv/fuyao/
├── shared/
│   ├── config/
│   │   ├── site.yaml
│   │   └── content.yaml
│   ├── secrets/
│   │   └── secrets.env
│   ├── legacy/
│   │   └── root-assets/
│   │       └── favicon/
│   └── content/
│       ├── posts/
│       ├── data/
│       └── albums/
│           ├── photos/
│           ├── thumbnails/
│           └── metadata/
├── tooling/
│   ├── releases/<tooling-id>/
│   └── current -> releases/<tooling-id>
├── releases/<release-id>/
└── current -> releases/<release-id>
```

- 将 `shared` 作为内容和配置的持久化权威来源，独立备份。
- 将每个 `release` 设为只读站点版本，不包含指向 `shared` 的符号链接。
- 由 Web 服务器将 `/media/albums/photos/` 和 `/media/albums/thumbnails/` 映射到持久化媒体目录。
- 禁止对 `shared` 使用 `rsync --delete`、递归清理或随 release 删除。

## 3. 公开站点配置

以 [config/site.example.yaml](./config/site.example.yaml) 为字段模板。`schemaVersion` 当前为 `1`。

- `site`：站名、域名、运营日期、默认语言
- `profile`：公开姓名、生日、公开邮箱、头像、双语角色与签名
- `repository`：公开仓库名称、URL 和所有者
- `seo`：作者、描述、关键词和可选 Twitter ID
- `services.wallpaper.apiUrl`：日常壁纸图片端点。默认使用 `https://api.imyan.ren/bing/wallpaper`，接口直接返回 `image/jpeg` 二进制，不返回图片 URL 文本，前端不得对响应执行文本解析。桌面端、平板及横屏使用默认 `1920×1080` 图片；宽度小于 `768px` 的移动竖屏通过 `URL.searchParams` 增加 `type=mini`，使用 `768×1366` 图片。
- `services.wallpaper.defaultUrl`：本地或外部默认壁纸，仅在 Bing 图片端点加载失败时作为备用图片，不作为日常主图片来源；备用图片也失败时回退全局主题纯色背景。
- `services.amap`：浏览器 Key、安全码和代理地址；必须配置域名白名单与最小权限
- `services.*ProxyUrl`：不含秘密的统计与编程活动代理地址

生产校验拒绝未知字段、重复字段、错误类型、无效 URL、无效日期、无效邮箱、错误语言代码、秘密字段、空关键字段和示例占位值。

编程统计使用两个可选公开端点：`codingActivityProxyUrl` 返回每日活动，`codingLanguagesProxyUrl` 返回七日总语言分布。每日活动端点需要保留真实的逐日语言秒数，响应契约如下：

```json
{
  "data": [
    {
      "range": { "date": "2026-07-28", "text": "Today" },
      "grand_total": { "hours": 1, "minutes": 30, "total_seconds": 5400, "text": "1 hr 30 mins" },
      "languages": [
        { "name": "Svelte", "total_seconds": 3600, "percent": 66.67, "color": "#ff3e00" },
        { "name": "TypeScript", "total_seconds": 1800, "percent": 33.33, "color": "#3178c6" }
      ]
    }
  ]
}
```

- 从 WakaTime 每日 summary 直接映射 `languages[].total_seconds` 与 `percent`，不得把七日总比例复制到每一天。
- 仅返回每日 `grand_total` 时，前端将日柱显示为中性色，并把 `codingLanguagesProxyUrl` 的七日分布放在独立分段条中。
- `color` 仅接受合法十六进制颜色；缺失时前端使用内置语言颜色，仍无法识别时归入中性“其他”。
- WakaTime API Key 只保存在代理服务的 Secret 中，两个浏览器端 URL 均不得包含密钥或签名参数。

## 4. 内容目录映射

以 [config/content.example.yaml](./config/content.example.yaml) 为模板。所有 `paths` 均相对于 `FUYAO_CONTENT_ROOT`，不能填写绝对路径。构建端使用 `realpath` 验证每个目录仍位于内容根目录内，符号链接越界会阻止发布。

相册媒体采用 `external` 模式：元数据进入构建快照，原图和缩略图不复制到 Git 仓库或 release。

## 5. 服务端变量与密钥

`.env.example` 只列出非秘密的常规部署参数。生产部署和内容服务支持的外部变量如下：

| 变量                          | 必需条件                 | 用途                                           |
| :---------------------------- | :----------------------- | :--------------------------------------------- |
| `FUYAO_CONFIG_ROOT`           | 生产构建、部署           | 外部 `site.yaml` 与 `content.yaml` 所在目录    |
| `FUYAO_CONTENT_ROOT`          | 生产构建、迁移、内容准备 | 外部持久化内容根目录                           |
| `FUYAO_FAVICON_ROOT`          | 生产构建、部署           | 外部持久化 favicon 目录                        |
| `FUYAO_SHARED_ROOT`           | 部署                     | 配置、内容和密钥的持久化根目录                 |
| `FUYAO_RELEASE_ROOT`          | 部署                     | 独立 release 保存目录                          |
| `FUYAO_CURRENT_LINK`          | 部署                     | 当前线上 release 的符号链接                    |
| `FUYAO_DEPLOY_LOCK`           | 可选                     | 构建与部署互斥锁路径                           |
| `FUYAO_SECRETS_FILE`          | 可选                     | 为最终产物泄漏扫描提供需禁止出现的服务端秘密值 |
| `FUYAO_REPOSITORY_URL`        | 未设置本地源码目录时部署 | 公开源码仓库地址                               |
| `FUYAO_SOURCE_ROOT`           | 可选                     | 使用已存在源码目录部署，避免重新克隆           |
| `FUYAO_RELEASE_KEEP`          | 可选                     | 成功部署后保留的 release 数量，默认 `5`        |
| `FUYAO_HEALTHCHECK_URL`       | 可选                     | 切换后用于验证 `release.json` 的站点地址       |
| `FUYAO_POSTS_WATCH_DIR`       | 内容监听                 | 文章监听目录                                   |
| `FUYAO_ALBUM_PHOTOS_DIR`      | 相册生成、内容监听       | 相册原图目录                                   |
| `FUYAO_ALBUM_THUMBNAILS_DIR`  | 相册生成、内容准备       | 相册缩略图目录                                 |
| `FUYAO_ALBUM_METADATA_DIR`    | 相册生成、内容准备       | 相册索引输出目录                               |
| `FUYAO_ALBUM_COORD_TYPE`      | 可选                     | 原始 EXIF 坐标系，`wgs84` 或 `gcj02`           |
| `FUYAO_CONTENT_PENDING_FILE`  | 内容准备                 | 待发布状态文件                                 |
| `FUYAO_WATCH_MODE`            | 可选                     | 内容监听模式，`prepare` 或 `deploy`            |
| `FUYAO_WATCH_DEBOUNCE_MS`     | 可选                     | 连续文件事件合并时间，默认 `5000` 毫秒         |
| `FUYAO_CONTENT_DEPLOY_SCRIPT` | 可选                     | 内容监听器调用的准备或部署脚本路径             |
| `FUYAO_LEGACY_ROOT`           | 3.0.0 内容迁移           | 独立保存的 3.0.0 源文件树                      |
| `FUYAO_MIGRATION_TYPES`       | 可选                     | 逗号分隔的迁移内容类型                         |
| `FUYAO_MIGRATION_MANIFEST`    | 执行迁移                 | SHA-256 迁移清单输出路径                       |
| `FUYAO_PRIVACY_TERMS_FILE`    | 可选                     | 隐私扫描的外部敏感词文件，每行一项             |

`FUYAO_SKIP_LOCK`、`FUYAO_SKIP_INSTALL`、`FUYAO_FAST_DEPLOY`、`FUYAO_DEPLOY_REASON` 以及构建快照相关变量由部署和内容脚本内部传递，不作为常规人工配置入口。

旧 `.env` 已完成字段迁移并退出当前跟踪范围。项目不再使用 `.env.build`、`.env.dev` 或 `.env.local`；所有非 `.env.example` 文件继续由 Git 忽略，不得作为待发布文件提交。历史中已确认的高熵演示值仅通过 SHA-256 指纹消除误报；任何新增高熵值仍会阻止审计。

GitHub Token、部署令牌、私钥、密码和 Webhook Secret 只能进入服务端 Secret 管理。Cloudflare API Token 与 Zone ID 继续使用独立代理服务的 Secret，不在本仓库维护 Worker 部署配置。含不可公开令牌的 WakaTime 或统计 URL 必须放在服务器代理之后。

## 6. 构建模式

### 6.1 开发与 CI

```bash
npm ci
npm run check
npm test
npm run build
```

命令自动使用迁移后的 `config/*.example.yaml` 与 `fixtures/content/`，将输入复制到 `.fuyao/build-inputs/current/`，生成索引后冻结为只读快照。生成物不回写 `static`。

### 6.2 生产

```bash
export FUYAO_CONFIG_ROOT=/srv/fuyao/shared/config
export FUYAO_CONTENT_ROOT=/srv/fuyao/shared/content
export FUYAO_FAVICON_ROOT=/srv/fuyao/shared/legacy/root-assets/favicon
export FUYAO_DEPLOY_LOCK="$PWD/.fuyao/production-build.lock"
npm run build:production
```

本地构建时应把 `FUYAO_DEPLOY_LOCK` 指向当前工作区内的临时锁文件；服务器部署服务继续使用 `/srv/fuyao/deploy.lock`。生产模式不接受缺失目录、示例配置或不兼容 Schema。相册公开元数据保留 EXIF GPS，位置会进入浏览器可读取的 JSON；最终构建再次扫描秘密和服务器绝对路径。

## 7. 原子部署与回滚

生产部署模板位于 `deploy/systemd/` 和 `deploy/caddy/`。`npm run deploy` 执行以下事务：

1. 获取部署锁。
2. 从公开 `main` 克隆到临时目录。
3. 只读使用外部配置和内容，准备构建快照。
4. 执行检查、测试、生产构建和产物扫描。
5. 将构建结果复制到新的 `releases/<release-id>/`。
6. 原子切换 `current`，随后执行可选健康检查。
7. 健康检查失败时恢复旧指针；成功后按保留数量清理旧 release。

回滚命令：

```bash
node scripts/deploy.js --rollback=<release-id>
```

回滚仅切换 release 指针，不修改持久化内容。

## 8. 内容目录监控

生产环境使用 `fuyao-content-watcher.service` 统一监听以下权威目录：

- 监听 `/srv/fuyao/shared/content/posts/` 下的 Markdown 变更，并将 `posts` 写入待发布状态。
- 监听 `/srv/fuyao/shared/content/albums/photos/` 下的图片变更，导入根目录新照片、按日期重命名归档、生成响应式 WebP 缩略图和保留 GPS 的公开 EXIF 元数据，并将 `albums` 写入待发布状态。
- 使用 5 秒防抖合并连续文件事件；处理期间产生的新事件会排队，不并行修改内容。

新增照片时，将 `jpg`、`jpeg`、`png`、`heic`、`webp`、`tiff` 或 `tif` 文件直接上传到 `albums/photos/` 根目录。不要手工写入 `thumbnails/` 或 `metadata/`。

服务使用 `/srv/fuyao/tooling/current` 中的已验证源码与依赖，并通过 `/opt/fuyao/node/bin/node` 运行。代码版本发布后必须同步更新 tooling；内容变更不再从远程仓库临时克隆。

服务器只准备内容并写入 `/srv/fuyao/shared/content/state/pending-deploy.json`，不执行 Vite 生产构建。发布时将外部配置、内容和 favicon 下载到本地，运行 `npm run build:production`，再通过 rsync 上传独立 release 并原子切换 `current`。该模式避免低内存服务器因预渲染进入 OOM 或重度换页。

```bash
systemctl reload fuyao-content-watcher.service
systemctl kill -s SIGUSR2 fuyao-content-watcher.service
journalctl -u fuyao-content-watcher.service -f
```

- `reload`：手工记录文章待发布状态。
- `SIGUSR2`：手工触发相册整理并记录待发布状态。
- `journalctl`：查看监听事件和内容准备结果。

旧 `/root/blog-tools/scripts/watch-posts.js` 仅监控 `/home/caddy/www/index/posts`，迁移后必须停用 `blog-watcher.service`。为便于回滚，可保留旧工具目录和 unit 备份，但不得同时启用两个监听服务。

## 9. 3.0.0 内容迁移

旧 `.env` 配置、部署变量、密钥边界、博客与足迹从 3.0.0 迁移到 27.0 的完整字段映射、排除项、校验和回滚要求见 [3.0.0 至 27.0 配置与内容迁移](./MIGRATION_3_TO_27.md)。迁移脚本必须通过 `FUYAO_LEGACY_ROOT` 读取独立的 3.0.0 文件树，不依赖 27.0 仓库中已经删除的 `static/posts` 与 `static/data`。

先生成不写入文件的迁移清单：

```bash
export FUYAO_LEGACY_ROOT=/srv/fuyao/migration-source/3.0.0
export FUYAO_MIGRATION_TYPES=posts,footprints
npm run content:migrate:plan
```

确认外部目录和清单保存位置后再复制：

```bash
export FUYAO_CONTENT_ROOT=/srv/fuyao/shared/content
export FUYAO_MIGRATION_MANIFEST=/srv/fuyao/shared/backups/migration-<date>.json
npm run content:migrate:apply
```

迁移脚本不覆盖内容不同的目标文件，不删除源文件，并记录文件数、总大小和每个文件的 SHA-256。仓库演示配置与内容已经迁入 `config/` 和 `fixtures/content/`；未来加入的真实 YAML、文章、媒体和生成索引必须先完成外部备份与抽样恢复，再从 Git 跟踪范围移除。

如果秘密曾进入 Git 历史，必须先在对应平台轮换或撤销，再使用专用历史重写工具清理所有引用；仅删除最新提交不构成清理完成。重写后重新运行：

```bash
npm run audit:privacy
npm run audit:history
```

个人姓名、域名、邮箱、用户名和坐标使用外部 `FUYAO_PRIVACY_TERMS_FILE` 逐行列出，扫描时只报告命中文件，不输出词值。

## 10. 版本与 Build Train

`version.json` 是唯一人工维护入口。27.1 使用 SemVer 存储值 `27.1.0`，页面显示为 `27.1`；Build Train 独立设为 `4B`，构建序号 96 显示为 `4B96`。构建标识直接拼接 Build Train 与构建序号，不补前导零。

```bash
npm run version:show
npm run version:set -- 27.1.0 4B
npm run build:set -- 96
npm run build:bump
npm run train:set -- 4C
```

开发、检查、测试和构建不会自动修改版本。只有显式版本命令会同步 `version.json`、`package.json` 和 `package-lock.json`。

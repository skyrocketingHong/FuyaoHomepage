# 3.0.0 至 27.0 配置与内容迁移

本文档迁移 3.0.0 的 `.env` 站点配置、部署配置、博客源文件和足迹数据。不迁移生成索引，不修改 3.0.0 源目录，也不覆盖 27.0 已存在的不同内容。

## 1. 迁移边界

| 数据       | 3.0.0 来源                    | 27.0 目标                                        | 处理方式                                   |
| :--------- | :---------------------------- | :----------------------------------------------- | :----------------------------------------- |
| 站点配置   | `.env` 中公开的 `VITE_*`      | `/srv/fuyao/shared/config/site.yaml`             | 按字段映射为版本化 YAML                    |
| 内容映射   | `static/` 固定目录约定        | `/srv/fuyao/shared/config/content.yaml`          | 使用相对路径声明内容目录                   |
| 部署参数   | 无统一来源                    | 部署进程环境或 systemd `EnvironmentFile`         | 使用 `FUYAO_*` 服务端变量                  |
| 服务端密钥 | 不应存在于前端 `.env`         | `/srv/fuyao/shared/secrets/secrets.env`          | 轮换后写入，仅服务端读取                   |
| 博客文章   | `static/posts/`               | `/srv/fuyao/shared/content/posts/`               | 复制 Markdown、分类 `_index.md` 和文章附件 |
| 博客生成物 | `static/posts/all.json` 等    | 不迁移                                           | 由 27.0 构建流程重新生成                   |
| 足迹数据   | `static/data/footprints.yaml` | `/srv/fuyao/shared/content/data/footprints.yaml` | 原样复制并校验 SHA-256                     |

以下博客生成物必须排除：`all.json`、`categories.json`、`search.json`、`map.json`、`rss.xml`。根目录旧 `static/sitemap.xml` 同样不得迁移。

足迹 YAML 的 `cities`、`places`、`name.zh`、`name.en`、`coordinates`、`visitDate`、`description`、`type` 和 `adcode` 字段与 27.0 兼容，不需要原地改写。生产内容中的经纬度属于个人内容，不得放回公开源码仓库。

## 2. 迁移配置

### 2.1 建立配置目录

在服务器建立外部持久化目录，不要在源码仓库中创建真实 `site.yaml`、`content.yaml` 或 `secrets.env`：

```bash
sudo install -d -m 0750 /srv/fuyao/shared/config
sudo install -d -m 0700 /srv/fuyao/shared/secrets
sudo install -d -m 0750 /srv/fuyao/shared/content
sudoedit /srv/fuyao/shared/config/site.yaml
sudoedit /srv/fuyao/shared/config/content.yaml
sudoedit /srv/fuyao/shared/secrets/secrets.env
sudo chmod 0640 /srv/fuyao/shared/config/site.yaml /srv/fuyao/shared/config/content.yaml
sudo chmod 0600 /srv/fuyao/shared/secrets/secrets.env
```

### 2.2 `.env` 到 `site.yaml` 字段映射

| 3.0.0 环境变量                 | 27.0 YAML 字段                     | 迁移规则                                       |
| :----------------------------- | :--------------------------------- | :--------------------------------------------- |
| `VITE_SITE_NAME`               | `site.name`                        | 原值迁移                                       |
| `VITE_SITE_URL`                | `site.url`                         | 使用完整 `https://` URL，不保留末尾斜杠        |
| `VITE_SITE_START_DATE`         | `site.startDate`                   | 转为 `YYYY-MM-DD`                              |
| `VITE_SITE_START_YEAR`         | `site.startYear`                   | 转为 YAML 整数                                 |
| 无                             | `site.defaultLocale`               | 新增，填写 `zh-CN` 或 `en-US`                  |
| `VITE_SEO_AUTHOR`              | `profile.name`、`seo.author`       | 3.0.0 将作者名同时用于个人资料和 SEO           |
| `VITE_USER_BIRTH_DATE`         | `profile.birthDate`                | 转为 `YYYY-MM-DD`                              |
| `VITE_AVATAR_URL`              | `profile.avatarUrl`                | 必须是完整 URL；旧值为空时填写实际公开头像 URL |
| `VITE_USER_ROLE_ZH`            | `profile.roles.zh-CN`              | 原值迁移                                       |
| `VITE_USER_ROLE_EN`            | `profile.roles.en-US`              | 原值迁移                                       |
| `VITE_USER_QUOTE_ZH`           | `profile.quotes.zh-CN`             | 原值迁移                                       |
| `VITE_USER_QUOTE_EN`           | `profile.quotes.en-US`             | 原值迁移                                       |
| `VITE_REPO_NAME`               | `repository.name`                  | 原值迁移                                       |
| `VITE_REPO_URL`                | `repository.url`                   | 使用完整仓库 URL                               |
| `VITE_GITHUB_USERNAME`         | `repository.owner`                 | 只填写公开用户名，不拼接 URL                   |
| `VITE_SEO_DESCRIPTION`         | `seo.description`                  | 原值迁移                                       |
| `VITE_SEO_KEYWORDS`            | `seo.keywords`                     | 将逗号分隔字符串拆为 YAML 字符串数组           |
| `VITE_TWITTER_ID`              | `seo.twitterId`                    | 可选；为空时删除该字段                         |
| `VITE_WALLPAPER_API`           | `services.wallpaper.apiUrl`        | 可选公开端点；另行补充必填的 `defaultUrl`      |
| `VITE_AMAP_KEY`                | `services.amap.browserKey`         | 浏览器公开 Key，必须设置域名白名单和最小权限   |
| `VITE_AMAP_SECURITY_CODE`      | `services.amap.securityCode`       | 浏览器公开安全码，不作为服务端秘密             |
| `VITE_AMAP_SERVICE_HOST`       | `services.amap.serviceHost`        | 可选完整 URL；为空时删除该字段                 |
| `VITE_CF_ANALYTICS_WORKER_URL` | `services.analyticsProxyUrl`       | 只迁移不含秘密的代理 URL                       |
| `VITE_WAKATIME_EMBED_URL`      | `services.codingActivityProxyUrl`  | URL 含令牌时禁止原样迁移，改为服务器代理 URL   |
| `VITE_WAKATIME_LANGUAGES_URL`  | `services.codingLanguagesProxyUrl` | URL 含令牌时禁止原样迁移，改为服务器代理 URL   |
| `VITE_BLOG_URL`                | 不迁移                             | 27.0 使用站内固定路由 `/blog/`，删除旧变量     |

`profile.email` 是 27.0 新增可选字段，3.0.0 没有对应变量；需要公开邮箱时手工添加，不需要时删除。

生产 `site.yaml` 结构如下。尖括号内容必须替换为 3.0.0 的实际公开值，不能保留示例域名或占位 Key：

```yaml
schemaVersion: 1
site:
  name: '<VITE_SITE_NAME>'
  url: '<VITE_SITE_URL>'
  startDate: '<YYYY-MM-DD>'
  startYear: 2024
  defaultLocale: zh-CN
profile:
  name: '<VITE_SEO_AUTHOR>'
  birthDate: '<YYYY-MM-DD>'
  avatarUrl: '<VITE_AVATAR_URL 或实际公开头像 URL>'
  roles:
    zh-CN: '<VITE_USER_ROLE_ZH>'
    en-US: '<VITE_USER_ROLE_EN>'
  quotes:
    zh-CN: '<VITE_USER_QUOTE_ZH>'
    en-US: '<VITE_USER_QUOTE_EN>'
repository:
  name: '<VITE_REPO_NAME>'
  url: '<VITE_REPO_URL>'
  owner: '<VITE_GITHUB_USERNAME>'
seo:
  author: '<VITE_SEO_AUTHOR>'
  description: '<VITE_SEO_DESCRIPTION>'
  keywords:
    - '<关键词一>'
    - '<关键词二>'
services:
  wallpaper:
    defaultUrl: '<稳定的默认壁纸 URL>'
    apiUrl: '<VITE_WALLPAPER_API>'
  amap:
    browserKey: '<VITE_AMAP_KEY>'
    securityCode: '<VITE_AMAP_SECURITY_CODE>'
    serviceHost: '<VITE_AMAP_SERVICE_HOST>'
  analyticsProxyUrl: '<VITE_CF_ANALYTICS_WORKER_URL>'
  codingActivityProxyUrl: '<不含秘密的编程活动代理 URL>'
  codingLanguagesProxyUrl: '<不含秘密的语言统计代理 URL>'
```

可选字段没有值时应整行删除，不能填写空字符串。`site.yaml` 只能包含 Schema 允许的字段，未知字段会阻止生产构建。

### 2.3 创建 `content.yaml`

3.0.0 没有内容映射文件。27.0 使用下列固定相对路径：

```yaml
schemaVersion: 1
paths:
  posts: posts
  data: data
  albumPhotos: albums/photos
  albumThumbnails: albums/thumbnails
  albumMetadata: albums/metadata
media:
  albumPublicBase: /media/albums
  mode: external
```

所有 `paths` 均相对于 `FUYAO_CONTENT_ROOT`，禁止填写 `/srv/fuyao/` 绝对路径。即使当前没有相册，也要保留三个相册目录映射，并创建对应空目录。

### 2.4 配置部署变量

以下变量不是从旧 `VITE_*` 重命名而来，而是只供 27.0 构建与部署进程读取：

```dotenv
FUYAO_CONFIG_ROOT=/srv/fuyao/shared/config
FUYAO_CONTENT_ROOT=/srv/fuyao/shared/content
FUYAO_SHARED_ROOT=/srv/fuyao/shared
FUYAO_RELEASE_ROOT=/srv/fuyao/releases
FUYAO_CURRENT_LINK=/srv/fuyao/current
FUYAO_DEPLOY_LOCK=/srv/fuyao/deploy.lock
FUYAO_SECRETS_FILE=/srv/fuyao/shared/secrets/secrets.env
FUYAO_REPOSITORY_URL=<公开 main 仓库 URL>
FUYAO_RELEASE_KEEP=5
FUYAO_HEALTHCHECK_URL=<部署后健康检查 URL>
```

将这些值写入 systemd `EnvironmentFile` 或部署账户的受控环境，不要创建仓库内 `.env.production`。

### 2.5 处理服务端密钥

3.0.0 的所有 `VITE_*` 都已经进入浏览器，不能视为秘密。迁移时执行以下处理：

- 高德浏览器 Key 和安全码可迁入 `site.yaml`，但必须限制允许域名和权限。
- Cloudflare API Token、Zone ID、GitHub Token、Webhook Secret、部署令牌、私钥和密码不得写入 `site.yaml`。
- WakaTime 或统计 URL 中若含令牌，先轮换旧令牌，再由独立服务器代理持有新令牌；`site.yaml` 只保存代理 URL。
- `secrets.env` 只保存服务器进程实际需要的秘密，使用 `KEY=value` 格式，不提交到 Git，不复制到 release。

### 2.6 配置预检

完成配置后先只验证生产输入：

```bash
export FUYAO_CONFIG_ROOT=/srv/fuyao/shared/config
export FUYAO_CONTENT_ROOT=/srv/fuyao/shared/content
export FUYAO_SECRETS_FILE=/srv/fuyao/shared/secrets/secrets.env
npm run inputs:prepare:production
```

该命令会拒绝示例域名、占位 Key、未知字段、重复字段、错误日期、错误 URL、秘密字段和越界内容路径。

## 3. 内容迁移前准备

1. 保留一份只读的 3.0.0 文件树，例如 `/srv/fuyao/migration-source/3.0.0/`。
2. 备份现有 `/srv/fuyao/shared/content/`，确认备份可读取。
3. 停止内容发布任务，避免迁移期间发生并发写入。
4. 从 27.0 源码目录执行本页命令，不在 3.0.0 线上目录直接升级或构建。

3.0.0 源目录至少应包含：

```text
/srv/fuyao/migration-source/3.0.0/
└── static/
    ├── posts/
    │   ├── <category>/_index.md
    │   ├── <category>/<article>.md
    │   └── <article-assets>/
    └── data/footprints.yaml
```

## 4. 生成内容迁移预检清单

```bash
export FUYAO_LEGACY_ROOT=/srv/fuyao/migration-source/3.0.0
export FUYAO_CONTENT_ROOT=/srv/fuyao/shared/content
export FUYAO_MIGRATION_TYPES=posts,footprints
export FUYAO_MIGRATION_MANIFEST=/srv/fuyao/shared/backups/migration-3.0.0-to-27.0.json
npm run content:migrate:plan
```

预检只计算文件数量、总字节数和 SHA-256，不写入目标目录。若源目录错误、没有找到所选内容、存在符号链接或迁移类型无效，命令会直接失败。

检查重点：

- 博客清单只包含作者维护的 Markdown、分类文件和文章附件。
- 清单不包含 `all.json`、`categories.json`、`search.json`、`map.json`、`rss.xml` 或 `sitemap.xml`。
- 足迹清单只包含 `static/data/footprints.yaml`。
- 目标路径仅位于 `posts/` 和 `data/footprints.yaml`。

## 5. 执行内容迁移

确认预检结果后执行：

```bash
npm run content:migrate:apply
```

迁移脚本采用以下保护：

- 不删除 3.0.0 源文件。
- 不覆盖目标中内容不同的同名文件。
- 已存在且 SHA-256 相同的文件视为通过。
- 每个新复制文件在写入后重新计算 SHA-256。
- 迁移清单使用 `0600` 权限且拒绝覆盖同名清单。

执行成功后，清单位于 `$FUYAO_MIGRATION_MANIFEST`，其中记录迁移类型、文件数、总大小和逐文件 SHA-256。

## 6. 核对 27.0 内容目录

确认 `/srv/fuyao/shared/config/content.yaml` 与下列映射一致：

```yaml
schemaVersion: 1
paths:
  posts: posts
  data: data
  albumPhotos: albums/photos
  albumThumbnails: albums/thumbnails
  albumMetadata: albums/metadata
media:
  albumPublicBase: /media/albums
  mode: external
```

所有路径均相对于 `FUYAO_CONTENT_ROOT`。不得在 YAML 中填写 `/srv/fuyao/` 绝对路径。

## 7. 验证配置、博客和足迹

```bash
export FUYAO_CONFIG_ROOT=/srv/fuyao/shared/config
export FUYAO_CONTENT_ROOT=/srv/fuyao/shared/content
npm run inputs:prepare:production
npm run check
npm test
npm run build:production
```

验收结果应满足：

- 博客索引、搜索索引、RSS 和 Sitemap 由迁移后的 Markdown 重新生成。
- 页面站名、个人资料、仓库链接、SEO、壁纸、地图和统计代理均来自新 `site.yaml`。
- 每篇非草稿文章具有可解析的 Front Matter；`title`、`date`、`slug`、`categories` 和 `tags` 保持原值。
- `_index.md` 继续提供分类标题，不作为普通文章发布。
- 足迹页面能够读取全部城市和地点，名称、访问日期、描述与坐标未变化。
- 最终构建产物不包含 `/srv/fuyao/` 路径、迁移清单或服务端密钥。

完成构建后先部署为独立 release 并执行健康检查，再原子切换 `/srv/fuyao/current`。不得使用覆盖式 `git pull` 或 `rsync --delete` 操作持久化内容。

## 8. 回滚

迁移脚本本身不删除源文件。验证失败时不要切换 `current`，修正外部内容后重新构建。已经切换 27.0 且需要回退代码时，执行：

```bash
node scripts/deploy.js --rollback=<3.0.0-release-id>
```

代码回滚不会修改 `/srv/fuyao/shared/content/`。如需恢复内容，使用迁移前备份恢复 `shared/content`，并保留失败清单用于差异核对。

[English](./MIGRATION_3_TO_27.md) | 简体中文

# 从 3.0.0 迁移到 27.0

本手册用于把 3.0.0 的站点配置和 `static/` 私有内容迁移到 27.0。迁移过程不会修改旧站目录，也不会迁移可重新生成的索引文件。

## 1. 先理解 `/srv/fuyao/shared/config/`

`/srv/fuyao/shared/config/` 不是 3.0.0 已有的目录，也不是安装程序自动生成的目录。它是 27.0 部署模板采用的**示例生产目录**，需要由服务器管理员手工创建。

27.0 将数据分成两类：

- `releases/`：每次发布生成一份，可删除、可回滚。
- `shared/`：配置、文章、足迹和相册等持久化数据，不随发布删除。

默认目录关系如下：

```text
/srv/fuyao/                         # 本手册选用的部署根目录
├── migration-source/3.0.0/        # 3.0.0 的只读副本，仅迁移期间使用
├── shared/                        # 跨版本保留，必须单独备份
│   ├── config/                    # site.yaml、content.yaml
│   ├── content/                   # 文章、足迹、友链、支付信息和相册
│   ├── legacy/root-assets/favicon/# 生产 favicon
│   ├── secrets/                   # 服务端密钥
│   └── backups/                   # 迁移清单和内容备份
├── releases/                      # 27.0 及后续版本的构建产物
└── current -> releases/<release-id>
```

`/srv/fuyao` 不是强制路径。如果服务器已经使用 `/opt/my-site`、`/var/www/example` 等目录，可以继续使用，只需让所有 `FUYAO_*` 变量和 systemd 配置指向实际位置。后文使用 `/srv/fuyao`，是因为仓库中的 `deploy/systemd/` 模板也采用该路径。

## 2. 迁移结果一览

| 3.0.0 数据             | 3.0.0 来源                      | 27.0 目标                               | 迁移方法           |
| :--------------------- | :------------------------------ | :-------------------------------------- | :----------------- |
| 站点公开配置           | `.env` 中的 `VITE_*`            | `shared/config/site.yaml`               | 按字段转换为 YAML  |
| 内容目录规则           | 3.0.0 固定使用 `static/`        | `shared/config/content.yaml`            | 新建映射文件       |
| 博客文章和附件         | `static/posts/`                 | `shared/content/posts/`                 | 迁移脚本复制       |
| 足迹                   | `static/data/footprints.yaml`   | `shared/content/data/footprints.yaml`   | 迁移脚本复制       |
| 友链                   | `static/data/friends.yaml`      | `shared/content/data/friends.yaml`      | 按需由迁移脚本复制 |
| 支付信息               | `static/data/payments.yaml`     | `shared/content/data/payments.yaml`     | 按需由迁移脚本复制 |
| 社交链接               | `static/data/social-links.yaml` | `shared/content/data/social-links.yaml` | 按需由迁移脚本复制 |
| 相册                   | `static/albums/`                | `shared/content/albums/`                | 按需由迁移脚本复制 |
| favicon                | `static/favicon/`               | `shared/legacy/root-assets/favicon/`    | 手工复制           |
| 服务端密钥             | 不应来自前端 `.env`             | `shared/secrets/secrets.env`            | 轮换后重新填写     |
| 博客索引、RSS、Sitemap | 3.0.0 生成物                    | 不迁移                                  | 由 27.0 重新生成   |

迁移脚本会排除 `all.json`、`categories.json`、`search.json`、`map.json` 和 `rss.xml`。旧 `static/sitemap.xml` 也不要复制。

## 3. 迁移前准备

### 3.1 确定三处位置

开始前确认：

1. **27.0 源码目录**：已检出 27.0 代码并完成 `npm ci`，后续 `npm run` 命令均在这里执行。
2. **3.0.0 源目录**：旧站的完整副本，至少包含 `.env` 和需要迁移的 `static/` 内容。
3. **27.0 持久化目录**：用于长期保存生产配置和内容，不在 Git 仓库内。

本手册使用以下变量。变量只在当前 Shell 会话中有效：

```bash
export FUYAO_SERVER_ROOT=/srv/fuyao
export FUYAO_LEGACY_ROOT="$FUYAO_SERVER_ROOT/migration-source/3.0.0"
export FUYAO_SHARED_ROOT="$FUYAO_SERVER_ROOT/shared"
export FUYAO_CONFIG_ROOT="$FUYAO_SHARED_ROOT/config"
export FUYAO_CONTENT_ROOT="$FUYAO_SHARED_ROOT/content"
export FUYAO_FAVICON_ROOT="$FUYAO_SHARED_ROOT/legacy/root-assets/favicon"
export FUYAO_SECRETS_FILE="$FUYAO_SHARED_ROOT/secrets/secrets.env"
```

如果不用 `/srv/fuyao`，只修改第一行，不要在后续命令中混用两套路径。

### 3.2 准备 3.0.0 只读副本

不要直接在正在运行的 3.0.0 站点目录中执行迁移。将旧目录复制到 `$FUYAO_LEGACY_ROOT`，或把 `FUYAO_LEGACY_ROOT` 改为已经准备好的只读备份目录。

迁移文章和足迹时，源目录至少应为：

```text
<FUYAO_LEGACY_ROOT>/
├── .env
└── static/
    ├── favicon/
    ├── posts/
    │   ├── <分类>/_index.md
    │   ├── <分类>/<文章>.md
    │   └── <文章附件>/
    └── data/
        └── footprints.yaml
```

迁移前还应完成以下操作：

- 备份现有 `$FUYAO_CONTENT_ROOT`，并抽样确认备份可读取。
- 暂停旧的内容发布或监听任务，避免迁移期间源文件变化。
- 保留 3.0.0 线上目录，27.0 验收完成前不要删除。

### 3.3 创建 27.0 持久化目录

仓库的 systemd 示例默认使用 `fuyao` 用户和用户组。如果实际服务账户不同，先修改以下两个变量：

```bash
export FUYAO_SERVICE_USER=fuyao
export FUYAO_SERVICE_GROUP=fuyao

sudo install -d -o "$FUYAO_SERVICE_USER" -g "$FUYAO_SERVICE_GROUP" -m 0750 \
  "$FUYAO_CONFIG_ROOT" \
  "$FUYAO_CONTENT_ROOT" \
  "$FUYAO_CONTENT_ROOT/posts" \
  "$FUYAO_CONTENT_ROOT/data" \
  "$FUYAO_CONTENT_ROOT/albums/photos" \
  "$FUYAO_CONTENT_ROOT/albums/thumbnails" \
  "$FUYAO_CONTENT_ROOT/albums/metadata" \
  "$FUYAO_FAVICON_ROOT"

sudo install -d -o "$FUYAO_SERVICE_USER" -g "$FUYAO_SERVICE_GROUP" -m 0700 \
  "$FUYAO_SHARED_ROOT/secrets" \
  "$FUYAO_SHARED_ROOT/backups"
```

## 4. 迁移站点配置

### 4.1 从模板创建两个 YAML 文件

在 27.0 源码目录执行：

以下命令会创建新文件。目标文件已经存在时，不要覆盖；先确认它是否为当前生产配置。

```bash
sudo install -o "$FUYAO_SERVICE_USER" -g "$FUYAO_SERVICE_GROUP" -m 0640 \
  config/site.example.yaml "$FUYAO_CONFIG_ROOT/site.yaml"

sudo install -o "$FUYAO_SERVICE_USER" -g "$FUYAO_SERVICE_GROUP" -m 0640 \
  config/content.example.yaml "$FUYAO_CONFIG_ROOT/content.yaml"
```

然后编辑 `site.yaml`：

```bash
sudoedit "$FUYAO_CONFIG_ROOT/site.yaml"
```

`site.yaml` 保存可以进入浏览器的公开站点配置；`content.yaml` 只描述内容子目录。两者都位于仓库外，因此后续升级代码不会覆盖它们。

### 4.2 把旧 `.env` 写入 `site.yaml`

打开旧 `$FUYAO_LEGACY_ROOT/.env` 和新 `$FUYAO_CONFIG_ROOT/site.yaml`，按下表填写：

| 3.0.0 环境变量                 | 27.0 YAML 字段                     | 处理规则                                |
| :----------------------------- | :--------------------------------- | :-------------------------------------- |
| `VITE_SITE_NAME`               | `site.name`                        | 原值迁移                                |
| `VITE_SITE_URL`                | `site.url`                         | 使用完整 `https://` URL，不保留末尾斜杠 |
| `VITE_SITE_START_DATE`         | `site.startDate`                   | 转为 `YYYY-MM-DD`                       |
| `VITE_SITE_START_YEAR`         | `site.startYear`                   | 填写 YAML 整数                          |
| 无                             | `site.defaultLocale`               | 新增，填写 `zh-CN` 或 `en-US`           |
| `VITE_SEO_AUTHOR`              | `profile.name`、`seo.author`       | 同一个旧值写入两个字段                  |
| `VITE_USER_BIRTH_DATE`         | `profile.birthDate`                | 转为 `YYYY-MM-DD`                       |
| `VITE_AVATAR_URL`              | `profile.avatarUrl`                | 使用完整公开 URL                        |
| `VITE_USER_ROLE_ZH`            | `profile.roles.zh-CN`              | 原值迁移                                |
| `VITE_USER_ROLE_EN`            | `profile.roles.en-US`              | 原值迁移                                |
| `VITE_USER_QUOTE_ZH`           | `profile.quotes.zh-CN`             | 原值迁移                                |
| `VITE_USER_QUOTE_EN`           | `profile.quotes.en-US`             | 原值迁移                                |
| `VITE_REPO_NAME`               | `repository.name`                  | 原值迁移                                |
| `VITE_REPO_URL`                | `repository.url`                   | 使用完整仓库 URL                        |
| `VITE_GITHUB_USERNAME`         | `repository.owner`                 | 只填写用户名                            |
| `VITE_SEO_DESCRIPTION`         | `seo.description`                  | 原值迁移                                |
| `VITE_SEO_KEYWORDS`            | `seo.keywords`                     | 将逗号分隔文本拆成 YAML 数组            |
| `VITE_TWITTER_ID`              | `seo.twitterId`                    | 可选；没有值时删除字段                  |
| `VITE_WALLPAPER_API`           | `services.wallpaper.apiUrl`        | 可选；另行填写必需的 `defaultUrl`       |
| `VITE_AMAP_KEY`                | `services.amap.browserKey`         | 浏览器公开 Key，限制域名和权限          |
| `VITE_AMAP_SECURITY_CODE`      | `services.amap.securityCode`       | 浏览器公开安全码                        |
| `VITE_AMAP_SERVICE_HOST`       | `services.amap.serviceHost`        | 可选；没有值时删除字段                  |
| `VITE_CF_ANALYTICS_WORKER_URL` | `services.analyticsProxyUrl`       | 只填写不含秘密的代理 URL                |
| `VITE_WAKATIME_EMBED_URL`      | `services.codingActivityProxyUrl`  | 含令牌时改用服务器代理 URL              |
| `VITE_WAKATIME_LANGUAGES_URL`  | `services.codingLanguagesProxyUrl` | 含令牌时改用服务器代理 URL              |
| `VITE_BLOG_URL`                | 不迁移                             | 27.0 固定使用站内 `/blog/`              |

`profile.email` 是 27.0 新增的可选字段。需要公开邮箱时手工填写，不需要时删除。其他可选字段没有值时也应删除整行，不要填写空字符串。

可直接对照以下结构检查层级：

```yaml
schemaVersion: 1
site:
  name: '<站点名称>'
  url: '<https://站点域名>'
  startDate: '<YYYY-MM-DD>'
  startYear: 2024
  defaultLocale: zh-CN
profile:
  name: '<公开姓名>'
  birthDate: '<YYYY-MM-DD>'
  avatarUrl: '<公开头像 URL>'
  roles:
    zh-CN: '<中文角色>'
    en-US: '<英文角色>'
  quotes:
    zh-CN: '<中文签名>'
    en-US: '<英文签名>'
repository:
  name: '<仓库名称>'
  url: '<仓库 URL>'
  owner: '<仓库所有者>'
seo:
  author: '<作者>'
  description: '<站点描述>'
  keywords:
    - '<关键词一>'
    - '<关键词二>'
services:
  wallpaper:
    defaultUrl: '<默认壁纸 URL>'
    apiUrl: '<壁纸 API URL>'
  amap:
    browserKey: '<高德浏览器 Key>'
    securityCode: '<高德安全码>'
```

尖括号内容必须替换。生产校验会拒绝示例域名、占位 Key、未知字段、重复字段、错误日期和错误 URL。

### 4.3 检查 `content.yaml`

`content.yaml` 应保持为：

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

这里的 `posts`、`data` 等路径都相对于 `$FUYAO_CONTENT_ROOT`。例如 `posts: posts` 最终对应 `$FUYAO_CONTENT_ROOT/posts/`。不要把 `/srv/fuyao/...` 绝对路径写进 YAML。

### 4.4 处理 favicon 和密钥

favicon 不由迁移脚本处理。如果 3.0.0 使用的是 `static/favicon/`，复制到新的持久化目录：

```bash
sudo rsync -a "$FUYAO_LEGACY_ROOT/static/favicon/" "$FUYAO_FAVICON_ROOT/"
sudo chown -R "$FUYAO_SERVICE_USER:$FUYAO_SERVICE_GROUP" "$FUYAO_FAVICON_ROOT"
```

3.0.0 的 `VITE_*` 都会进入浏览器，不能当作秘密继续使用：

- 高德浏览器 Key 和安全码可以写入 `site.yaml`，但应限制域名和权限。
- Cloudflare API Token、Zone ID、GitHub Token、Webhook Secret、私钥和密码不得写入 `site.yaml`。
- WakaTime 或统计 URL 含令牌时，先轮换令牌，再让服务器代理保存新令牌；前端只使用代理 URL。

需要服务端密钥时创建文件：

```bash
sudoedit "$FUYAO_SECRETS_FILE"
sudo chown "$FUYAO_SERVICE_USER:$FUYAO_SERVICE_GROUP" "$FUYAO_SECRETS_FILE"
sudo chmod 0600 "$FUYAO_SECRETS_FILE"
```

密钥文件使用 `KEY=value` 格式，不提交到 Git，也不复制进 release。

## 5. 迁移内容

### 5.1 选择要迁移的内容

`FUYAO_MIGRATION_TYPES` 支持以下值：

| 值             | 内容                                       |
| :------------- | :----------------------------------------- |
| `posts`        | 博客 Markdown、分类 `_index.md` 和文章附件 |
| `footprints`   | 足迹数据                                   |
| `friends`      | 友链数据                                   |
| `payments`     | 支付信息                                   |
| `social-links` | 社交链接                                   |
| `albums`       | 相册原图、缩略图及既有 JSON 元数据         |

只迁移实际需要的类型。例如只迁移文章和足迹：

```bash
export FUYAO_MIGRATION_TYPES=posts,footprints
```

如果不设置该变量，脚本会尝试迁移全部类型；不存在的类型会被跳过，但所有类型都没有找到文件时会失败。

### 5.2 先做只读预检

在 27.0 源码目录执行：

```bash
npm run content:migrate:plan
```

预检只读取 `$FUYAO_LEGACY_ROOT`，计算文件数量、总字节数和 SHA-256，不会写入 `$FUYAO_CONTENT_ROOT`。

检查输出和源目录，确认：

- `FUYAO_LEGACY_ROOT` 确实指向 3.0.0 根目录，而不是其 `static/` 子目录。
- 博客范围只有作者维护的 Markdown、分类文件和附件。
- 没有迁移 `all.json`、`categories.json`、`search.json`、`map.json`、`rss.xml` 或 `sitemap.xml`。
- 足迹等 YAML 的目标位于 `data/`，文章目标位于 `posts/`。
- 源目录中没有符号链接；迁移脚本会拒绝符号链接。

### 5.3 执行复制

先为本次操作设置一个尚不存在的清单文件名：

```bash
export FUYAO_MIGRATION_MANIFEST="$FUYAO_SHARED_ROOT/backups/migration-3.0.0-to-27.0.json"
npm run content:migrate:apply
```

迁移脚本的行为：

- 不删除或改写 3.0.0 源文件。
- 目标文件不存在时才复制。
- 目标文件已存在且 SHA-256 相同时视为通过。
- 目标文件已存在但内容不同时停止，并保留原目标文件。
- 复制后重新校验 SHA-256。
- 将结果写入权限为 `0600` 的迁移清单，且不覆盖同名清单。

迁移不是跨文件事务。执行前必须备份目标内容；如果中途因文件冲突停止，先依据错误信息和迁移清单核对，不要直接删除整个目标目录。

## 6. 验证 27.0

### 6.1 验证生产输入和构建

在 27.0 源码目录执行：

```bash
export FUYAO_DEPLOY_LOCK="$PWD/.fuyao/migration-build.lock"
npm run inputs:prepare:production
npm run build:production
```

这里把构建锁放在当前源码目录内，避免人工验证时要求写入 `/srv/fuyao/deploy.lock`。两条命令读取 `$FUYAO_CONFIG_ROOT`、`$FUYAO_CONTENT_ROOT` 和 `$FUYAO_FAVICON_ROOT`。缺少目录、使用示例值、YAML 字段错误、内容路径越界或最终产物泄漏服务器路径和秘密时会失败。

如需同时检查代码本身，再执行：

```bash
npm run check
npm test
```

`check` 和 `test` 使用仓库内的公开 fixture；生产数据是否可构建，以 `inputs:prepare:production` 和 `build:production` 的结果为准。

### 6.2 人工验收

至少确认：

- 站名、个人资料、仓库链接、SEO、壁纸、地图和统计代理与旧站预期一致。
- 每篇非草稿文章的 `title`、`date`、`slug`、`categories` 和 `tags` 可解析且未改变。
- `_index.md` 继续作为分类信息使用，不显示为普通文章。
- 博客索引、搜索索引、RSS 和 Sitemap 已由 Markdown 重新生成。
- 足迹的城市、地点、日期、描述和坐标未变化。
- favicon 可访问；最终构建不包含 `/srv/fuyao/`、迁移清单或服务端密钥。

验证完成后，再按 [配置与部署](./CONFIGURATION_ZH.md) 安装或修改 systemd、Caddy 和发布流程。如果使用的根目录不是 `/srv/fuyao`，必须同步修改 `deploy/systemd/` 模板中的路径。

## 7. 回滚

迁移脚本不会删除 3.0.0 源目录。验证失败时：

1. 不要把 `current` 切换到 27.0。
2. 根据报错修正外部配置或内容，再重新生成生产构建。
3. 如需恢复内容，使用迁移前备份恢复 `$FUYAO_CONTENT_ROOT`。

如果已经切换到 27.0，并且旧版本本身已保存在实际的 `FUYAO_RELEASE_ROOT` 下，可在生产部署变量齐全时执行：

```bash
node scripts/deploy.js --rollback=<release-id>
```

该命令只切换 `current` 指向的代码 release，不会恢复 `shared/` 中的配置和内容。如果 3.0.0 没有按 27.0 的 release 结构保存，就不能使用此命令回滚到 3.0.0，应恢复迁移前的 Web 服务配置和旧站目录。

## 8. 完成标准

满足以下条件后，迁移才算完成：

- 3.0.0 源目录和迁移前备份仍可用。
- `site.yaml`、`content.yaml`、内容目录和 favicon 均位于仓库外。
- 服务端秘密已轮换并只保存在服务器端。
- 生产输入预检和生产构建均通过。
- 页面、文章、足迹和静态资源已人工抽样验收。
- systemd、Caddy 和备份任务均指向实际使用的持久化目录。

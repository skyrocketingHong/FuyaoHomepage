[English](./README.md) | 简体中文

# 主题契约（v1）

公开前台与内容平台解耦的权威、机器可校验契约。主题声明自己消费与产出的内容；平台在任何构建、预览或发布之前先判断站点需求是否被覆盖。契约采用 JSON Schema（draft 2020-12），由 Go 包 `backend/internal/themecontract` 校验。

范围边界：`contracts/openapi/management.yaml` 管理后台 HTTP 接口（传输、鉴权、错误）；本目录管理构建期主题契约（标识、输入、输出）。HTTP 接口变更随各后端阶段同步进 OpenAPI 文件；主题契约不描述任何 HTTP 接口。

## 文档

| 文档                      | 校验对象                        | 消费方                                            |
| :------------------------ | :------------------------------ | :------------------------------------------------ |
| `manifest.schema.json`    | 主题根目录的 `theme.json`       | 平台主题登记、构建编排                            |
| `build-input.schema.json` | 快照的 `private/input.json`     | 输入准备（T2）、构建执行器（T3）                  |
| `release.schema.json`     | release 根目录的 `release.json` | 发布校验、Web 服务器健康检查                      |
| `examples/`               | 正例与负例 fixture              | `go test ./internal/themecontract ./internal/cli` |

全部 fixture 均为公开演示数据，不含私有内容、凭据或真实站点取值。

## 主题清单

主题根目录包含 `theme.json`、主题源码，以及可选的主题配置 schema。关键字段：

| 字段                        | 规则                                                                                                               |
| :-------------------------- | :----------------------------------------------------------------------------------------------------------------- |
| `contract`                  | 常量 `fuyao.theme.manifest/v1`，自标识 schema 版本。                                                               |
| `id` / `version`            | 小写 kebab-case 标识（3 至 63 字符）与 SemVer 2.0.0 版本。首个主题为 `fuyao-homepage`。                            |
| `adapter`                   | 枚举的受信任构建适配器。v1 仅提供 `node22-sveltekit-static`。绝不是命令、脚本或 URL。                              |
| `inputProtocol`             | 主题消费的输入快照协议；v1 为 `fuyao.theme.build-input/v1`。                                                       |
| `capabilities`              | 非空且不重复的内容能力集合（见下文）。                                                                             |
| `configSchema`              | 可选。`file` 为无穿越的相对路径，指向声明 `themeConfig` 合法取值的 draft 2020-12 JSON Schema；缺省时仅 `{}` 合法。 |
| `outputs.spaFallback`       | release 内的 SPA 回退页（例如 `200.html`）或 `null`。不强制每个主题提供。                                          |
| `outputs.urlConventions`    | 非空且不重复的站点 URL 约定集合（见下文）。                                                                        |
| `outputs.requiredArtifacts` | 每个 release 必须存在的文件，平台在切换流量前校验。`release.json` 由平台写入，不得列在此处。                       |

任何层级的未知字段一律拒绝（`additionalProperties: false`）。

### 能力枚举

| 能力        | 含义                                               |
| :---------- | :------------------------------------------------- |
| `blog`      | 基于 `posts` 输入的文章、分类、标签、搜索与 RSS。  |
| `albums`    | 基于相册元数据与相册公开基路径下外部媒体的相册页。 |
| `footprint` | 基于 `data` 输入与地图服务配置的足迹地图。         |
| `friends`   | 基于 `data` 输入的友链页。                         |
| `pay`       | 基于 `data` 输入的赞赏与支付页。                   |
| `favicon`   | 基于 `favicon` 输入的站点图标集。                  |

### URL 约定枚举

| 约定           | 含义                                                    |
| :------------- | :------------------------------------------------------ |
| `release.json` | 站点根目录的 release 元数据文件，用于健康检查与回滚。   |
| `posts`        | `/posts/` 下的文章文件，由 Web 服务器从持久化内容提供。 |
| `data`         | `/data/` 下的共享数据文件。                             |
| `media-albums` | 配置的相册公开基路径（`/media/albums`）下的相册媒体。   |
| `sitemap`      | `/sitemap.xml`。                                        |
| `blog-rss`     | `/blog/rss.xml`。                                       |
| `blog-search`  | 主题搜索界面消费的博客搜索索引。                        |

兼容规则：站点需要而主题未声明的能力或 URL 约定，平台逐项列出不兼容项并阻止发布。不自动隐藏页面，也不替主题生成 301 或 410 响应。

## 构建输入快照

平台在任何主题构建前冻结只读快照；适配器不得写入快照，构建过程没有管理密钥，也没有数据库连接。

冻结消费（`prepare-build-inputs.js --frozen=<snapshot>` 或 `FUYAO_FROZEN_INPUT`）对快照只读校验，且必须使用独立目录：冻结根与任何可重建工作目录（`site/.fuyao/`、`site/build/`）相交时，在任何清理动作之前即被拒绝，因为后续工作目录删除会破坏输入。

```text
<snapshot-root>
├── public/                 # 对外可读输入（Web 服务器可读）
│   ├── favicon/            # 站点图标集
│   ├── fonts/              # 可选公开字体
│   ├── robots.txt          # 可选爬虫指令
│   ├── posts/              # 文章与生成的索引（all.json、search.json 等）
│   ├── data/               # 足迹、友链、支付与社交数据
│   └── albums/             # 相册元数据（index.json 与各相册元数据）
└── private/                # 适配器私有，权限 0600
    ├── site-config.json    # 归一化后的公开站点配置
    ├── content-config.json # 内容路径与媒体映射
    └── input.json          # 由 build-input.schema.json 校验的元数据
```

`input.json` 记录 `preparedAt`、`mode`（`ci`、`development`、`preview`、`production`）、快照面向的 `theme`（`id`、`version`）、可选的 `themeConfig` 取值，以及 `inputs` 摘要。三个摘要（`contentDigest`、`siteConfigDigest`、`themeConfigDigest`）分别为三项独立管理的输入定版：平台内容、站点配置、主题配置。

摘要算法（规范性；参考实现为 `site/scripts/lib/theme-input.js` 的 `computeContentDigest`）：每个条目按 `u8(domain) + u32be(labelUtf8Length) + label + u64be(contentLength) + content` 送入 SHA-256。域 1 覆盖 `public/` 下的普通文件，label 为快照内相对路径；域 2 覆盖为内容映射定版的私有文件（当前为 `content-config.json`），label 为 `private/<basename>`。各域内部按 label 的 UTF-8 字节序排序，公开条目在前。长度前缀使文件边界不可伪造。`siteConfigDigest` 为 `private/site-config.json` 文件字节的 SHA-256；`themeConfigDigest` 为 `themeConfig` 对象按递归排序键序序列化后的 SHA-256（缺省配置等价于空对象）。

## 发布元数据

每个 release 目录根包含 `release.json`，由 `release.schema.json` 校验。它保留旧字段 `schemaVersion`（常量 1）、`releaseId`、`createdAt` 与 `reasons`，现有 Web 服务器健康检查继续可用，并新增：

- `theme`：`id`、`version` 与 `manifestDigest`（所用 `theme.json` 的摘要）。
- `inputs`：与快照一致的三个输入摘要，支持逐站回滚到精确的内容、主题与配置三元组。
- `routes`：从清单镜像的 `spaFallback` 与 `urlConventions`。

## 安全模型

- 适配器是枚举的、平台内置的执行单元。清单无法请求任意 shell 命令、脚本，或从任意 Git 仓库拉取主题。
- 清单内所有路径均为无穿越的相对路径（无绝对路径、无 `..` 段、无反斜杠、无尾部斜杠）；Go 校验器与 CLI 另做防御性目录包含检查。
- 主题配置 schema 必须声明 draft 2020-12；其他方言在编译前即被拒绝。
- 契约文件与 fixture 不含任何秘密；本目录纳入仓库隐私扫描范围。

## 版本策略

每份 schema 以自身 `contract` 常量（release 为旧字段 `schemaVersion`）标识版本。v1 内的增量变更（新增可选字段、新增枚举值）保持常量不变；破坏性变更引入 v2 常量并保留兼容窗口，使既有主题在迁移期间仍能发布。

## 校验

```bash
# 单元与 fixture 测试（正负例，无需数据库）
cd backend && go test ./internal/themecontract/ ./internal/cli/

# 命令行校验一个主题根目录（flag 必须位于根目录之前）
cd backend && go run ./cmd/fuyao-admin validate-theme \
  --contracts ../../contracts/theme [--config <theme-config.json>] <theme-root>
```

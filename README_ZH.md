<p align="center">
  <a href="README.md">English</a> | 简体中文
</p>

<p align="center">
  <img src="https://fuyaoskyrocket.ing/favicon/android-chrome-512x512.png" alt="Fuyao Homepage 图标" width="128">
</p>

<h1 align="center">Fuyao Homepage</h1>

<p align="center">
  <a href="https://github.com/skyrocketingHong/FuyaoHomepage/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/skyrocketingHong/FuyaoHomepage/ci.yml?branch=main&amp;label=CI" alt="CI 状态"></a>
  <img src="https://img.shields.io/badge/Svelte-5-FF3E00?logo=svelte&amp;logoColor=white" alt="Svelte 5">
  <img src="https://img.shields.io/badge/Node.js-22%2B-339933?logo=nodedotjs&amp;logoColor=white" alt="Node.js 22 或更高版本">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-AGPL--3.0-blue" alt="AGPL-3.0 许可证"></a>
</p>

Fuyao Homepage 是一个基于 SvelteKit、Svelte 5 和 TypeScript 的静态个人主页与内容站点，集成个人资料、博客、足迹、相册、友链和赞赏页面。项目同时提供响应式界面、双语内容、Markdown 内容处理、外部生产数据管理以及可回滚的静态站点发布流程。

公开仓库只保存源码、基础公开资源、配置样例和演示内容。真实站点配置、文章、足迹、相册及服务端密钥均可保存在仓库外，开发和持续集成不依赖个人生产数据。

## 核心特性

- 提供首页、博客、足迹、相册、友链和赞赏六类主要页面，并针对桌面端和移动端分别优化导航与布局。
- 使用 Svelte 5 Runes、TypeScript 和 Tailwind CSS 4 构建组件与样式，支持日间和夜间主题。
- 提供中文和英文界面，语言切换使用交叉淡入淡出过渡。
- 提供流动渐变、港铁马赛克、Bing 每日壁纸和纯色等背景模式，并包含图片加载失败回退。
- 使用 Liquid Glass 组件体系和共享 WebGL 合成器实现响应式玻璃材质，不可用时自动回退到 CSS 或静态材质。
- 从 Markdown 生成博客列表、分类、标签、全文搜索、RSS、Sitemap 和静态文章页面，支持 GFM、数学公式、代码高亮和目录。
- 根据 EXIF 信息整理相册，生成响应式 WebP 缩略图和年度元数据，并通过独立媒体路径提供原图与缩略图。
- 使用高德地图展示足迹，支持城市与地点列表、地点检索及 YAML 数据生成。
- 使用公开代理端点展示访问统计和编程活动，浏览器端配置不保存 API Token。
- 使用版本化 YAML Schema 管理站点配置和内容目录，生产构建拒绝示例值、未知字段、越界路径及秘密字段。
- 使用只读构建输入快照隔离源码、生产内容和生成物，避免构建过程回写权威内容目录。
- 提供隐私审计、自动化测试、独立 release、健康检查、原子切换和失败回滚流程。

## 技术栈

| 类别       | 主要技术                                                            |
| :--------- | :------------------------------------------------------------------ |
| 应用框架   | SvelteKit、Svelte 5、Vite                                           |
| 开发语言   | TypeScript、JavaScript                                              |
| 样式与组件 | Tailwind CSS 4、Tailwind Variants、Lucide、Simple Icons             |
| 内容处理   | Unified、Remark、Rehype、Gray Matter、KaTeX、Highlight.js           |
| 搜索       | Fuse.js                                                             |
| 图片处理   | Sharp、Exifr                                                        |
| 配置       | YAML、版本化 Schema、构建时白名单校验                               |
| 输出方式   | `adapter-static` 静态站点、预渲染页面、外部相册媒体                 |
| 质量保障   | Svelte Check、ESLint、Prettier、Node.js Test Runner、GitHub Actions |

## 环境要求

开发和演示构建需要：

- Node.js 22 或更高版本
- npm，依赖版本以 `package-lock.json` 为准
- 支持 WebGL2、CSS Mask 和现代 `backdrop-filter` 的浏览器；不支持时界面会使用降级材质

生产部署可选使用 Linux、systemd 和 Caddy。静态构建本身不要求在服务器上运行，也不依赖数据库。

## 快速开始

```bash
git clone https://github.com/skyrocketingHong/FuyaoHomepage.git
cd FuyaoHomepage
npm ci
npm run dev
```

开发服务器使用 `config/*.example.yaml` 和 `fixtures/content/` 中的公开演示数据。启动后按终端输出的本地地址访问站点，不需要创建生产配置或复制个人内容。

生成演示生产构建：

```bash
npm run build
npm run preview
```

构建结果位于 `build/`。`npm run build` 使用公开 fixture，适合本地检查和持续集成，不代表生产配置已经通过验证。

## 配置与内容

### 开发与持续集成

开发模式使用仓库内的公开输入：

```text
config/
├── site.example.yaml       # 公开站点配置样例
└── content.example.yaml    # 内容目录映射样例

fixtures/content/
├── posts/                  # 演示文章
├── data/                   # 足迹、友链、支付及社交数据
└── albums/                 # 演示相册元数据和空媒体目录
```

这些文件用于开发、测试和 CI，不应替换为真实生产数据。

### 生产环境

生产构建至少需要三个外部输入目录：

| 变量                 | 内容                                   |
| :------------------- | :------------------------------------- |
| `FUYAO_CONFIG_ROOT`  | `site.yaml` 和 `content.yaml` 所在目录 |
| `FUYAO_CONTENT_ROOT` | 文章、数据和相册的持久化根目录         |
| `FUYAO_FAVICON_ROOT` | 生产 favicon 目录                      |

仓库部署模板使用 `/srv/fuyao` 作为示例根目录，例如 `/srv/fuyao/shared/config/`。该目录不是安装程序自动生成的固定路径；使用其他位置时，应同步修改 `FUYAO_*` 变量以及 systemd、Caddy 配置。

所有 `VITE_*` 值都会进入浏览器产物。本项目不使用 `VITE_*` 保存密钥，Cloudflare、WakaTime 等服务的 Token 应保存在独立代理服务或 Secret 管理平台中，`site.yaml` 只填写不含秘密的公开代理 URL。

完整字段、目录、密钥边界和生产构建说明见 [CONFIGURATION_ZH.md](./CONFIGURATION_ZH.md)。从 3.0.0 升级时先阅读 [MIGRATION_3_TO_27_ZH.md](./MIGRATION_3_TO_27_ZH.md)。

## 常用命令

| 命令                       | 用途                                   |
| :------------------------- | :------------------------------------- |
| `npm run dev`              | 使用公开配置和 fixture 启动开发服务器  |
| `npm run check`            | 执行 Svelte 和 TypeScript 静态检查     |
| `npm test`                 | 运行 Node.js 自动化测试                |
| `npm run lint`             | 检查 Prettier 格式和 ESLint 规则       |
| `npm run format`           | 格式化项目文件                         |
| `npm run build`            | 构建并验证公开演示版本                 |
| `npm run build:production` | 使用外部生产输入构建并执行泄漏检查     |
| `npm run preview`          | 本地预览已有静态构建                   |
| `npm run gen-blog`         | 重新准备开发内容并生成博客索引         |
| `npm run gen-album:import` | 导入照片并生成缩略图和相册元数据       |
| `npm run gen-album:public` | 生成移除 GPS 的公开相册元数据          |
| `npm run watch:content`    | 监听生产文章与相册变更                 |
| `npm run audit:privacy`    | 审计当前文件和待提交内容中的隐私与秘密 |
| `npm run audit:history`    | 审计完整 Git 历史                      |
| `npm run version:show`     | 显示版本、Build Train 和构建标识       |

## 构建与质量检查

提交前建议执行：

```bash
npm run audit:privacy
npm run check
npm run lint
npm test
npm run build
```

GitHub Actions 对 `main` 分支推送和 Pull Request 执行相同检查。构建流程会验证博客索引、Sitemap、RSS、favicon、相册元数据、公开文件权限和最终产物，发现秘密值或服务器绝对路径时停止。

生产输入单独验证：

```bash
export FUYAO_CONFIG_ROOT=/path/to/config
export FUYAO_CONTENT_ROOT=/path/to/content
export FUYAO_FAVICON_ROOT=/path/to/favicon
export FUYAO_DEPLOY_LOCK="$PWD/.fuyao/production-build.lock"
npm run build:production
```

`build:production` 会先准备并验证生产输入，再执行静态构建和最终产物检查。只想预检输入时可运行 `npm run inputs:prepare:production`。生产模式不会在输入缺失时回退到演示数据。

## 架构与数据流

```text
公开源码               外部生产输入
   │         ┌───────────┼────────────┐
   │      site.yaml   content/     favicon/
   │         └───────────┼────────────┘
   └──────────────┐      │
                  ▼      ▼
          prepare-build-inputs
                  │
        只读构建输入快照 .fuyao/
                  │
       ┌──────────┴──────────┐
       ▼                     ▼
  博客与相册索引          SvelteKit 预渲染
       └──────────┬──────────┘
                  ▼
              build/
                  │
       独立 release + 可选健康检查
                  │
                  ▼
       current 符号链接原子切换

外部相册原图和缩略图 ────────── Caddy /media/albums/*
```

配置、内容和密钥保存在 `shared/` 一类的持久化目录中；每次静态构建生成独立 release。代码回滚只切换 `current`，不会删除或恢复持久化内容。

## 自动化部署

仓库提供以下生产模板和脚本：

- `scripts/deploy.js`：获取部署锁、读取或克隆源码、检查生产输入、构建独立 release、切换 `current` 并执行可选健康检查。
- `scripts/watch-content.js`：递归监听文章和相册目录，合并短时间内的连续文件事件。
- `scripts/prepare-content-update.js`：在低内存服务器上整理相册、生成缩略图和元数据，并记录待发布状态，不执行 Vite 构建。
- `deploy/systemd/`：部署任务和内容监听服务模板。
- `deploy/caddy/`：静态 release 与外部相册媒体路由模板。

默认内容监听服务采用 `prepare` 模式。服务器只准备内容并记录待发布状态，最终生产构建和 release 发布由独立发布流程完成，避免在低内存服务器上执行预渲染。资源充足且变量完整时，监听器也支持直接调用部署脚本。

部署前必须根据实际服务器路径、运行账户、域名和 Secret 管理方式调整模板。完整流程、变量表、Caddy 映射和回滚方法见 [CONFIGURATION_ZH.md](./CONFIGURATION_ZH.md)。

## 项目结构

```text
config/                    公开 YAML 配置样例
deploy/                    systemd 与 Caddy 生产模板
fixtures/content/          开发和 CI 使用的公开演示内容
scripts/                   内容生成、迁移、审计、版本及部署脚本
src/lib/components/        页面组件和通用 UI 组件
src/lib/config/            配置 Schema、服务端加载及浏览器公开入口
src/lib/i18n/              中文和英文语言资源
src/lib/styles/            全局样式、主题和阅读器样式
src/routes/                SvelteKit 页面与路由
static/                    公开字体、favicon 和基础静态文件
tests/                     自动化测试和构建验收
```

完整目录树与模块职责见 [PROJECT_STRUCTURE_ZH.md](./PROJECT_STRUCTURE_ZH.md)。

## 数据与隐私

- 生产配置、文章、足迹、友链、支付信息和相册默认不进入公开仓库。
- `site.yaml` 属于浏览器可见的公开配置，不能保存 Token、密码、私钥或 Webhook Secret。
- 相册公开元数据可能包含 EXIF GPS；公开发布前可使用 `npm run gen-album:public` 移除坐标。
- `audit:privacy` 检查当前文件，`audit:history` 检查 Git 历史；从最新提交删除秘密并不能使旧提交失效，相关凭据仍需轮换。
- release 不包含指向 `shared/` 的符号链接，持久化目录不得随代码版本清理。

## 版本与文档

`version.json` 是版本、Build Train 和构建序号的唯一人工维护入口。发布版本差异记录在 [CHANGELOG_ZH.md](./CHANGELOG_ZH.md)。

| 文档                                                 | 内容                                        |
| :--------------------------------------------------- | :------------------------------------------ |
| [CONFIGURATION_ZH.md](./CONFIGURATION_ZH.md)         | 配置 Schema、环境变量、内容目录、构建和部署 |
| [MIGRATION_3_TO_27_ZH.md](./MIGRATION_3_TO_27_ZH.md) | 从 3.0.0 迁移配置和内容到 27.0              |
| [PROJECT_STRUCTURE_ZH.md](./PROJECT_STRUCTURE_ZH.md) | 完整项目目录和核心模块职责                  |
| [CHANGELOG_ZH.md](./CHANGELOG_ZH.md)                 | 版本变更记录                                |

## 鸣谢

- [imyan.ren](https://github.com/Yanren1225/imyan.ren)：早期页面视觉与交互参考。
- [hongkong-mtr-mosaic](https://github.com/sayidhe/hongkong-mtr-mosaic)：港铁马赛克背景效果参考。
- [MTR-Sung](https://github.com/wobebebe/MTR-Sung)：港铁字体参考。

## 许可证

本项目使用 [GNU Affero General Public License v3.0](./LICENSE)。通过网络向用户提供修改后的版本时，应遵守 AGPL-3.0 对应源代码提供义务。

# Fuyao Homepage

这是一个基于 [SvelteKit](https://kit.svelte.dev/) 构建的现代个人主页/博客系统。项目采用 Svelte 5 和 Tailwind CSS 开发，旨在提供高性能、响应式且设计精美的用户体验。

## ✨ 特性

- **技术栈**: SvelteKit, Svelte 5 (Runes), TypeScript
- **样式**: Tailwind CSS, PostCSS
- **组件库**: 自定义 UI 组件 (`src/lib/components/ui`)
- **图标**: Lucide Svelte, Simple Icons
- **国际化**: 支持多语言 (i18n)
- **视觉特效**: 硬件加速流光/液态玻璃效果，动态文本特效，Infinite Scroll
- **字体**: 整合 MiSans 字体，优化阅读体验
- **响应式设计**: 完美适配移动端和桌面端

## 📂 项目结构

详情请参阅 [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)。

## 📅 更新日志

完整更新记录请查看 [CHANGELOG.md](./CHANGELOG.md)。

## 📝 许可证

[MIT](LICENSE)

## 🛠️ 开发指南

### 环境要求

- Node.js (建议 LTS 版本)
- npm / pnpm / yarn

### 安装依赖

```bash
npm install
# 或者
pnpm install
```

### 启动开发服务器

```bash
npm run dev
# 或者
pnpm dev
# 开启 --open 自动打开浏览器
npm run dev -- --open
```

### 构建生产版本

构建应用：

```bash
npm run build
```

预览构建结果：

```bash
npm run preview
```

## ⚙️ 配置说明

项目使用环境变量进行配置。复制 `.env.example` 为 `.env` 并根据需要修改。

### 必填配置

| 变量名                 | 说明          | 示例                |
| ---------------------- | ------------- | ------------------- |
| `VITE_SITE_NAME`       | 站点名称      | `扶摇 Skyrocketing` |
| `VITE_GITHUB_USERNAME` | GitHub 用户名 | `skyrocketinghong`  |

### 站点信息

| 变量名                 | 说明                               |
| ---------------------- | ---------------------------------- |
| `VITE_SITE_URL`        | 主站地址                           |
| `VITE_BLOG_URL`        | 博客地址（用于博客页面 iframe）    |
| `VITE_AVATAR_URL`      | 头像 URL（留空则使用 GitHub 头像） |
| `VITE_SITE_START_YEAR` | 网站运营起始年份                   |
| `VITE_USER_BIRTH_DATE` | 站长出生日期（用于年龄计算）       |

### SEO 配置

| 变量名                 | 说明                   |
| ---------------------- | ---------------------- |
| `VITE_SEO_AUTHOR`      | 作者名称               |
| `VITE_SEO_DESCRIPTION` | 网站描述               |
| `VITE_SEO_KEYWORDS`    | SEO 关键词（逗号分隔） |
| `VITE_TWITTER_ID`      | Twitter 用户名         |

### 开源仓库

| 变量名           | 说明                         |
| ---------------- | ---------------------------- |
| `VITE_REPO_URL`  | 项目仓库地址                 |
| `VITE_REPO_NAME` | 项目仓库名称（用于页脚显示） |

### 第三方服务

| 变量名                    | 说明              |
| ------------------------- | ----------------- |
| `VITE_WALLPAPER_API`      | 必应壁纸 API 地址 |
| `VITE_AMAP_KEY`           | 高德地图 API Key  |
| `VITE_AMAP_SECURITY_CODE` | 高德地图安全码    |

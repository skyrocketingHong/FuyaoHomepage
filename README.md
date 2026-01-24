# Fuyao Homepage

这是一个基于 [SvelteKit](https://kit.svelte.dev/) 构建的现代个人主页/博客系统。项目采用 Svelte 5 和 Tailwind CSS 开发，旨在提供高性能、响应式且设计精美的用户体验。

## ✨ 特性

- **技术栈**: SvelteKit, Svelte 5 (Runes), TypeScript
- **样式**: Tailwind CSS, PostCSS
- **组件库**: 自定义 UI 组件 (`src/lib/components/ui`)
- **图标**: Lucide Svelte, Simple Icons
- **国际化**: 支持多语言 (i18n)
- **响应式设计**: 完美适配移动端和桌面端

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

## 📂 项目结构

详情请参阅 [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)。

## 📝 许可证

[MIT](LICENSE)
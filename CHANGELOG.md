# 更新日志 (Changelog)

所有该项目的显著更改都将记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)。

## [1.0.0] - 2026-01-25

### 🎉 发布
- 个人主页/博客系统初始版本发布。

### ✨ 新增
- **核心框架**: 基于 SvelteKit 和 Svelte 5 (Runes) 构建。
- **UI 设计**: 采用 Tailwind CSS 进行全新响应式设计，适配深色模式。
- **组件库**: 集成自定义 UI 组件 (`src/lib/components/ui`)，包含 Avatar, Button, Cards 等。
- **内容展示**: 首页 Profile 部分，包含个人简介、社交链接展示。
- **交互体验**:
    - 图片背景模糊叠加效果 (`liquid-glass`)。
    - 平滑的页面过渡和动画效果。
- **国际化**: 基础 i18n 架构支持。
- **开发工具**: 配置 ESLint, Prettier, PostCSS 等开发规范工具。

### 🔧 优化
- 优化了 SEO 相关的 meta 标签结构 (根据 Web App 开发规范)。
- 简化了依赖管理，移除未使用的旧版库。

# 更新日志 (Changelog)

所有该项目的显著更改都将记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)。


## 1.1.0 (2026-01-25)

重构 LiquidGlass/HeaderActions，新增多项组件，优化移动端导航，更新文档，同步环境变量配置。

### ✨ 新增
- **UI 组件**: 新增 `HeaderActionButton` 组件，统一头部按钮样式与交互；新增 `TextEffect` 组件实现标题多种效果轮换 (流光/绿色终端/火焰/色散)，且无布局偏移；新增 `AutoScroll` 组件，支持超长内容自动滚动。
- **字体**: 优化字体配置，整合 `MiSans` 等字体定义。
- **工具**: 新增 `scripts` 目录及版本管理脚本。

### 🔧 优化
- **性能**: 重构 `LiquidGlass` 组件，移除噪点纹理，强制开启硬件加速。
- **布局**: 优化 `MobileNav` 路由分布算法，实现自适应均分排列。
- **代码**: 重构 `HeaderActions`，抽离通用逻辑，提升复用性。
- **文档**: 更新 `README.md` 与 `PROJECT_STRUCTURE.md`，完善中文文档与目录结构说明。
- **配置**: 同步 `.env` 与 `.env.example` 环境变量配置。

### 🐛 修复
- 修复 `Copyright` 组件样式细节。
- 修复部分模块导入路径与类型定义问题。

## 1.0.0 (2026-01-25)

初始化 SvelteKit 个人主页项目，引入核心路由、组件、工具、配置及多语言支持。

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

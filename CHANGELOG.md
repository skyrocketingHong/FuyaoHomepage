# 更新日志 (Changelog)

所有该项目的显著更改都将记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)。

## 2.0.0 (2026-01-31)

全面重构系统架构，引入自动化内容管理系统，并在性能、SEO 与交互细节上进行了多处优化。

### ✨ 新增

- **自动化博客系统**: 引入全新的 Markdown 驱动博客工作流。新增 `vite-plugin-blog-watcher` 插件实现自动索引更新；新增 `generate-blog-index.js` 脚本用于预构建处理。
- **架构升级**: 模块化重构 `src/lib`。将组件、样式与工具类按功能细分为 `background`, `header`, `loader`, `sidebar`, `datetime` 等命名空间。
- **站点地图**: 新增 `sitemap.xml` 动态生成能力，提升搜索引擎索引效率。
- **增强特性**: `LiquidGlass` 组件新增 `opaque` 不透明模式；`MosaicInfo` 现已支持渲染 MTR 图标。

### 🔧 优化

- **渲染性能**:
  - **Mosaic 重构**: 核心代码完全移至 HTML5 Canvas 实现，大幅削减 GPU 负载与延迟。
  - **按需滤镜**: 为 `LiquidGlass` 引入 `lazyBlur` 技术，仅在用户交互时激活高斯模糊计算。
- **交互体验**:
  - 增强 `MainContent` 的间距切换动画，确保视窗布局调整时的平滑过渡。
  - 优化 `BlurEdge` 遮罩在移动端页眉/页脚处的覆盖算法。
- **文档与规范**: 遵照最新开发指南，完成全量代码的简体中文注释补全与 JSDoc 标准化。
- **资源管理**: 优化字体加载策略；重构并同步了足迹 (`footprints.yaml`)、友链 (`friends.yaml`)、支付 (`payments.yaml`) 等关键配置文件。

### 🐛 修复

- 修复 `Copyright` 组件在特定分辨率下无法正确显示背景信息的故障。
- 修复移动端导航菜单宽度适配问题。
- 解决长内容按钮在窄屏下自动换行导致的布局抖动。

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
- 修复 PC 版博客文章加载时无法自动跳转到锚点链接的问题。

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

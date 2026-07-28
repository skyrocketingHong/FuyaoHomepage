# Fuyao Homepage

基于 SvelteKit、Svelte 5 和 TypeScript 的个人主页、博客、足迹与相册前端。公开源码、公开站点配置、私有内容和服务端密钥采用独立边界。

## 核心特性

- 使用版本化 YAML Schema 管理公开站点配置和内容目录映射
- 使用从原有 `.env` 与 `static/` 迁移得到的公开演示配置和 fixture 支持检查、测试和构建
- 从只读内容快照生成博客索引、搜索索引、RSS、Sitemap 和预渲染页面
- 将相册元数据固化到 release，大体积原图和缩略图通过稳定媒体 URL 提供
- 使用响应式 Bing 每日壁纸、来源标识和图片至主题纯色的两级故障回退
- 使用六项等宽移动端 Tab Bar、固定底部信息 Dock 和响应式支付 Wallet 布局
- 使用真实逐日语言明细展示编程活动堆叠柱，无明细时提供中性回退
- 使用独立 release、健康检查、原子符号链接切换和失败回滚发布
- 统一监听外部文章与照片目录，自动生成缩略图和公开 EXIF 元数据并记录待发布状态
- 在 CI 和发布前检查秘密、服务器路径、非白名单文件和最终浏览器产物

## 快速命令

```bash
npm ci                 # 安装依赖并准备演示构建输入
npm run dev            # 使用公开演示配置和内容启动开发服务器
npm run check          # Svelte 与 TypeScript 检查
npm test               # 使用公开演示 fixture 运行测试
npm run build          # 演示 CI 构建及最终产物泄漏检查
npm run build:production # 使用外部生产配置、内容和 favicon 完成生产构建
npm run watch:content  # 监听生产文章与照片目录并自动发布
npm run audit:privacy  # 检查当前跟踪文件和待提交文件
npm run audit:history  # 检查完整 Git 历史
npm run version:show   # 显示营销版本、Build Train 和构建标识
```

## 自动化方案

- 生产发布在本地使用外部生产配置、内容和 favicon 构建，经检查后通过 rsync 上传独立 release，再原子切换服务器 `current`；缺少生产输入时直接失败，不会回退到仓库演示数据。
- 内容服务使用 `npm run watch:content` 监听外部文章与照片目录，生成索引、缩略图和公开元数据，并记录待发布状态。
- 从 3.0.0 升级前，按[迁移手册](./MIGRATION_3_TO_27.md)迁移配置、文章和足迹；完整变量及部署模板见[配置与部署](./CONFIGURATION.md)。
- 目录职责见[项目结构](./PROJECT_STRUCTURE.md)，版本差异见[更新日志](./CHANGELOG.md)。

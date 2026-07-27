# 项目目录结构与简述

## 概述

本项目是一个基于 SvelteKit 的个人主页/博客系统。
主要功能包括个人简介、GitHub 项目展示、足迹地图、友情链接、博客文章等。
系统采用了 Svelte 5 (`runes` mode), TailwindCSS, 和 TypeScript 进行开发。

公开仓库仅保存源码、由旧 `.env` 迁移得到的 `config/*.example.yaml` 和由旧 `static/` 内容迁移得到的 `fixtures/content/` 公开演示数据。生产配置、内容与密钥位于仓库外部；构建使用 `.fuyao/build-inputs/current/` 只读快照，输出到独立 release。

## 目录结构

```text
.
├── .env.example          # 环境变量示例
├── .gitignore            # Git 忽略文件配置
├── .github/workflows/    # GitHub Actions 持续集成
│   └── ci.yml            # 类型、格式、测试和构建检查
├── .npmrc                # NPM 配置文件
├── .prettierignore       # Prettier 忽略文件配置
├── .prettierrc           # Prettier 配置文件
├── CHANGELOG.md          # 更新日志
├── config/               # 仅跟踪版本化公开配置样例
│   ├── site.example.yaml
│   └── content.example.yaml
├── deploy/               # 生产服务与 Web 服务器配置模板
│   ├── caddy/FuyaoHomepage.caddy.example
│   └── systemd/
│       ├── fuyao-deploy.service
│       └── fuyao-content-watcher.service # 文章与照片统一监听及自动发布
├── fixtures/content/     # 开发与 CI 使用的公开演示内容
│   ├── posts/            # 从旧 static 迁移的 Markdown 演示文章
│   ├── data/             # 从旧 static 迁移的足迹、友链、付款及社交示例
│   └── albums/           # 空媒体目录和版本化元数据
├── CONFIGURATION.md      # 配置说明文档
├── LICENSE               # 项目许可证
├── MIGRATION_3_TO_27.md  # 3.0.0 配置、博客与足迹迁移到 27.0 的操作手册
├── PROJECT_STRUCTURE.md  # 项目结构说明 (本文档)
├── README.md             # 项目自述文件
├── eslint.config.js      # ESLint 配置文件
├── package-lock.json     # NPM 依赖锁定文件
├── package.json          # 项目依赖配置
├── svelte.config.js      # SvelteKit 配置文件
├── tsconfig.json         # TypeScript 配置文件
├── version.json          # 营销版本、Build Train 与构建序号的唯一人工维护入口
├── vite.config.ts        # Vite 构建配置
├── scripts/              # 工具脚本及版本管理
│   ├── generate-blog-index.js # 博客索引生成脚本 (支持 RSS/Sitemap)
│   ├── generate-album-index.js# 相册 EXIF 索引及响应式缩略图生成脚本
│   ├── prepare-build-inputs.js # 校验、复制并冻结构建输入快照
│   ├── prepare-content-update.js # 低内存相册整理与待发布状态写入
│   ├── validate-deployment.js  # 构建输入与最终产物泄漏检查
│   ├── audit-repository.js     # 当前文件和完整 Git 历史隐私扫描
│   ├── migrate-content.js      # 外部持久化内容复制与 SHA-256 清单
│   ├── deploy.js               # 独立 release、原子切换与回滚
│   ├── watch-content.js       # 文章与照片递归监听、事件合并及自动发布
│   └── update-version.js      # 版本校验、更新、同步及 Build Train 格式化入口
├── src/
│   ├── app.d.ts          # TypeScript 类型定义
│   ├── app.html          # HTML 模版
│   ├── service-worker.ts # Service Worker
│   ├── lib/              # 核心库代码
│   │   ├── actions/          # Svelte Actions
│   │   │   ├── linkEnhancer.svelte.ts        # 独立裸 URL 链接预览增强
│   │   │   └── tableScrollEnhancer.svelte.ts # Markdown 表格滚轮与键盘横向滚动增强
│   │   ├── config/           # 网站配置
│   │   │   ├── index.ts      # 页面配置入口
│   │   │   ├── schema.ts     # site/content Schema、类型与白名单校验
│   │   │   ├── public.ts     # 浏览器可见配置单一入口
│   │   │   ├── server.ts     # YAML、realpath 与构建端配置读取
│   │   │   └── mosaic.ts     # 马赛克背景配置
│   │   ├── plugins/          # Vite 插件
│   │   │   └── vite-plugin-blog-watcher.ts # 博客文件监听插件
│   │   ├── hooks/            # Svelte Composable Hooks
│   │   │   └── useBlogState.svelte.ts # 博客状态管理 Hook
│   │   ├── stores/           # 全局状态管理
│   │   │   ├── app.svelte.ts     # 应用级状态（含可重入背景加载事务与 Header 严格所有权插槽）
│   │   │   ├── lightbox.svelte.ts# 灯箱全局状态 (Svelte 5 runes)
│   │   │   ├── mosaic.svelte.ts  # 马赛克背景状态
│   │   │   └── search.svelte.ts  # 搜索状态
│   │   ├── styles/           # 全局样式
│   │   │   ├── app.css       # 全局样式入口
│   │   │   ├── base.css      # 基础元素样式
│   │   │   ├── components.css# 共用组件样式
│   │   │   ├── fonts.css     # 字体定义
│   │   │   ├── reader-syntax.css # 阅读器语法高亮样式
│   │   │   ├── reader.css    # 阅读器排版样式
│   │   │   ├── theme.css     # 主题与材质 Token
│   │   │   └── utilities.css # 全局工具类
│   │   ├── types/            # 类型定义
│   │   │   ├── album.ts      # 相册类型 (Photo, AlbumIndex, YearGroup)
│   │   │   ├── component.ts  # 运行期动态组件类型
│   │   │   ├── sidebar.ts    # 侧边栏类型
│   │   │   └── modules.d.ts  # 第三方模块类型声明
│   │   ├── components/       # Svelte 组件库
│   │   │   ├── albums/       # 相册页面组件
│   │   │   │   ├── AlbumGrid.svelte       # 照片网格 (justified gallery 布局)
│   │   │   │   ├── AlbumSidebar.svelte    # 相册侧边栏 (日期/设备模式)
│   │   │   │   ├── BrandIcon.svelte       # 相机与镜头品牌图标
│   │   │   │   ├── LightboxNavButton.svelte # 灯箱导航按钮 (复用组件)
│   │   │   │   ├── PhotoLightbox.svelte   # 照片灯箱 (全屏预览 + EXIF)
│   │   │   │   └── YearNav.svelte         # 年份导航 (SegmentedControl)
│   │   │   ├── footprint/    # 足迹页面组件
│   │   │   │   ├── FootprintActions.svelte   # 足迹操作按钮
│   │   │   │   ├── FootprintList.svelte      # 足迹列表展示
│   │   │   │   ├── GeneratorModal.svelte     # YAML 数据生成器弹窗
│   │   │   │   ├── PlaceSearchDropdown.svelte# 地点搜索下拉框
│   │   │   │   └── map/                      # 地图子组件
│   │   │   │       ├── AMap.svelte           # 高德地图主入口
│   │   │   │       ├── MapCopyright.svelte   # 地图版权信息
│   │   │   │       ├── MapInfoWindow.svelte  # 地图信息窗口
│   │   │   │       ├── types.ts              # 地图类型定义
│   │   │   │       └── core/                 # 地图核心逻辑
│   │   │   │           ├── copyright.ts          # 版权工具
│   │   │   │           ├── infoWindowController.svelte.ts # 信息窗口控制器
│   │   │   │           ├── loader.ts             # 地图加载器
│   │   │   │           ├── markers.ts            # 标记点管理
│   │   │   │           ├── placeSearch.ts        # 地点搜索
│   │   │   │           ├── view.ts               # 视图工具
│   │   │   │           └── viewController.svelte.ts # 视图控制器
│   │   │   ├── friends/      # 友链页面组件
│   │   │   │   ├── FriendCard.svelte        # 友链卡片
│   │   │   │   └── ProfileCard.svelte       # 个人信息卡片
│   │   │   ├── home/         # 首页专用组件
│   │   │   │   ├── Hero.svelte              # 首页主组件
│   │   │   │   └── content/                 # 首页内容组件
│   │   │   │       ├── CloudflareAnalytics.svelte # 访问统计
│   │   │   │       ├── CodingActivity.svelte # 编程活动统计
│   │   │   │       ├── GithubProjects.svelte # GitHub 项目展示
│   │   │   │       ├── LatestPosts.svelte    # 最新文章
│   │   │   │       ├── ProfileSection.svelte # 个人信息展示
│   │   │   │       ├── SocialLinks.svelte    # 社交链接列表
│   │   │   │       ├── TimeCapsule.svelte    # 时间胶囊/个人状态
│   │   │   │       └── common/               # 首页共用卡片与标题
│   │   │   │           ├── ContentCard.svelte
│   │   │   │           └── SectionHeader.svelte
│   │   │   ├── blog/         # 博客页面组件
│   │   │   │   ├── card/         # 卡片组件
│   │   │   │   │   ├── FeaturedPostCard.svelte # 精选文章卡片
│   │   │   │   │   ├── GridPostCard.svelte  # 网格文章卡片
│   │   │   │   │   ├── ListPostCard.svelte  # 列表文章卡片
│   │   │   │   │   └── PostCard.svelte      # 文章卡片统一入口
│   │   │   │   ├── common/       # 公共小组件
│   │   │   │   │   ├── CategoryBadge.svelte # 分类标签
│   │   │   │   │   └── TagBadge.svelte      # 统一标签 (胶囊样式)
│   │   │   │   ├── home/         # 首页视图
│   │   │   │   │   ├── EmptyState.svelte    # 文章空状态
│   │   │   │   │   └── Home.svelte          # 博客首页主入口
│   │   │   │   ├── search/       # 搜索视图
│   │   │   │   │   └── Search.svelte        # 博客搜索页
│   │   │   │   ├── sidebar/      # 侧边栏
│   │   │   │   │   ├── Sidebar.svelte       # 博客归档/分类列表
│   │   │   │   │   └── TagCloud.svelte      # 标签云展示
│   │   │   │   ├── viewer/       # 文章阅读器
│   │   │   │   │   ├── BackButton.svelte    # 返回列表按钮
│   │   │   │   │   ├── Header.svelte        # 文章头部 (标题、作者等)
│   │   │   │   │   ├── LinkPreview.svelte   # 链接预览组件
│   │   │   │   │   ├── MarkdownRenderer.svelte # Markdown 内容渲染器
│   │   │   │   │   ├── TableOfContents.svelte # 文章目录
│   │   │   │   │   └── Viewer.svelte        # 阅读器主入口
│   │   │   │   └── header/       # 头部集成
│   │   │   │       ├── Actions.svelte        # 博客操作胶囊 (搜索 + RSS)
│   │   │   │       ├── RssButton.svelte      # RSS 订阅按钮
│   │   │   │       └── SearchButton.svelte   # 搜索按钮
│   │   │   ├── layout/       # 布局组件
│   │   │   │   ├── background/   # 背景组件
│   │   │   │   │   └── BackgroundLayer.svelte # 通用背景层包裹
│   │   │   │   ├── bottom-info/  # 底部信息组件
│   │   │   │   │   ├── BottomInfo.svelte       # 底部信息容器 (垂直/水平布局, 移动端为文档流页脚)
│   │   │   │   │   ├── BackgroundInfo.svelte   # 背景信息展示
│   │   │   │   │   ├── CopyrightText.svelte    # 版权文本
│   │   │   │   │   └── ServiceStatus.svelte    # 服务状态
│   │   │   │   ├── content/      # 内容区域组件
│   │   │   │   │   └── MainContent.svelte    # 主内容区域容器 (底部边缘渐隐局部关闭, 其余实例不受影响)
│   │   │   │   ├── header/       # 头部组件
│   │   │   │   │   ├── Header.svelte         # 统一网站 Header
│   │   │   │   │   ├── HeaderChrome.svelte   # 顶栏连续 chrome 背景层 (liveBackdrop 实时模糊, 内容进入 Header 后方时显示; 移动端覆盖控件区及 12px 底部间距, 单行 64px/双行 108px)
│   │   │   │   │   ├── Actions.svelte        # 全局操作区 (背景/主题/语言分组)
│   │   │   │   │   ├── BackgroundSwitcher.svelte # 背景模式切换 (桌面端嵌入 chrome 分段胶囊 / 移动端循环按钮)
│   │   │   │   │   ├── ActionButton.svelte   # 统一按钮外观 (独立玻璃 / bare 分段两种模式)
│   │   │   │   │   ├── ActionGroup.svelte    # 分段胶囊容器 (轻量静态材质, hairline 分隔, 柔和外投影)
│   │   │   │   │   └── drawer/               # 移动端菜单
│   │   │   │   │       └── Drawer.svelte         # 移动端侧栏抽屉
│   │   │   │   ├── nav/          # 导航
│   │   │   │   │   ├── CategoryNav.svelte    # 顶部分类导航
│   │   │   │   │   └── MobileNav.svelte      # 移动端悬浮导航胶囊 (独立玻璃胶囊仅含导航项, 与 BottomInfo 文档流页脚分离)
│   │   │   │   ├── loader/       # 加载指示器
│   │   │   │   │   └── GlobalLoader.svelte   # 首次背景加载与画布尺寸重建的全局遮罩
│   │   │   │   └── sidebar/      # 全局侧边栏
│   │   │   │       ├── Sidebar.svelte        # PC端侧边栏容器
│   │   │   │       ├── SidebarTree.svelte    # 递归导航树
│   │   │   │       └── Item.svelte           # 导航项/菜单项
│   │   │   ├── pay/          # 支付/赞赏组件
│   │   │   │   └── QRCodeCard.svelte         # 付款码展示卡片
│   │   │   ├── seo/          # SEO 组件
│   │   │   │   └── SeoHead.svelte            # HTML Meta 管理
│   │   │   └── ui/           # 基础 UI 原子组件
│   │   │       ├── background/   # 背景特效
│   │   │       │   ├── FlowingBackground.svelte # 流动渐变
│   │   │       │   ├── MosaicBackground.svelte  # 马赛克动态背景（防抖尺寸事务、绘制提交与故障回退）
│   │   │       │   └── SolidBackground.svelte   # 纯色/基础背景
│   │   │       ├── display/      # 内容展示
│   │   │       │   ├── Avatar.svelte         # 头像
│   │   │       │   ├── LazyImage.svelte      # 懒加载图片
│   │   │       │   ├── Marquee.svelte        # 跑马灯
│   │   │       │   ├── MosaicInfo.svelte     # 马赛克卡片信息
│   │   │       │   └── SegmentedControl.svelte # 分段切换按钮
│   │   │       ├── effect/       # 视觉效果
│   │   │       │   ├── Crossfade.svelte      # 交叉淡入淡出动画
│   │   │       │   ├── FadeEdge.svelte       # 边缘淡出 (CSS Mask, 支持起止独立渐隐尺寸)
│   │   │       │   ├── GlassCompositor.svelte # 共享玻璃合成器画布 (WebGL2)
│   │   │       │   ├── LiquidGlass.svelte    # 流体玻璃态背景 (panel/card/control/chrome/icon 材质变体, chromeEdge 顶/底栏边缘, 单层方向性边界, liveBackdrop 实时模糊, contentLayout 内容布局)
│   │   │       │   └── TextEffect.svelte     # 文本打字/特效
│   │   │       ├── feedback/     # 反馈/状态
│   │   │       │   ├── LoadingSpinner.svelte # 加载转圈
│   │   │       │   ├── LoadingState.svelte   # 加载中状态封面（全屏模式底部信息居中并适配安全区）
│   │   │       │   ├── Skeleton.svelte       # 骨架屏占位
│   │   │       │   └── StatusState.svelte    # 404 与空数据状态共用的玻璃卡片及语言过渡
│   │   │       └── layout/       # 布局辅助
│   │   │           └── ScrollContainer.svelte# 统一滚动容器
│   │   ├── i18n/             # 国际化支持
│   │   │   ├── index.ts      # i18n 配置入口
│   │   │   ├── store.ts      # 语言切换状态管理
│   │   │   └── locales/      # 翻译语言包
│   │   │       ├── en-US.json
│   │   │       └── zh-CN.json
│   │   └── utils/            # 实用工具函数
│   │       ├── datetime/     # 时间处理
│   │       │   ├── age.ts            # 年龄计算
│   │       │   └── date.ts           # 日期格式化
│   │       ├── domain/       # 业务逻辑
│   │       │   ├── blog.ts           # 博客数据处理
│   │       │   ├── blogRoute.ts      # 统一博客 catch-all 分类、标签与文章路径解析
│   │       │   ├── exif.ts           # EXIF 参数格式化 (相册网格/灯箱共用)
│   │       │   ├── footprintYaml.ts  # 足迹 YAML 生成
│   │       │   ├── footprints.ts     # 足迹数据处理
│   │       │   ├── loader.ts         # 数据加载器
│   │       │   ├── map.ts            # 地图链接工具 (GCJ-02/WGS-84 坐标转换)
│   │       │   ├── markdown.ts       # Markdown AST 解析、HTML 净化与内容结构增强
│   │       │   └── nav.ts            # 导航工具
│   │       ├── effect/       # 视觉效果工具
│   │       │   ├── appearanceTransition.svelte.ts # 外观过渡统一入口 (View Transition 能力检测 + Crossfade 回退, reduced-motion 直切)
│   │       │   ├── glassCompositor.svelte.ts # 共享 WebGL2 玻璃合成器 (单例, 两级高斯模糊, 按需渲染)
│   │       │   └── liquidGlass.ts # 尺寸感知的单通道 SVG 折射滤镜生成器
│   │       ├── format/       # 内容格式化
│   │       │   ├── number.ts         # 数字格式化
│   │       │   └── slugify.ts        # Slug 规范化
│   │       ├── network/      # 网络与加载
│   │       │   ├── loading.ts        # 请求加载状态
│   │       │   └── urlMetadata.ts    # URL 元数据获取
│   │       ├── state/        # 状态所有权工具
│   │       │   └── headerOwnership.ts # Header 插槽非空注册 ID 所有权校验
│   │       └── index.ts      # 工具出口
│   └── routes/               # 路由定义 (SvelteKit)
│       ├── +layout.svelte    # 全局布局 (Header, Sidebar)
│       ├── +layout.ts        # 客户端适配加载 logic
│       ├── +page.svelte      # 首页入口
│       ├── albums/[...path]/ # 相册列表、筛选和照片深链接
│       │   ├── +page.svelte  # 照片网格、侧边栏与灯箱状态
│       │   └── +page.ts      # 路径校验及按年数据加载
│       ├── blog/             # 博客模块
│       │   ├── (main)/       # 博客 Layout Group
│       │   │   ├── +layout.ts    # 共享数据加载
│       │   │   ├── +page.ts      # 博客首页类型标记
│       │   │   ├── +page.svelte  # 博客首页 (列表)
│       │   │   ├── search/       # 搜索页
│       │   │   │   ├── +page.ts      # 搜索页类型标记
│       │   │   │   └── +page.svelte
│       │   │   └── [...path]/    # 任意深度分类、标签与文章统一路由
│       │   │       ├── +page.ts      # 路径验证及 Markdown 服务端渲染
│       │   │       └── +page.svelte  # 分类列表、标签筛选与文章详情
│       ├── footprint/        # 足迹页面路由
│       │   └── +page.svelte
│       ├── friends/          # 友链页面路由
│       │   └── +page.svelte
│       ├── pay/              # 赞赏页面路由
│       │   └── +page.svelte
│       └── +error.svelte     # 全局错误页面
├── static/                   # 仅允许公开白名单静态资产
│   ├── favicon/              # 匿名或通用站点图标
│   ├── fonts/                # 可公开分发的字体
│   └── robots.txt            # 搜索引擎协议
├── tests/                    # Node.js 项目完整性测试
│   ├── background-loading.test.js # 底部信息对齐、背景加载事务与尺寸重建回归测试
│   ├── config-boundary.test.js # 配置、占位值、重复字段与 realpath 越界测试
│   ├── content-watcher.test.js # 内容监听、GPS 保留与部署约束回归测试
│   ├── home-components.test.js # 首页组件布局回归测试
│   ├── markdown-rendering.test.js # Markdown HTML、链接、公式与表格回归测试
│   ├── navigation-state.test.js # Header 插槽所有权及博客路由、背景策略回归测试
│   ├── project-integrity.test.js
│   └── verify-build.js       # 生产构建正文、文章阅读背景及 Header 背景切换器验证
```

## 组件调用与规范

### 组件命名与组织

1. **高内聚低耦合**：组件应尽可能自包含，通过 props 传递数据，减少对全局状态的依赖。
2. **复用原则**：通用 UI 效果请使用 `src/lib/components/ui` 下的原子组件，如 `LiquidGlass` 或 `TextEffect`。
3. **样式管理**：优先使用 TailwindCSS 类名，复杂的动画或效果可以在组件内部使用 `<style>` 块，但应避免全局污染。

### Z-Index 层级策略

所有 z-index 均在 `src/lib/styles/app.css` 中以类名形式统一管理，**禁止**在组件样式中硬编码数值。

| 层级 (Layer)   | 类名 (Class)    | Value | 说明                    |
| :------------- | :-------------- | :---- | :---------------------- |
| **Loader**     | `.z-loader`     | 100   | 全局加载/遮罩 (最高)    |
| **Modal**      | `.z-modal`      | 60    | 抽屉、弹窗              |
| **Controls**   | `.z-controls`   | 50    | 导航、侧边栏、Header    |
| **Mask**       | `.z-mask`       | 40    | 滚动淡出遮罩、背景覆盖  |
| **Content**    | `.z-content`    | 20    | 主页面主要文字/图片内容 |
| **Deep**       | `.z-deep`       | -10   | 组件内底层装饰元素      |
| **Background** | `.z-background` | -50   | 全局背景层 (最低)       |

---

> **提示**：新增、修改代码文件或目录后，请务必更新此文档以保持同步。

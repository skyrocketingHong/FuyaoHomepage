# 项目目录结构与简述

## 概述

本项目是一个基于 SvelteKit 的个人主页/博客系统。
主要功能包括个人简介、GitHub 项目展示、足迹地图、友情链接、博客文章等。
系统采用了 Svelte 5 (`runes` mode), TailwindCSS, 和 TypeScript 进行开发。

## 目录结构

```text
.
├── .env                  # 环境变量配置
├── .env.example          # 环境变量示例
├── .gitignore            # Git 忽略文件配置
├── .npmrc                # NPM 配置文件
├── .prettierignore       # Prettier 忽略文件配置
├── .prettierrc           # Prettier 配置文件
├── CHANGELOG.md          # 更新日志
├── LICENSE               # 项目许可证
├── PROJECT_STRUCTURE.md  # 项目结构说明 (本文档)
├── README.md             # 项目自述文件
├── components.json       # Shadcn UI 组件配置
├── eslint.config.js      # ESLint 配置文件
├── package-lock.json     # NPM 依赖锁定文件
├── package.json          # 项目依赖配置
├── postcss.config.js     # PostCSS 配置文件
├── svelte.config.js      # SvelteKit 配置文件
├── tailwind.config.js    # TailwindCSS 配置文件
├── tsconfig.json         # TypeScript 配置文件
├── vite.config.ts        # Vite 构建配置
├── scripts/              # 工具脚本及版本管理
│   ├── generate-blog-index.js # 博客索引生成脚本
│   ├── generate-redirects.js  # 重定向配置生成脚本
│   ├── rename-posts-to-slug.cjs # 批量重命名文章脚本
│   └── update-version.js      # 版本更新与日志生成脚本
├── src/
│   ├── app.css           # 全局样式 (Tailwind @apply 等)
│   ├── app.d.ts          # TypeScript 类型定义
│   ├── app.html          # HTML 模版
│   ├── service-worker.ts # Service Worker
│   ├── lib/              # 核心库代码
│   │   ├── config.ts         # 网站配置文件
│   │   ├── state.svelte.ts   # 全局状态管理 (Svelte 5 runes)
│   │   ├── utils.ts          # 通用工具函数 (cn 合并、类型工具等)
│   │   ├── plugins/          # Vite 插件
│   │   │   └── vite-plugin-blog-watcher.ts # 博客文件监听插件
│   │   ├── components/       # Svelte 组件库
│   │   │   ├── footprint/    # 足迹页面组件
│   │   │   │   └── FootprintList.svelte     # 足迹列表展示
│   │   │   ├── friends/      # 友链页面组件
│   │   │   │   ├── FriendCard.svelte        # 友链卡片
│   │   │   │   └── ProfileCard.svelte       # 个人信息卡片
│   │   │   ├── home/         # 首页专用组件
│   │   │   │   ├── Hero.svelte              # 首页主组件
│   │   │   │   └── hero/                    # Hero 区域子组件
│   │   │   │       ├── GithubProjects.svelte # GitHub 项目展示
│   │   │   │       ├── ProfileSection.svelte # 个人信息展示
│   │   │   │       ├── SocialLinks.svelte    # 社交链接列表
│   │   │   │       └── TimeCapsule.svelte    # 时间胶囊/个人状态
│   │   │   ├── blog/         # 博客页面组件
│   │   │   │   ├── card/         # 卡片组件
│   │   │   │   │   └── PostCard.svelte      # 统一的博客文章卡片
│   │   │   │   ├── common/       # 公共小组件
│   │   │   │   │   ├── CategoryBadge.svelte # 分类标签
│   │   │   │   │   ├── TagBadge.svelte      # 统一标签 (胶囊样式)
│   │   │   │   │   └── EmptyState.svelte    # 文章空状态
│   │   │   │   ├── home/         # 首页视图
│   │   │   │   │   └── BlogHome.svelte      # 博客首页主入口
│   │   │   │   ├── sidebar/      # 侧边栏
│   │   │   │   │   ├── BlogSidebar.svelte   # 博客归档/分类列表
│   │   │   │   │   └── TagCloud.svelte      # 标签云展示
│   │   │   │   ├── viewer/       # 文章阅读器
│   │   │   │   │   ├── BlogViewer.svelte    # 阅读器主入口
│   │   │   │   │   ├── BlogHeader.svelte    # 文章头部 (标题、作者等)
│   │   │   │   │   ├── BlogTOC.svelte       # 文章目录
│   │   │   │   │   ├── BackButton.svelte    # 返回列表按钮
│   │   │   │   │   ├── MarkdownRenderer.svelte # Markdown 内容渲染器
│   │   │   │   │   └── LinkPreview.svelte   # 链接预览组件
│   │   │   │   └── header/       # 头部集成
│   │   │   │       └── HeaderRssButton.svelte # RSS 订阅按钮
│   │   │   ├── layout/       # 布局组件
│   │   │   │   ├── background/   # 背景组件
│   │   │   │   │   └── BackgroundLayer.svelte # 通用背景层包裹
│   │   │   │   ├── content/      # 内容区域组件
│   │   │   │   │   └── MainContent.svelte    # 主内容区域容器
│   │   │   │   ├── header/       # 头部组件
│   │   │   │   │   ├── Header.svelte         # 统一网站 Header
│   │   │   │   │   ├── button/               # Header 按钮
│   │   │   │   │   │   ├── HeaderActions.svelte      # 功能按钮组
│   │   │   │   │   │   └── HeaderActionButton.svelte # 统一按钮外观
│   │   │   │   │   ├── drawer/               # 移动端菜单
│   │   │   │   │   │   └── Drawer.svelte         # 移动端侧栏抽屉
│   │   │   │   │   └── nav/                  # 导航
│   │   │   │   │       ├── CategoryNav.svelte    # 顶部分类导航
│   │   │   │   │       └── MobileNav.svelte      # 移动端底部/顶部导航
│   │   │   │   ├── loader/       # 加载指示器
│   │   │   │   │   └── GlobalLoader.svelte   # 页面切换全局加载
│   │   │   │   └── sidebar/      # 全局侧边栏
│   │   │   │       ├── Sidebar.svelte        # PC端侧边栏容器
│   │   │   │       ├── SidebarTree.svelte    # 递归导航树
│   │   │   │       ├── Item.svelte           # 导航项/菜单项
│   │   │   │       ├── Copyright.svelte      # 底部版权信息
│   │   │   │       └── types.ts              # 侧边栏类型定义
│   │   │   ├── map/          # 地图组件
│   │   │   │   └── AMap.svelte               # 高德地图集成
│   │   │   ├── pay/          # 支付/赞赏组件
│   │   │   │   └── QRCodeCard.svelte         # 付款码展示卡片
│   │   │   ├── seo/          # SEO 组件
│   │   │   │   └── SeoHead.svelte            # HTML Meta 管理
│   │   │   └── ui/           # 基础 UI 原子组件
│   │   │       ├── background/   # 背景特效
│   │   │       │   ├── FlowingBackground.svelte # 流动渐变
│   │   │       │   ├── MosaicBackground.svelte  # 马赛克动态背景
│   │   │       │   └── SolidBackground.svelte   # 纯色/基础背景
│   │   │       ├── display/      # 内容展示
│   │   │       │   ├── Avatar.svelte         # 头像
│   │   │       │   ├── Marquee.svelte        # 跑马灯
│   │   │       │   ├── MosaicInfo.svelte     # 马赛克卡片信息
│   │   │       │   └── SegmentedControl.svelte # 分段切换按钮
│   │   │       ├── effect/       # 视觉效果
│   │   │       │   ├── BlurEdge.svelte       # 边缘模糊
│   │   │       │   ├── Crossfade.svelte      # 交叉淡入淡出动画
│   │   │       │   ├── FadeEdge.svelte       # 边缘淡出
│   │   │       │   ├── LiquidGlass.svelte    # 流体玻璃态背景
│   │   │       │   └── TextEffect.svelte     # 文本打字/特效
│   │   │       ├── feedback/     # 反馈/状态
│   │   │       │   ├── LoadingSpinner.svelte # 加载转圈
│   │   │       │   └── LoadingState.svelte   # 加载中状态封面
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
│   │       │   ├── age.ts    # 年龄计算逻辑
│   │       │   └── date.ts   # 通用日期格式化
│   │       ├── domain/       # 业务逻辑相关
│   │       │   ├── blog.ts       # 博客核心逻辑 (排序、搜索等)
│   │       │   ├── footprints.ts # 足迹数据处理
│   │       │   ├── markdown.ts   # Markdown 解析与渲染逻辑
│   │       │   └── nav.ts        # 导航相关计算
│   │       ├── format/       # 内容格式化
│   │       │   ├── number.ts # 数字转换 (如万、亿)
│   │       │   └── slugify.ts# 字符串 Slug 化
│   │       └── network/      # 网络与加载
│   │           ├── loading.ts    # 资源预加载
│   │           └── urlMetadata.ts# 获取网页元数据
│   └── routes/               # 路由定义 (SvelteKit)
│       ├── +layout.svelte    # 全局布局 (Header, Sidebar)
│       ├── +layout.ts        # 客户端适配加载 logic
│       ├── +page.ts          # 首页重定向 logic
│       ├── blog/             # 博客模块
│       │   ├── [...path]/    # 文章动态渲染页面
│       │   ├── +layout.svelte # 博客专用布局
│       │   └── rss.xml/      # RSS 服务端生成
│       │       └── +server.ts
│       ├── footprint/        # 足迹页面路由
│       │   └── +page.svelte
│       ├── friends/          # 友链页面路由
│       │   └── +page.svelte
│       ├── home/             # 首页路由
│       │   └── +page.svelte
│       ├── pay/              # 赞赏页面路由
│       │   └── +page.svelte
│       └── sitemap.xml/      # 站点地图生成
│           └── +server.ts
├── static/                   # 静态资源目录
│   ├── data/                 # 静态配置数据 (YAML)
│   │   ├── footprints.yaml   # 足迹坐标与信息
│   │   ├── friends.yaml      # 友情链接列表
│   │   ├── payments.yaml     # 收款码配置
│   │   └── social-links.yaml # 社交账号链接
│   ├── fonts/                # 网站自定义字体
│   ├── posts/                # 博客内容源
│   │   ├── [category]/       # 分类存放的 .md 文章 (示例)
│   │   ├── categories.json   # 自动生成的分类索引
│   │   ├── all.json          # 自动生成的文章索引
│   │   └── map.json          # Slug 到路径的映射
│   ├── wp-content/           # 历史媒体存档
│   ├── robots.txt            # 搜索引擎协议
│   └── manifest.json         # PWA 配置
```

## 组件调用与规范

### 组件命名与组织

1. **高内聚低耦合**：组件应尽可能自包含，通过 props 传递数据，减少对全局状态的依赖。
2. **复用原则**：通用 UI 效果请使用 `src/lib/components/ui` 下的原子组件，如 `LiquidGlass` 或 `TextEffect`。
3. **样式管理**：优先使用 TailwindCSS 类名，复杂的动画或效果可以在组件内部使用 `<style>` 块，但应避免全局污染。

### Z-Index 层级策略

所有 z-index 均在 `src/app.css` 中以类名形式统一管理，**禁止**在组件样式中硬编码数值。

| 层级 (Layer)   | 类名 (Class)    | Value | 说明                 |
| :------------- | :-------------- | :---- | :------------------- |
| **Loader**     | `.z-loader`     | 100   | 全局加载/遮罩 (最高) |
| **Modal**      | `.z-modal`      | 60    | 抽屉、弹窗           |
| **Controls**   | `.z-controls`   | 50    | 导航、侧边栏、Header |
| **Mask**       | `.z-mask`       | 40    | 滚动淡出遮罩、背景覆盖 |
| **Content**    | `.z-content`    | 20    | 主页面主要文字/图片内容 |
| **Deep**       | `.z-deep`       | -10   | 组件内底层装饰元素   |
| **Background** | `.z-background` | -50   | 全局背景层 (最低)    |

---
> **提示**：新增、修改代码文件或目录后，请务必更新此文档以保持同步。

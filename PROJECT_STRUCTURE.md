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
│   └── update-version.js      # 版本更新与日志生成脚本
├── src/
│   ├── app.css           # 全局样式 (Tailwind @apply 等)
│   ├── app.d.ts          # TypeScript 类型定义
│   ├── app.html          # HTML 模版
│   ├── service-worker.ts # Service Worker
│   ├── lib/              # 核心库代码
│   │   ├── config.ts         # 网站配置文件
│   │   ├── state.svelte.ts   # 全局状态管理 (Svelte 5 runes)
│   │   ├── utils.ts          # 通用工具函数 (Re-export)
│   │   ├── plugins/          # Vite 插件
│   │   │   └── vite-plugin-blog-watcher.ts # 博客文件监听插件
│   │   ├── components/       # Svelte 组件库
│   │   │   ├── footprint/    # 足迹页面组件
│   │   │   │   └── FootprintList.svelte
│   │   │   ├── friends/      # 友链页面组件
│   │   │   │   ├── FriendCard.svelte
│   │   │   │   └── ProfileCard.svelte
│   │   │   ├── home/         # 首页专用组件
│   │   │   │   ├── Hero.svelte   # 首页主组件
│   │   │   │   └── hero/     # Hero区域（Hero Section/Hero Image）子组件
│   │   │   │       ├── GithubProjects.svelte
│   │   │   │       ├── ProfileSection.svelte # 个人信息展示组件
│   │   │   │       ├── SocialLinks.svelte
│   │   │   │       └── TimeCapsule.svelte
│   │   │   ├── blog/         # 博客页面组件
│   │   │   │   ├── BlogHome.svelte       # 博客首页
│   │   │   │   ├── BlogSidebar.svelte    # 博客侧边栏 (List.svelte exports as default ?)
│   │   │   │   ├── BlogViewer.svelte     # 博客阅读器 (Content.svelte)
│   │   │   │   └── viewer/               # 阅读器子组件
│   │   │   │       ├── Button.svelte     # 返回按钮
│   │   │   │       ├── common/
│   │   │   │       ├── desktop/
│   │   │   │       └── mobile/
│   │   │   ├── layout/       # 布局组件 (按功能模块组织)
│   │   │   │   ├── background/ # 背景组件
│   │   │   │   │   ├── BackgroundLayer.svelte
│   │   │   │   │   └── ...
│   │   │   │   ├── content/  # 内容区域组件
│   │   │   │   │   └── MainContent.svelte    # 主内容区域封装 (原 Content/MainContent)
│   │   │   │   ├── header/   # 头部组件
│   │   │   │   │   ├── Header.svelte         # 统一 Header
│   │   │   │   │   ├── button/               # Header 按钮组件
│   │   │   │   │   │   ├── HeaderActions.svelte      # 功能按钮组
│   │   │   │   │   │   └── HeaderActionButton.svelte # 统一按钮样式
│   │   │   │   │   ├── drawer/               # 移动端抽屉
│   │   │   │   │   │   └── Drawer.svelte
│   │   │   │   │   └── nav/                  # 导航组件
│   │   │   │   │       ├── CategoryNav.svelte    # 胶囊分类导航
│   │   │   │   │       └── MobileNav.svelte      # 移动端底部导航
│   │   │   │   ├── loader/   # 加载器
│   │   │   │   │   └── GlobalLoader.svelte
│   │   │   │   └── sidebar/  # 侧边栏组件
│   │   │   │       ├── Sidebar.svelte        # PC端侧边栏容器
│   │   │   │       ├── SidebarTree.svelte    # 递归树形列表组件 (原 Tree.svelte)
│   │   │   │       ├── Item.svelte           # 列表项组件
│   │   │   │       ├── Copyright.svelte      # 版权信息
│   │   │   │       └── types.ts              # 类型定义
│   │   │   ├── map/          # 地图相关组件
│   │   │   │   └── AMap.svelte
│   │   │   ├── pay/          # 打钱页面组件
│   │   │   │   └── QRCodeCard.svelte
│   │   │   ├── seo/          # SEO 相关组件
│   │   │   │   └── SeoHead.svelte
│   │   │   └── ui/           # 基础 UI 组件 (分类组织)
│   │   │       ├── background/   # 背景特效
│   │   │       │   ├── FlowingBackground.svelte
│   │   │       │   ├── MosaicBackground.svelte
│   │   │       │   └── SolidBackground.svelte
│   │   │       ├── display/      # 展示型组件
│   │   │       │   ├── Avatar.svelte
│   │   │       │   ├── Marquee.svelte
│   │   │       │   └── MosaicInfo.svelte
│   │   │       ├── effect/       # 视觉特效组件
│   │   │       │   ├── BlurEdge.svelte
│   │   │       │   ├── Crossfade.svelte
│   │   │       │   ├── FadeEdge.svelte
│   │   │       │   ├── LiquidGlass.svelte
│   │   │       │   └── TextEffect.svelte
│   │   │       ├── feedback/     # 反馈/状态组件
│   │   │       │   ├── LoadingSpinner.svelte
│   │   │       │   └── LoadingState.svelte
│   │   │       └── layout/       # 通用布局原子组件
│   │   │           └── ScrollContainer.svelte
│   │   ├── i18n/             # 国际化模块
│   │   │   ├── index.ts      # 入口文件
│   │   │   ├── store.ts      # 语言状态管理
│   │   │   └── locales/      # 语言包
│   │   │       ├── en-US.json
│   │   │       └── zh-CN.json
│   │   └── utils/            # 工具函数模块
│   │       ├── datetime/     # 时间日期相关
│   │       │   ├── age.ts    # 年龄计算
│   │       │   └── date.ts   # 日期处理 (Day.js)
│   │       ├── domain/       # 业务领域逻辑
│   │       │   ├── footprints.ts # 足迹数据处理
│   │       │   └── nav.ts    # 导航计算
│   │       ├── format/       # 格式化
│   │       │   ├── number.ts # 数字格式化 (中文大写/英文)
│   │       │   └── slugify.ts# Slug 生成
│   │       └── network/      # 网络与加载
│   │           ├── loading.ts    # 静态资源加载
│   │           └── urlMetadata.ts# URL 元数据获取
│   └── routes/               # 路由定义
│       ├── +layout.svelte    # 根布局
│       ├── +layout.ts        # 根布局通用加载函数
│       ├── +page.ts          # 根路由重定向逻辑
│       ├── blog/             # 博客页面
│       │   ├── [...path]/    # 博客文章动态路由
│       │   └── +layout.svelte
│       ├── footprint/        # 足迹页面
│       │   └── +page.svelte
│       ├── friends/          # 友链页面
│       │   └── +page.svelte
│       ├── home/             # 首页
│       │   └── +page.svelte
│       └── pay/              # 赞赏页面
│           └── +page.svelte
│       └── sitemap.xml/      # 站点地图
│           └── +server.ts
└── static/                   # 静态资源
    ├── posts/                # 博客文章 Markdown 源文件
    ├── robots.txt            # 机器人协议
    ├── manifest.json         # Web App Manifest
    └── data/                 # 静态数据文件
```

## 样式与层级规范

### Z-Index 层级策略

所有 z-index 均在 `src/app.css` 中统一管理，禁止在组件中硬编码。

| 层级 (Layer)   | 类名 (Class)    | Value | 说明                 |
| :------------- | :-------------- | :---- | :------------------- |
| **Loader**     | `.z-loader`     | 100   | 全局加载/遮罩        |
| **Modal**      | `.z-modal`      | 60    | 抽屉、弹窗           |
| **Controls**   | `.z-controls`   | 50    | 导航、侧边栏、Header |
| **Mask**       | `.z-mask`       | 40    | 滚动遮罩、装饰性覆盖 |
| **Content**    | `.z-content`    | 20    | 主页面内容           |
| **Deep**       | `.z-deep`       | -10   | 组件内底层元素       |
| **Background** | `.z-background` | -50   | 全局背景             |

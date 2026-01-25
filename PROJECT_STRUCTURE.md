# 项目目录结构与简述

## 概述
本项目是一个基于 SvelteKit 的个人主页/博客系统。
主要功能包括个人简介、GitHub 项目展示、足迹地图、友情链接、博客文章等。
系统采用了 Svelte 5 (`runes` mode), TailwindCSS, 和 TypeScript 进行开发。

## 目录结构

```
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
│   └── update-version.js # 版本更新与日志生成脚本
├── src/
│   ├── app.css           # 全局样式 (Tailwind @apply 等)
│   ├── app.d.ts          # TypeScript 类型定义
│   ├── app.html          # HTML 模版
│   ├── service-worker.ts # Service Worker
│   ├── lib/              # 核心库代码
│   │   ├── config.ts         # 网站配置文件
│   │   ├── state.svelte.ts   # 全局状态管理 (Svelte 5 runes)
│   │   ├── utils.ts          # 通用工具函数
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
│   │   │   ├── layout/       # 布局组件
│   │   │   │   ├── common/   # 通用布局组件
│   │   │   │   │   ├── BackgroundLayer.svelte
│   │   │   │   │   ├── Copyright.svelte
│   │   │   │   │   ├── GlobalLoader.svelte
│   │   │   │   │   ├── Header.svelte
│   │   │   │   │   ├── HeaderActionButton.svelte # 统一头部按钮样式与交互
│   │   │   │   │   ├── HeaderActions.svelte      # 功能按钮组 (通用逻辑抽离)
│   │   │   │   │   └── LoadingScreen.svelte
│   │   │   │   ├── desktop/  # 桌面端布局
│   │   │   │   │   ├── Content.svelte
│   │   │   │   │   └── Sidebar.svelte
│   │   │   │   └── mobile/   # 移动端布局
│   │   │   │       ├── Content.svelte
│   │   │   │       ├── Drawer.svelte
│   │   │   │       └── MobileNav.svelte          # 移动端导航 (自适应均分排列)
│   │   │   ├── map/          # 地图相关组件
│   │   │   │   └── AMap.svelte
│   │   │   ├── pay/          # 打钱页面组件
│   │   │   │   └── QRCodeCard.svelte
│   │   │   ├── seo/          # SEO 相关组件
│   │   │   │   └── SeoHead.svelte
│   │   │   └── ui/           # 基础 UI 组件
│   │   │       ├── AutoScroll.svelte         # 自动滚动文本组件 (支持触摸暂停)
│   │   │       ├── Avatar.svelte
│   │   │       ├── Crossfade.svelte
│   │   │       ├── LiquidGlass.svelte        # 液态玻璃特效 (硬件加速优化)
│   │   │       ├── LoadingSpinner.svelte
│   │   │       ├── LoadingState.svelte
│   │   │       └── TextEffect.svelte         # 文本特效 (流光/终端/火焰/色散)
│   │   ├── i18n/             # 国际化模块
│   │   │   ├── index.ts      # 入口文件
│   │   │   ├── store.ts      # 语言状态管理
│   │   │   └── locales/      # 语言包
│   │   │       ├── en.json
│   │   │       └── zh.json
│   │   └── utils/            # 工具函数模块
│   │       ├── age.ts        # 年龄计算
│   │       ├── footprints.ts # 足迹数据处理
│   │       ├── loading.ts    # 加载状态处理
│   │       ├── nav.ts        # 导航配置
│   │       └── number.ts     # 数字处理
│   └── routes/               # 路由定义
│       ├── +layout.svelte    # 根布局
│       ├── +layout.ts        # 根布局通用加载函数
│       ├── +page.ts          # 根路由重定向逻辑
│       ├── blog/             # 博客页面
│       │   └── +page.svelte
│       ├── footprint/        # 足迹页面
│       │   └── +page.svelte
│       ├── friends/          # 友链页面
│       │   └── +page.svelte
│       ├── home/             # 首页
│       │   └── +page.svelte
│       └── pay/              # 赞赏页面
│           └── +page.svelte
└── static/                   # 静态资源
    ├── manifest.json         # PWA Manifest
    ├── robots.txt            # 爬虫协议
    ├── data/                 # 静态数据文件
    │   ├── footprints.yaml
    │   ├── friends.yaml
    │   ├── payments.yaml
    │   └── social-links.yaml
    └── favicon/              # 网站图标资源
        ├── android-chrome-192x192.png
        ├── android-chrome-512x512.png
        ├── apple-touch-icon-114x114.png
        ├── apple-touch-icon-120x120.png
        ├── apple-touch-icon-144x144.png
        ├── apple-touch-icon-152x152.png
        ├── apple-touch-icon-180x180.png
        ├── apple-touch-icon-57x57.png
        ├── apple-touch-icon-60x60.png
        ├── apple-touch-icon-72x72.png
        ├── apple-touch-icon-76x76.png
        ├── apple-touch-icon.png
        ├── browserconfig.xml
        ├── favicon-16x16.png
        ├── favicon-32x32.png
        ├── favicon.ico
        ├── html_code.html
        ├── mstile-144x144.png
        ├── mstile-150x150.png
        ├── mstile-310x150.png
        ├── mstile-310x310.png
        ├── mstile-70x70.png
        ├── safari-pinned-tab.svg
        └── site.webmanifest
```

## 核心模块说明

### 1. 组件系统 (`src/lib/components`)
- **ui/**: 基础原子组件，不包含业务逻辑，可在任何地方复用。
- **layout/**: 负责页面整体结构的组件。分为桌面端 (`desktop`) 和移动端 (`mobile`)，`common` 为通用部分。
- **home/**: 首页业务组件。
- **footprint/**: 足迹展示相关组件。
- **friends/**: 友情链接展示卡片组件。
- **map/**: 高德地图/地图组件封装。
- **pay/**: 支付/赞赏页面组件。

### 2. 状态管理 (`src/lib/state.svelte.ts`)
- 使用 Svelte 5 的 `$state` 原语进行全局状态管理。
- 包含 UI 状态（如侧边栏开关）、响应式状态（如是否为移动端）。

### 3. 工具库 (`src/lib/utils`)
- **age.ts**: 计算年龄/时间差。
- **footprints.ts**: 处理 GeoJSON 或足迹数据格式。
- **loading.ts**: 页面加载状态控制。
- **nav.ts**: 导航菜单配置。
- **number.ts**: 数字格式化工具。

### 4. 静态数据 (`static/data`)
- 使用 YAML 文件存储内容数据，方便编辑和管理：
    - `footprints.yaml`: 足迹点数据。
    - `friends.yaml`: 友情链接数据。
    - `payments.yaml`: 支付方式数据。
    - `social-links.yaml`: 社交媒体链接数据。

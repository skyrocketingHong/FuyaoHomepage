# 项目目录结构与简述

## 概述
本项目是一个基于 SvelteKit 的个人主页/博客系统。

## 目录结构

```
.
├── src/
│   ├── lib/                  # 库代码
│   │   ├── components/       # Svelte 组件
│   │   │   ├── ui/           # 通用 UI 组件 (Avatar, Button, LoadingState 等)
│   │   │   ├── home/         # 首页相关组件
│   │   │   └── ...
│   │   ├── i18n/             # 国际化相关文件
│   │   ├── utils/            # 工具函数
│   │   ├── state.svelte.ts   # 全局状态管理
│   │   └── config.ts         # 配置文件
│   ├── routes/               # SvelteKit 路由
│   ├── app.html              # 主 HTML 模版
│   └── app.css               # 全局样式
├── static/                   # 静态资源 (图片, favicon/ 等)
├── README.md                 # 项目说明文档
├── CHANGELOG.md              # 更新日志
├── PROJECT_STRUCTURE.md      # 项目结构说明
├── svelte.config.js          # Svelte 配置文件
├── tailwind.config.js        # Tailwind CSS 配置文件
└── vite.config.ts            # Vite 配置文件
```

## 核心模块
- **Components**: UI 组件库位于 `src/lib/components/ui`，业务组件按功能分类。
- **State**: 使用 Svelte 5 的 `$state` 进行状态管理 (`src/lib/state.svelte.ts`)。
- **Styling**: 使用 Tailwind CSS 进行样式开发。

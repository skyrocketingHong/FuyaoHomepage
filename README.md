# Fuyao Homepage

基于 SvelteKit 构建的现代个人主页与博客系统。采用 Svelte 5、Tailwind CSS 和 TypeScript 开发

## 目录

- [Fuyao Homepage](#fuyao-homepage)
  - [目录](#目录)
  - [特性](#特性)
  - [项目结构](#项目结构)
  - [开发指南](#开发指南)
    - [常用命令](#常用命令)
  - [配置说明](#配置说明)
  - [博客自动化部署](#博客自动化部署)
    - [1. 自动化监听](#1-自动化监听)
    - [2. 精简部署](#2-精简部署)
  - [鸣谢](#鸣谢)

---

## 特性

- **技术栈**: SvelteKit, Svelte 5 (Runes), TypeScript
- **样式**: Tailwind CSS, PostCSS
- **组件**: 自定义 UI 组件库
- **功能**: 国际化支持 (i18n)、动态特效、响应式设计
- **自动部署**: 博文上传/删除自动索引，同步生成 RSS 与 Sitemap

## 项目结构

详情参阅 [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)。更新记录查看 [CHANGELOG.md](./CHANGELOG.md)

## 开发指南

项目依赖 Node.js 环境

### 常用命令

```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 手动生成博客索引
npm run gen-blog
```

## 配置说明

项目使用环境变量进行配置。请参考 [CONFIGURATION.md](./CONFIGURATION.md) 查看详细的变量列表与说明

## 博客自动化部署

支持在服务器上实现“上传即发布”：

### 1. 自动化监听

建议使用 `systemd` 守护进程运行 `scripts/watch-posts.js` 实现递归监控

**服务文件配置** (`/etc/systemd/system/blog-watcher.service`):

```ini
[Unit]
Description=Recursive Blog Post Watcher
After=network.target

[Service]
Type=simple
WorkingDirectory=/path/to/project
ExecStart=/path/to/node scripts/watch-posts.js
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

**管理命令**:

```bash
systemctl daemon-reload
systemctl enable --now blog-watcher.service
```

### 2. 精简部署

服务器可仅保留以下必要文件以运行自动化脚本：

- `scripts/generate-blog-index.js`
- `scripts/watch-posts.js`
- `package.json`
- `.env`

在目标目录运行 `npm install --production` 即可

## 鸣谢

参考的开源项目：

- [imyan.ren](https://github.com/Yanren1225/imyan.ren): 部分样式参考
- [hongkong-mtr-mosaic](https://github.com/sayidhe/hongkong-mtr-mosaic): 港铁马赛克特效参考
- [MTR-Sung](https://github.com/wobebebe/MTR-Sung): 港铁字体参考

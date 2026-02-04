# 配置说明

项目通过环境变量进行配置。请将 `.env.example` 复制为 `.env` 并根据环境实际情况修改。

## 环境变量

### 1. 核心配置

| 变量名 | 说明 | 示例 |
| :--- | :--- | :--- |
| `VITE_SITE_NAME` | 站点名称 | `扶摇 Skyrocketing` |
| `VITE_GITHUB_USERNAME` | GitHub 用户名 | `skyrocketinghong` |

### 2. 站点信息

| 变量名 | 说明 | 示例 |
| :--- | :--- | :--- |
| `VITE_SITE_URL` | 主站地址 | `https://fuyaoskyrocket.ing` |
| `VITE_BLOG_URL` | 博客地址 | `https://fuyaoskyrocket.ing/blog` |
| `VITE_AVATAR_URL` | 用户头像 URL | (留空则使用 GitHub 头像) |
| `VITE_SITE_START_YEAR` | 网站运行起始年份 | `2016` |
| `VITE_USER_BIRTH_DATE` | 站长出生日期 | `YYYY-MM-DD` |

### 3. 博客自动化 (服务端)

| 变量名 | 说明 | 示例 |
| :--- | :--- | :--- |
| `VITE_BLOG_SOURCE_DIR` | 博文 Markdown 源目录 | `/home/caddy/www/index/posts` |
| `VITE_BLOG_OUTPUT_DIR` | 索引文件 (JSON) 输出目录 | `/home/caddy/www/index/posts` |
| `VITE_STATIC_OUTPUT_DIR` | 静态资源 (RSS/Sitemap) 输出目录 | `/home/caddy/www/index` |

### 4. SEO 设置

| 变量名 | 说明 |
| :--- | :--- |
| `VITE_SEO_AUTHOR` | 作者名称 |
| `VITE_SEO_DESCRIPTION` | 网站描述 |
| `VITE_SEO_KEYWORDS` | SEO 关键词 (逗号分隔) |
| `VITE_TWITTER_ID` | Twitter 用户名 |

### 5. 源代码仓库

| 变量名 | 说明 |
| :--- | :--- |
| `VITE_REPO_URL` | 仓库地址 |
| `VITE_REPO_NAME` | 仓库名称 |

### 6. 第三方服务

| 变量名 | 说明 |
| :--- | :--- |
| `VITE_WALLPAPER_API` | 壁纸接口地址 |
| `VITE_AMAP_KEY` | 高德地图 API Key |
| `VITE_AMAP_SECURITY_CODE` | 高德地图安全码 |

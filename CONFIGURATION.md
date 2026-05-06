# 配置说明

项目通过环境变量进行配置。请将 `.env.example` 复制为 `.env` 并根据环境实际情况修改。

## 环境变量

### 1. 站点配置

| 变量名                 | 说明                            | 示例                |
| :--------------------- | :------------------------------ | :------------------ |
| `VITE_SITE_NAME`       | 站点名称                        | `扶摇 Skyrocketing` |
| `VITE_SITE_START_YEAR` | 网站运营起始年份 (页脚版权显示) | `2024`              |
| `VITE_SITE_START_DATE` | 网站运营起始日期 (计算运行时间) | `2024-01-01`        |
| `VITE_USER_BIRTH_DATE` | 站长出生日期 (计算年龄)         | `YYYY-MM-DD`        |

### 2. 个人信息

| 变量名                 | 说明                                  | 示例                |
| :--------------------- | :------------------------------------ | :------------------ |
| `VITE_GITHUB_USERNAME` | GitHub 用户名                         | `skyrocketinghong`  |
| `VITE_AVATAR_URL`      | 用户头像 URL (留空则使用 GitHub 头像) |                     |
| `VITE_USER_ROLE_ZH`    | 站长角色/职业 (中文)                  | `软件工程师`        |
| `VITE_USER_ROLE_EN`    | 站长角色/职业 (英文)                  | `Software Engineer` |
| `VITE_USER_QUOTE_ZH`   | 站长个性签名 (中文)                   | `你的座右铭`        |
| `VITE_USER_QUOTE_EN`   | 站长个性签名 (英文)                   | `Your Motto`        |

### 3. 网站链接

| 变量名          | 说明     | 示例                       |
| :-------------- | :------- | :------------------------- |
| `VITE_SITE_URL` | 主站地址 | `https://example.com`      |
| `VITE_BLOG_URL` | 博客地址 | `https://blog.example.com` |

### 4. 博客自动化 (服务端)

| 变量名                   | 说明                            | 示例                          |
| :----------------------- | :------------------------------ | :---------------------------- |
| `VITE_BLOG_SOURCE_DIR`   | 博文 Markdown 源目录            | `/home/caddy/www/index/posts` |
| `VITE_BLOG_OUTPUT_DIR`   | 索引文件 (JSON) 输出目录        | `/home/caddy/www/index/posts` |
| `VITE_STATIC_OUTPUT_DIR` | 静态资源 (RSS/Sitemap) 输出目录 | `/home/caddy/www/index`       |

### 5. 开源仓库

| 变量名           | 说明     |
| :--------------- | :------- |
| `VITE_REPO_URL`  | 仓库地址 |
| `VITE_REPO_NAME` | 仓库名称 |

### 6. SEO 设置

| 变量名                 | 说明                  |
| :--------------------- | :-------------------- |
| `VITE_SEO_AUTHOR`      | 作者名称              |
| `VITE_SEO_DESCRIPTION` | 网站描述              |
| `VITE_SEO_KEYWORDS`    | SEO 关键词 (逗号分隔) |
| `VITE_TWITTER_ID`      | Twitter 用户名        |

### 7. 第三方服务

| 变量名                         | 说明                                          |
| :----------------------------- | :-------------------------------------------- |
| `VITE_WALLPAPER_API`           | 壁纸接口地址                                  |
| `VITE_AMAP_KEY`                | 高德地图 API Key                              |
| `VITE_AMAP_SECURITY_CODE`      | 高德地图安全码                                |
| `VITE_CF_ANALYTICS_WORKER_URL` | Cloudflare Analytics Worker URL（部署后获取） |
| `VITE_WAKATIME_EMBED_URL`      | WakaTime 嵌入式 JSON URL                      |

## Cloudflare Analytics Worker

首页的访问统计模块通过独立的 Cloudflare Worker 代理 Analytics GraphQL API，避免在前端暴露 API Token。

### 前置条件

- Cloudflare 账户，域名已接入 Cloudflare
- API Token（需 `Analytics:Read` 权限，在 Cloudflare Dashboard → 我的个人资料 → API 令牌 中创建）
- Zone ID（在 Cloudflare Dashboard → 域名概览页右下角获取）

### 部署步骤

```bash
# 1. 安装 Wrangler CLI
npm install -g wrangler

# 2. 登录 Cloudflare
wrangler login

# 3. 进入 Worker 目录
cd cf-analytics-worker

# 4. 修改 wrangler.toml 中的 ALLOWED_ORIGIN 为你的域名
# 5. 配置密钥
wrangler secret put CF_API_TOKEN
wrangler secret put CF_ZONE_ID

# 6. 部署
wrangler deploy
```

部署成功后会输出 Worker URL（形如 `https://cf-analytics-worker.xxx.workers.dev`），将其填入 `.env` 的 `VITE_CF_ANALYTICS_WORKER_URL`。

### WakaTime 配置

1. 登录 [WakaTime](https://wakatime.com)
2. 进入 Settings → Share → Embeddable
3. 选择 JSON 格式，复制生成的 URL
4. 填入 `.env` 的 `VITE_WAKATIME_EMBED_URL`

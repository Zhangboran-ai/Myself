# 林深 · 个人展示网站

深色星空主题的个人品牌站点：个人介绍、技能、项目、博客四个模块，附带只给站主使用的管理后台。

产品需求见 [`docs/PRD.md`](docs/PRD.md)，技术方案见 [`docs/TECH_DESIGN.md`](docs/TECH_DESIGN.md)，编码规范见 [`AGENTS.md`](AGENTS.md)。

## 技术栈

| 层 | 选型 |
| --- | --- |
| 前端 | Next.js 15（App Router）+ React 19 + TypeScript + Tailwind CSS v4 |
| 星空 | 原生 Canvas 2D，单 canvas + RAF，不进入 React 状态 |
| 后端 | NestJS 11 + Fastify adapter |
| 数据库 | MySQL 8 + Prisma |
| 校验 | Zod（`packages/shared` 前后端共用） |
| Markdown | remark → rehype → rehype-sanitize → Shiki，禁用运行时 MDX |
| 部署 | Docker Compose + Caddy |

## 目录

```
apps/web          Next.js 前端（(site) 公开站点 + (admin) 管理后台）
apps/api          NestJS 后端（controller → service → repository 分层）
packages/shared   共享类型、Zod schema、纯函数
docker/           Dockerfile、compose.yml、Caddyfile
docs/             PRD 与技术设计
```

## 本地开发

要求：Node.js ≥ 22、pnpm ≥ 9、可用的 MySQL 8 实例。

1. 复制环境变量并填写数据库连接：

   ```powershell
   Copy-Item .env.example .env
   Copy-Item .env.example apps/api/.env
   Copy-Item .env.example apps/web/.env.local
   ```

   `apps/web/.env.local` 只需要保留 `NEXT_PUBLIC_*`、`INTERNAL_API_URL`、`REVALIDATE_SECRET` 等前端相关项。

2. 安装依赖、建表并写入演示数据：

   ```powershell
   pnpm install
   pnpm db:migrate
   pnpm db:seed
   ```

3. 启动前后端（两个终端）：

   ```powershell
   pnpm dev:api
   pnpm dev:web
   ```

   前端 <http://localhost:3000>，API <http://localhost:4000/api/v1>，后台 <http://localhost:3000/admin>。
   管理员账号来自 `ADMIN_USERNAME` / `ADMIN_PASSWORD`（默认 `admin` / `admin12345`，仅用于本地）。

4. 可选：启用图片上传（媒体库）。本地用 Docker 起一个 MinIO，然后在 `apps/api/.env` 填写：

   ```powershell
   docker compose -f docker/compose.yml up -d minio minio-init
   ```

   ```env
   S3_ENDPOINT=http://127.0.0.1:9000
   S3_BUCKET=media
   S3_ACCESS_KEY=minio
   S3_SECRET_KEY=minio-dev-secret
   S3_PUBLIC_BASE=http://127.0.0.1:9000/media
   S3_REGION=auto
   ```

   不配置对象存储时，后台其余功能正常，只有上传接口返回「对象存储未配置」。

## 常用命令

| 用途 | 命令 |
| --- | --- |
| 全量类型检查 | `pnpm typecheck` |
| ESLint | `pnpm lint` |
| 单元测试 | `pnpm test` |
| 生产构建 | `pnpm build` |
| 数据库迁移（本地） | `pnpm db:migrate` |
| 数据库迁移（部署） | `pnpm db:deploy` |
| Prisma Studio | `pnpm db:studio` |

## 已实现能力

- 首页：Hero、技能摘要、精选项目、最新文章、联系区，`Person` 结构化数据。
- 关于：Markdown 简介、经历时间线、简历与社交链接。
- 项目：列表（技术栈筛选、URL 状态保留）、详情、相关项目、旧 slug 301。
- 博客：列表（标签、搜索、分页）、详情（TOC、Shiki 高亮、上下篇、浏览去重）、标签页、RSS、sitemap。
- 后台：登录（JWT + 轮换 Refresh + CSRF 双提交）、文章/项目/技能/资料/经历编辑、草稿预览（10 分钟签名链接）、修订历史与恢复、统计概览、手动缓存失效（失败自动重试）。
- 媒体库：S3 兼容对象存储上传（magic bytes 校验、拒绝 SVG、10MB 上限）、WebP 三档变体、blurhash 占位、SHA-256 去重、引用检查后删除，文章/项目封面可直接从媒体库选择。
- 联系留言：前台表单限流 + 蜜罐，后台收件箱（未读/已读/已回复/垃圾），可选 SMTP 邮件通知。
- 全局：星空背景（DPR 上限、隐藏暂停、`prefers-reduced-motion` 降级）、404、错误兜底、响应式与键盘可达。

## Docker 部署

```powershell
Copy-Item docker/.env.example docker/.env
# 填写域名与所有密钥
docker compose -f docker/compose.yml up -d --build
docker compose -f docker/compose.yml run --rm api npx prisma migrate deploy
docker compose -f docker/compose.yml run --rm api pnpm db:seed
```

Caddy 负责 80/443 入口与自动 HTTPS：`/api/*` 转发到 API，其余转发到 Web；MySQL 不暴露公网端口。

## Vercel 部署（仅前端）

Vercel 只托管 `apps/web`，API 与 MySQL 需要部署在能访问数据库的服务器上（推荐上面的 Docker 方案），并且对公网可达。

1. 在 Vercel 导入本仓库。
2. 项目设置 → **Root Directory** 选择 `apps/web`。这一步必须做：仓库根目录的 `package.json` 没有 `next` 依赖，留在根目录会报 `NEXT_NO_VERSION`。仓库根目录不再放 `vercel.json`，避免 Vercel 在根目录按 Next.js 项目解析。
3. Framework Preset 保持 **Next.js**，Node.js 版本选择 **22.x**。
4. 在 Environment Variables 中配置：

   | 变量 | 说明 |
   | --- | --- |
   | `INTERNAL_API_URL` | 构建期与 SSR 访问 API 的地址，例如 `https://api.example.com/api/v1`。Vercel 构建时会请求它生成静态页面，必须公网可达 |
   | `NEXT_PUBLIC_API_URL` | 浏览器访问 API 的地址，例如 `https://api.example.com/api/v1` |
   | `NEXT_PUBLIC_SITE_URL` | 站点正式域名，例如 `https://example.com`，用于 canonical、sitemap、RSS |
   | `REVALIDATE_SECRET` | 与 API 端一致的缓存失效密钥 |
   | `NEXT_IMAGE_HOSTS` | 可选，`next/image` 允许的图片域名，逗号分隔，不含协议 |

5. 构建命令由 `apps/web/vercel.json` 提供，会先构建 `packages/shared` 再构建 web，无需在 Dashboard 手动填写。

> 构建期数据来自真实 API。若 `INTERNAL_API_URL` 不可达，`Generating static pages` 阶段会失败；这不是框架配置问题，先确认 API 已部署且允许来自 Vercel 的访问。

## 测试

- 单元测试使用 Vitest，覆盖共享工具、Markdown 清洗（XSS）、日期格式化、登录锁定与令牌重放、留言限流、图片类型识别、预览令牌。
- E2E 使用 Playwright：

  ```powershell
  pnpm test:e2e:install
  # 先启动 api 与 web，并完成 db:migrate + db:seed
  $env:E2E_ADMIN_PASSWORD = "admin12345"
  pnpm test:e2e
  ```

  测试覆盖访客主流程、RSS/sitemap/404、移动端抽屉与无横向滚动、键盘跳转，以及「登录 → 发布文章 → 前台可见 → 删除」的后台链路（未设置 `E2E_ADMIN_PASSWORD` 时自动跳过）。

## 尚未实现（按优先级）

1. MySQL ngram 全文检索（当前标题/摘要 `contains` 查询，数据量小时足够）。
2. 自动生成 1200×630 OG 图（当前使用 `public/og-default.svg`）。
3. 访问统计接入（隐私友好方案）。
4. Lighthouse CI 门禁与视觉回归截图。

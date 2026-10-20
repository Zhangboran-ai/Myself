# 个人展示网站 技术设计文档（TECH_DESIGN）

| 项目 | 内容 |
| --- | --- |
| 文档版本 | v1.0 |
| 日期 | 2026-10-20 |
| 关联文档 | [PRD.md](./PRD.md) |
| 目标读者 | 前端 / 后端 / 运维 |

---

## 0. 文档说明

### 0.1 与 PRD 的差异

PRD §4.6 采用「Git 仓库中的 MDX 文件」作为内容源（纯静态）。本方案按全栈要求调整为 **API + MySQL**，原因与实际收益：

| 维度 | 文件驱动（PRD 原方案） | API + MySQL（本方案） |
| --- | --- | --- |
| 内容发布 | 改文件 → 提交 → 构建 | 后台表单 → 即时生效 |
| 非技术人员维护 | 困难 | 可行 |
| 草稿预览 | 需额外路由 | 签名链接直接预览 |
| 浏览量 / 搜索 / 联系表单 | 需第三方服务 | 数据库内闭环 |
| 运维成本 | 极低 | 需维护服务器与数据库 |
| 内容可迁移性 | 天然可版本化 | 需导出功能（本期提供 Markdown 导出） |

其余产品需求（四大模块、星空主题、响应式、SEO、性能预算、无障碍）保持不变。

### 0.2 设计原则

1. **单体优先**：个人站点不做微服务，一个 Web 进程 + 一个 API 进程 + 一个数据库足够。
2. **读多写少**：公开页面全部走缓存/预渲染，数据库只承受后台写入与少量动态请求。
3. **后台是工具，不是产品**：管理端只追求可靠与效率，不做复杂权限与工作流。
4. **可迁移**：内容以 Markdown 为主存储格式，可随时导出为文件回退到静态方案。

---

## 1. 技术栈选择

### 1.1 总览

| 层次 | 选型 | 版本建议 | 说明 |
| --- | --- | --- | --- |
| 前端框架 | Next.js（App Router） | 最新稳定版（≥15） | SSR/ISR 兼顾 SEO 与首屏性能，与 React 生态一致 |
| UI 运行时 | React | 19+ | Server Components 减少首屏 JS |
| 语言 | TypeScript | 5.x，`strict: true` | 前后端共享类型 |
| 样式 | Tailwind CSS + CSS Variables | v4 | Token 用 CSS 变量，工具类做布局，避免运行时 CSS-in-JS |
| 组件基座 | Radix UI（无样式）+ 自研封装 | 最新 | 可访问性由 Radix 保证，视觉完全自定义 |
| 动效 | CSS Transition + Motion（按需） | 最新 | 优先 CSS，复杂手势/编排再引入库 |
| 星空背景 | 原生 Canvas 2D（自研组件） | — | 不引入粒子库，控制体积与性能 |
| 代码高亮 | Shiki | 最新 | 构建期/请求期高亮，输出静态 HTML，无客户端高亮开销 |
| 图标 | Lucide | 最新 | 线性统一风格，按需引入 |
| 后端框架 | NestJS（Fastify adapter） | 11+ | 模块化、DI、管道校验、Swagger，适合长期维护 |
| ORM | Prisma | 6+ | 类型安全、迁移工具完善、生态成熟 |
| 数据库 | MySQL | 8.0 / 8.4 LTS | 按需求指定；InnoDB、utf8mb4 |
| 校验 | Zod（共享 schema） | 最新 | 前后端复用同一份校验规则 |
| 认证 | JWT（短期 Access + 轮换 Refresh） | — | httpOnly Cookie 存储，仅管理员使用 |
| 缓存 | Next.js 数据缓存 + Redis（可选） | Redis 7 | 首版可不启用 Redis，预留接口 |
| 对象存储 | S3 兼容（Cloudflare R2 / 阿里云 OSS / MinIO） | — | 图片与附件，不自建本地磁盘长期存储 |
| 图片处理 | sharp | 最新 | 上传时压缩、转 WebP/AVIF、生成缩略图与 blurhash |
| 反向代理 | Caddy 或 Nginx | — | Caddy 自动 HTTPS 更省心 |
| 容器化 | Docker + Docker Compose | — | 单机编排，一条命令起全栈 |
| CI/CD | GitHub Actions | — | lint → test → build → 推送镜像 → SSH 部署 |
| 测试 | Vitest + Playwright + Supertest | — | 单测 / E2E / API 集成 |
| 包管理 | pnpm workspace + Turborepo | — | Monorepo 依赖与任务编排 |

### 1.2 前端选型理由

- **Next.js 而非纯 SPA**：博客与项目详情需要被搜索引擎索引、需要社交平台正确抓取 OG 信息。纯 SPA 需要额外做预渲染，成本更高。Next.js 的 SSG/ISR 可直接产出静态 HTML，同时保留后台数据更新后的按需重验证能力。
- **App Router + Server Components**：星空、动效等交互留在客户端组件，正文与列表在服务端渲染，首屏 JS 可控在 150KB 以内。
- **Tailwind + CSS 变量**：PRD §5.2 的颜色/间距/圆角 Token 直接落为 CSS 变量，Tailwind 只负责原子布局，避免设计系统被工具类淹没。
- **不选 Vite + React SPA**：需要自行搭建 SSR/SEO/图片优化，收益不足。
- **不选 Astro**：内容站很合适，但后台管理、动态表单、鉴权会引入额外的 Islands 复杂度，且团队更熟悉 React 全栈。

### 1.3 后端选型理由

- **NestJS 而非 Express 裸写**：模块边界（auth / content / media / stats）、DTO 校验、异常过滤器、Swagger 文档都是现成的，半年后回来改代码仍有结构可循。
- **Fastify adapter**：比默认 Express 吞吐更高、开销更小。
- **不选 Java/Go**：个人项目单人维护，前后端同语言可共享类型与校验，收益远大于性能差异；QPS 量级（个人站）远未触及 Node 瓶颈。
- **不选 Serverless 函数 + MySQL**：数据库连接数在冷启动场景下难以控制，且个人站流量低，常驻进程更简单、更便宜。

### 1.4 数据库选型理由

- **MySQL 8**：需求指定；InnoDB 事务、窗口函数、JSON 类型、FULLTEXT（含 ngram 分词）足够覆盖本项目。
- **编码统一 `utf8mb4` + `utf8mb4_0900_ai_ci`**：支持 emoji 与中文，排序规则对中文按 Unicode 码位排序（非拼音，可接受）。
- **不选 PostgreSQL**：需求明确 MySQL；PG 的 `tsvector` 全文检索更强，但本项目可用 ngram FULLTEXT + 应用层兜底解决。
- **不选 MongoDB**：内容有明确关系（文章-标签、项目-技术栈），关系型更合适，且便于统计查询。

### 1.5 明确不引入的技术

| 技术 | 不引入原因 |
| --- | --- |
| GraphQL | 接口数量少，REST 更直观，缓存更好做 |
| 微服务 / 消息队列 | 单人项目，无此量级需求 |
| Kubernetes | 单机 Docker Compose 足够 |
| Elasticsearch | 数据量 < 1 万条，MySQL FULLTEXT 足够 |
| 运行时 MDX | 数据库内容不可信执行任意代码，安全风险高（见 §6.2） |
| 大型 UI 组件库（Ant Design 等） | 定制成本高，视觉风格冲突 |

---

## 2. 系统架构

```mermaid
flowchart LR
    U[访客 / 管理员] -->|HTTPS| C[Caddy 反向代理]
    C -->|/| W[Next.js Web]
    C -->|/api| A[NestJS API]
    W -->|SSR / ISR 数据请求| A
    W -->|构建期/重验证| A
    A -->|Prisma| D[(MySQL 8)]
    A -->|读写| R[(Redis 可选)]
    A -->|上传/读取| S[S3 兼容对象存储]
    A -->|发送| M[邮件服务 SMTP/API]
```

### 2.1 请求路径

| 场景 | 路径 | 缓存策略 |
| --- | --- | --- |
| 首页 / 项目 / 文章详情 | 浏览器 → Caddy → Next.js（SSG/ISR） | 静态 HTML + `revalidateTag` 按需失效 |
| 后台管理 | 浏览器 → Caddy → Next.js `/admin` → API | 不缓存，`no-store` |
| 公开 API（列表/筛选） | 浏览器/SSR → API | API 侧 `Cache-Control: public, s-maxage=60, stale-while-revalidate=300` |
| 图片 | 浏览器 → 对象存储 / CDN | 长缓存 + 内容哈希文件名 |
| 浏览量上报 | 浏览器 → API | 不做响应缓存，异步落库 |

### 2.2 内容更新链路

1. 管理员在后台保存内容 → API 写 MySQL。
2. API 调用 Next.js 的 revalidate 接口（带内部签名密钥），传入 `post:{slug}`、`project:{slug}`、`tag:{name}` 等 tag。
3. Next.js 下次请求对应页面时重新生成，其余页面保持静态。
4. 若 revalidate 调用失败，记录任务表 `revalidate_job` 并重试（最多 5 次，指数退避），保证最终一致。

> 不让 API 直接写 Next.js 缓存文件，避免部署拓扑耦合；只通过 HTTP 接口触发。

---

## 3. 项目结构

采用 pnpm workspace 单仓库（Monorepo），前后端共享类型与校验规则。

```
myself/
├─ apps/
│  ├─ web/                          # Next.js 前端
│  │  ├─ src/
│  │  │  ├─ app/
│  │  │  │  ├─ (site)/              # 公开站点路由组
│  │  │  │  │  ├─ layout.tsx        # 全局布局：导航 + 星空 + 页脚
│  │  │  │  │  ├─ page.tsx          # 首页
│  │  │  │  │  ├─ about/page.tsx
│  │  │  │  │  ├─ projects/
│  │  │  │  │  │  ├─ page.tsx
│  │  │  │  │  │  └─ [slug]/page.tsx
│  │  │  │  │  ├─ blog/
│  │  │  │  │  │  ├─ page.tsx
│  │  │  │  │  │  ├─ [slug]/page.tsx
│  │  │  │  │  │  └─ tags/[tag]/page.tsx
│  │  │  │  │  └─ contact/page.tsx
│  │  │  │  ├─ (admin)/admin/       # 管理端路由组
│  │  │  │  │  ├─ layout.tsx        # 侧边栏 + 鉴权守卫
│  │  │  │  │  ├─ login/page.tsx
│  │  │  │  │  ├─ dashboard/page.tsx
│  │  │  │  │  ├─ posts/…           # 列表 / 新建 / 编辑
│  │  │  │  │  ├─ projects/…
│  │  │  │  │  ├─ skills/…
│  │  │  │  │  ├─ profile/…
│  │  │  │  │  └─ media/page.tsx
│  │  │  │  ├─ api/revalidate/route.ts   # 内部重验证入口（签名校验）
│  │  │  │  ├─ rss.xml/route.ts
│  │  │  │  ├─ sitemap.ts
│  │  │  │  ├─ robots.ts
│  │  │  │  ├─ not-found.tsx
│  │  │  │  └─ globals.css
│  │  │  ├─ components/
│  │  │  │  ├─ ui/                  # Button/Input/Card/Dialog/Tabs/Toast…
│  │  │  │  ├─ layout/              # Header/MobileDrawer/Footer/Container
│  │  │  │  ├─ background/          # StarField(Canvas)/StarFieldFallback
│  │  │  │  ├─ sections/            # Hero/Skills/FeaturedProjects/LatestPosts/Contact
│  │  │  │  ├─ content/             # MarkdownRenderer/Toc/CodeBlock/ProjectCard
│  │  │  │  └─ admin/               # 编辑器/上传器/表单
│  │  │  ├─ lib/
│  │  │  │  ├─ api.ts               # fetch 封装（超时/重试/错误归一）
│  │  │  │  ├─ seo.ts               # metadata / JSON-LD 构造
│  │  │  │  ├─ markdown.ts          # remark/rehype/shiki 管线
│  │  │  │  └─ hooks/
│  │  │  └─ styles/tokens.css
│  │  ├─ public/
│  │  └─ next.config.ts
│  └─ api/                          # NestJS 后端
│     ├─ src/
│     │  ├─ main.ts                 # 启动、全局管道、CORS、日志
│     │  ├─ app.module.ts
│     │  ├─ common/
│     │  │  ├─ filters/             # 全局异常过滤器
│     │  │  ├─ interceptors/        # 响应包装、耗时日志
│     │  │  ├─ guards/              # JwtGuard / RolesGuard
│     │  │  ├─ decorators/
│     │  │  └─ utils/
│     │  ├─ modules/
│     │  │  ├─ auth/                # 登录、刷新、登出、CSRF
│     │  │  ├─ profile/             # 个人信息、社交链接、经历
│     │  │  ├─ skills/              # 技能分组与条目
│     │  │  ├─ projects/
│     │  │  ├─ posts/               # 文章、标签、修订、预览
│     │  │  ├─ media/               # 上传、转码、删除
│     │  │  ├─ stats/               # 浏览量、访问统计
│     │  │  ├─ contact/             # 联系表单 + 防刷
│     │  │  └─ revalidate/          # 通知前端失效
│     │  └─ prisma/prisma.service.ts
│     ├─ prisma/
│     │  ├─ schema.prisma
│     │  ├─ migrations/
│     │  └─ seed.ts
│     └─ test/
├─ packages/
│  ├─ shared/                       # 前后端共享
│  │  ├─ src/types/                 # 实体 DTO 类型
│  │  ├─ src/schemas/               # Zod schema（单一真相源）
│  │  └─ src/constants/
│  └─ config/                       # eslint / tsconfig / prettier 共享配置
├─ docker/
│  ├─ Dockerfile.web
│  ├─ Dockerfile.api
│  └─ compose.yml
├─ docs/
│  ├─ PRD.md
│  └─ TECH_DESIGN.md
└─ package.json
```

### 3.1 目录约定

- 公开页面与后台用路由组 `(site)` / `(admin)` 隔离，后台布局单独挂鉴权守卫，避免公开页面误引入后台依赖。
- 组件按「复用层级」分目录，而非按页面分：`ui` 无业务、`sections` 有业务、`admin` 仅后台使用。
- API 的每个模块内部统一为 `controller / service / repository / dto`，`repository` 只做 Prisma 调用，便于替换与测试。
- 类型与校验以 `packages/shared` 为唯一来源，前端表单与后端 DTO 引用同一 Zod schema，避免双份定义漂移。

### 3.2 命名规范

| 类型 | 规范 | 示例 |
| --- | --- | --- |
| 组件/类 | PascalCase | `ProjectCard.tsx`、`PostsService` |
| 函数/变量 | camelCase | `formatReadingTime` |
| 文件（非组件） | kebab-case | `markdown.ts`、`slug-history.ts` |
| 数据库表 | snake_case 复数 | `posts`、`project_tech_tags` |
| 数据库列 | snake_case | `published_at` |
| API 路径 | kebab-case 复数 | `/api/v1/projects` |
| 环境变量 | 大写 + 前缀 | `DATABASE_URL`、`JWT_SECRET` |

---

## 4. 数据模型

### 4.1 ER 关系

```mermaid
erDiagram
    users ||--o{ refresh_tokens : has
    users ||--o{ posts : authors
    skill_groups ||--o{ skills : contains
    posts ||--o{ post_tags : has
    tags ||--o{ post_tags : has
    projects ||--o{ project_tech_tags : has
    tech_tags ||--o{ project_tech_tags : has
    posts ||--o{ post_revisions : keeps
    posts ||--o{ slug_redirects : may_have
    projects ||--o{ slug_redirects : may_have
    media ||--o{ posts : cover
    media ||--o{ projects : cover
```

### 4.2 表清单

| 表 | 用途 | 预计量级 |
| --- | --- | --- |
| `users` | 管理员账号 | 1–3 |
| `refresh_tokens` | 刷新令牌（哈希存储） | 数十 |
| `profiles` | 个人信息（单行） | 1 |
| `social_links` | 社交链接 | 5–10 |
| `experiences` | 工作/教育经历 | 5–20 |
| `skill_groups` | 技能分类 | 3–6 |
| `skills` | 技能条目 | 10–30 |
| `projects` | 项目 | 5–50 |
| `tech_tags` | 技术栈标签 | 20–60 |
| `project_tech_tags` | 项目-技术栈关联 | 100–300 |
| `posts` | 文章 | 20–500 |
| `tags` | 文章标签 | 10–50 |
| `post_tags` | 文章-标签关联 | 100–1500 |
| `post_revisions` | 文章历史版本 | 数百 |
| `slug_redirects` | 旧链接 301 映射 | 少量 |
| `media` | 图片/附件元数据 | 数百 |
| `contact_messages` | 联系表单留言 | 少量 |
| `post_views` | 浏览去重记录（可选） | 数万 |
| `revalidate_jobs` | 缓存失效任务 | 少量 |
| `site_settings` | 键值配置 | 10–30 |

### 4.3 核心字段设计

#### users

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| id | BIGINT UNSIGNED | PK, AUTO_INCREMENT | |
| username | VARCHAR(50) | UNIQUE, NOT NULL | 登录名 |
| email | VARCHAR(120) | UNIQUE, NOT NULL | |
| password_hash | VARCHAR(255) | NOT NULL | Argon2id |
| display_name | VARCHAR(50) | NOT NULL | |
| avatar_url | VARCHAR(500) | NULL | |
| role | ENUM('owner','editor') | DEFAULT 'owner' | 本期仅 owner |
| last_login_at | DATETIME(3) | NULL | |
| created_at / updated_at | DATETIME(3) | NOT NULL | UTC |
| deleted_at | DATETIME(3) | NULL | 软删除 |

#### posts

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| id | BIGINT UNSIGNED | PK | |
| slug | VARCHAR(160) | UNIQUE, NOT NULL | URL，小写短横线 |
| title | VARCHAR(200) | NOT NULL | |
| summary | VARCHAR(300) | NOT NULL | 列表摘要 / meta description |
| body_md | MEDIUMTEXT | NOT NULL | Markdown 原文 |
| cover_media_id | BIGINT UNSIGNED | FK → media.id, NULL | |
| author_id | BIGINT UNSIGNED | FK → users.id | |
| status | ENUM('draft','published','archived') | DEFAULT 'draft' | |
| pinned | TINYINT(1) | DEFAULT 0 | 置顶 |
| reading_time | SMALLINT UNSIGNED | DEFAULT 0 | 分钟，保存时计算 |
| word_count | INT UNSIGNED | DEFAULT 0 | |
| view_count | BIGINT UNSIGNED | DEFAULT 0 | 冗余计数 |
| published_at | DATETIME(3) | NULL | 首次发布时间 |
| created_at / updated_at | DATETIME(3) | NOT NULL | |
| deleted_at | DATETIME(3) | NULL | 软删除时改写 slug 释放唯一键 |

索引：

- `UNIQUE KEY uk_posts_slug (slug)`
- `KEY idx_posts_status_published (status, published_at DESC)` — 列表主查询
- `KEY idx_posts_pinned (pinned, published_at DESC)`
- `FULLTEXT KEY ft_posts (title, summary, body_md) WITH PARSER ngram` — 中文搜索

#### projects

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| id | BIGINT UNSIGNED | PK | |
| slug | VARCHAR(160) | UNIQUE | |
| title | VARCHAR(200) | NOT NULL | |
| summary | VARCHAR(300) | NOT NULL | 一句话简介 |
| body_md | MEDIUMTEXT | NOT NULL | 详情正文 |
| cover_media_id | BIGINT UNSIGNED | FK → media.id, NULL | |
| cover_blurhash | VARCHAR(100) | NULL | 占位图 |
| role | VARCHAR(100) | NULL | 我的角色 |
| year | SMALLINT | NOT NULL | |
| status | ENUM('live','oss','archived') | DEFAULT 'live' | |
| featured | TINYINT(1) | DEFAULT 0 | 首页精选 |
| demo_url / repo_url | VARCHAR(500) | NULL | |
| sort_order | INT | DEFAULT 0 | 手动排序 |
| view_count | BIGINT UNSIGNED | DEFAULT 0 | |
| created_at / updated_at / deleted_at | DATETIME(3) | | |

索引：`UNIQUE uk_projects_slug (slug)`、`KEY idx_projects_featured (featured, sort_order)`、`KEY idx_projects_year (year DESC)`。

#### skills / skill_groups

`skill_groups(id, name, sort_order)`；`skills(id, group_id FK, name, level ENUM('proficient','familiar','learning'), note VARCHAR(200), icon VARCHAR(50), sort_order)`。

索引：`KEY idx_skills_group (group_id, sort_order)`。

#### tags / post_tags / tech_tags / project_tech_tags

- `tags(id, name VARCHAR(50) UNIQUE, slug VARCHAR(60) UNIQUE, post_count INT DEFAULT 0)`
- `post_tags(post_id, tag_id, PRIMARY KEY(post_id, tag_id), KEY idx_post_tags_tag (tag_id))`
- `tech_tags(id, name VARCHAR(50) UNIQUE, slug VARCHAR(60) UNIQUE)`
- `project_tech_tags(project_id, tech_tag_id, PRIMARY KEY(project_id, tech_tag_id))`

#### profiles / social_links / experiences

- `profiles(id, name, handle, headline, bio_md TEXT, avatar_media_id, location, status_label, status_available TINYINT, email, resume_url, updated_at)` 单行表（`id = 1`）。
- `social_links(id, label, href, icon, sort_order, visible)`。
- `experiences(id, company, role, start_date DATE, end_date DATE NULL, summary VARCHAR(500), kind ENUM('work','education'), sort_order, visible)`，`end_date IS NULL` 表示「至今」。

#### media

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | BIGINT UNSIGNED PK | |
| storage_key | VARCHAR(300) UNIQUE | 对象存储路径 |
| url | VARCHAR(500) | 对外访问地址 |
| mime | VARCHAR(80) | 白名单校验 |
| size | INT UNSIGNED | 字节 |
| width / height | INT UNSIGNED | |
| blurhash | VARCHAR(100) | 占位 |
| checksum | CHAR(64) | SHA-256，去重 |
| alt | VARCHAR(200) | 无障碍文本 |
| created_by | BIGINT UNSIGNED | |
| created_at | DATETIME(3) | |

#### 其他

- `contact_messages(id, name VARCHAR(50), email VARCHAR(120), subject VARCHAR(120), content TEXT, ip_hash CHAR(64), status ENUM('new','read','replied','spam'), created_at)`
- `slug_redirects(id, entity_type ENUM('post','project'), old_slug VARCHAR(160) UNIQUE, new_slug VARCHAR(160), created_at)`
- `post_revisions(id, post_id, title, body_md, editor_id, created_at)`，每篇文章保留最近 20 条
- `revalidate_jobs(id, target_tag VARCHAR(120), payload JSON, attempts TINYINT, status ENUM('pending','done','failed'), next_run_at DATETIME(3), created_at)`
- `site_settings(setting_key VARCHAR(60) PK, value JSON, updated_at)`

### 4.4 Prisma 模型（节选）

```prisma
model Post {
  id          BigInt    @id @default(autoincrement())
  slug        String    @unique @db.VarChar(160)
  title       String    @db.VarChar(200)
  summary     String    @db.VarChar(300)
  bodyMd      String    @map("body_md") @db.MediumText
  coverId     BigInt?   @map("cover_media_id")
  authorId    BigInt    @map("author_id")
  status      PostStatus @default(DRAFT)
  pinned      Boolean   @default(false)
  readingTime Int       @default(0) @map("reading_time") @db.UnsignedSmallInt
  wordCount   Int       @default(0) @map("word_count") @db.UnsignedInt
  viewCount   BigInt    @default(0) @map("view_count") @db.UnsignedBigInt
  publishedAt DateTime? @map("published_at") @db.DateTime(3)
  createdAt   DateTime  @default(now()) @map("created_at") @db.DateTime(3)
  updatedAt   DateTime  @updatedAt @map("updated_at") @db.DateTime(3)
  deletedAt   DateTime? @map("deleted_at") @db.DateTime(3)

  cover  Media?   @relation(fields: [coverId], references: [id])
  author User     @relation(fields: [authorId], references: [id])
  tags   PostTag[]

  @@index([status, publishedAt(sort: Desc)], name: "idx_posts_status_published")
  @@map("posts")
}

enum PostStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}
```

### 4.5 数据库约定

1. **字符集**：库、表、连接统一 `utf8mb4` / `utf8mb4_0900_ai_ci`。
2. **时间**：全部存 UTC（`DATETIME(3)`），应用层按 `Asia/Shanghai` 渲染；禁止存本地时间字符串。
3. **主键**：业务表用 `BIGINT UNSIGNED AUTO_INCREMENT`；不暴露连续 ID 给前端时用 slug 路由。
4. **软删除**：内容表保留 `deleted_at`；删除时把 `slug` 改写为 `{slug}-del-{id}`，释放唯一键并保留 301 能力。
5. **计数冗余**：`post_count`、`view_count` 为冗余字段，写入时在同一事务内维护，定期用聚合 SQL 校准。
6. **迁移**：只用 Prisma Migrate 或带版本号的手写 SQL，禁止手工改线上表结构；每个迁移必须可回滚或有对应回滚说明。
7. **索引原则**：所有列表查询必须有覆盖排序的联合索引；禁止 `SELECT *` 取正文列用于列表页（`body_md` 单独查）。
8. **JSON 使用**：仅用于结构不固定的配置（`site_settings.value`、`revalidate_jobs.payload`），可检索字段必须建列。

---

## 5. API 设计

### 5.1 约定

- 基础路径 `/api/v1`，全部 `application/json; charset=utf-8`。
- 成功：`{ "data": ..., "meta": { "page": 1, "pageSize": 10, "total": 42 } }`。
- 失败：RFC 7807 `application/problem+json`，含 `type / title / status / detail / instance`，`detail` 不暴露堆栈。
- 分页：`?page=1&pageSize=10`，`pageSize` 上限 50；深分页（> 100 页）改游标 `?cursor=`。
- 排序：`?sort=published_at:desc`，白名单字段。
- 时间：ISO 8601 UTC（`2026-10-20T06:00:00.000Z`）。

### 5.2 公开接口

| 方法 | 路径 | 说明 | 缓存 |
| --- | --- | --- | --- |
| GET | `/site` | 个人信息、社交链接、站点配置 | 60s + SWR |
| GET | `/experiences` | 经历时间线 | 300s |
| GET | `/skills` | 技能分类与条目 | 300s |
| GET | `/projects` | 项目列表，支持 `featured`、`tech`、`year`、分页 | 60s |
| GET | `/projects/:slug` | 项目详情 | 60s |
| GET | `/posts` | 文章列表，支持 `tag`、`q`、`pinned`、分页 | 60s |
| GET | `/posts/:slug` | 文章详情（含 TOC、上下篇） | 60s |
| GET | `/posts/:slug/preview?token=` | 草稿预览（签名 token，10 分钟有效） | no-store |
| GET | `/tags` | 标签及文章数 | 300s |
| POST | `/contact` | 提交留言（限流 + 蜜罐） | no-store |
| POST | `/posts/:slug/view` | 浏览量上报（去重） | no-store |
| GET | `/health` | 健康检查（DB/存储连通） | no-store |

### 5.3 管理接口（需鉴权）

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/auth/login` | 用户名密码登录，下发 Cookie |
| POST | `/auth/refresh` | 轮换刷新令牌 |
| POST | `/auth/logout` | 吊销当前刷新令牌 |
| GET | `/auth/me` | 当前管理员信息 |
| GET/POST/PATCH/DELETE | `/admin/posts`、`/admin/posts/:id` | 文章 CRUD（含发布、归档、置顶） |
| POST | `/admin/posts/:id/restore` | 从修订版本恢复 |
| GET/POST/PATCH/DELETE | `/admin/projects` | 项目 CRUD |
| PUT | `/admin/skills` | 技能分组与条目整体覆盖保存 |
| PUT | `/admin/profile` | 个人信息与社交链接 |
| PUT | `/admin/experiences` | 经历列表整体保存 |
| GET/POST/DELETE | `/admin/media`、`/admin/media/:id` | 上传、列表、删除（magic bytes 校验；软删 + 引用检查，被引用返回 409） |
| GET/PATCH | `/admin/contact-messages`、`/admin/contact-messages/:id` | 联系留言收件箱与状态流转（NEW / READ / REPLIED / SPAM） |
| GET | `/admin/stats/overview` | 浏览量、文章数、留言数 |
| POST | `/admin/revalidate` | 手动触发页面失效（排障用，失败写入重试任务） |

### 5.4 鉴权流程

1. `POST /auth/login` 校验 Argon2id 哈希 → 签发 Access Token（15 分钟，JWT）+ Refresh Token（7 天，随机 256bit）。
2. 两个 Token 均写入 `httpOnly; Secure; SameSite=Lax; Path=/` Cookie；Refresh Token 的 SHA-256 哈希存 `refresh_tokens` 表，附带 UA 与 IP 段。
3. 受保护请求：NestJS 全局 `JwtGuard` 校验 Access Token；写操作额外校验 `X-CSRF-Token` 头（双提交 Cookie 模式）。
4. `POST /auth/refresh`：校验 Refresh 有效性 → 旧令牌标记 `revoked_at` → 签发新对（令牌轮换，检测重放）。
5. 登录失败 5 次锁定 15 分钟（按用户名 + IP），失败响应统一文案，不区分「用户不存在/密码错误」。

---

## 6. 关键技术点与难点

### 6.1 SEO 与按需静态化的一致性

**问题**：内容在数据库里，页面是静态生成的。发布后若不失效，访客看到旧内容；若全站关闭缓存，首屏性能不达标。

**方案**：
- 公开页面用 `generateStaticParams` + ISR，默认 `revalidate = 3600` 兜底。
- 写入成功后按 tag 精确失效：文章 → `post:{slug}` + `posts:list` + `tag:{name}` + `sitemap`。
- 失效失败进入 `revalidate_jobs` 重试，保证最终一致。
- `sitemap.xml` 与 `rss.xml` 从 API 读取并缓存 10 分钟，不参与页面构建。
- 上线前用 `curl -I` 验证：HTML 为 200 且含完整正文，而非空壳。

### 6.2 Markdown 渲染与 XSS（重点）

**问题**：正文来自数据库，若直接 `dangerouslySetInnerHTML` 或运行时执行 MDX，等于把 XSS 入口交给任何能写内容的人；日后若开放投稿会直接失守。

**方案**：
- **只用 Markdown，不用 MDX**。Markdown 经 `remark → rehype → rehype-sanitize` 白名单清洗后输出 HTML。
- 禁止原始 HTML（`rehype-raw` 不启用）；确需嵌入视频/代码演示，用受控的自定义指令（如 `:::demo{src=...}`），由前端白名单组件渲染。
- 链接强制 `target="_blank" rel="noopener noreferrer nofollow"`（站内链接除外）；`javascript:`、`data:` 协议一律过滤。
- 代码高亮在服务端用 Shiki 生成，输出纯 HTML 与内联样式，不接受用户提供的主题。
- 图片 `src` 仅允许本站对象存储域名或白名单外链。
- 后台预览与前台渲染共用同一管线，避免「预览正常、上线被注入」。

### 6.3 星空背景的性能与 React 集成

**问题**：Canvas 粒子在 React 里用 state 驱动会每帧触发渲染；高分屏 DPR 放大导致填充率飙升；移动端滚动时掉帧、耗电。

**方案**：
- 星空作为**单个客户端组件**，`useRef` 持有 canvas 与粒子数组，动画循环完全在 `requestAnimationFrame` 内操作，**不进入 React 状态**。
- `devicePixelRatio` 上限 2；粒子数量按 `min(面积系数, 上限)` 计算（移动端 120、桌面 250）。
- `visibilitychange` 暂停；连续 3 秒无滚动/交互降帧至 30fps；离开视口 `IntersectionObserver` 停止。
- 尊重 `prefers-reduced-motion`：不启动动画，绘制一帧静态星空后停止。
- SSR 阶段不渲染 canvas 内容，组件挂载后再初始化，避免 hydration mismatch；noscript 与降级路径使用预生成 WebP 纹理。
- 页面滚动与视差只读 `scrollY`，用 `transform` 位移，不触发重排；禁止监听 `mousemove` 做全局跟随（移动端不绑定）。
- 验收：Chrome Performance 面板下中端机滚动 ≥ 50fps，主线程脚本占用 ≤ 2%。

### 6.4 首屏性能预算

**问题**：Next.js + 后台 + 动效容易把首屏 JS 推到 300KB 以上。

**方案**：
- 首页正文、项目卡片、文章列表全部 Server Component；仅导航抽屉、星空、复制按钮、灯箱为客户端组件。
- 路由级代码分割；后台管理端整体 `dynamic import`，公开页面不加载编辑器与图表库。
- 字体：`next/font` 自托管 + 子集化（仅常用汉字 + 拉丁），`display: swap`，最多 2 个字族 4 个字重。
- 图片：`next/image` + AVIF/WebP + 明确宽高 + `priority` 仅给首屏封面，其余懒加载。
- 第三方脚本：统计脚本 `defer` 且仅生产环境加载；首版不引入任何分析 SDK 之外的第三方。
- CI 中加入体积检查：首屏 JS gzip > 150KB 时构建失败。

### 6.5 中文全文搜索

**问题**：MySQL 默认分词对中文无效，`LIKE '%关键词%'` 无法走索引且不支持多词。

**方案**：
- 建 `FULLTEXT ... WITH PARSER ngram`，`ngram_token_size = 2`（需在 MySQL 配置中设置并重启）。
- 查询用 `MATCH(title, summary, body_md) AGAINST (? IN BOOLEAN MODE)`，按相关度排序，摘要用 `ts_headline` 的等价实现（应用层截取关键词前后各 40 字并高亮）。
- 英文/数字混排时 ngram 会把单词切碎，降级策略：先 `MATCH` 取候选集，再用应用层 `includes` 精排；或对英文单独走 `LIKE` 并合并结果。
- 数据量 < 1000 篇时可直接在构建/请求层做内存索引（`title + summary` 数组），简单可靠；超过后再启用 FULLTEXT。
- 搜索结果页 URL 带 `q`，可分享；空结果给出「清除关键词」与热门标签。

### 6.6 图片上传与处理

**问题**：用户上传的图片可能超大、格式伪造、带 EXIF 隐私信息，或 SVG 携带脚本。

**方案**：
- 校验顺序：文件大小（≤ 10MB）→ 扩展名白名单（jpg/png/webp/avif）→ **magic bytes 真实类型**→ 解码成功。
- 拒绝 SVG 上传（或强制走 sanitize 并转为 PNG）；移除 EXIF/GPS。
- `sharp` 生成 3 档尺寸（400/800/1600 宽）+ AVIF/WebP，保留原图；按内容 SHA-256 去重，避免重复存储。
- 生成 16×16 缩略图计算 blurhash，随记录返回，前端用于占位。
- 上传走 API 中转（后端校验 + 转码）而非前端直传，首版简单优先；日后再改直传 + 服务端回调校验。
- 对象存储路径：`{env}/{yyyy}/{mm}/{sha256前2位}/{sha256}.{ext}`，文件名不含用户输入。
- 删除采用软删 + 引用检查（被文章/项目引用时禁止删除，返回 409）。

### 6.7 缓存与失效

**问题**：个人站读多写少，但浏览量、留言提交等动态数据不能缓存；过期策略不当会出现「发布后半小时才可见」。

**方案**：
- 分三层：CDN/浏览器（图片、静态资源）→ Next.js 数据缓存（页面）→ API 层短缓存（`s-maxage=60`）。
- 缓存 key 包含查询参数与语言；后台与预览请求带 `no-store`。
- 失效只做 tag 级，不做全站清空；每次内容写入只失效相关 tag。
- 浏览量不参与缓存，前端上报后异步更新；API 返回的 `view_count` 允许滞后。
- 提供 `POST /admin/revalidate` 用于人工兜底。

### 6.8 浏览量并发与防刷

**问题**：每次刷新 `view_count + 1` 会产生热点行更新与刷量。

**方案**：
- 去重键：`hash(ip + user-agent + path + 日期)`，存 Redis（TTL 24h）或 `post_views` 表唯一索引；同一访客同一天只计一次。
- 写库用 `UPDATE posts SET view_count = view_count + 1 WHERE id = ?`，事务短、无读改写竞态。
- 高频场景改为内存/Redis 累加，定时批量落库（每 60 秒 flush），宕机最多丢 1 分钟计数（可接受）。
- 爬虫 UA 与已知监控 IP 段不计入。

### 6.9 Slug 变更与旧链接

**问题**：标题修改导致 slug 变化，已有外链 404，SEO 权重丢失。

**方案**：
- 保存时若 slug 变化：写 `slug_redirects(old_slug → new_slug)`，前端路由先查重定向表返回 308/301。
- slug 只允许小写字母、数字、短横线，长度 ≤ 160；生成时用标题 transliterate 或手填，重复则追加 `-2`。
- 删除内容时保留 redirect 指向列表页，避免死链。
- 定期扫描 `slug_redirects` 中的链式跳转并压平（A→B→C 改为 A→C）。

### 6.10 深色主题与对比度

**问题**：星空粒子、渐变文字、半透明卡片叠加后，正文对比度可能跌破 WCAG AA。

**方案**：
- 正文容器强制 `background: rgba(7,10,18,0.72)` + `backdrop-filter: blur(8px)`，星空只在容器外可见。
- 设计 Token 用 CSS 变量，构建期跑对比度脚本校验关键组合（正文/次要文本/按钮文字），低于阈值直接报错。
- 禁用 `prefers-color-scheme: light` 覆盖：`<meta name="color-scheme" content="dark">` + `color-scheme: dark`。
- 表单控件、滚动条、`::selection` 统一深色样式，避免系统默认白底。
- 焦点环 2px `--accent` + 2px offset，深色背景下可见。

### 6.11 响应式与触摸设备

**问题**：桌面 hover 效果在触摸屏上「点一下才出现且不消失」；iOS 输入框字号 < 16px 会触发页面缩放。

**方案**：
- 交互态用 `@media (hover: hover)` 包裹，触摸设备改用 `:active` 反馈。
- 移动端抽屉：锁定 body 滚动、焦点陷阱、`Esc` 关闭、关闭后焦点回到触发按钮。
- 所有输入控件字号 ≥ 16px；按钮最小 44×44px。
- 使用 `100svh` 而非 `100vh`，避免移动端地址栏导致 Hero 被裁切。
- 断点按 PRD §5.3 执行，用 `clamp()` 做流式字号，减少硬切换。

### 6.12 时间、时区与日期展示

- 数据库存 UTC，API 输出 ISO 8601；前端统一用 `Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai' })` 渲染。
- 「最后更新于」与「发布于」分开存储，避免修改文章后列表排序被打乱。
- 阅读时长按中文字符 400 字/分钟、英文单词 200 词/分钟估算，保存时计算，不实时算。

### 6.13 数据迁移与备份

- Prisma Migrate 管理结构变更；每次上线前在 staging 库跑一遍迁移 + 回滚脚本。
- 每日 `mysqldump --single-transaction` 全量备份，保留 14 天；每周异地备份一份（对象存储）。
- 备份文件加密后上传；每季度做一次恢复演练并记录耗时。
- 提供内容导出接口（Markdown + frontmatter + 图片清单），保证可迁回静态方案。

### 6.14 部署与安全边界

- Caddy 统一入口，自动签发证书；仅暴露 80/443，MySQL 与 Redis 不映射公网端口。
- 环境变量通过 `.env` + Docker secrets 注入，禁止提交仓库；启动时校验必需变量缺失即退出。
- API 开启 CORS 白名单（仅站点域名与本地开发端口），Cookie 跨站场景设 `SameSite=Lax`。
- 安全响应头：`Content-Security-Policy`（允许 self 与对象存储域）、`X-Content-Type-Options: nosniff`、`Referrer-Policy: strict-origin-when-cross-origin`、`Strict-Transport-Security`。
- 反向代理层限制请求体（上传接口单独放宽到 12MB）与单 IP 速率。
- 日志脱敏：不记录密码、Token、完整 IP（存哈希或截断）。

---

## 7. 非功能性设计

### 7.1 性能目标

| 指标 | 目标 | 手段 |
| --- | --- | --- |
| LCP（4G 中端机） | ≤ 2.0s | 静态 HTML、首屏图 `priority`、字体子集化 |
| INP | ≤ 200ms | 减少客户端组件、长任务拆分 |
| CLS | ≤ 0.05 | 图片固定宽高比、骨架屏、字体 `size-adjust` |
| 首屏 JS（gzip） | ≤ 150KB | RSC、动态导入、体积门禁 |
| API P95 | ≤ 300ms | 索引、避免 N+1、列表不取正文 |
| 首页 TTFB | ≤ 200ms | ISR + CDN |

### 7.2 可用性

- 健康检查 `/health` 同时探测数据库与对象存储；Docker `healthcheck` 失败自动重启。
- 数据库连接池上限按 CPU 核数配置（`connection_limit=10`），Prisma 单实例连接数受控。
- 部署采用「先构建新镜像 → 迁移 → 切换容器」，失败可秒级回滚到上一镜像。
- 静态资源与图片走 CDN，源站故障时页面主体仍可访问。

### 7.3 安全清单

- [ ] 全站 HTTPS，HSTS 开启
- [ ] 密码 Argon2id（memory 64MB、iterations 3）
- [ ] Access Token 15 分钟、Refresh 轮换 + 重放检测
- [ ] 登录与留言接口限流
- [ ] Markdown 白名单清洗，禁用原始 HTML
- [ ] 上传文件 magic bytes 校验，拒绝 SVG
- [ ] 所有 SQL 经 Prisma 参数化，禁止拼接
- [ ] 后台接口鉴权 + CSRF 双提交
- [ ] 依赖漏洞扫描（`pnpm audit` / Dependabot）
- [ ] 错误响应不泄露堆栈与 SQL

### 7.4 可观测性

- 结构化 JSON 日志（请求 ID、耗时、状态码、路由），保留 30 天。
- 慢查询日志：Prisma 中间件记录 > 200ms 的查询。
- 前端错误上报（可选 Sentry 或自建轻量接口），只上报错误类型与堆栈，不采集用户输入。
- 简易监控：外部探针每 5 分钟请求 `/health` 与首页，失败邮件告警。

---

## 8. 部署方案

### 8.1 拓扑

单台 2C4G 云服务器（起步 2C2G 亦可）：

| 容器 | 端口 | 说明 |
| --- | --- | --- |
| caddy | 80/443 | 反代 + 自动 HTTPS |
| web | 3000 | Next.js（`output: 'standalone'`） |
| api | 4000 | NestJS |
| mysql | 3306（仅内网） | MySQL 8，数据卷持久化 |
| redis | 6379（仅内网，可选） | 去重、限流、计数缓冲 |
| backup | — | 定时任务容器，执行 mysqldump 并上传 |

### 8.2 环境变量

```env
# 通用
NODE_ENV=production
APP_URL=https://example.com
API_URL=https://example.com/api
INTERNAL_API_URL=http://api:4000/api/v1
REVALIDATE_SECRET=<32 字节随机>

# 数据库
DATABASE_URL=mysql://user:pass@mysql:3306/myself?connection_limit=10

# 鉴权
JWT_ACCESS_SECRET=<32 字节随机>
JWT_REFRESH_SECRET=<32 字节随机>
COOKIE_DOMAIN=example.com

# 对象存储
S3_ENDPOINT=...
S3_BUCKET=...
S3_ACCESS_KEY=...
S3_SECRET_KEY=...
S3_PUBLIC_BASE=https://cdn.example.com

# 邮件（联系表单通知）
SMTP_HOST=...
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
CONTACT_TO=...
```

### 8.3 发布流程

1. PR 合入 `main` → GitHub Actions 跑 lint、单测、构建。
2. 构建 `web` / `api` 镜像并推送到镜像仓库（打 commit SHA 标签）。
3. SSH 到服务器：`docker compose pull && docker compose run --rm api npx prisma migrate deploy`。
4. `docker compose up -d --no-deps web api`，观察 `/health` 与首页 200。
5. 失败则回滚到上一个 SHA 镜像，数据库迁移按预写的回滚脚本处理。
6. 发布后自动跑一次冒烟：首页、项目列表、文章详情、RSS、sitemap、后台登录页。

---

## 9. 测试策略

| 层级 | 工具 | 覆盖重点 |
| --- | --- | --- |
| 单元测试 | Vitest | 日期/阅读时长/slug 生成、Markdown 清洗、TOC 构建、Zod schema |
| API 集成 | Supertest + 测试库 | 鉴权、CRUD、分页边界、软删除、slug 重定向、限流 |
| 组件测试 | Testing Library | 表单校验、导航抽屉焦点管理、星空降级逻辑（mock rAF） |
| E2E | Playwright | 访客浏览全流程、后台发布文章 → 前台可见、移动端视口回归、键盘导航 |
| 视觉回归 | Playwright 截图 | 首页/文章页在 375/768/1440 三档截图对比 |
| 性能 | Lighthouse CI | 四项 ≥ 95，LCP/CLS 预算超标即失败 |
| 安全 | `pnpm audit`、ZAP 基线扫描（可选） | 依赖漏洞、常见头缺失 |

测试数据：使用独立测试库（`myself_test`），每个用例事务回滚或 `TRUNCATE` 重置；禁止连接生产库。

---

## 10. 开发顺序建议

| 阶段 | 内容 | 验收 |
| --- | --- | --- |
| 1 | Monorepo 脚手架、Docker Compose、MySQL 连接、Prisma 初始迁移 | 本地一条命令起全栈 |
| 2 | 设计 Token、布局、导航、星空组件 | 三档视口无横向滚动，星空降级可用 |
| 3 | 公开首页（Profile / Skills / Featured / Latest） | 数据来自 API，SSG 输出完整 HTML |
| 4 | 项目列表与详情、标签筛选 | 筛选状态入 URL，刷新保留 |
| 5 | 文章列表/详情、Markdown 管线、TOC、代码高亮、RSS、sitemap | 移动端长文无溢出，SEO 结构化数据通过校验 |
| 6 | 后台登录、文章/项目/技能/资料编辑、图片上传 | 发布后前台 5 秒内可见 |
| 7 | 浏览量、联系表单、统计概览 | 去重生效，留言可达邮箱 |
| 8 | 性能与无障碍打磨、备份、监控、上线 | PRD §10 验收清单全部通过 |

---

## 11. 风险与备选

| 风险 | 影响 | 应对 |
| --- | --- | --- |
| 后端与数据库增加运维负担 | 单人维护成本上升 | 全部容器化 + 一键部署脚本 + 备份自动化；若仍嫌重，可退回 PRD 的静态方案（数据模型与前端可复用） |
| 服务器单点故障 | 站点短时不可用 | 静态页面与图片走 CDN；数据库每日备份；迁移脚本可重建 |
| 中文搜索效果不佳 | 搜索体验差 | 数据量小时用内存索引；后续可加 Meilisearch（接口层已抽象） |
| 图片存储成本与迁移 | 换存储需改代码 | 统一走 S3 协议 + `S3_PUBLIC_BASE` 配置，不写死域名 |
| 后台 XSS / 鉴权漏洞 | 站点被篡改 | Markdown 白名单、CSP、登录限流、Cookie 属性、依赖扫描 |
| 迁移失败导致数据损坏 | 内容丢失 | 迁移前自动快照；`prisma migrate deploy` 前执行备份；保留回滚脚本 |
| 星空组件在低端机掉帧 | 体验与电耗问题 | 数量上限、降帧、静态降级、可配置关闭开关 |

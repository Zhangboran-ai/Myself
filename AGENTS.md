# AGENTS.md

> 本文件面向在本仓库工作的 AI 编码助手（以及人类开发者）。开始任何任务前请完整阅读，它与代码同等重要。
>
> 项目当前处于**文档阶段**，代码尚未初始化。脚手架落地后，本文件中的命令与目录约定应验证一次并保持同步。

---

## 1. 项目概述

### 1.1 是什么

一个深色星空主题的个人展示网站，用于呈现站主的身份、技能、项目与文章，并承担个人品牌与 SEO 入口的作用。

四大内容模块：

| 模块 | 路由 | 核心内容 |
| --- | --- | --- |
| 个人介绍 | `/`、`/about` | Hero、简介、经历时间线、联系方式、简历下载 |
| 技能展示 | 首页区块 | 分类 + 条目 + 等级（熟练/熟悉/了解）+ 关联项目 |
| 项目展示 | `/projects`、`/projects/[slug]` | 卡片列表、技术栈筛选、详情页 |
| 博客 | `/blog`、`/blog/[slug]`、`/blog/tags/[tag]` | 列表、详情、TOC、代码高亮、RSS |

管理端 `/admin` 仅站主使用，负责内容维护，不做多用户与权限体系。

### 1.2 技术栈（不可随意替换）

| 层 | 选型 |
| --- | --- |
| 前端 | Next.js（App Router）+ React 19 + TypeScript + Tailwind CSS v4 + Radix UI |
| 星空 | 原生 Canvas 2D，自研组件，不引入粒子库 |
| 后端 | NestJS 11 + Fastify adapter |
| 数据库 | MySQL 8（utf8mb4）+ Prisma |
| 校验 | Zod（`packages/shared`，前后端共用） |
| 存储 | S3 兼容对象存储 + sharp |
| 部署 | Docker Compose + Caddy |

### 1.3 必读文档

| 文档 | 用途 |
| --- | --- |
| [`docs/PRD.md`](docs/PRD.md) | 产品需求、交互、设计要点、验收清单 |
| [`docs/TECH_DESIGN.md`](docs/TECH_DESIGN.md) | 架构、数据模型、API、技术难点与方案 |

**优先级规则**：

1. 用户当前的明确指令优先于文档。
2. 需求冲突时以 PRD 为准；技术实现冲突时以 TECH_DESIGN 为准。
3. 本文件的编码规范与测试要求优先于个人偏好。
4. 发现文档之间矛盾时，**先指出矛盾并给出建议，不要沉默地二选一**。

---

## 2. 开工前的固定动作

1. 读相关文档章节，确认需求属于哪个模块、优先级是 P0/P1/P2。
2. 检查现有实现，避免重复造轮子；搜索已有组件、工具函数、类型。
3. 明确本次改动的边界，**只做被要求的事**，不顺带重构无关代码。
4. 涉及数据结构或公共接口时，先说明方案再动手。
5. 完成实现后按第 9 节自检，再汇报结果。

不允许的行为：

- 未读文档就凭常识发明需求。
- 为了让测试通过而删除或跳过测试。
- 大量改动后不说明影响范围。
- 用 `--no-verify`、`--force`、`git reset --hard` 等破坏性手段绕过问题。

---

## 3. 仓库结构与边界

```
apps/web          Next.js 前端（公开站点 + /admin）
apps/api          NestJS 后端
packages/shared   共享类型、Zod schema、常量
packages/config   eslint / tsconfig / prettier 共享配置
docker/           Dockerfile 与 compose
docs/             PRD、技术设计
```

边界规则：

- `apps/web` 与 `apps/api` **不得互相直接 import 源码**，只能通过 `packages/shared` 共享类型与校验，通过 HTTP 通信。
- `packages/shared` **不得依赖** React、NestJS、Prisma 或任何运行时框架。
- `apps/web/src/components/ui` 只放无业务语义的通用组件；业务区块放 `components/sections`；后台专用组件放 `components/admin`。
- `apps/api` 的每个模块内部分层固定为 `controller → service → repository`：
  - controller 只做参数接收、鉴权注解、调用 service，不写业务逻辑。
  - service 承载业务规则与事务边界。
  - repository 只做 Prisma 调用，不抛业务异常。
- 公开页面与后台通过路由组 `(site)` / `(admin)` 隔离，公开页面不得引入后台依赖。

---

## 4. 开发规范

### 4.1 环境与命令

- Node.js ≥ 22（推荐当前 LTS），pnpm ≥ 9，Docker Desktop。
- Windows + PowerShell 环境，**给出的命令必须能在 PowerShell 下直接运行**；不要假设 `bash`、`grep`、`&&` 链式写法一定可用（PowerShell 5 不支持 `&&`，7+ 支持）。
- 运行命令前先确认 `package.json` 中是否存在对应 script，不要臆造命令。

预期命令（脚手架完成后落地）：

| 用途 | 命令 |
| --- | --- |
| 安装依赖 | `pnpm install` |
| 启动全栈 | `docker compose -f docker/compose.yml up -d` |
| 前端开发 | `pnpm --filter web dev` |
| 后端开发 | `pnpm --filter api start:dev` |
| 类型检查 | `pnpm typecheck` |
| Lint | `pnpm lint` |
| 单测 | `pnpm test` |
| E2E | `pnpm test:e2e` |
| 数据库迁移（本地） | `pnpm --filter api prisma migrate dev --name <name>` |
| 数据库迁移（部署） | `pnpm --filter api prisma migrate deploy` |
| 生成 Prisma Client | `pnpm --filter api prisma generate` |

### 4.2 分支与提交

- 分支：`feat/<简短描述>`、`fix/<简短描述>`、`chore/<简短描述>`、`docs/<简短描述>`。
- 提交信息遵循 Conventional Commits：`feat(blog): 增加文章目录折叠`、`fix(auth): 修正刷新令牌重放检测`。
- 一个提交只做一件事；格式化与业务改动分开提交。
- 不提交生成的产物：`.next/`、`dist/`、`node_modules/`、Prisma Client、上传的临时文件。
- 不提交任何 `.env`、密钥、Token、生产数据库连接串。

### 4.3 依赖管理

- 新增依赖前必须说明理由，并优先检查是否已有同类库。
- 禁止同时存在两个解决同一问题的库（如同时装 `date-fns` 与 `dayjs`）。
- 前端依赖需评估体积：单库 gzip 后 > 30KB 需明确论证；首屏 JS 总量不得超过 150KB（gzip）。
- UI 组件优先用 Radix 基座自研，不引入整套组件库（Ant Design / MUI 等）。
- 星空白名单：只用原生 Canvas，不引入 `tsparticles`、`three` 等重库。
- 依赖升级单独提交，不与功能混在一起。

### 4.4 API 约定

- 基础路径 `/api/v1`，资源名用复数 kebab-case：`/posts`、`/projects`、`/tech-tags`。
- 成功响应：`{ "data": ..., "meta"?: { page, pageSize, total } }`。
- 失败响应：RFC 7807 `application/problem+json`，字段 `type / title / status / detail / instance`。
- 错误码使用 HTTP 语义：400 参数、401 未登录、403 无权限、404 不存在、409 冲突、422 业务校验失败、429 限流、500 服务端。
- **禁止**在响应中返回堆栈、SQL、内部路径、字段名明细。
- 时间统一 ISO 8601 UTC 字符串；数据库存 UTC，展示层转 `Asia/Shanghai`。
- 分页参数 `page` / `pageSize`（上限 50）；深分页改游标，不用超大 offset。
- 公开接口必须有明确的缓存头；后台接口 `Cache-Control: no-store`。
- 新增或修改接口时同步更新 TECH_DESIGN §5 与 Swagger 注解。

### 4.5 数据库与迁移

- 只用 Prisma Migrate 管理结构；**禁止手工改线上表结构**。
- 已提交的迁移文件不可修改，需要调整时新增迁移。
- 每个迁移必须可回滚或有明确回滚说明；破坏性变更（删列、改类型）需先备份并说明。
- 所有表必须有 `created_at` / `updated_at`；内容表另有 `deleted_at`。
- 命名：表 snake_case 复数，列 snake_case，Prisma 字段 camelCase + `@map`。
- 字符串字段长度必须显式声明（`@db.VarChar(n)`），不使用无长度 `VARCHAR`。
- 列表查询必须走索引；新增查询前用 `EXPLAIN` 确认，禁止全表扫描取正文列。
- 事务只包裹必要的写操作，不在事务内做 HTTP 请求、文件上传或邮件发送。
- 软删除时按 TECH_DESIGN §4.5 改写 slug 释放唯一键，禁止直接物理删除内容。

### 4.6 内容与 Markdown

- 内容存储格式为 **Markdown**，禁止运行时 MDX。
- 渲染管线固定为 `remark → rehype → rehype-sanitize → Shiki`，白名单清洗后才输出 HTML。
- 不启用 `rehype-raw`；禁止 `dangerouslySetInnerHTML` 直接渲染未清洗内容。
- 链接统一加 `rel="noopener noreferrer"`；`javascript:`、`data:` 协议在清洗阶段移除。
- 图片域名白名单：本站对象存储域名 + 明确配置的外链域名。
- 前后台必须共用同一套渲染管线，不允许后台预览另写一套。

---

## 5. 代码风格

### 5.1 TypeScript

- `strict: true`，禁止 `any`；确实无法推导时用 `unknown` + 类型守卫。
- 公共函数、导出类型必须有显式返回类型；内部实现可依赖推导。
- 优先 `type` 定义联合/映射，`interface` 用于可扩展的对象契约。
- 禁止非空断言 `!` 滥用；用显式判空或提前抛错。
- 禁止 `@ts-ignore`；确需抑制用 `@ts-expect-error` 并写明原因。
- 枚举值统一大写或小写常量，前后端共享定义放 `packages/shared`。
- 金额/计数等大整数注意 Prisma `BigInt` 无法被 `JSON.stringify` 序列化，必须在序列化层转 `number` 或字符串。

### 5.2 命名

| 对象 | 规范 | 示例 |
| --- | --- | --- |
| 组件 / 类 / 类型 | PascalCase | `ProjectCard`、`PostsService`、`PostStatus` |
| 函数 / 变量 | camelCase，动词开头 | `formatReadingTime`、`revalidatePost` |
| 布尔值 | `is/has/can/should` 前缀 | `isPublished`、`hasCover` |
| 常量 | UPPER_SNAKE_CASE | `MAX_PAGE_SIZE` |
| 文件（组件） | PascalCase | `StarField.tsx` |
| 文件（工具） | kebab-case | `markdown-pipeline.ts` |
| CSS 变量 | `--kebab-case` | `--text-secondary` |
| 数据库 | snake_case | `published_at` |

- 禁止拼音命名、无意义缩写（`tmp`、`data2`、`obj`）。
- 文件名与默认导出名保持一致。

### 5.3 函数与模块

- 单个函数尽量 ≤ 50 行，超过时拆分；嵌套层级 ≤ 3。
- 参数超过 3 个时改用对象参数。
- 纯逻辑（格式化、校验、slug 生成、TOC 构建）必须抽到 `lib/` 或 `shared/`，便于测试。
- 避免隐式副作用；写操作集中在 service 层。
- 删除无用代码，不保留注释掉的旧实现。

### 5.4 注释

- 注释解释「为什么」，不复述「做了什么」。
- 复杂算法、非直觉的边界处理、临时兼容方案必须写注释，并标注 `TODO:` / `FIXME:` 的触发条件与清理时机。
- 不使用表情符号装饰代码注释。
- 对外 API 与复杂类型使用 TSDoc。

### 5.5 React / Next.js

- **服务端优先**：默认 Server Component，只在需要状态、事件、浏览器 API 时加 `'use client'`，且加在最叶子节点。
- 初始数据在服务端获取（RSC 或 `generateMetadata`），禁止用 `useEffect` 在客户端拉首屏数据。
- 列表 `key` 用稳定业务 ID，不用数组下标。
- 不滥用 `useMemo` / `useCallback`；仅在测量到性能问题或依赖稳定性必要时使用。
- 所有 `<img>` 用 `next/image` 或明确说明原因；图片必须有宽高比，避免 CLS。
- 表单校验复用 `packages/shared` 的 Zod schema，不重复写规则。
- 路由参数、查询参数必须校验后再使用。
- 不在组件内拼接 API 基础地址，统一走 `lib/api.ts`。

### 5.6 NestJS

- controller 方法保持 5 行以内，只做参数与调用。
- DTO 用 Zod schema + `nestjs-zod`（或等价方案）生成，不手写重复校验。
- 异常统一抛 Nest 内置 `HttpException` 子类，由全局过滤器转 problem+json。
- 守卫只做鉴权判断，不查业务数据；业务校验放 service。
- 日志用注入的 Logger，禁止裸 `console.log`；日志不打印密码、Token、完整 IP。

### 5.7 样式

- 颜色、间距、圆角、阴影、动效曲线**只能取自设计 Token**（`styles/tokens.css`），禁止硬编码十六进制色值。
- Tailwind 只做布局与原子样式；复杂视觉（光晕、渐变文字、毛玻璃）写成语义类或组件样式。
- 移动优先书写断点；断点值与 PRD §5.3 一致，不新增临时断点。
- 禁止 `!important`（第三方覆盖场景需注释说明）。
- 禁止 `100vh` 用于移动端全屏，使用 `100svh` / `100dvh`。
- 动画优先 CSS transition；必须用 JS 时用 `transform` / `opacity`，不动画 `width/height/top/left`。
- 所有动画必须响应 `prefers-reduced-motion: reduce`。

---

## 6. 测试要求

### 6.1 分层

| 层级 | 工具 | 范围 |
| --- | --- | --- |
| 单元 | Vitest | 纯函数、校验 schema、Markdown 管线、TOC、阅读时长、slug |
| 集成 | Supertest + 测试库 | API 路由、鉴权、分页边界、软删除、重定向、限流 |
| 组件 | Testing Library | 表单校验、抽屉焦点管理、星空降级逻辑 |
| E2E | Playwright | 访客主流程、后台发布链路、多视口回归 |
| 性能 | Lighthouse CI | 四项 ≥ 95，LCP/CLS 预算 |

### 6.2 必须补测试的改动

以下改动**没有测试不允许合并**：

- 新增或修改公开 API 的行为（含错误分支）。
- 鉴权、Cookie、CSRF、限流相关逻辑。
- Markdown 清洗与 HTML 输出（含恶意输入用例）。
- slug 生成与重定向。
- 浏览量去重、分页、筛选条件。
- 图片上传的类型与大小校验。
- 任何修复 bug 的提交（先写能复现的失败用例）。

### 6.3 覆盖率与质量门槛

- `packages/shared` 与 `apps/api` 的 service/工具函数：行覆盖 ≥ 80%。
- 不为凑覆盖率测试实现细节；UI 展示型组件不强制单测，但关键交互必须有组件测试或 E2E。
- 测试必须独立、可重复，不依赖执行顺序与真实网络。
- 测试数据用独立库 `myself_test`，每个用例后清理；**禁止连接生产库或共享开发库**。
- 修复 flaky 测试而不是重跑跳过；超过 3 次不稳定需定位根因。

### 6.4 必测 E2E 流程

1. 访客：首页 → 项目列表 → 项目详情 → 返回 → 文章列表 → 文章详情 → 复制邮箱。
2. 管理员：登录 → 新建文章并发布 → 前台 5 秒内可见 → 修改 slug → 旧链接 301 → 删除后列表不再出现。
3. 移动端：375px 视口下导航抽屉、目录折叠、无横向滚动、触控目标 ≥ 44px。
4. 无障碍：仅用键盘完成主流程，焦点可见，抽屉 `Esc` 可关闭。
5. 降级：关闭 JavaScript 后正文与项目信息可读；`prefers-reduced-motion` 下无动画。

### 6.5 测试命令与失败处理

- 提交前至少运行：`pnpm lint && pnpm typecheck && pnpm test`。
- 涉及页面或 API 的改动额外跑对应 E2E。
- 测试失败必须修复或说明原因，**不得删除断言、放宽阈值、跳过用例**来让 CI 变绿。

---

## 7. UI / 设计规范

- 视觉规范以 PRD §5 为准：暗色 Token、字体阶梯、间距、圆角、动效曲线、断点。
- 星空规范（PRD §5.2.2 / TECH_DESIGN §6.3）：
  - 单 canvas 固定定位、`pointer-events: none`、`aria-hidden="true"`。
  - 动效循环不进入 React state；DPR 上限 2；粒子数移动端 ≤ 120、桌面 ≤ 250。
  - 页面隐藏暂停，静止降帧；`prefers-reduced-motion` 只画静态一帧。
  - 正文容器必须有足够不透明背景，星空不得降低文字对比度。
- 可访问性（WCAG 2.1 AA）：
  - 每页一个 `h1`，语义化 `header/nav/main/article/footer`。
  - 键盘可达、焦点环可见、提供跳转主内容链接。
  - 图标按钮必须有 `aria-label`；图片必须有 `alt`（装饰图 `alt=""`）。
  - 正文对比度 ≥ 7:1，辅助文字 ≥ 4.5:1。
- 响应式：320px–1920px 无横向滚动；输入框字号 ≥ 16px；触控目标 ≥ 44×44px。
- 空状态、加载态、错误态必须有设计，不允许出现空白区块或裸露的英文报错。

---

## 8. 安全与性能红线

### 8.1 绝对禁止

- 提交密钥、`.env`、数据库连接串、Token。
- 在客户端 `localStorage` 存 Access/Refresh Token（统一 httpOnly Cookie）。
- 直接渲染未清洗的 Markdown / HTML，或启用运行时 MDX。
- 接受上传 SVG 或未校验 magic bytes 的文件。
- 拼接 SQL 字符串（一律走 Prisma 参数化）。
- 在错误响应中暴露堆栈、SQL、文件路径。
- 关闭 CORS 校验（`origin: *` + credentials）。
- 为通过构建而 `@ts-ignore`、关闭 ESLint 规则、删除测试。
- 引入自动播放音频、阻塞滚动的全屏动画、跟随鼠标的强视差。
- 在未经说明的情况下修改 `docs/` 中的既定方案。

### 8.2 性能预算（超标即视为缺陷）

| 指标 | 上限 |
| --- | --- |
| 首屏 JS（gzip） | 150KB |
| 首屏图片总重 | 300KB |
| LCP（4G 中端机） | 2.0s |
| CLS | 0.05 |
| INP | 200ms |
| Lighthouse 四项 | 均 ≥ 95 |
| 星空主线程占用 | ≤ 2% |

### 8.3 隐私

- 统计不采集可识别个人身份的信息；IP 只存哈希或截断。
- 联系表单内容仅站主可见，不做二次分发。
- 日志保留 30 天，备份加密存储。

---

## 9. 完成定义（DoD）

提交前逐项确认：

- [ ] 需求来自 PRD 或用户明确指令，未擅自扩大范围。
- [ ] `pnpm lint`、`pnpm typecheck`、`pnpm test` 全部通过。
- [ ] 新增行为有对应测试；修复 bug 有回归用例。
- [ ] 320 / 375 / 768 / 1440 四档视口检查过布局，无横向滚动。
- [ ] 键盘可完成本次新增的交互；对比度与 `alt` 已检查。
- [ ] 无 `console.log`、无注释掉的死代码、无未使用的导入。
- [ ] 无硬编码颜色/间距，全部使用 Token。
- [ ] 涉及接口、数据模型、目录结构的改动已同步更新 `docs/TECH_DESIGN.md`。
- [ ] 涉及产品行为变化的改动已同步更新 `docs/PRD.md`。
- [ ] 涉及环境变量的改动已更新 `.env.example` 与部署文档。
- [ ] 汇报中说明：改了什么、为什么、影响范围、如何验证、遗留问题。

---

## 10. 与用户协作

- 使用**简体中文**回复。
- 汇报先给结论，再给依据；不堆砌工具调用细节。
- 不确定的业务规则（文案、模块取舍、是否上线某功能）先问，不猜测。
- 大改动前给出简短方案与影响面；用户确认后再实施。
- 不擅自删除用户文件、不擅自重写无关模块、不擅自升级大版本依赖。
- 发现更优方案时先说明收益与成本，由用户决定，不直接替换既定技术栈。

---

## 11. 已知坑位（历史经验，务必避开）

1. **Prisma `BigInt` 序列化**：`JSON.stringify` 会直接抛错，必须在响应序列化层统一转换。
2. **Next.js 缓存**：`fetch` 默认缓存行为随版本变化，数据请求必须显式声明 `cache` / `next.revalidate` / tag，禁止依赖默认值。
3. **水合不一致**：星空、时间格式化、随机数、`window` 判断必须在挂载后执行，服务端与客户端首帧保持一致。
4. **时区**：数据库存 UTC，展示统一 `Asia/Shanghai`；禁止用 `new Date().toLocaleString()` 直接展示。
5. **MySQL ngram**：`ngram_token_size` 是实例级配置，改完需重启；线上与本地配置必须一致，否则搜索结果不同。
6. **唯一键与软删除**：MySQL 唯一索引允许多个 `NULL`，软删除会与 slug 唯一键冲突，按 TECH_DESIGN §4.5 处理。
7. **图片 CLS**：没有 `width/height` 或 `aspect-ratio` 的图片必然抖动，封面统一 16:9。
8. **移动端高度**：`100vh` 在 iOS Safari 会被地址栏裁切，统一 `100svh` / `100dvh`。
9. **触摸设备 hover**：`hover` 样式包在 `@media (hover: hover)` 内，移动端改用 `:active`。
10. **Cookie 跨域**：前后端不同子域时需正确设置 `Domain`、`SameSite`、`Secure`，否则登录态丢失。
11. **Tailwind v4**：配置方式与 v3 不同（CSS-first），不要照搬 v3 的 `tailwind.config.js` 写法。
12. **React 19 生态**：部分库 peer 依赖未跟上，安装前检查兼容性，避免强行 `--force` 安装。
13. **深色对比度**：半透明卡片叠加星空后对比度会下降，新增组件必须在最暗背景上复核。
14. **后台打包泄漏**：`/admin` 的编辑器、图表库必须动态导入，否则会被打进公开页面首屏。
15. **构建时数据依赖**：SSG 页面在构建期请求 API，CI 中必须能访问 API 或提供 mock，否则构建失败。

---

## 12. 文档维护

- 本文件是活的规范：发现规范与实现长期不一致时，优先修改实现；确实需要调整规范时，在同一 PR 中更新本文件并说明原因。
- 架构、数据模型、接口变化必须同步 `docs/TECH_DESIGN.md`。
- 产品行为、交互、验收标准变化必须同步 `docs/PRD.md`。
- 新增目录、脚本、环境变量时同步更新本文件第 3、4 节。

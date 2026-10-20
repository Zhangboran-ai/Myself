import 'dotenv/config';
import { hash } from '@node-rs/argon2';
import { PrismaClient } from '@prisma/client';
import { readingStats, slugify } from '@myself/shared';

const prisma = new PrismaClient();

const password = process.env.ADMIN_PASSWORD ?? 'admin12345';
const username = process.env.ADMIN_USERNAME ?? 'admin';

function date(value: string): Date {
  return new Date(value);
}

async function main(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('禁止在生产环境执行种子脚本');
  }

  const passwordHash = await hash(password);
  const admin = await prisma.user.upsert({
    where: { username },
    update: { passwordHash, displayName: process.env.ADMIN_DISPLAY_NAME ?? '站长' },
    create: {
      username,
      email: process.env.ADMIN_EMAIL ?? 'admin@example.com',
      passwordHash,
      displayName: process.env.ADMIN_DISPLAY_NAME ?? '站长',
      role: 'OWNER',
    },
  });

  await prisma.profile.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: '林深',
      handle: '@linshen',
      headline: '前端工程师 · 关注交互与性能',
      bioMd: [
        '你好，我是林深。白天写界面，晚上读源码，偶尔在星空下记录一些关于工程与设计的思考。',
        '过去五年我主要做 Web 前端与全栈应用，喜欢把复杂问题拆成清晰的模块，也喜欢为一个 8px 的对齐反复调整。相信好的产品是「功能正确」与「感受自然」的叠加。',
      ].join('\n\n'),
      location: '杭州',
      statusLabel: '开放远程合作',
      statusAvailable: true,
      email: 'hello@linshen.dev',
      resumeUrl: null,
    },
  });

  await prisma.socialLink.deleteMany();
  await prisma.socialLink.createMany({
    data: [
      { label: 'GitHub', href: 'https://github.com', icon: 'github', sortOrder: 1 },
      { label: '邮箱', href: 'mailto:hello@linshen.dev', icon: 'mail', sortOrder: 2 },
      { label: 'X', href: 'https://x.com', icon: 'twitter', sortOrder: 3 },
      { label: 'RSS', href: '/rss.xml', icon: 'rss', sortOrder: 4 },
    ],
  });

  await prisma.experience.deleteMany();
  await prisma.experience.createMany({
    data: [
      {
        company: '云舟科技',
        role: '高级前端工程师',
        startDate: date('2023-04-01'),
        endDate: null,
        summary: '负责核心 SaaS 产品的前端架构，首屏性能提升 42%，搭建组件库与设计 Token 体系。',
        kind: 'WORK',
        sortOrder: 1,
      },
      {
        company: '拾光网络',
        role: '前端工程师',
        startDate: date('2020-07-01'),
        endDate: date('2023-03-31'),
        summary: '从 0 到 1 参与三个中后台项目，主导构建工具迁移与 CI 流程改造。',
        kind: 'WORK',
        sortOrder: 2,
      },
      {
        company: '南方工业大学',
        role: '计算机科学与技术 · 本科',
        startDate: date('2016-09-01'),
        endDate: date('2020-06-30'),
        summary: '主修 Web 开发与图形学，毕业设计为基于 Canvas 的交互式数据可视化。',
        kind: 'EDUCATION',
        sortOrder: 3,
      },
    ],
  });

  await prisma.skill.deleteMany();
  await prisma.skillGroup.deleteMany();
  await prisma.skillGroup.create({
    data: {
      name: '前端开发',
      sortOrder: 1,
      skills: {
        create: [
          { name: 'TypeScript', level: 'PROFICIENT', note: '大型项目类型设计与渐进迁移', icon: 'code', sortOrder: 1 },
          { name: 'React', level: 'PROFICIENT', note: 'RSC、状态管理与性能调优', icon: 'atom', sortOrder: 2 },
          { name: 'Next.js', level: 'PROFICIENT', note: 'SSR / ISR 与缓存策略', icon: 'layers', sortOrder: 3 },
          { name: 'CSS / Tailwind', level: 'PROFICIENT', note: '设计 Token 与响应式布局', icon: 'palette', sortOrder: 4 },
        ],
      },
    },
  });
  await prisma.skillGroup.create({
    data: {
      name: '后端与数据',
      sortOrder: 2,
      skills: {
        create: [
          { name: 'Node.js', level: 'PROFICIENT', note: 'NestJS 服务与 BFF 层', icon: 'server', sortOrder: 1 },
          { name: 'MySQL', level: 'FAMILIAR', note: '索引设计与查询优化', icon: 'database', sortOrder: 2 },
          { name: 'Prisma', level: 'FAMILIAR', note: '数据建模与迁移管理', icon: 'box', sortOrder: 3 },
          { name: 'Redis', level: 'LEARNING', note: '缓存与限流的初步实践', icon: 'zap', sortOrder: 4 },
        ],
      },
    },
  });
  await prisma.skillGroup.create({
    data: {
      name: '工程化与设计',
      sortOrder: 3,
      skills: {
        create: [
          { name: 'Vite / Webpack', level: 'FAMILIAR', note: '构建配置与产物体积治理', icon: 'wrench', sortOrder: 1 },
          { name: 'Docker', level: 'FAMILIAR', note: '单机部署与镜像瘦身', icon: 'container', sortOrder: 2 },
          { name: '性能优化', level: 'PROFICIENT', note: 'Core Web Vitals 与渲染分析', icon: 'gauge', sortOrder: 3 },
          { name: 'Figma', level: 'FAMILIAR', note: '界面设计与设计走查', icon: 'pen', sortOrder: 4 },
        ],
      },
    },
  });

  await prisma.postRevision.deleteMany();
  await prisma.postTag.deleteMany();
  await prisma.post.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.projectTechTag.deleteMany();
  await prisma.project.deleteMany();
  await prisma.techTag.deleteMany();

  const tagDefinitions = [
    { name: '性能优化', slug: 'performance' },
    { name: '工程化', slug: 'engineering' },
    { name: '设计', slug: 'design' },
    { name: '随笔', slug: 'essay' },
    { name: 'Next.js', slug: 'nextjs' },
  ];

  const tags = [];
  for (const tag of tagDefinitions) {
    tags.push(await prisma.tag.create({ data: tag }));
  }
  const tagBySlug = new Map(tags.map((tag) => [tag.slug, tag]));

  const techNames = [
    'TypeScript',
    'React',
    'Next.js',
    'Node.js',
    'NestJS',
    'MySQL',
    'Prisma',
    'Tailwind CSS',
    'Canvas',
    'Docker',
  ];
  const techTags = [];
  for (const name of techNames) {
    techTags.push(await prisma.techTag.create({ data: { name, slug: slugify(name) } }));
  }
  const techByName = new Map(techTags.map((tech) => [tech.name, tech]));

  function techConnections(names: string[]) {
    return names.map((name) => {
      const tech = techByName.get(name);
      if (!tech) throw new Error(`未定义的技术栈：${name}`);
      return { techTagId: tech.id };
    });
  }

  const projects = [
    {
      slug: 'star-atlas',
      title: '星图 · 个人知识库',
      summary: '把笔记、书签与摘录组织成一张可检索的星空图谱。',
      role: '独立开发',
      year: 2025,
      status: 'LIVE' as const,
      featured: true,
      sortOrder: 1,
      demoUrl: 'https://example.com/star-atlas',
      repoUrl: 'https://github.com/example/star-atlas',
      tech: ['Next.js', 'TypeScript', 'Prisma', 'MySQL', 'Tailwind CSS'],
      bodyMd: `## 项目背景

零散的笔记散落在多个工具里，检索困难，也难以建立知识之间的关联。星图希望把「记录」与「连接」放到同一个界面中完成。

## 我的角色

独立完成产品设计、数据建模、前后端开发与部署，持续迭代 8 个月。

## 方案与架构

- 内容以 Markdown 存储，渲染管线固定为 \`remark → rehype → sanitize → Shiki\`，避免运行时执行不可信内容。
- 图谱使用 Canvas 2D 分层渲染，节点数超过 500 时自动降低动画频率。
- 搜索走 MySQL ngram 全文索引，短查询降级为标题匹配。

\`\`\`ts
const result = await searchIndex.query({
  keyword,
  scope: ['title', 'summary'],
  limit: 20,
});
\`\`\`

## 结果

上线后累计处理 1.2 万条笔记，首屏 LCP 稳定在 1.4s 左右。

> 最大的收获不是功能本身，而是学会了为「未来的自己」设计数据结构。`,
    },
    {
      slug: 'nebula-ui',
      title: 'Nebula UI',
      summary: '一套面向深色界面的 React 组件库，强调可访问性与动效克制。',
      role: '作者 / 维护者',
      year: 2024,
      status: 'OSS' as const,
      featured: true,
      sortOrder: 2,
      demoUrl: 'https://example.com/nebula',
      repoUrl: 'https://github.com/example/nebula-ui',
      tech: ['React', 'TypeScript', 'Tailwind CSS'],
      bodyMd: `## 为什么再造一个组件库

多数组件库在深色模式下只是把颜色反过来，对比度与焦点可见性经常不达标。Nebula UI 以深色为第一优先级，所有组件在最早版本就通过 WCAG AA 校验。

## 设计取舍

- 不使用运行时 CSS-in-JS，全部基于 CSS 变量，主题切换零成本。
- 交互组件基于 Radix 基座，自己只负责视觉层。
- 动效时长上限 260ms，且全部响应 \`prefers-reduced-motion\`。

\`\`\`css
:root {
  --surface-1: #111827;
  --text-primary: #e8eef9;
}
\`\`\`

## 结果

开源后收获 1.8k Star，被 30 多个个人项目使用，Issues 平均响应时间小于 24 小时。`,
    },
    {
      slug: 'pulse-monitor',
      title: 'Pulse 性能监控面板',
      summary: '把 Core Web Vitals 采集、聚合与告警放进一块看板。',
      role: '前端负责人',
      year: 2024,
      status: 'LIVE' as const,
      featured: false,
      sortOrder: 3,
      demoUrl: null,
      repoUrl: null,
      tech: ['React', 'Node.js', 'NestJS', 'MySQL', 'Docker'],
      bodyMd: `## 项目背景

团队需要在发布后 10 分钟内判断性能是否回退，原有方案依赖人工跑 Lighthouse，反馈太慢。

## 方案

- 前端通过 \`PerformanceObserver\` 采集 LCP、INP、CLS，按页面与版本号上报。
- 后端用 NestJS 接收并聚合到分钟级，写入 MySQL 分区表。
- 超过阈值时触发企业微信告警，并附带对应版本的发布记录。

## 难点

采样率与数据量的平衡：全量上报会让写入放大 20 倍，最终采用「首屏全量 + 交互采样 10%」的策略，并把去重放在客户端完成。`,
    },
    {
      slug: 'ink-flow',
      title: '墨流 · Markdown 编辑器',
      summary: '一个为长文写作设计的极简编辑器，支持实时预览与目录。',
      role: '独立开发',
      year: 2023,
      status: 'ARCHIVED' as const,
      featured: false,
      sortOrder: 4,
      demoUrl: null,
      repoUrl: 'https://github.com/example/ink-flow',
      tech: ['React', 'TypeScript', 'Canvas'],
      bodyMd: `## 简介

为大段中文写作优化的编辑器，左写作右预览，目录随滚动高亮。项目已归档，代码保留作为学习参考。

## 技术点

- 使用受控输入 + 防抖渲染，避免长文输入卡顿。
- 预览区只重渲染变更的段落，滚动位置保持不变。`,
    },
  ];

  for (const project of projects) {
    await prisma.project.create({
      data: {
        slug: project.slug,
        title: project.title,
        summary: project.summary,
        bodyMd: project.bodyMd,
        role: project.role,
        year: project.year,
        status: project.status,
        featured: project.featured,
        sortOrder: project.sortOrder,
        demoUrl: project.demoUrl,
        repoUrl: project.repoUrl,
        tech: { create: techConnections(project.tech) },
      },
    });
  }

  const posts = [
    {
      slug: 'building-dark-starfield',
      title: '在深色界面里做一片不打扰人的星空',
      summary: '星空背景很容易做成廉价的粒子特效。这篇文章记录我如何用 250 个粒子、两层视差和一条降级路径，让背景好看又不拖慢页面。',
      tags: ['design', 'performance'],
      pinned: true,
      publishedAt: '2026-09-18T10:00:00Z',
      bodyMd: `## 问题不在「有没有星空」，而在「它是否抢戏」

第一版我把粒子数量设成了 1200，桌面端看起来很热闹，但文字区域的可读性明显下降，滚动时也能感觉到掉帧。后来我把目标改成一句话：**让星空在余光里，而不是在视线中心。**

## 分层

最终拆成四层：

1. 深空渐变，纯 CSS，静止。
2. 远景星点，0.5–1px，约 180 颗。
3. 近景星点，1–2px，约 70 颗，带轻微视差。
4. 偶发流星，6–15 秒随机一次。

## 性能上的几个决定

- 所有动画在 \`requestAnimationFrame\` 里直接操作 Canvas，不进入 React 状态。
- DPR 上限设为 2，高分屏不再无限放大画布。
- 页面隐藏时暂停，静止 3 秒后降到 30fps。
- 尊重 \`prefers-reduced-motion\`：只画一帧静态星空，然后停止。

\`\`\`ts
const dpr = Math.min(window.devicePixelRatio || 1, 2);
canvas.width = width * dpr;
canvas.height = height * dpr;
ctx.scale(dpr, dpr);
\`\`\`

## 降级

Canvas 不可用或脚本失败时，用一张预生成的 WebP 星点纹理兜底。它不动的，但没有人会因此觉得页面坏了。

> 装饰性动效的第一原则：它必须随时可以被拿走。`,
    },
    {
      slug: 'nextjs-cache-boundaries',
      title: 'Next.js 缓存的四条边界',
      summary: '从静态生成到按需失效，梳理我在内容站里踩过的缓存问题：什么时候该缓存、缓存在哪一层、失效为什么没生效。',
      tags: ['nextjs', 'engineering'],
      pinned: false,
      publishedAt: '2026-08-02T09:30:00Z',
      bodyMd: `## 缓存不是一个开关

内容站的理想状态是：页面是静态的，内容更新后又能立刻看到。这两件事天然矛盾，解法是把缓存拆成几层分别控制。

## 我划的四条边界

1. **构建期**：不依赖数据库的页面直接静态化。
2. **请求期**：列表页短缓存，详情页按 slug 打 tag。
3. **浏览器**：HTML 不缓存，静态资源长缓存。
4. **对象存储**：内容哈希命名，永久缓存。

## 失效为什么没生效

最常见的原因是 tag 打错了层级：列表页用了 \`post:slug\`，但保存时只失效了 \`posts:list\`。我的做法是把 tag 生成收敛到一处：

\`\`\`ts
export const tags = {
  post: (slug: string) => \`post:\${slug}\`,
  posts: 'posts:list',
};
\`\`\`

写入成功后按「详情 + 列表 + 标签页 + sitemap」四类一起失效，宁可多失效一点，也不要让用户看到旧内容。`,
    },
    {
      slug: 'design-tokens-in-practice',
      title: '设计 Token 落到代码里的三个细节',
      summary: 'Token 不只是颜色变量。间距、层级和动效曲线如果不一起定义，设计系统很快会退化成一份配色表。',
      tags: ['design', 'engineering'],
      pinned: false,
      publishedAt: '2026-06-21T14:00:00Z',
      bodyMd: `## 一、Token 要覆盖「决策」，而不只是「值」

\`--accent: #6ea8fe\` 是值，\`--action-primary\` 才是决策。前者回答「用什么颜色」，后者回答「什么时候用」。两者都需要，但不要让业务代码直接引用前者。

## 二、间距必须是有限集合

4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96。只要允许随手写 13px，系统就开始腐烂。

## 三、动效曲线也是 Token

同样的 200ms，\`ease-out\` 和 \`cubic-bezier(0.16, 1, 0.3, 1)\` 给人的感觉完全不同。把曲线命名成 \`--ease-enter\`、\`--ease-exit\`，团队才不会每人写一套。

\`\`\`css
:root {
  --ease-enter: cubic-bezier(0.16, 1, 0.3, 1);
  --duration-fast: 150ms;
  --duration-base: 220ms;
}
\`\`\`

## 最后

Token 的价值不在于「统一」，而在于「可替换」。当你想换一套配色时，只改一个文件就能完成，这才说明系统是活的。`,
    },
    {
      slug: 'slow-is-a-feature',
      title: '慢一点，是一种功能',
      summary: '关于阅读体验的一点随笔：为什么我把文章页的行宽收窄到 68 个字符，也删掉了大部分滚动动画。',
      tags: ['essay', 'design'],
      pinned: false,
      publishedAt: '2026-05-09T20:00:00Z',
      bodyMd: `## 阅读是最容易被忽略的交互

我们花很多时间优化首屏，却很少为「读到第三段时的感受」做设计。

## 我删掉的东西

- 滚动时逐字出现的效果：它让阅读节奏被强行控制。
- 悬浮在段落旁的装饰线：注意力会被反复拉走。
- 过宽的正文：一行 100 个字符，眼睛回扫会迷路。

## 留下来的

正文 68 个字符宽，行高 1.8，段间距 1.2em，代码块可以横向滚动但不撑破布局。目录安静地待在右边，只在需要时被看见。

> 好的阅读体验，是让人忘记界面的存在。`,
    },
  ];

  for (const post of posts) {
    const stats = readingStats(post.bodyMd);
    const postTags = post.tags
      .map((slug) => tagBySlug.get(slug))
      .filter((tag): tag is NonNullable<typeof tag> => Boolean(tag));

    await prisma.post.create({
      data: {
        slug: post.slug,
        title: post.title,
        summary: post.summary,
        bodyMd: post.bodyMd,
        status: 'PUBLISHED',
        pinned: post.pinned,
        publishedAt: date(post.publishedAt),
        readingTime: stats.readingTime,
        wordCount: stats.wordCount,
        authorId: admin.id,
        tags: { create: postTags.map((tag) => ({ tagId: tag.id })) },
        revisions: {
          create: { title: post.title, bodyMd: post.bodyMd, editorId: admin.id },
        },
      },
    });
  }

  for (const tag of tagDefinitions) {
    const count = await prisma.postTag.count({ where: { tag: { slug: tag.slug } } });
    await prisma.tag.update({ where: { slug: tag.slug }, data: { postCount: count } });
  }

  console.log(`种子数据完成：${projects.length} 个项目、${posts.length} 篇文章、管理员 ${username}`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

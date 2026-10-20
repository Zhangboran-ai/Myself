import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  PostDetail,
  PostInput,
  PostNeighbor,
  PostRevisionItem,
  PostSummary,
  TagItem,
} from '@myself/shared';
import { readingStats, slugify } from '@myself/shared';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma.service';
import { RevalidateService } from '../../common/revalidate.service';
import { pageMeta, slugFromName } from '../../common/http';

type PostWithTags = Prisma.PostGetPayload<{
  include: { tags: { include: { tag: true } } };
}>;

/** 列表查询只选必要列，避免把正文带出来。 */
interface PostSummaryRow {
  id: bigint;
  slug: string;
  title: string;
  summary: string;
  coverUrl: string | null;
  publishedAt: Date | null;
  updatedAt: Date;
  readingTime: number;
  pinned: boolean;
  tags: { tag: { name: string } }[];
}

export interface PostListQuery {
  page: number;
  pageSize: number;
  tag?: string;
  q?: string;
  pinned?: boolean;
}

const VIEW_DEDUPE_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class PostsService {
  private readonly viewDedupe = new Map<string, number>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly revalidate: RevalidateService,
  ) {}

  async list(query: PostListQuery): Promise<{
    items: PostSummary[];
    meta: ReturnType<typeof pageMeta>;
  }> {
    const where: Prisma.PostWhereInput = {
      status: 'PUBLISHED',
      deletedAt: null,
      ...(query.tag ? { tags: { some: { tag: { slug: query.tag } } } } : {}),
      ...(query.pinned !== undefined ? { pinned: query.pinned } : {}),
      ...(query.q
        ? {
            OR: [
              { title: { contains: query.q } },
              { summary: { contains: query.q } },
            ],
          }
        : {}),
    };

    const [total, posts] = await this.prisma.$transaction([
      this.prisma.post.count({ where }),
      this.prisma.post.findMany({
        where,
        orderBy: [{ pinned: 'desc' }, { publishedAt: 'desc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        select: {
          id: true,
          slug: true,
          title: true,
          summary: true,
          coverUrl: true,
          publishedAt: true,
          updatedAt: true,
          readingTime: true,
          pinned: true,
          tags: { include: { tag: true } },
        },
      }),
    ]);

    return {
      items: posts.map((post) => this.toSummary(post)),
      meta: pageMeta(total, query.page, query.pageSize),
    };
  }

  async detail(slug: string): Promise<PostDetail> {
    const post = await this.prisma.post.findFirst({
      where: { slug, status: 'PUBLISHED', deletedAt: null },
      include: { tags: { include: { tag: true } } },
    });
    if (!post) throw new NotFoundException('文章不存在');

    const [older, newer] = await Promise.all([
      post.publishedAt
        ? this.prisma.post.findFirst({
            where: {
              status: 'PUBLISHED',
              deletedAt: null,
              publishedAt: { lt: post.publishedAt },
            },
            orderBy: { publishedAt: 'desc' },
            select: { slug: true, title: true },
          })
        : null,
      post.publishedAt
        ? this.prisma.post.findFirst({
            where: {
              status: 'PUBLISHED',
              deletedAt: null,
              publishedAt: { gt: post.publishedAt },
            },
            orderBy: { publishedAt: 'asc' },
            select: { slug: true, title: true },
          })
        : null,
    ]);

    return {
      ...this.toSummary(post),
      body: post.bodyMd,
      prev: older ? this.toNeighbor(older) : null,
      next: newer ? this.toNeighbor(newer) : null,
    };
  }

  async resolveRedirect(slug: string): Promise<string> {
    const redirect = await this.prisma.slugRedirect.findUnique({
      where: { entityType_oldSlug: { entityType: 'post', oldSlug: slug } },
    });
    if (!redirect) throw new NotFoundException('没有对应的重定向');
    return redirect.newSlug;
  }

  async tags(): Promise<TagItem[]> {
    const tags = await this.prisma.tag.findMany({
      where: { postCount: { gt: 0 } },
      orderBy: [{ postCount: 'desc' }, { name: 'asc' }],
    });
    return tags.map((tag) => ({ name: tag.name, slug: tag.slug, postCount: tag.postCount }));
  }

  async incrementView(slug: string, ip: string | undefined): Promise<{ viewCount: number }> {
    const key = `${ip ?? 'unknown'}:${slug}:${new Date().toISOString().slice(0, 10)}`;
    const now = Date.now();
    this.pruneViewDedupe(now);

    if (this.viewDedupe.has(key)) {
      const post = await this.prisma.post.findFirst({
        where: { slug, deletedAt: null },
        select: { viewCount: true },
      });
      return { viewCount: Number(post?.viewCount ?? 0) };
    }

    this.viewDedupe.set(key, now);

    const post = await this.prisma.post.findFirst({
      where: { slug, status: 'PUBLISHED', deletedAt: null },
      select: { id: true },
    });
    if (!post) throw new NotFoundException('文章不存在');

    const updated = await this.prisma.post.update({
      where: { id: post.id },
      data: { viewCount: { increment: 1 } },
      select: { viewCount: true },
    });
    return { viewCount: Number(updated.viewCount) };
  }

  async adminList(): Promise<{ items: (PostSummary & { status: string })[] }> {
    const posts = await this.prisma.post.findMany({
      where: { deletedAt: null },
      include: { tags: { include: { tag: true } } },
      orderBy: [{ updatedAt: 'desc' }],
    });
    return {
      items: posts.map((post) => ({
        ...this.toSummary(post),
        status: post.status,
      })),
    };
  }

  async adminGet(id: bigint): Promise<PostDetail & { status: string }> {
    const post = await this.prisma.post.findFirst({
      where: { id, deletedAt: null },
      include: { tags: { include: { tag: true } } },
    });
    if (!post) throw new NotFoundException('文章不存在');

    return {
      ...this.toSummary(post),
      body: post.bodyMd,
      status: post.status,
      prev: null,
      next: null,
    };
  }

  /** 草稿预览：调用方已校验签名令牌，这里只负责取数与状态。 */
  async preview(slug: string): Promise<PostDetail & { status: string }> {
    const post = await this.prisma.post.findFirst({
      where: { slug, deletedAt: null },
      include: { tags: { include: { tag: true } } },
    });
    if (!post) throw new NotFoundException('文章不存在');

    return {
      ...this.toSummary(post),
      body: post.bodyMd,
      status: post.status,
      prev: null,
      next: null,
    };
  }

  async revisions(id: bigint): Promise<PostRevisionItem[]> {
    const post = await this.prisma.post.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!post) throw new NotFoundException('文章不存在');

    const revisions = await this.prisma.postRevision.findMany({
      where: { postId: id },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: { id: true, title: true, createdAt: true },
    });

    return revisions.map((revision) => ({
      id: String(revision.id),
      title: revision.title,
      createdAt: revision.createdAt.toISOString(),
    }));
  }

  async restore(id: bigint, revisionId: bigint): Promise<PostDetail & { status: string }> {
    const post = await this.prisma.post.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, slug: true, title: true, bodyMd: true, authorId: true },
    });
    if (!post) throw new NotFoundException('文章不存在');

    const revision = await this.prisma.postRevision.findFirst({
      where: { id: revisionId, postId: id },
    });
    if (!revision) throw new NotFoundException('修订版本不存在');

    const stats = readingStats(revision.bodyMd);

    await this.prisma.$transaction(async (tx) => {
      // 覆盖前先保存当前内容，恢复本身也可回退。
      await tx.postRevision.create({
        data: {
          postId: id,
          title: post.title,
          bodyMd: post.bodyMd,
          editorId: post.authorId,
        },
      });

      await tx.post.update({
        where: { id },
        data: {
          title: revision.title,
          bodyMd: revision.bodyMd,
          readingTime: stats.readingTime,
          wordCount: stats.wordCount,
        },
      });
    });

    this.revalidate.notify(['posts:list', `post:${post.slug}`]);
    return this.adminGet(id);
  }

  async create(input: PostInput, authorId: bigint): Promise<PostDetail> {
    const stats = readingStats(input.body);
    const publishedAt = input.status === 'PUBLISHED' ? new Date() : null;

    const post = await this.prisma.post.create({
      data: {
        slug: input.slug,
        title: input.title,
        summary: input.summary,
        bodyMd: input.body,
        coverUrl: input.coverUrl ?? null,
        authorId,
        status: input.status,
        pinned: input.pinned,
        readingTime: stats.readingTime,
        wordCount: stats.wordCount,
        publishedAt,
        tags: { create: this.tagConnections(input.tags) },
        revisions: {
          create: { title: input.title, bodyMd: input.body, editorId: authorId },
        },
      },
      include: { tags: { include: { tag: true } } },
    });

    await this.recalcTagCounts();
    this.revalidate.notify(['posts:list', `post:${post.slug}`, 'sitemap']);
    return this.detailOrAdmin(post);
  }

  async update(id: bigint, input: PostInput): Promise<PostDetail> {
    const existing = await this.prisma.post.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundException('文章不存在');

    const stats = readingStats(input.body);
    const publishedAt =
      existing.publishedAt ?? (input.status === 'PUBLISHED' ? new Date() : null);

    await this.prisma.$transaction(async (tx) => {
      await tx.post.update({
        where: { id },
        data: {
          slug: input.slug,
          title: input.title,
          summary: input.summary,
          bodyMd: input.body,
          coverUrl: input.coverUrl ?? null,
          status: input.status,
          pinned: input.pinned,
          readingTime: stats.readingTime,
          wordCount: stats.wordCount,
          publishedAt,
          tags: {
            deleteMany: {},
            create: this.tagConnections(input.tags),
          },
        },
      });

      await tx.postRevision.create({
        data: { postId: id, title: input.title, bodyMd: input.body, editorId: existing.authorId },
      });

      const stale = await tx.postRevision.findMany({
        where: { postId: id },
        orderBy: { createdAt: 'desc' },
        skip: 20,
        select: { id: true },
      });
      if (stale.length > 0) {
        await tx.postRevision.deleteMany({ where: { id: { in: stale.map((item) => item.id) } } });
      }

      if (existing.slug !== input.slug) {
        await tx.slugRedirect.upsert({
          where: { entityType_oldSlug: { entityType: 'post', oldSlug: existing.slug } },
          update: { newSlug: input.slug },
          create: { entityType: 'post', oldSlug: existing.slug, newSlug: input.slug },
        });
      }
    });

    await this.recalcTagCounts();
    this.revalidate.notify([
      'posts:list',
      `post:${existing.slug}`,
      `post:${input.slug}`,
      'sitemap',
    ]);

    const updated = await this.prisma.post.findUniqueOrThrow({
      where: { id },
      include: { tags: { include: { tag: true } } },
    });
    return this.toDetail(updated);
  }

  async remove(id: bigint): Promise<{ ok: true }> {
    const existing = await this.prisma.post.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundException('文章不存在');

    await this.prisma.post.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        slug: `${existing.slug}-del-${String(id)}`,
      },
    });

    await this.recalcTagCounts();
    this.revalidate.notify(['posts:list', `post:${existing.slug}`, 'sitemap']);
    return { ok: true };
  }

  private async recalcTagCounts(): Promise<void> {
    const grouped = await this.prisma.postTag.groupBy({
      by: ['tagId'],
      where: { post: { status: 'PUBLISHED', deletedAt: null } },
      _count: { _all: true },
    });
    const counts = new Map(grouped.map((row) => [String(row.tagId), row._count._all]));

    const tags = await this.prisma.tag.findMany({ select: { id: true } });
    await this.prisma.$transaction(
      tags.map((tag) =>
        this.prisma.tag.update({
          where: { id: tag.id },
          data: { postCount: counts.get(String(tag.id)) ?? 0 },
        }),
      ),
    );
  }

  private tagConnections(names: string[]) {
    return [...new Set(names.map((name) => name.trim()))]
      .filter(Boolean)
      .map((name) => ({
        tag: {
          connectOrCreate: {
            where: { name },
            create: { name, slug: slugify(name) || slugFromName(name, 'tag') },
          },
        },
      }));
  }

  private toSummary(post: PostSummaryRow): PostSummary {
    return {
      id: String(post.id),
      slug: post.slug,
      title: post.title,
      summary: post.summary,
      coverUrl: post.coverUrl,
      publishedAt: post.publishedAt ? post.publishedAt.toISOString() : null,
      updatedAt: post.updatedAt.toISOString(),
      readingTime: post.readingTime,
      tags: post.tags.map((item) => item.tag.name),
      pinned: post.pinned,
    };
  }

  private toDetail(post: PostWithTags): PostDetail {
    return {
      ...this.toSummary(post),
      body: post.bodyMd,
      prev: null,
      next: null,
    };
  }

  private async detailOrAdmin(post: PostWithTags): Promise<PostDetail> {
    return {
      ...this.toSummary(post),
      body: post.bodyMd,
      prev: null,
      next: null,
    };
  }

  private toNeighbor(post: { slug: string; title: string }): PostNeighbor {
    return { slug: post.slug, title: post.title };
  }

  private pruneViewDedupe(now: number): void {
    if (this.viewDedupe.size < 5000) return;
    for (const [key, timestamp] of this.viewDedupe) {
      if (now - timestamp > VIEW_DEDUPE_MS) this.viewDedupe.delete(key);
    }
  }
}

import { Injectable } from '@nestjs/common';
import type { StatsOverview } from '@myself/shared';
import { toNumber } from '@myself/shared';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async overview(): Promise<StatsOverview> {
    const [
      postsTotal,
      postsPublished,
      postsDraft,
      postsArchived,
      projectsTotal,
      projectsFeatured,
      postViews,
      projectViews,
      contactTotal,
      contactUnread,
    ] = await Promise.all([
      this.prisma.post.count({ where: { deletedAt: null } }),
      this.prisma.post.count({ where: { deletedAt: null, status: 'PUBLISHED' } }),
      this.prisma.post.count({ where: { deletedAt: null, status: 'DRAFT' } }),
      this.prisma.post.count({ where: { deletedAt: null, status: 'ARCHIVED' } }),
      this.prisma.project.count({ where: { deletedAt: null } }),
      this.prisma.project.count({ where: { deletedAt: null, featured: true } }),
      this.prisma.post.aggregate({
        where: { deletedAt: null },
        _sum: { viewCount: true },
      }),
      this.prisma.project.aggregate({
        where: { deletedAt: null },
        _sum: { viewCount: true },
      }),
      this.prisma.contactMessage.count(),
      this.prisma.contactMessage.count({ where: { status: 'NEW' } }),
    ]);

    // Prisma 的 BigInt 无法被 JSON.stringify 序列化，这里统一转 number。
    return {
      posts: {
        total: postsTotal,
        published: postsPublished,
        draft: postsDraft,
        archived: postsArchived,
      },
      projects: { total: projectsTotal, featured: projectsFeatured },
      views: {
        posts: toNumber(postViews._sum.viewCount ?? 0),
        projects: toNumber(projectViews._sum.viewCount ?? 0),
      },
      contact: { total: contactTotal, unread: contactUnread },
      generatedAt: new Date().toISOString(),
    };
  }
}

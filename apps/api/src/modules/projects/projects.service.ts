import { Injectable, NotFoundException } from '@nestjs/common';
import type { ProjectDetail, ProjectInput, ProjectStatus, ProjectSummary } from '@myself/shared';
import { slugify } from '@myself/shared';
import { Prisma, ProjectStatus as PrismaProjectStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma.service';
import { RevalidateService } from '../../common/revalidate.service';
import { pageMeta, slugFromName } from '../../common/http';

/** 列表查询只选必要列，避免把正文带出来。 */
interface ProjectSummaryRow {
  id: bigint;
  slug: string;
  title: string;
  summary: string;
  coverUrl: string | null;
  role: string | null;
  year: number;
  status: PrismaProjectStatus;
  featured: boolean;
  demoUrl: string | null;
  repoUrl: string | null;
  tech: { techTag: { name: string } }[];
}

export interface ProjectListQuery {
  page: number;
  pageSize: number;
  tech?: string;
  year?: number;
  featured?: boolean;
}

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly revalidate: RevalidateService,
  ) {}

  async list(query: ProjectListQuery): Promise<{
    items: ProjectSummary[];
    meta: ReturnType<typeof pageMeta>;
  }> {
    const where: Prisma.ProjectWhereInput = {
      deletedAt: null,
      ...(query.featured !== undefined ? { featured: query.featured } : {}),
      ...(query.year ? { year: query.year } : {}),
      ...(query.tech ? { tech: { some: { techTag: { slug: query.tech } } } } : {}),
    };

    const [total, projects] = await this.prisma.$transaction([
      this.prisma.project.count({ where }),
      this.prisma.project.findMany({
        where,
        orderBy: [{ featured: 'desc' }, { sortOrder: 'asc' }, { year: 'desc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        // 列表不取正文，避免大字段拖慢查询
        select: {
          id: true,
          slug: true,
          title: true,
          summary: true,
          coverUrl: true,
          role: true,
          year: true,
          status: true,
          featured: true,
          demoUrl: true,
          repoUrl: true,
          tech: { include: { techTag: true } },
        },
      }),
    ]);

    return {
      items: projects.map((project) => this.toSummary(project)),
      meta: pageMeta(total, query.page, query.pageSize),
    };
  }

  async techTags(): Promise<{ name: string; slug: string; count: number }[]> {
    const tags = await this.prisma.techTag.findMany({
      include: { _count: { select: { projects: true } } },
      orderBy: { name: 'asc' },
    });
    return tags
      .filter((tag) => tag._count.projects > 0)
      .map((tag) => ({ name: tag.name, slug: tag.slug, count: tag._count.projects }));
  }

  async detail(slug: string): Promise<ProjectDetail> {
    const project = await this.prisma.project.findFirst({
      where: { slug, deletedAt: null },
      include: { tech: { include: { techTag: true } } },
    });

    if (!project) {
      throw new NotFoundException('项目不存在');
    }

    return {
      ...this.toSummary(project),
      body: project.bodyMd,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    };
  }

  async resolveRedirect(slug: string): Promise<string> {
    const redirect = await this.prisma.slugRedirect.findUnique({
      where: { entityType_oldSlug: { entityType: 'project', oldSlug: slug } },
    });
    if (!redirect) throw new NotFoundException('没有对应的重定向');
    return redirect.newSlug;
  }

  async adminList(): Promise<{ items: ProjectSummary[] }> {
    const projects = await this.prisma.project.findMany({
      where: { deletedAt: null },
      include: { tech: { include: { techTag: true } } },
      orderBy: [{ sortOrder: 'asc' }, { year: 'desc' }],
    });
    return { items: projects.map((project) => this.toSummary(project)) };
  }

  async adminGet(id: bigint): Promise<ProjectDetail> {
    const project = await this.prisma.project.findFirst({
      where: { id, deletedAt: null },
      include: { tech: { include: { techTag: true } } },
    });
    if (!project) throw new NotFoundException('项目不存在');

    return {
      ...this.toSummary(project),
      body: project.bodyMd,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    };
  }

  async create(input: ProjectInput): Promise<ProjectDetail> {
    const project = await this.prisma.project.create({
      data: {
        ...this.toWriteData(input),
        tech: { create: this.techConnections(input.tech) },
      },
      include: { tech: { include: { techTag: true } } },
    });

    this.revalidate.notify(['projects:list', `project:${project.slug}`]);
    return this.adminGet(project.id);
  }

  async update(id: bigint, input: ProjectInput): Promise<ProjectDetail> {
    const existing = await this.prisma.project.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw new NotFoundException('项目不存在');

    await this.prisma.$transaction(async (tx) => {
      await tx.project.update({
        where: { id },
        data: {
          ...this.toWriteData(input),
          tech: {
            deleteMany: {},
            create: this.techConnections(input.tech),
          },
        },
      });

      if (existing.slug !== input.slug) {
        await tx.slugRedirect.upsert({
          where: { entityType_oldSlug: { entityType: 'project', oldSlug: existing.slug } },
          update: { newSlug: input.slug },
          create: { entityType: 'project', oldSlug: existing.slug, newSlug: input.slug },
        });
      }
    });

    this.revalidate.notify(['projects:list', `project:${existing.slug}`, `project:${input.slug}`]);
    return this.adminGet(id);
  }

  async remove(id: bigint): Promise<{ ok: true }> {
    const existing = await this.prisma.project.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundException('项目不存在');

    await this.prisma.project.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        slug: `${existing.slug}-del-${String(id)}`,
      },
    });

    this.revalidate.notify(['projects:list', `project:${existing.slug}`]);
    return { ok: true };
  }

  private toSummary(project: ProjectSummaryRow): ProjectSummary {
    return {
      id: String(project.id),
      slug: project.slug,
      title: project.title,
      summary: project.summary,
      coverUrl: project.coverUrl,
      role: project.role,
      year: project.year,
      status: project.status.toLowerCase() as ProjectStatus,
      featured: project.featured,
      tech: project.tech.map((item) => item.techTag.name),
      demoUrl: project.demoUrl,
      repoUrl: project.repoUrl,
    };
  }

  private toWriteData(input: ProjectInput) {
    return {
      slug: input.slug,
      title: input.title,
      summary: input.summary,
      bodyMd: input.body,
      role: input.role ?? null,
      year: input.year,
      status: input.status.toUpperCase() as 'LIVE' | 'OSS' | 'ARCHIVED',
      featured: input.featured,
      demoUrl: input.demoUrl ?? null,
      repoUrl: input.repoUrl ?? null,
      coverUrl: input.coverUrl ?? null,
      sortOrder: input.sortOrder,
    };
  }

  private techConnections(names: string[]) {
    return names.map((name) => ({
      techTag: {
        connectOrCreate: {
          where: { name },
          create: { name, slug: slugify(name) || slugFromName(name, 'tech') },
        },
      },
    }));
  }
}

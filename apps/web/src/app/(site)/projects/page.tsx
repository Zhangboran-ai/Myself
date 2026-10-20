import type { Metadata } from 'next';
import Link from 'next/link';
import clsx from 'clsx';
import { ProjectCard } from '@/components/content/ProjectCard';
import { Pagination } from '@/components/ui/Pagination';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { getProjects, getTechTags } from '@/lib/api';

export const metadata: Metadata = {
  title: '项目',
  description: '我做过的项目：个人工具、开源组件库与团队系统。',
  alternates: { canonical: '/projects' },
};

interface ProjectsPageProps {
  searchParams: Promise<{ tech?: string; page?: string }>;
}

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const params = await searchParams;
  const tech = params.tech?.trim() || undefined;
  const page = Math.max(1, Number(params.page ?? '1') || 1);

  const [tags, data] = await Promise.all([
    getTechTags(),
    getProjects({ tech, page, pageSize: 9 }),
  ]);

  const activeTag = tags.find((tag) => tag.slug === tech);

  return (
    <section className="pt-32 pb-16 sm:pt-40">
      <div className="container-page">
        <SectionHeading
          eyebrow="Projects"
          title={activeTag ? `项目 · ${activeTag.name}` : '做过的项目'}
          description="从个人工具到团队系统，每个项目都尽量讲清楚问题、方案与结果。"
        />

        <div className="mt-8 flex flex-wrap gap-2">
          <Link
            href="/projects"
            className={clsx(
              'chip min-h-9 px-3.5 transition-colors',
              !tech
                ? '!border-[rgba(110,168,254,0.45)] !bg-[rgba(110,168,254,0.10)] !text-[var(--accent)]'
                : 'hover:!border-white/[0.16] hover:!text-[var(--text-primary)]',
            )}
          >
            全部
          </Link>
          {tags.map((tag) => (
            <Link
              key={tag.slug}
              href={`/projects?tech=${encodeURIComponent(tag.slug)}`}
              className={clsx(
                'chip min-h-9 px-3.5 transition-colors',
                tech === tag.slug
                  ? '!border-[rgba(110,168,254,0.45)] !bg-[rgba(110,168,254,0.10)] !text-[var(--accent)]'
                  : 'hover:!border-white/[0.16] hover:!text-[var(--text-primary)]',
              )}
            >
              {tag.name}
              <span className="text-[10px] text-[var(--text-muted)]">{tag.count}</span>
            </Link>
          ))}
        </div>

        {data.items.length === 0 ? (
          <div className="card mt-10 p-10 text-center">
            <p className="text-sm text-[var(--text-secondary)]">没有匹配的项目。</p>
            <Link href="/projects" className="btn btn-ghost mt-4">
              清除筛选
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}

        <Pagination
          page={data.meta.page}
          totalPages={data.meta.totalPages}
          basePath="/projects"
          params={{ tech }}
        />
      </div>
    </section>
  );
}

import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, ExternalLink, Github } from 'lucide-react';
import { PROJECT_STATUS_LABELS } from '@myself/shared';
import { Markdown } from '@/components/content/Markdown';
import { ApiError, getProject, resolveRedirect } from '@/lib/api';

interface ProjectPageProps {
  params: Promise<{ slug: string }>;
}

async function loadProject(slug: string) {
  try {
    return await getProject(slug);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      const target = await resolveRedirect('project', slug);
      if (target) redirect(`/projects/${target}`);
      notFound();
    }
    throw error;
  }
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const project = await getProject(slug);
    return {
      title: project.title,
      description: project.summary,
      alternates: { canonical: `/projects/${project.slug}` },
      openGraph: {
        title: project.title,
        description: project.summary,
        type: 'article',
        images: project.coverUrl ? [project.coverUrl] : ['/og-default.svg'],
      },
    };
  } catch {
    return { title: '项目不存在' };
  }
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = await loadProject(slug);

  return (
    <article className="pt-28 pb-20 sm:pt-36">
      <div className="container-page">
        <Link
          href="/projects"
          className="inline-flex min-h-10 items-center gap-2 text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
        >
          <ArrowLeft size={15} aria-hidden="true" />
          返回项目列表
        </Link>

        <header className="mt-8 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
            <span className="chip">{PROJECT_STATUS_LABELS[project.status] ?? project.status}</span>
            <span>{project.year}</span>
            {project.role ? (
              <>
                <span aria-hidden="true">·</span>
                <span>{project.role}</span>
              </>
            ) : null}
          </div>

          <h1 className="mt-5 text-[clamp(32px,5vw,52px)] font-bold leading-[1.12] tracking-[-0.025em]">
            {project.title}
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-[var(--text-secondary)]">
            {project.summary}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            {project.tech.map((tech) => (
              <span key={tech} className="chip">
                {tech}
              </span>
            ))}
          </div>

          {project.demoUrl || project.repoUrl ? (
            <div className="mt-7 flex flex-wrap gap-3">
              {project.demoUrl ? (
                <a
                  href={project.demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                >
                  <ExternalLink size={15} aria-hidden="true" />
                  访问项目
                </a>
              ) : null}
              {project.repoUrl ? (
                <a
                  href={project.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-ghost"
                >
                  <Github size={15} aria-hidden="true" />
                  查看源码
                </a>
              ) : null}
            </div>
          ) : null}
        </header>

        {project.coverUrl ? (
          <div className="relative mt-10 aspect-[16/8] overflow-hidden rounded-[var(--radius-lg)] border border-white/[0.08]">
            <Image
              src={project.coverUrl}
              alt={`${project.title} 封面`}
              fill
              priority
              sizes="(max-width: 1200px) 100vw, 1120px"
              className="object-cover"
            />
          </div>
        ) : null}

        <div className="mt-12 max-w-[72ch]">
          <Markdown content={project.body} />
        </div>

        <div className="mt-16 border-t border-white/[0.08] pt-8">
          <Link
            href="/projects"
            className="inline-flex min-h-11 items-center gap-2 text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--accent)]"
          >
            <ArrowLeft size={15} aria-hidden="true" />
            继续浏览其他项目
          </Link>
        </div>
      </div>
    </article>
  );
}

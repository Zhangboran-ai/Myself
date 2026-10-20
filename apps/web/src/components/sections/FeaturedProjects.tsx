import Link from 'next/link';
import type { ProjectSummary } from '@myself/shared';
import { ArrowRight } from 'lucide-react';
import { ProjectCard } from '@/components/content/ProjectCard';

export function FeaturedProjects({ projects }: { projects: ProjectSummary[] }) {
  if (projects.length === 0) return null;

  return (
    <>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
      <div className="mt-8">
        <Link
          href="/projects"
          className="inline-flex min-h-11 items-center gap-2 text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--accent)]"
        >
          查看全部项目
          <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </div>
    </>
  );
}

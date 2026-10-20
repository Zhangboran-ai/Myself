import Image from 'next/image';
import Link from 'next/link';
import type { ProjectSummary } from '@myself/shared';
import { ArrowUpRight } from 'lucide-react';

const GRADIENTS = [
  'linear-gradient(135deg, #16233b 0%, #0d1524 60%, #1b1630 100%)',
  'linear-gradient(135deg, #1a2338 0%, #101828 55%, #231a33 100%)',
  'linear-gradient(135deg, #142a33 0%, #0c161f 60%, #161f33 100%)',
  'linear-gradient(135deg, #241c33 0%, #12101d 60%, #0f1a2b 100%)',
];

function hash(input: string): number {
  let value = 0;
  for (let index = 0; index < input.length; index += 1) {
    value = (value * 31 + input.charCodeAt(index)) % 997;
  }
  return value;
}

const STATUS_LABELS: Record<string, string> = {
  live: '线上',
  oss: '开源',
  archived: '归档',
};

export function ProjectCard({ project }: { project: ProjectSummary }) {
  const gradient = GRADIENTS[hash(project.slug) % GRADIENTS.length] ?? GRADIENTS[0];

  return (
    <Link
      href={`/projects/${project.slug}`}
      className="card card-hover group flex h-full flex-col overflow-hidden"
      aria-label={`查看项目：${project.title}`}
    >
      <div className="relative aspect-[16/9] overflow-hidden border-b border-white/[0.06]">
        {project.coverUrl ? (
          <Image
            src={project.coverUrl}
            alt={`${project.title} 封面`}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="relative h-full w-full" style={{ background: gradient }}>
            <div
              aria-hidden="true"
              className="absolute inset-0 opacity-40"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 20% 30%, rgba(110,168,254,0.35), transparent 45%), radial-gradient(circle at 75% 65%, rgba(167,139,250,0.28), transparent 45%)',
              }}
            />
            <span className="absolute bottom-4 left-5 select-none text-[42px] font-bold leading-none tracking-[-0.04em] text-white/10">
              {project.title.slice(0, 2)}
            </span>
            <span className="absolute right-4 top-4 rounded-full border border-white/[0.12] bg-black/20 px-2.5 py-1 text-[11px] text-white/70">
              {STATUS_LABELS[project.status] ?? project.status}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-lg font-semibold leading-snug tracking-[-0.01em] text-[var(--text-primary)]">
            {project.title}
          </h3>
          <span className="mt-0.5 shrink-0 text-xs tabular-nums text-[var(--text-muted)]">
            {project.year}
          </span>
        </div>

        <p className="mt-2.5 line-clamp-2 text-sm leading-relaxed text-[var(--text-secondary)]">
          {project.summary}
        </p>

        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <ul className="flex flex-wrap gap-1.5">
            {project.tech.slice(0, 4).map((tech) => (
              <li key={tech} className="chip">
                {tech}
              </li>
            ))}
            {project.tech.length > 4 ? <li className="chip">+{project.tech.length - 4}</li> : null}
          </ul>
          <ArrowUpRight
            size={16}
            aria-hidden="true"
            className="shrink-0 text-[var(--text-muted)] transition-colors group-hover:text-[var(--accent)]"
          />
        </div>
      </div>
    </Link>
  );
}

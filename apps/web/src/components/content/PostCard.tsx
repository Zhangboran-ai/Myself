import Link from 'next/link';
import type { PostSummary } from '@myself/shared';
import { ArrowUpRight } from 'lucide-react';
import { formatDate, readingTimeLabel } from '@/lib/format';

export function PostCard({ post }: { post: PostSummary }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group block border-b border-white/[0.08] py-6 first:pt-0 last:border-0"
    >
      <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
        <time dateTime={post.publishedAt ?? undefined}>{formatDate(post.publishedAt)}</time>
        <span aria-hidden="true">·</span>
        <span>{readingTimeLabel(post.readingTime)}</span>
        {post.pinned ? (
          <span className="rounded-full border border-[rgba(245,201,139,0.25)] px-2 py-0.5 text-[11px] text-[var(--accent-warm)]">
            置顶
          </span>
        ) : null}
      </div>

      <div className="mt-2 flex items-start justify-between gap-4">
        <h3 className="text-lg font-medium leading-snug tracking-[-0.01em] text-[var(--text-primary)] transition-colors group-hover:text-[var(--accent)] sm:text-xl">
          {post.title}
        </h3>
        <ArrowUpRight
          size={18}
          aria-hidden="true"
          className="mt-1 shrink-0 text-[var(--text-muted)] transition-all group-hover:-translate-y-0.5 group-hover:text-[var(--accent)]"
        />
      </div>

      <p className="mt-2 line-clamp-2 max-w-[70ch] text-sm leading-relaxed text-[var(--text-secondary)]">
        {post.summary}
      </p>

      {post.tags.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {post.tags.map((tag) => (
            <li key={tag} className="chip">
              #{tag}
            </li>
          ))}
        </ul>
      ) : null}
    </Link>
  );
}

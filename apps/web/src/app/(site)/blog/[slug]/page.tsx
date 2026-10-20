import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Markdown } from '@/components/content/Markdown';
import { TableOfContents } from '@/components/content/TableOfContents';
import { ViewTracker } from '@/components/content/ViewTracker';
import { ApiError, getPost, resolveRedirect } from '@/lib/api';
import { formatDate, readingTimeLabel } from '@/lib/format';
import { extractToc } from '@/lib/markdown';

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

async function loadPost(slug: string) {
  try {
    return await getPost(slug);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      const target = await resolveRedirect('post', slug);
      if (target) redirect(`/blog/${target}`);
      notFound();
    }
    throw error;
  }
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const post = await getPost(slug);
    return {
      title: post.title,
      description: post.summary,
      alternates: { canonical: `/blog/${post.slug}` },
      openGraph: {
        type: 'article',
        title: post.title,
        description: post.summary,
        publishedTime: post.publishedAt ?? undefined,
        modifiedTime: post.updatedAt,
        tags: post.tags,
        images: post.coverUrl ? [post.coverUrl] : ['/og-default.svg'],
      },
    };
  } catch {
    return { title: '文章不存在' };
  }
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = await loadPost(slug);
  const toc = extractToc(post.body);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.summary,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    keywords: post.tags.join(','),
    author: { '@type': 'Person', name: '林深' },
  };

  return (
    <article className="pt-28 pb-20 sm:pt-36">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <ViewTracker slug={post.slug} />

      <div className="container-page">
        <Link
          href="/blog"
          className="inline-flex min-h-10 items-center gap-2 text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
        >
          <ArrowLeft size={15} aria-hidden="true" />
          返回博客
        </Link>

        <header className="mt-8 max-w-[72ch]">
          <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-muted)]">
            <time dateTime={post.publishedAt ?? undefined}>{formatDate(post.publishedAt)}</time>
            <span aria-hidden="true">·</span>
            <span>{readingTimeLabel(post.readingTime)}</span>
            {post.pinned ? (
              <span className="rounded-full border border-[rgba(245,201,139,0.25)] px-2 py-0.5 text-[11px] text-[var(--accent-warm)]">
                置顶
              </span>
            ) : null}
          </div>

          <h1 className="mt-4 text-[clamp(30px,4.6vw,46px)] font-bold leading-[1.2] tracking-[-0.02em]">
            {post.title}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-[var(--text-secondary)]">
            {post.summary}
          </p>

          {post.tags.length > 0 ? (
            <ul className="mt-5 flex flex-wrap gap-1.5">
              {post.tags.map((tag) => (
                <li key={tag} className="chip">
                  #{tag}
                </li>
              ))}
            </ul>
          ) : null}
        </header>

        <hr className="my-8 border-white/[0.08]" />

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_220px] lg:gap-14">
          <div className="min-w-0">
            <TableOfContents items={toc} mode="mobile" />
            <Markdown content={post.body} />

            {post.updatedAt !== post.publishedAt ? (
              <p className="mt-10 text-xs text-[var(--text-muted)]">
                最后更新于 {formatDate(post.updatedAt)}
              </p>
            ) : null}
          </div>

          <aside className="hidden lg:block">
            <TableOfContents items={toc} mode="desktop" />
          </aside>
        </div>

        <nav className="mt-14 grid gap-3 border-t border-white/[0.08] pt-8 sm:grid-cols-2" aria-label="文章导航">
          {post.prev ? (
            <Link
              href={`/blog/${post.prev.slug}`}
              className="card card-hover flex flex-col gap-1.5 p-4"
              rel="prev"
            >
              <span className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                <ArrowLeft size={13} aria-hidden="true" />
                上一篇
              </span>
              <span className="text-sm text-[var(--text-primary)]">{post.prev.title}</span>
            </Link>
          ) : (
            <span />
          )}
          {post.next ? (
            <Link
              href={`/blog/${post.next.slug}`}
              className="card card-hover flex flex-col items-end gap-1.5 p-4 text-right"
              rel="next"
            >
              <span className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                下一篇
                <ArrowRight size={13} aria-hidden="true" />
              </span>
              <span className="text-sm text-[var(--text-primary)]">{post.next.title}</span>
            </Link>
          ) : (
            <span />
          )}
        </nav>
      </div>
    </article>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import clsx from 'clsx';
import { Search } from 'lucide-react';
import { PostCard } from '@/components/content/PostCard';
import { Pagination } from '@/components/ui/Pagination';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { getPosts, getTags } from '@/lib/api';

export const metadata: Metadata = {
  title: '博客',
  description: '关于性能、工程化与界面设计的长文。',
  alternates: { canonical: '/blog' },
};

interface BlogPageProps {
  searchParams: Promise<{ tag?: string; q?: string; page?: string }>;
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const params = await searchParams;
  const tag = params.tag?.trim() || undefined;
  const q = params.q?.trim() || undefined;
  const page = Math.max(1, Number(params.page ?? '1') || 1);

  const [tags, data] = await Promise.all([
    getTags(),
    getPosts({ tag, q, page, pageSize: 10 }),
  ]);

  const activeTag = tags.find((item) => item.slug === tag);

  return (
    <section className="pt-32 pb-20 sm:pt-40">
      <div className="container-page">
        <SectionHeading
          eyebrow="Writing"
          title={activeTag ? `文章 · ${activeTag.name}` : '写下一些东西'}
          description="关于工程、性能与设计的笔记。尽量把「为什么」讲清楚，而不只是「怎么做」。"
        />

        <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            <Link
              href="/blog"
              className={clsx(
                'chip min-h-9 px-3.5 transition-colors',
                !tag
                  ? '!border-[rgba(110,168,254,0.45)] !bg-[rgba(110,168,254,0.10)] !text-[var(--accent)]'
                  : 'hover:!border-white/[0.16] hover:!text-[var(--text-primary)]',
              )}
            >
              全部
            </Link>
            {tags.map((item) => (
              <Link
                key={item.slug}
                href={`/blog?tag=${encodeURIComponent(item.slug)}`}
                className={clsx(
                  'chip min-h-9 px-3.5 transition-colors',
                  tag === item.slug
                    ? '!border-[rgba(110,168,254,0.45)] !bg-[rgba(110,168,254,0.10)] !text-[var(--accent)]'
                    : 'hover:!border-white/[0.16] hover:!text-[var(--text-primary)]',
                )}
              >
                {item.name}
                <span className="text-[10px] text-[var(--text-muted)]">{item.postCount}</span>
              </Link>
            ))}
          </div>

          <form action="/blog" method="get" role="search" className="relative w-full lg:w-64">
            <label htmlFor="blog-search" className="sr-only">
              搜索文章
            </label>
            <Search
              size={15}
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
            />
            <input
              id="blog-search"
              name="q"
              defaultValue={q}
              placeholder="搜索标题或摘要"
              className="field !min-h-10 !pl-10 text-sm"
              maxLength={100}
            />
            {tag ? <input type="hidden" name="tag" value={tag} /> : null}
          </form>
        </div>

        {q ? (
          <p className="mt-6 text-sm text-[var(--text-muted)]">
            「{q}」的搜索结果：{data.meta.total} 篇
            <Link href="/blog" className="ml-3 text-[var(--accent)] hover:underline">
              清除
            </Link>
          </p>
        ) : null}

        {data.items.length === 0 ? (
          <div className="card mt-10 p-10 text-center">
            <p className="text-sm text-[var(--text-secondary)]">
              {q ? '没有找到匹配的文章，换个关键词试试。' : '这个标签下还没有文章。'}
            </p>
            <Link href="/blog" className="btn btn-ghost mt-4">
              返回全部文章
            </Link>
          </div>
        ) : (
          <div className="mt-8 max-w-3xl">
            {data.items.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}

        <Pagination
          page={data.meta.page}
          totalPages={data.meta.totalPages}
          basePath="/blog"
          params={{ tag, q }}
        />
      </div>
    </section>
  );
}

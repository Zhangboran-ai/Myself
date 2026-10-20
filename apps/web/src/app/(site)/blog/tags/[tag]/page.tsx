import type { Metadata } from 'next';
import Link from 'next/link';
import { PostCard } from '@/components/content/PostCard';
import { Pagination } from '@/components/ui/Pagination';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { getPosts, getTags } from '@/lib/api';

interface TagPageProps {
  params: Promise<{ tag: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const { tag } = await params;
  return {
    title: `标签：${decodeURIComponent(tag)}`,
    description: `该标签下的全部文章。`,
  };
}

export default async function TagPage({ params, searchParams }: TagPageProps) {
  const { tag } = await params;
  const { page: pageParam } = await searchParams;
  const decoded = decodeURIComponent(tag);
  const page = Math.max(1, Number(pageParam ?? '1') || 1);

  const [tags, data] = await Promise.all([
    getTags(),
    getPosts({ tag: decoded, page, pageSize: 10 }),
  ]);
  const activeTag = tags.find((item) => item.slug === decoded);

  return (
    <section className="pt-32 pb-20 sm:pt-40">
      <div className="container-page">
        <Link href="/blog" className="text-sm text-[var(--text-muted)] hover:text-[var(--accent)]">
          ← 返回博客
        </Link>

        <div className="mt-6">
          <SectionHeading
            eyebrow="Tag"
            title={`#${activeTag?.name ?? decoded}`}
            description={
              activeTag ? `共 ${activeTag.postCount} 篇与「${activeTag.name}」相关的文章。` : '该标签下的文章。'
            }
          />
        </div>

        {data.items.length === 0 ? (
          <div className="card mt-10 p-10 text-center">
            <p className="text-sm text-[var(--text-secondary)]">这个标签下还没有文章。</p>
            <Link href="/blog" className="btn btn-ghost mt-4">
              浏览全部文章
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
          basePath={`/blog/tags/${encodeURIComponent(decoded)}`}
        />
      </div>
    </section>
  );
}

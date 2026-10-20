import Link from 'next/link';
import type { PostSummary } from '@myself/shared';
import { ArrowRight } from 'lucide-react';
import { PostCard } from '@/components/content/PostCard';

export function LatestPosts({ posts }: { posts: PostSummary[] }) {
  if (posts.length === 0) {
    return (
      <p className="mt-8 text-sm text-[var(--text-muted)]">
        还没有发布文章，第一篇文章正在路上。
      </p>
    );
  }

  return (
    <>
      <div className="mt-10 max-w-3xl">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
      <div className="mt-2">
        <Link
          href="/blog"
          className="inline-flex min-h-11 items-center gap-2 text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--accent)]"
        >
          全部文章
          <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </div>
    </>
  );
}

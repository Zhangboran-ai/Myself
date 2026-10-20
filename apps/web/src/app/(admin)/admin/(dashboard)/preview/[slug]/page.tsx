import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Markdown } from '@/components/content/Markdown';
import { ApiError, getPostPreview } from '@/lib/api';
import { formatDate, readingTimeLabel } from '@/lib/format';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '草稿预览',
  robots: { index: false, follow: false },
};

interface PreviewPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ token?: string }>;
}

export default async function PreviewPage({ params, searchParams }: PreviewPageProps) {
  const { slug } = await params;
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="card p-6">
        <h1 className="text-lg font-semibold">缺少预览令牌</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          请回到文章编辑页，点击「预览」重新生成链接。
        </p>
      </div>
    );
  }

  const post = await getPostPreview(slug, token).catch((error: unknown) => {
    if (error instanceof ApiError) return null;
    throw error;
  });

  if (!post) {
    return (
      <div className="card p-6">
        <h1 className="text-lg font-semibold">预览链接无效或已过期</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          预览链接 10 分钟内有效，请回到编辑页重新生成。
        </p>
        <Link href="/admin/posts" className="btn btn-ghost mt-4">
          返回文章列表
        </Link>
      </div>
    );
  }

  return (
    <article>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/admin/posts/${post.id}`}
          className="inline-flex min-h-10 items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          <ArrowLeft size={15} aria-hidden="true" />
          返回编辑
        </Link>
        <span className="chip !border-[rgba(245,201,139,0.3)] !text-[var(--accent-warm)]">
          预览 · {post.status === 'PUBLISHED' ? '已发布' : post.status === 'DRAFT' ? '草稿' : '已归档'}
        </span>
      </div>

      <header className="mt-6 max-w-[72ch]">
        <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-muted)]">
          <span>{post.publishedAt ? formatDate(post.publishedAt) : '未发布'}</span>
          <span aria-hidden="true">·</span>
          <span>{readingTimeLabel(post.readingTime)}</span>
        </div>
        <h1 className="mt-3 text-[clamp(26px,4vw,40px)] font-bold leading-[1.25] tracking-[-0.02em]">
          {post.title}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-[var(--text-secondary)]">{post.summary}</p>
      </header>

      <hr className="my-8 border-white/[0.08]" />
      <Markdown content={post.body} />
    </article>
  );
}

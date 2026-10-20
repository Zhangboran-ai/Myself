import Link from 'next/link';
import { cookies } from 'next/headers';
import { Plus } from 'lucide-react';
import { getAdminPosts } from '@/lib/api';
import { adminData } from '@/lib/admin';
import { formatDate } from '@/lib/format';
import { DeletePostButton } from '@/components/admin/DeletePostButton';

export const dynamic = 'force-dynamic';

const STATUS_LABELS: Record<string, string> = {
  DRAFT: '草稿',
  PUBLISHED: '已发布',
  ARCHIVED: '已归档',
};

export default async function AdminPostsPage() {
  const cookieHeader = (await cookies()).toString();
  const posts = await adminData(() => getAdminPosts(cookieHeader));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">文章管理</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            共 {posts.length} 篇。发布后前台会在数秒内更新。
          </p>
        </div>
        <Link href="/admin/posts/new" className="btn btn-primary !min-h-10">
          <Plus size={15} aria-hidden="true" />
          新建文章
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="card mt-8 p-10 text-center">
          <p className="text-sm text-[var(--text-secondary)]">还没有文章。</p>
          <Link href="/admin/posts/new" className="btn btn-primary mt-4">
            写第一篇
          </Link>
        </div>
      ) : (
        <div className="card mt-8 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.08] text-xs text-[var(--text-muted)]">
                  <th className="px-4 py-3 font-normal">标题</th>
                  <th className="px-4 py-3 font-normal">状态</th>
                  <th className="px-4 py-3 font-normal">更新时间</th>
                  <th className="px-4 py-3 font-normal">操作</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id} className="border-b border-white/[0.05] last:border-0">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/posts/${post.id}`}
                        className="font-medium text-[var(--text-primary)] hover:text-[var(--accent)]"
                      >
                        {post.title}
                      </Link>
                      <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">/{post.slug}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          post.status === 'PUBLISHED'
                            ? 'text-xs text-[var(--success)]'
                            : post.status === 'DRAFT'
                              ? 'text-xs text-[var(--accent-warm)]'
                              : 'text-xs text-[var(--text-muted)]'
                        }
                      >
                        {STATUS_LABELS[post.status] ?? post.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs tabular-nums text-[var(--text-muted)]">
                      {formatDate(post.updatedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/admin/posts/${post.id}`}
                          className="text-xs text-[var(--text-secondary)] hover:text-[var(--accent)]"
                        >
                          编辑
                        </Link>
                        {post.status === 'PUBLISHED' ? (
                          <Link
                            href={`/blog/${post.slug}`}
                            target="_blank"
                            className="text-xs text-[var(--text-secondary)] hover:text-[var(--accent)]"
                          >
                            查看
                          </Link>
                        ) : null}
                        <DeletePostButton id={post.id} title={post.title} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

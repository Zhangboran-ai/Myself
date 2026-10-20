import Link from 'next/link';
import { cookies } from 'next/headers';
import { Eye, FileText, FolderKanban, Mail } from 'lucide-react';
import { getStatsOverview } from '@/lib/api';
import { adminData } from '@/lib/admin';
import { formatDateTime } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const cookieHeader = (await cookies()).toString();
  const stats = await adminData(() => getStatsOverview(cookieHeader));

  const cards = [
    {
      label: '文章',
      value: stats.posts.total,
      hint: `已发布 ${stats.posts.published} · 草稿 ${stats.posts.draft}`,
      href: '/admin/posts',
      icon: FileText,
    },
    {
      label: '项目',
      value: stats.projects.total,
      hint: `精选 ${stats.projects.featured}`,
      href: '/admin/projects',
      icon: FolderKanban,
    },
    {
      label: '文章浏览量',
      value: stats.views.posts,
      hint: '按访客去重后累计',
      href: '/admin/posts',
      icon: Eye,
    },
    {
      label: '未读留言',
      value: stats.contact.unread,
      hint: `累计 ${stats.contact.total} 条`,
      href: '/admin/messages',
      icon: Mail,
    },
  ];

  return (
    <div>
      <h1 className="text-xl font-semibold">概览</h1>
      <p className="mt-1 text-sm text-[var(--text-muted)]">
        数据生成于 {formatDateTime(stats.generatedAt)}，刷新页面获取最新值。
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.label} href={card.href} className="card card-hover p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-[var(--text-muted)]">{card.label}</p>
                  <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight">
                    {card.value}
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">{card.hint}</p>
                </div>
                <span className="grid size-9 place-items-center rounded-full border border-white/[0.08] text-[var(--accent)]">
                  <Icon size={16} aria-hidden="true" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="card mt-5 p-5">
        <h2 className="text-sm font-medium">快捷操作</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/admin/posts/new" className="btn btn-primary !min-h-10">
            写新文章
          </Link>
          <Link href="/admin/projects/new" className="btn btn-ghost !min-h-10">
            添加项目
          </Link>
          <Link href="/admin/skills" className="btn btn-ghost !min-h-10">
            维护技能
          </Link>
          <Link href="/admin/profile" className="btn btn-ghost !min-h-10">
            更新资料
          </Link>
        </div>
      </div>
    </div>
  );
}

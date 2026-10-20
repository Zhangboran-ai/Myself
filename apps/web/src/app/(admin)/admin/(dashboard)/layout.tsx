import Link from 'next/link';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { FileText, FolderKanban, ExternalLink, Image as ImageIcon, LayoutDashboard, Mail, UserRound, Wrench } from 'lucide-react';
import { getMe } from '@/lib/api';
import { AdminSignOut } from '@/components/admin/AdminSignOut';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '内容管理',
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieHeader = (await cookies()).toString();
  const user = await getMe(cookieHeader).catch(() => null);

  if (!user) {
    redirect('/admin/login');
  }

  return (
    <div className="min-h-svh">
      <header className="border-b border-white/[0.08] bg-[rgba(7,10,18,0.8)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <div className="flex items-center gap-3">
            <span className="grid size-8 place-items-center rounded-full border border-white/[0.10] text-[var(--accent)]">
              <LayoutDashboard size={15} aria-hidden="true" />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-medium">内容管理</p>
              <p className="text-[11px] text-[var(--text-muted)]">你好，{user.displayName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              target="_blank"
              className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-white/[0.08] px-3 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              <ExternalLink size={13} aria-hidden="true" />
              查看站点
            </Link>
            <AdminSignOut />
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-8 lg:flex-row">
        <nav className="flex shrink-0 gap-2 lg:w-44 lg:flex-col" aria-label="后台导航">
          <Link
            href="/admin"
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/[0.08] px-3 text-sm text-[var(--text-secondary)] hover:border-white/[0.16] hover:text-[var(--text-primary)]"
          >
            <LayoutDashboard size={15} aria-hidden="true" />
            概览
          </Link>
          <Link
            href="/admin/posts"
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/[0.08] px-3 text-sm text-[var(--text-secondary)] hover:border-white/[0.16] hover:text-[var(--text-primary)]"
          >
            <FileText size={15} aria-hidden="true" />
            文章
          </Link>
          <Link
            href="/admin/projects"
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/[0.08] px-3 text-sm text-[var(--text-secondary)] hover:border-white/[0.16] hover:text-[var(--text-primary)]"
          >
            <FolderKanban size={15} aria-hidden="true" />
            项目
          </Link>
          <Link
            href="/admin/skills"
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/[0.08] px-3 text-sm text-[var(--text-secondary)] hover:border-white/[0.16] hover:text-[var(--text-primary)]"
          >
            <Wrench size={15} aria-hidden="true" />
            技能
          </Link>
          <Link
            href="/admin/media"
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/[0.08] px-3 text-sm text-[var(--text-secondary)] hover:border-white/[0.16] hover:text-[var(--text-primary)]"
          >
            <ImageIcon size={15} aria-hidden="true" />
            媒体库
          </Link>
          <Link
            href="/admin/messages"
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/[0.08] px-3 text-sm text-[var(--text-secondary)] hover:border-white/[0.16] hover:text-[var(--text-primary)]"
          >
            <Mail size={15} aria-hidden="true" />
            留言
          </Link>
          <Link
            href="/admin/profile"
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/[0.08] px-3 text-sm text-[var(--text-secondary)] hover:border-white/[0.16] hover:text-[var(--text-primary)]"
          >
            <UserRound size={15} aria-hidden="true" />
            个人资料
          </Link>
        </nav>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}

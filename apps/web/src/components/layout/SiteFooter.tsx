import Link from 'next/link';
import { Rss } from 'lucide-react';

interface SiteFooterProps {
  name: string;
  email: string;
}

export function SiteFooter({ name, email }: SiteFooterProps) {
  return (
    <footer className="border-t border-white/[0.08] py-12">
      <div className="container-page flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-[var(--text-primary)]">{name}</p>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-[var(--text-muted)]">
            把想法写下来，把界面做干净。欢迎通过邮件或社交媒体联系。
          </p>
          <a
            href={`mailto:${email}`}
            className="mt-3 inline-block text-sm text-[var(--text-secondary)] underline decoration-white/20 underline-offset-4 hover:text-[var(--accent)]"
          >
            {email}
          </a>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-[var(--text-muted)]">
          <Link href="/projects" className="hover:text-[var(--text-primary)]">
            项目
          </Link>
          <Link href="/blog" className="hover:text-[var(--text-primary)]">
            博客
          </Link>
          <a href="/rss.xml" className="inline-flex items-center gap-1.5 hover:text-[var(--text-primary)]">
            <Rss size={14} aria-hidden="true" />
            RSS
          </a>
          <a href="#top" className="hover:text-[var(--text-primary)]">
            回到顶部
          </a>
        </div>
      </div>

      <div className="container-page mt-10 flex flex-col gap-2 text-xs text-[var(--text-muted)] sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} {name}. 保留所有权利。</p>
        <p className="text-[var(--text-muted)]">用 Next.js 与 Canvas 构建</p>
      </div>
    </footer>
  );
}

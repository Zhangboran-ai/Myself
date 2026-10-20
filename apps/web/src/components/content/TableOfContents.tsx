'use client';

import { useEffect, useState } from 'react';
import type { TocItem } from '@myself/shared';
import clsx from 'clsx';

export function TableOfContents({
  items,
  mode = 'all',
}: {
  items: TocItem[];
  mode?: 'all' | 'desktop' | 'mobile';
}) {
  const [activeId, setActiveId] = useState<string>(items[0]?.id ?? '');

  useEffect(() => {
    if (items.length === 0) return;

    const headings = items
      .map((item) => document.getElementById(item.id))
      .filter((element): element is HTMLElement => Boolean(element));

    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]?.target.id) setActiveId(visible[0].target.id);
      },
      { rootMargin: '-88px 0px -65% 0px', threshold: [0, 1] },
    );

    headings.forEach((heading) => observer.observe(heading));
    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  const list = (
    <ul className="space-y-1.5 border-l border-white/[0.08] pl-3">
      {items.map((item) => (
        <li key={item.id} className={item.level === 3 ? 'pl-3' : undefined}>
          <a
            href={`#${item.id}`}
            className={clsx(
              'block py-1 text-[13px] leading-snug transition-colors',
              activeId === item.id
                ? 'text-[var(--accent)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
            )}
          >
            {item.text}
          </a>
        </li>
      ))}
    </ul>
  );

  return (
    <>
      {mode !== 'mobile' ? (
        <nav
          aria-label="文章目录"
          className="sticky top-28 hidden max-h-[calc(100svh-160px)] overflow-y-auto lg:block"
        >
          <p className="mb-3 text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
            目录
          </p>
          {list}
        </nav>
      ) : null}

      {mode !== 'desktop' ? (
        <details className="card mb-8 p-4 lg:hidden">
          <summary className="cursor-pointer text-sm text-[var(--text-secondary)]">文章目录</summary>
          <nav aria-label="文章目录" className="mt-3">
            {list}
          </nav>
        </details>
      ) : null}
    </>
  );
}

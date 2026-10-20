'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Menu, X } from 'lucide-react';
import clsx from 'clsx';

const NAV_ITEMS = [
  { href: '/', label: '首页' },
  { href: '/projects', label: '项目' },
  { href: '/blog', label: '博客' },
  { href: '/about', label: '关于' },
];

interface SiteHeaderProps {
  name: string;
  email: string;
}

export function SiteHeader({ name, email }: SiteHeaderProps) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.querySelector<HTMLElement>('a, button')?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        return;
      }
      if (event.key !== 'Tab' || !panelRef.current) return;

      const focusable = panelRef.current.querySelectorAll<HTMLElement>('a[href], button');
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    const menuButton = menuButtonRef.current;
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      menuButton?.focus();
    };
  }, [open]);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <header
      className={clsx(
        'fixed inset-x-0 top-0 z-40 transition-colors duration-200',
        scrolled || open
          ? 'border-b border-white/[0.08] bg-[rgba(7,10,18,0.82)] backdrop-blur-xl'
          : 'border-b border-transparent bg-transparent',
      )}
    >
      <div className="container-page flex h-16 items-center justify-between sm:h-[72px]">
        <Link href="/" className="flex items-center gap-3" aria-label={`${name} 的首页`}>
          <span className="grid size-9 place-items-center rounded-full border border-white/[0.10] bg-gradient-to-br from-[#1b2740] to-[#0d1424] text-sm font-semibold text-[var(--accent)]">
            {name.slice(0, 1)}
          </span>
          <span className="text-sm font-medium tracking-wide text-[var(--text-primary)]">
            {name}
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="主导航">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? 'page' : undefined}
              className={clsx(
                'rounded-full px-4 py-2 text-sm transition-colors',
                isActive(item.href)
                  ? 'bg-white/[0.06] text-[var(--text-primary)]'
                  : 'text-[var(--text-secondary)] hover:bg-white/[0.04] hover:text-[var(--text-primary)]',
              )}
            >
              {item.label}
            </Link>
          ))}
          <a href={`mailto:${email}`} className="btn btn-primary ml-2 !min-h-9 !px-4 !text-[13px]">
            联系我
          </a>
        </nav>

        <button
          ref={menuButtonRef}
          type="button"
          className="grid size-11 place-items-center rounded-full border border-white/[0.10] text-[var(--text-secondary)] md:hidden"
          aria-label="打开导航菜单"
          aria-expanded={open}
          aria-controls="mobile-navigation"
          onClick={() => setOpen(true)}
        >
          <Menu size={18} aria-hidden="true" />
        </button>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="关闭导航菜单"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div
            ref={panelRef}
            id="mobile-navigation"
            role="dialog"
            aria-modal="true"
            aria-label="导航菜单"
            className="absolute right-0 top-0 h-full w-[min(86vw,340px)] border-l border-white/[0.10] bg-[#080c15] p-6 shadow-2xl"
          >
            <div className="mb-8 flex items-center justify-between">
              <span className="text-sm text-[var(--text-secondary)]">{name}</span>
              <button
                type="button"
                className="grid size-11 place-items-center rounded-full border border-white/[0.10] text-[var(--text-secondary)]"
                aria-label="关闭导航菜单"
                onClick={() => setOpen(false)}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <nav className="flex flex-col gap-1" aria-label="移动端导航">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                  className={clsx(
                    'rounded-xl px-4 py-3 text-base transition-colors',
                    isActive(item.href)
                      ? 'bg-white/[0.06] text-[var(--text-primary)]'
                      : 'text-[var(--text-secondary)] hover:bg-white/[0.04] hover:text-[var(--text-primary)]',
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="mt-8 border-t border-white/[0.08] pt-6">
              <a href={`mailto:${email}`} className="btn btn-primary w-full">
                联系我
              </a>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}

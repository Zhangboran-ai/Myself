import Link from 'next/link';
import { ArrowUpRight, Download, Mail } from 'lucide-react';
import type { Profile } from '@myself/shared';
import { SocialIcon } from '@/components/ui/SocialIcon';

interface HeroProps {
  profile: Profile;
}

export function Hero({ profile }: HeroProps) {
  const firstParagraph = profile.bio[0] ?? '';

  return (
    <section className="relative flex min-h-[calc(100svh-72px)] items-center pt-28 pb-16 sm:pt-32">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/3 -z-[1] h-[420px] w-[680px] max-w-[90vw] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60 blur-[100px]"
        style={{
          background:
            'radial-gradient(circle, rgba(110,168,254,0.18) 0%, rgba(167,139,250,0.10) 45%, transparent 70%)',
        }}
      />

      <div className="container-page">
        <div className="max-w-3xl">
          <div className="animate-rise flex flex-wrap items-center gap-3">
            <span className="eyebrow">Portfolio / {new Date().getFullYear()}</span>
            {profile.statusLabel ? (
              <span className="chip !border-[rgba(74,222,128,0.24)] !text-[#9ae6b4]">
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#4ade80] opacity-60" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-[#4ade80]" />
                </span>
                {profile.statusLabel}
              </span>
            ) : null}
          </div>

          <h1
            className="animate-rise mt-7 text-[clamp(40px,7vw,72px)] font-bold leading-[1.05] tracking-[-0.03em]"
            style={{ animationDelay: '60ms' }}
          >
            <span className="gradient-text">{profile.name}</span>
            <span className="mt-2 block text-[clamp(20px,3vw,32px)] font-medium tracking-[-0.01em] text-[var(--text-secondary)]">
              {profile.headline}
            </span>
          </h1>

          <p
            className="animate-rise mt-7 max-w-2xl text-[15px] leading-[1.9] text-[var(--text-secondary)] sm:text-base"
            style={{ animationDelay: '120ms' }}
          >
            {firstParagraph}
          </p>

          <div
            className="animate-rise mt-9 flex flex-wrap items-center gap-3"
            style={{ animationDelay: '180ms' }}
          >
            <Link href="/projects" className="btn btn-primary">
              查看项目
              <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
            <Link href="/blog" className="btn btn-ghost">
              阅读文章
            </Link>
            {profile.resumeUrl ? (
              <a
                href={profile.resumeUrl}
                className="btn btn-ghost"
                download
                aria-label="下载简历 PDF"
              >
                <Download size={16} aria-hidden="true" />
                简历
              </a>
            ) : null}
          </div>

          <div
            className="animate-rise mt-10 flex flex-wrap items-center gap-2"
            style={{ animationDelay: '240ms' }}
          >
            {profile.socials.map((social) => (
              <a
                key={social.href}
                href={social.href}
                target={social.href.startsWith('http') ? '_blank' : undefined}
                rel={social.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/[0.08] px-4 text-sm text-[var(--text-secondary)] transition-colors hover:border-white/[0.16] hover:text-[var(--text-primary)]"
              >
                <SocialIcon name={social.icon} />
                {social.label}
              </a>
            ))}
            <a
              href={`mailto:${profile.email}`}
              className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/[0.08] px-4 text-sm text-[var(--text-secondary)] transition-colors hover:border-white/[0.16] hover:text-[var(--text-primary)]"
            >
              <Mail size={15} aria-hidden="true" />
              {profile.email}
            </a>
          </div>
        </div>

        <div className="mt-16 flex items-center gap-3 text-xs text-[var(--text-muted)]">
          <span className="h-8 w-px bg-gradient-to-b from-white/20 to-transparent" aria-hidden="true" />
          向下滚动，看看我做过什么
        </div>
      </div>
    </section>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight, MapPin } from 'lucide-react';
import { getSite, getSkills } from '@/lib/api';
import { formatRange } from '@/lib/format';
import { SocialIcon } from '@/components/ui/SocialIcon';
import { SkillsSection } from '@/components/sections/SkillsSection';
import { SectionHeading } from '@/components/ui/SectionHeading';

export const metadata: Metadata = {
  title: '关于我',
  description: '关于我的经历、工作方式与技术背景。',
  alternates: { canonical: '/about' },
};

export default async function AboutPage() {
  const [site, skills] = await Promise.all([getSite(), getSkills()]);
  const { profile, experiences } = site;
  const work = experiences.filter((item) => item.kind === 'work');
  const education = experiences.filter((item) => item.kind === 'education');

  return (
    <>
      <section className="pt-32 pb-16 sm:pt-40">
        <div className="container-page">
          <p className="eyebrow">About</p>
          <h1 className="mt-4 text-[clamp(32px,5vw,52px)] font-bold leading-[1.15] tracking-[-0.02em]">
            你好，我是{profile.name}
          </h1>
          <p className="mt-3 text-lg text-[var(--text-secondary)]">{profile.headline}</p>

          <div className="mt-8 max-w-[68ch] space-y-5 text-[15px] leading-[1.95] text-[var(--text-secondary)]">
            {profile.bio.map((paragraph) => (
              <p key={paragraph.slice(0, 24)}>{paragraph}</p>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-[var(--text-muted)]">
            {profile.location ? (
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={14} aria-hidden="true" />
                {profile.location}
              </span>
            ) : null}
            <a
              href={`mailto:${profile.email}`}
              className="inline-flex items-center gap-1.5 hover:text-[var(--accent)]"
            >
              {profile.email}
            </a>
            {profile.socials.map((social) => (
              <a
                key={social.href}
                href={social.href}
                target={social.href.startsWith('http') ? '_blank' : undefined}
                rel={social.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="inline-flex items-center gap-1.5 hover:text-[var(--accent)]"
              >
                <SocialIcon name={social.icon} size={14} />
                {social.label}
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="section border-t border-white/[0.06]">
        <div className="container-page">
          <SectionHeading
            eyebrow="Experience"
            title="工作经历"
            description="按时间倒序，只保留与工程能力相关的关键信息。"
          />

          <ol className="mt-10 space-y-8">
            {work.map((item) => (
              <li key={item.id} className="relative border-l border-white/[0.10] pl-6 sm:pl-8">
                <span
                  aria-hidden="true"
                  className="absolute -left-[4.5px] top-2 size-2 rounded-full bg-[var(--accent)] shadow-[0_0_12px_var(--glow)]"
                />
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <h3 className="text-base font-medium text-[var(--text-primary)]">
                    {item.role}
                    <span className="text-[var(--text-muted)]"> · </span>
                    <span className="text-[var(--text-secondary)]">{item.company}</span>
                  </h3>
                  <time className="text-xs tabular-nums text-[var(--text-muted)]">
                    {formatRange(item.startDate, item.endDate)}
                  </time>
                </div>
                {item.summary ? (
                  <p className="mt-2 max-w-[64ch] text-sm leading-relaxed text-[var(--text-secondary)]">
                    {item.summary}
                  </p>
                ) : null}
              </li>
            ))}
          </ol>

          {education.length > 0 ? (
            <div className="mt-12">
              <h3 className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">教育</h3>
              <ul className="mt-4 space-y-3">
                {education.map((item) => (
                  <li key={item.id} className="flex flex-wrap justify-between gap-2 text-sm">
                    <span className="text-[var(--text-secondary)]">
                      {item.company} · {item.role}
                    </span>
                    <span className="text-xs tabular-nums text-[var(--text-muted)]">
                      {formatRange(item.startDate, item.endDate)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </section>

      <section className="section border-t border-white/[0.06]">
        <div className="container-page">
          <SectionHeading
            eyebrow="Toolbox"
            title="我的工具箱"
            description="技能的熟练度以实际项目使用为准，不使用百分比。"
          />
          <SkillsSection groups={skills} />
        </div>
      </section>

      <section className="section border-t border-white/[0.06]">
        <div className="container-page">
          <div className="card flex flex-col items-start justify-between gap-6 p-6 sm:flex-row sm:items-center sm:p-8">
            <div>
              <h2 className="text-xl font-semibold">有合适的机会或想法？</h2>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                我开放远程合作与技术咨询，也欢迎纯粹的技术交流。
              </p>
            </div>
            <Link href="/contact" className="btn btn-primary">
              联系我
              <ArrowUpRight size={15} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

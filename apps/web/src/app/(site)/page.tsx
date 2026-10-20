import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowRight } from 'lucide-react';
import { SITE_NAME } from '@myself/shared';
import { Hero } from '@/components/sections/Hero';
import { SkillsSection } from '@/components/sections/SkillsSection';
import { FeaturedProjects } from '@/components/sections/FeaturedProjects';
import { LatestPosts } from '@/components/sections/LatestPosts';
import { ContactSection } from '@/components/sections/ContactSection';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { getPosts, getProjects, getSite, getSkills } from '@/lib/api';

export const metadata: Metadata = {
  title: '首页',
  description: '前端工程师的个人主页：项目、技能与关于工程和设计的思考。',
  alternates: { canonical: '/' },
};

export default async function HomePage() {
  const [site, skills, projects, posts] = await Promise.all([
    getSite(),
    getSkills(),
    getProjects({ featured: true, pageSize: 3 }),
    getPosts({ pageSize: 3 }),
  ]);

  const { profile } = site;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.name,
    jobTitle: profile.headline,
    email: profile.email,
    address: profile.location ? { '@type': 'PostalAddress', addressLocality: profile.location } : undefined,
    sameAs: profile.socials
      .filter((social) => social.href.startsWith('http'))
      .map((social) => social.href),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
        }}
      />

      <Hero profile={profile} />

      <section id="skills" className="section border-t border-white/[0.06]">
        <div className="container-page">
          <SectionHeading
            eyebrow="Capabilities"
            title="技能与工具"
            description="下面是我日常真正在用的技术，按熟悉程度标注，并与项目经历相互对应。"
            action={
              <Link
                href="/about"
                className="inline-flex min-h-11 items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--accent)]"
              >
                了解更多
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
            }
          />
          <SkillsSection groups={skills} />
        </div>
      </section>

      <section id="projects" className="section border-t border-white/[0.06]">
        <div className="container-page">
          <SectionHeading
            eyebrow="Selected Work"
            title="精选项目"
            description="从个人工具到团队系统，每一个都记录了具体的取舍与结果。"
          />
          <FeaturedProjects projects={projects.items} />
        </div>
      </section>

      <section id="writing" className="section border-t border-white/[0.06]">
        <div className="container-page">
          <SectionHeading
            eyebrow="Writing"
            title="最近写下的"
            description="关于性能、工程化与界面设计的长文，尽量写清楚「为什么」。"
          />
          <LatestPosts posts={posts.items} />
        </div>
      </section>

      <section id="contact" className="section border-t border-white/[0.06]">
        <div className="container-page">
          <SectionHeading
            eyebrow="Contact"
            title="一起做点东西"
            description="无论是项目合作、技术交流，还是简单的问候，我都很乐意收到。"
          />
          <ContactSection profile={profile} />
        </div>
      </section>

      <p className="container-page pb-10 text-xs text-[var(--text-muted)]">
        {SITE_NAME} · 用代码记录思考
      </p>
    </>
  );
}

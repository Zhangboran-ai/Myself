import type { Metadata } from 'next';
import { ContactSection } from '@/components/sections/ContactSection';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { getSite } from '@/lib/api';

export const metadata: Metadata = {
  title: '联系',
  description: '通过邮件、社交媒体或表单与我联系。',
  alternates: { canonical: '/contact' },
};

export default async function ContactPage() {
  const site = await getSite();

  return (
    <section className="pt-32 pb-20 sm:pt-40">
      <div className="container-page">
        <SectionHeading
          eyebrow="Contact"
          title="聊聊你的想法"
          description="我通常会在 48 小时内回复。涉及具体项目时，附上背景与目标会让沟通更高效。"
        />
        <ContactSection profile={site.profile} />
      </div>
    </section>
  );
}

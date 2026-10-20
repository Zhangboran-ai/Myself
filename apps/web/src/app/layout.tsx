import type { Metadata, Viewport } from 'next';
import { StarField } from '@/components/background/StarField';
import { SITE_NAME } from '@myself/shared';
import './globals.css';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${SITE_NAME} · 个人主页`,
    template: `%s · ${SITE_NAME}`,
  },
  description:
    '前端工程师的个人主页：项目、技能与关于工程和设计的思考。深色星空主题，关注交互与性能。',
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME }],
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    siteName: SITE_NAME,
    title: `${SITE_NAME} · 个人主页`,
    description: '前端工程师的项目、技能与文章。',
    images: ['/og-default.svg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} · 个人主页`,
    description: '前端工程师的项目、技能与文章。',
    images: ['/og-default.svg'],
  },
  icons: {
    icon: '/favicon.svg',
  },
};

export const viewport: Viewport = {
  themeColor: '#070a12',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body id="top">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-[var(--accent)] focus:px-4 focus:py-2 focus:text-sm focus:text-[#06101f]"
        >
          跳到主要内容
        </a>
        <StarField />
        <div className="relative z-0">{children}</div>
      </body>
    </html>
  );
}

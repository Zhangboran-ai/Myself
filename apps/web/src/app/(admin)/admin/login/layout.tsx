import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '登录 · 内容管理',
  robots: { index: false, follow: false },
};

export default function AdminLoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}

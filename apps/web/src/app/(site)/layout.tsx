import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { getSite } from '@/lib/api';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  // 导航在 API 不可用时仍要可渲染，因此这里做降级而不是直接抛错
  const site = await getSite().catch(() => null);
  const name = site?.profile.name ?? '林深';
  const email = site?.profile.email ?? 'hello@linshen.dev';

  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader name={name} email={email} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter name={name} email={email} />
    </div>
  );
}

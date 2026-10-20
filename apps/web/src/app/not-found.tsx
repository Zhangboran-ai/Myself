import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center px-6 text-center">
      <p className="eyebrow">404 / Lost in space</p>
      <h1 className="mt-5 text-[clamp(40px,8vw,80px)] font-bold tracking-[-0.03em]">
        <span className="gradient-text">这片星域是空的</span>
      </h1>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-[var(--text-secondary)]">
        你访问的页面不存在，或者已经被移动到别处。可以回到首页，或者去看看项目与文章。
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn btn-primary">
          回到首页
        </Link>
        <Link href="/blog" className="btn btn-ghost">
          浏览文章
        </Link>
      </div>
    </main>
  );
}

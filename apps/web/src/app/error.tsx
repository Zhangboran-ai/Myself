'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-svh flex-col items-center justify-center px-6 text-center">
      <p className="eyebrow">Something went wrong</p>
      <h1 className="mt-5 text-3xl font-bold tracking-[-0.02em]">页面加载失败</h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-[var(--text-secondary)]">
        可能是内容服务暂时不可用。稍后重试，或者刷新页面。
      </p>
      <button type="button" onClick={reset} className="btn btn-primary mt-8">
        重试
      </button>
    </main>
  );
}

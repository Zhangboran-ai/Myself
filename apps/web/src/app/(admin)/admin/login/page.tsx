'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { Loader2, LockKeyhole } from 'lucide-react';
import { login } from '@/lib/client-api';

export default function AdminLoginPage() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError('');

    const data = new FormData(event.currentTarget);
    try {
      await login(String(data.get('username') ?? ''), String(data.get('password') ?? ''));
      router.replace('/admin/posts');
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '登录失败');
      setPending(false);
    }
  };

  return (
    <main className="flex min-h-svh items-center justify-center px-5 py-16">
      <div className="w-full max-w-sm">
        <Link href="/" className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]">
          ← 返回站点
        </Link>

        <div className="card mt-6 p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full border border-white/[0.10] text-[var(--accent)]">
              <LockKeyhole size={18} aria-hidden="true" />
            </span>
            <div>
              <h1 className="text-lg font-semibold">管理后台</h1>
              <p className="text-xs text-[var(--text-muted)]">仅站主可访问</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <div>
              <label htmlFor="username" className="mb-1.5 block text-xs text-[var(--text-muted)]">
                用户名
              </label>
              <input
                id="username"
                name="username"
                required
                autoComplete="username"
                className="field"
                defaultValue="admin"
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-xs text-[var(--text-muted)]">
                密码
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="field"
              />
            </div>

            {error ? (
              <p role="alert" className="text-sm text-[var(--danger)]">
                {error}
              </p>
            ) : null}

            <button type="submit" className="btn btn-primary w-full" disabled={pending}>
              {pending ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : null}
              {pending ? '登录中…' : '登录'}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-xs text-[var(--text-muted)]">
          {process.env.NODE_ENV === 'production'
            ? '仅站主可访问，登录状态 7 天内有效。'
            : '本地开发默认账号 admin / admin12345，请在生产环境修改。'}
        </p>
      </div>
    </main>
  );
}

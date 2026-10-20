'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LogOut } from 'lucide-react';
import { logout } from '@/lib/client-api';

export function AdminSignOut() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const handleClick = async () => {
    setPending(true);
    try {
      await logout();
    } finally {
      router.replace('/admin/login');
      router.refresh();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-white/[0.08] px-3 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
    >
      <LogOut size={13} aria-hidden="true" />
      退出
    </button>
  );
}

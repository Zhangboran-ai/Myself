'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import { deletePost } from '@/lib/client-api';

export function DeletePostButton({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    if (!window.confirm(`确定删除《${title}》吗？删除后前台将不可见。`)) return;
    setPending(true);
    setError('');
    try {
      await deletePost(id);
      router.refresh();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : '删除失败');
    } finally {
      setPending(false);
    }
  };

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={handleDelete}
        disabled={pending}
        className="inline-flex min-h-8 items-center gap-1 rounded-md px-2 text-xs text-[var(--text-muted)] hover:text-[var(--danger)]"
        aria-label={`删除文章 ${title}`}
      >
        {pending ? (
          <Loader2 size={13} className="animate-spin" aria-hidden="true" />
        ) : (
          <Trash2 size={13} aria-hidden="true" />
        )}
        删除
      </button>
      {error ? <span className="text-[11px] text-[var(--danger)]">{error}</span> : null}
    </span>
  );
}

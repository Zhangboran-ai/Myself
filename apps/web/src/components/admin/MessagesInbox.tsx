'use client';

import { useState } from 'react';
import { Loader2, Mail, MailOpen } from 'lucide-react';
import type { ContactMessageItem, ContactMessageStatus, PageMeta } from '@myself/shared';
import { listContactMessages, updateContactMessage } from '@/lib/client-api';
import { formatDateTime } from '@/lib/format';

const FILTERS: { value: ContactMessageStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: '全部' },
  { value: 'NEW', label: '未读' },
  { value: 'READ', label: '已读' },
  { value: 'REPLIED', label: '已回复' },
  { value: 'SPAM', label: '垃圾' },
];

const STATUS_LABELS: Record<ContactMessageStatus, string> = {
  NEW: '未读',
  READ: '已读',
  REPLIED: '已回复',
  SPAM: '垃圾',
};

interface MessagesInboxProps {
  initial: ContactMessageItem[];
  initialMeta: PageMeta;
}

export function MessagesInbox({ initial, initialMeta }: MessagesInboxProps) {
  const [items, setItems] = useState(initial);
  const [meta, setMeta] = useState(initialMeta);
  const [filter, setFilter] = useState<ContactMessageStatus | 'ALL'>('ALL');
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState('');
  const [error, setError] = useState('');

  const load = async (nextFilter: ContactMessageStatus | 'ALL', page = 1) => {
    setLoading(true);
    setError('');
    try {
      const result = await listContactMessages({
        page,
        pageSize: meta.pageSize,
        ...(nextFilter === 'ALL' ? {} : { status: nextFilter }),
      });
      setItems(result.items);
      setMeta(result.meta);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : '留言加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = (next: ContactMessageStatus | 'ALL') => {
    setFilter(next);
    void load(next, 1);
  };

  const handleStatus = async (item: ContactMessageItem, status: ContactMessageStatus) => {
    setUpdatingId(item.id);
    setError('');
    try {
      const updated = await updateContactMessage(item.id, status);
      setItems((current) =>
        current.map((entry) => (entry.id === updated.id ? updated : entry)),
      );
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : '状态更新失败');
    } finally {
      setUpdatingId('');
    }
  };

  return (
    <div>
      <div>
        <h1 className="text-xl font-semibold">联系留言</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          共 {meta.total} 条。配置 SMTP 后新留言会同时发送到邮箱。
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2" role="tablist" aria-label="留言状态筛选">
        {FILTERS.map((option) => (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={filter === option.value}
            onClick={() => handleFilter(option.value)}
            className={`min-h-9 rounded-full border px-3 text-xs transition-colors ${
              filter === option.value
                ? 'border-[var(--accent)] text-[var(--accent)]'
                : 'border-white/[0.08] text-[var(--text-secondary)] hover:border-white/[0.16]'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {error ? (
        <p role="alert" className="mt-4 text-sm text-[var(--danger)]">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="mt-8 flex items-center justify-center gap-2 text-sm text-[var(--text-muted)]">
          <Loader2 size={14} className="animate-spin" aria-hidden="true" />
          加载中…
        </p>
      ) : items.length === 0 ? (
        <div className="card mt-6 p-10 text-center text-sm text-[var(--text-secondary)]">
          这里还没有留言。
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {items.map((item) => (
            <li key={item.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">{item.name}</span>
                    <a
                      href={`mailto:${item.email}`}
                      className="text-xs text-[var(--accent)] hover:underline"
                    >
                      {item.email}
                    </a>
                    <span
                      className={`chip ${
                        item.status === 'NEW'
                          ? '!border-[rgba(245,201,139,0.35)] !text-[var(--accent-warm)]'
                          : item.status === 'SPAM'
                            ? '!text-[var(--text-muted)]'
                            : '!text-[var(--success)]'
                      }`}
                    >
                      {STATUS_LABELS[item.status]}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {formatDateTime(item.createdAt)}
                    {item.subject ? ` · ${item.subject}` : ''}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {item.status === 'NEW' ? (
                    <button
                      type="button"
                      onClick={() => void handleStatus(item, 'READ')}
                      disabled={updatingId === item.id}
                      className="btn btn-ghost !min-h-9 !px-3 !text-xs"
                    >
                      <MailOpen size={13} aria-hidden="true" />
                      标记已读
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => void handleStatus(item, 'REPLIED')}
                    disabled={updatingId === item.id}
                    className="btn btn-ghost !min-h-9 !px-3 !text-xs"
                  >
                    <Mail size={13} aria-hidden="true" />
                    已回复
                  </button>
                  {item.status !== 'SPAM' ? (
                    <button
                      type="button"
                      onClick={() => void handleStatus(item, 'SPAM')}
                      disabled={updatingId === item.id}
                      className="btn btn-ghost !min-h-9 !px-3 !text-xs !text-[var(--text-muted)]"
                    >
                      标记垃圾
                    </button>
                  ) : null}
                </div>
              </div>

              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-[var(--text-secondary)]">
                {item.content}
              </p>
            </li>
          ))}
        </ul>
      )}

      {items.length < meta.total ? (
        <div className="mt-6 text-center">
          <button
            type="button"
            disabled={loading}
            onClick={() =>
              void (async () => {
                setLoading(true);
                try {
                  const result = await listContactMessages({
                    page: meta.page + 1,
                    pageSize: meta.pageSize,
                    ...(filter === 'ALL' ? {} : { status: filter }),
                  });
                  setItems((current) => [...current, ...result.items]);
                  setMeta(result.meta);
                } catch (loadError) {
                  setError(loadError instanceof Error ? loadError.message : '加载失败');
                } finally {
                  setLoading(false);
                }
              })()
            }
            className="btn btn-ghost !min-h-10"
          >
            加载更多
          </button>
        </div>
      ) : null}
    </div>
  );
}

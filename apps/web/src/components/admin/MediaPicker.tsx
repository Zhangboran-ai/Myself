'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Image as ImageIcon, Loader2, Upload, X } from 'lucide-react';
import type { MediaItem } from '@myself/shared';
import { listMedia, uploadMedia } from '@/lib/client-api';

interface MediaPickerProps {
  id: string;
  value: string;
  onChange: (url: string) => void;
  label?: string;
}

/** 封面字段 + 媒体库选择弹窗；上传后立即选中，避免「先上传再回来复制地址」。 */
export function MediaPicker({ id, value, onChange, label = '封面图（可选）' }: MediaPickerProps) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;

      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    closeRef.current?.focus();

    setLoading(true);
    setError('');
    listMedia({ pageSize: 24 })
      .then((result) => setItems(result.items))
      .catch((loadError: unknown) =>
        setError(loadError instanceof Error ? loadError.message : '媒体库加载失败'),
      )
      .finally(() => setLoading(false));

    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, close]);

  const handleUpload = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const item = await uploadMedia(file);
      setItems((current) => [item, ...current]);
      onChange(item.url);
      close();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : '上传失败');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs text-[var(--text-muted)]">
        {label}
      </label>
      <div className="flex gap-2">
        <input
          id={id}
          type="url"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="field !text-[13px]"
          placeholder="https://…"
        />
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="btn btn-ghost shrink-0 !min-h-11 !px-3"
        >
          <ImageIcon size={14} aria-hidden="true" />
          选择
        </button>
      </div>
      {value ? (
        <div className="relative mt-2 h-24 w-40 overflow-hidden rounded-lg border border-white/[0.08]">
          <Image src={value} alt="" fill sizes="160px" className="object-cover" />
        </div>
      ) : null}

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(3,6,12,0.72)] p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${id}-media-title`}
            className="card max-h-[80svh] w-full max-w-3xl overflow-y-auto p-5"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 id={`${id}-media-title`} className="text-sm font-medium">
                从媒体库选择
              </h2>
              <div className="flex items-center gap-2">
                <label className="btn btn-primary !min-h-9 !px-3 !text-xs cursor-pointer">
                  {uploading ? (
                    <Loader2 size={13} className="animate-spin" aria-hidden="true" />
                  ) : (
                    <Upload size={13} aria-hidden="true" />
                  )}
                  {uploading ? '上传中…' : '上传新图片'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    className="sr-only"
                    disabled={uploading}
                    onChange={(event) => void handleUpload(event.target.files)}
                  />
                </label>
                <button
                  ref={closeRef}
                  type="button"
                  onClick={close}
                  className="btn btn-ghost !min-h-9 !px-3"
                  aria-label="关闭媒体库"
                >
                  <X size={14} aria-hidden="true" />
                </button>
              </div>
            </div>

            {error ? (
              <p role="alert" className="mt-3 text-sm text-[var(--danger)]">
                {error}
              </p>
            ) : null}

            {loading ? (
              <p className="mt-6 text-center text-sm text-[var(--text-muted)]">加载中…</p>
            ) : items.length === 0 ? (
              <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
                媒体库还是空的，先上传一张图片。
              </p>
            ) : (
              <ul className="mt-4 grid gap-3 sm:grid-cols-3">
                {items.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange(item.url);
                        close();
                      }}
                      className={`group block w-full overflow-hidden rounded-lg border text-left transition-colors ${
                        value === item.url
                          ? 'border-[var(--accent)]'
                          : 'border-white/[0.08] hover:border-white/[0.2]'
                      }`}
                    >
                      <span className="relative block aspect-[16/9] bg-[var(--surface-2)]">
                        <Image
                          src={item.url}
                          alt={item.alt ?? ''}
                          fill
                          sizes="200px"
                          className="object-cover"
                        />
                      </span>
                      <span className="block truncate px-2 py-1.5 text-[11px] text-[var(--text-muted)]">
                        {item.alt || item.url}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

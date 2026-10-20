'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { Copy, Loader2, Trash2, Upload } from 'lucide-react';
import type { MediaItem, PageMeta } from '@myself/shared';
import { deleteMedia, listMedia, uploadMedia } from '@/lib/client-api';

interface MediaLibraryProps {
  initial: MediaItem[];
  initialMeta: PageMeta;
}

export function MediaLibrary({ initial, initialMeta }: MediaLibraryProps) {
  const [items, setItems] = useState(initial);
  const [meta, setMeta] = useState(initialMeta);
  const [alt, setAlt] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;

    setError('');
    setNotice('');
    setUploading(true);
    try {
      const item = await uploadMedia(file, alt.trim());
      setItems((current) => [item, ...current.filter((entry) => entry.id !== item.id)]);
      setAlt('');
      setNotice('上传成功，可直接在文章或项目编辑页选择这张图片。');
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : '上传失败');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleCopy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setNotice('图片地址已复制');
    } catch {
      setError('浏览器拒绝了剪贴板访问，请手动复制');
    }
  };

  const handleDelete = async (item: MediaItem) => {
    if (!window.confirm('删除这张图片？被文章或项目引用时无法删除。')) return;
    setError('');
    setNotice('');
    setDeletingId(item.id);
    try {
      await deleteMedia(item.id);
      setItems((current) => current.filter((entry) => entry.id !== item.id));
      setMeta((current) => ({ ...current, total: Math.max(0, current.total - 1) }));
      setNotice('图片已删除');
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : '删除失败');
    } finally {
      setDeletingId('');
    }
  };

  const handleLoadMore = async () => {
    setLoadingMore(true);
    setError('');
    try {
      const next = await listMedia({ page: meta.page + 1, pageSize: meta.pageSize });
      setItems((current) => [...current, ...next.items]);
      setMeta(next.meta);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : '加载失败');
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">媒体库</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            共 {meta.total} 张图片。支持 JPG / PNG / WebP / AVIF，单张不超过 10MB。
          </p>
        </div>
      </div>

      <div className="card mt-6 p-5">
        <label htmlFor="media-alt" className="mb-1.5 block text-xs text-[var(--text-muted)]">
          图片说明（alt，可选，用于无障碍与 SEO）
        </label>
        <input
          id="media-alt"
          value={alt}
          onChange={(event) => setAlt(event.target.value)}
          maxLength={200}
          className="field !text-sm"
          placeholder="例如：项目首页截图"
        />

        <div
          className="mt-4 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/[0.14] px-6 py-8 text-center"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            void handleFiles(event.dataTransfer.files);
          }}
        >
          <Upload size={20} className="text-[var(--accent)]" aria-hidden="true" />
          <p className="text-sm text-[var(--text-secondary)]">拖拽图片到这里，或选择文件</p>
          <label className="btn btn-primary !min-h-10 cursor-pointer">
            {uploading ? (
              <Loader2 size={15} className="animate-spin" aria-hidden="true" />
            ) : (
              <Upload size={15} aria-hidden="true" />
            )}
            {uploading ? '上传中…' : '选择图片'}
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="sr-only"
              disabled={uploading}
              onChange={(event) => void handleFiles(event.target.files)}
            />
          </label>
        </div>

        {error ? (
          <p role="alert" className="mt-4 text-sm text-[var(--danger)]">
            {error}
          </p>
        ) : null}
        {notice ? (
          <p role="status" className="mt-4 text-sm text-[var(--success)]">
            {notice}
          </p>
        ) : null}
      </div>

      {items.length === 0 ? (
        <div className="card mt-6 p-10 text-center text-sm text-[var(--text-secondary)]">
          还没有图片，先上传一张作为文章或项目封面。
        </div>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <li key={item.id} className="card overflow-hidden">
              <div className="relative aspect-[16/9] bg-[var(--surface-2)]">
                <Image
                  src={item.url}
                  alt={item.alt ?? ''}
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  className="object-cover"
                />
              </div>
              <div className="p-3">
                <p className="truncate text-xs text-[var(--text-secondary)]" title={item.alt ?? item.url}>
                  {item.alt || '未填写说明'}
                </p>
                <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                  {item.width && item.height ? `${item.width}×${item.height} · ` : ''}
                  {Math.max(1, Math.round(item.size / 1024))} KB
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void handleCopy(item.url)}
                    className="btn btn-ghost !min-h-9 !px-3 !text-xs"
                    aria-label={`复制图片地址：${item.alt ?? item.url}`}
                  >
                    <Copy size={13} aria-hidden="true" />
                    复制地址
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(item)}
                    disabled={deletingId === item.id}
                    className="btn btn-ghost !min-h-9 !px-3 !text-xs !text-[var(--danger)]"
                    aria-label={`删除图片：${item.alt ?? item.url}`}
                  >
                    {deletingId === item.id ? (
                      <Loader2 size={13} className="animate-spin" aria-hidden="true" />
                    ) : (
                      <Trash2 size={13} aria-hidden="true" />
                    )}
                    删除
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {items.length < meta.total ? (
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => void handleLoadMore()}
            disabled={loadingMore}
            className="btn btn-ghost !min-h-10"
          >
            {loadingMore ? '加载中…' : '加载更多'}
          </button>
        </div>
      ) : null}
    </div>
  );
}

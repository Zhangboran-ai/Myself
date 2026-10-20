'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Eye, Loader2, RotateCcw, Save } from 'lucide-react';
import type { PostInput, PostRevisionItem } from '@myself/shared';
import { slugify } from '@myself/shared';
import { createPost, createPreviewToken, restoreRevision, updatePost } from '@/lib/client-api';
import { MediaPicker } from './MediaPicker';
import { formatDateTime } from '@/lib/format';
import type { AdminPost } from '@/lib/api';

type PostStatus = PostInput['status'];

const STATUS_OPTIONS: { value: PostStatus; label: string }[] = [
  { value: 'DRAFT', label: '草稿' },
  { value: 'PUBLISHED', label: '发布' },
  { value: 'ARCHIVED', label: '归档' },
];

interface PostEditorProps {
  initial?: AdminPost;
  revisions?: PostRevisionItem[];
}

export function PostEditor({ initial, revisions = [] }: PostEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? '');
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [summary, setSummary] = useState(initial?.summary ?? '');
  const [body, setBody] = useState(initial?.body ?? '');
  const [status, setStatus] = useState<PostStatus>(initial?.status ?? 'DRAFT');
  const [pinned, setPinned] = useState(initial?.pinned ?? false);
  const [tags, setTags] = useState(initial?.tags.join(', ') ?? '');
  const [coverUrl, setCoverUrl] = useState(initial?.coverUrl ?? '');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [previewPending, setPreviewPending] = useState(false);
  const [restoringId, setRestoringId] = useState('');

  const tagList = useMemo(
    () =>
      tags
        .split(/[,，]/)
        .map((tag) => tag.trim())
        .filter(Boolean)
        .slice(0, 8),
    [tags],
  );

  const handleGenerateSlug = () => {
    const generated = slugify(title);
    if (!generated) {
      setNotice('中文标题无法自动生成 slug，请手动填写英文短横线形式。');
      return;
    }
    setSlug(generated);
    setNotice('');
  };

  const handlePreview = async () => {
    if (!initial) return;
    setError('');
    setPreviewPending(true);
    try {
      const { token } = await createPreviewToken(initial.id);
      window.open(
        `/admin/preview/${encodeURIComponent(slug || initial.slug)}?token=${encodeURIComponent(token)}`,
        '_blank',
        'noopener,noreferrer',
      );
    } catch (previewError) {
      setError(previewError instanceof Error ? previewError.message : '预览链接生成失败');
    } finally {
      setPreviewPending(false);
    }
  };

  const handleRestore = async (revision: PostRevisionItem) => {
    if (!initial) return;
    if (!window.confirm(`恢复到「${revision.title}」？当前内容会先保存为一个修订版本。`)) return;

    setError('');
    setNotice('');
    setRestoringId(revision.id);
    try {
      const restored = await restoreRevision(initial.id, revision.id);
      setTitle(restored.title);
      setBody(restored.body);
      setNotice('已恢复该修订版本，请检查内容后点击保存。');
      router.refresh();
    } catch (restoreError) {
      setError(restoreError instanceof Error ? restoreError.message : '恢复失败');
    } finally {
      setRestoringId('');
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setNotice('');
    setPending(true);

    const payload: PostInput = {
      title: title.trim(),
      slug: slug.trim(),
      summary: summary.trim(),
      body,
      status,
      pinned,
      tags: tagList,
      coverUrl: coverUrl.trim() ? coverUrl.trim() : null,
    };

    try {
      if (initial) {
        await updatePost(initial.id, payload);
      } else {
        await createPost(payload);
      }
      router.push('/admin/posts');
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '保存失败');
      setPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/admin/posts"
            className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <ArrowLeft size={13} aria-hidden="true" />
            返回列表
          </Link>
          <h1 className="mt-2 text-xl font-semibold">{initial ? '编辑文章' : '新建文章'}</h1>
        </div>

        <div className="flex items-center gap-2">
          {initial ? (
            <button
              type="button"
              onClick={handlePreview}
              disabled={previewPending}
              className="btn btn-ghost !min-h-10"
            >
              {previewPending ? (
                <Loader2 size={14} className="animate-spin" aria-hidden="true" />
              ) : (
                <Eye size={14} aria-hidden="true" />
              )}
              预览
            </button>
          ) : null}
          {initial?.status === 'PUBLISHED' ? (
            <Link
              href={`/blog/${initial.slug}`}
              target="_blank"
              className="btn btn-ghost !min-h-10"
            >
              <ExternalLink size={14} aria-hidden="true" />
              线上页
            </Link>
          ) : null}
          <button type="submit" className="btn btn-primary !min-h-10" disabled={pending}>
            {pending ? (
              <Loader2 size={15} className="animate-spin" aria-hidden="true" />
            ) : (
              <Save size={15} aria-hidden="true" />
            )}
            {pending ? '保存中…' : '保存'}
          </button>
        </div>
      </div>

      {error ? (
        <p role="alert" className="mt-4 rounded-lg border border-[rgba(248,113,113,0.3)] bg-[rgba(248,113,113,0.08)] px-4 py-3 text-sm text-[var(--danger)]">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p role="status" className="mt-4 rounded-lg border border-[rgba(245,201,139,0.25)] bg-[rgba(245,201,139,0.06)] px-4 py-3 text-sm text-[var(--accent-warm)]">
          {notice}
        </p>
      ) : null}

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-4">
          <div>
            <label htmlFor="post-title" className="mb-1.5 block text-xs text-[var(--text-muted)]">
              标题
            </label>
            <input
              id="post-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              maxLength={200}
              className="field !text-base"
              placeholder="给文章起个标题"
            />
          </div>

          <div>
            <label htmlFor="post-summary" className="mb-1.5 block text-xs text-[var(--text-muted)]">
              摘要（列表与 SEO 使用，不超过 300 字）
            </label>
            <textarea
              id="post-summary"
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              required
              maxLength={300}
              className="field !min-h-20"
              placeholder="一两句话说明文章讲了什么"
            />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="post-body" className="text-xs text-[var(--text-muted)]">
                正文（Markdown）
              </label>
              <span className="text-[11px] tabular-nums text-[var(--text-muted)]">
                {body.length} 字符
              </span>
            </div>
            <textarea
              id="post-body"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              required
              spellCheck={false}
              className="field !min-h-[480px] font-mono !text-[13.5px] !leading-[1.75]"
              placeholder={'## 小节标题\n\n正文内容…'}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-4">
            <label htmlFor="post-status" className="mb-1.5 block text-xs text-[var(--text-muted)]">
              状态
            </label>
            <select
              id="post-status"
              value={status}
              onChange={(event) => setStatus(event.target.value as PostStatus)}
              className="field"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <label className="mt-4 flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <input
                type="checkbox"
                checked={pinned}
                onChange={(event) => setPinned(event.target.checked)}
                className="size-4 accent-[var(--accent)]"
              />
              在列表置顶
            </label>
          </div>

          <div className="card p-4">
            <label htmlFor="post-slug" className="mb-1.5 block text-xs text-[var(--text-muted)]">
              Slug（URL）
            </label>
            <input
              id="post-slug"
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              required
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              className="field font-mono !text-[13px]"
              placeholder="my-first-post"
            />
            <button
              type="button"
              onClick={handleGenerateSlug}
              className="mt-2 text-[11px] text-[var(--accent)] hover:underline"
            >
              根据标题生成
            </button>
            <p className="mt-2 text-[11px] leading-relaxed text-[var(--text-muted)]">
              发布后修改 slug 会自动为旧链接建立 301 重定向。
            </p>
          </div>

          <div className="card p-4">
            <label htmlFor="post-tags" className="mb-1.5 block text-xs text-[var(--text-muted)]">
              标签（逗号分隔，最多 8 个）
            </label>
            <input
              id="post-tags"
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              className="field"
              placeholder="性能优化, 工程化"
            />
            {tagList.length > 0 ? (
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {tagList.map((tag) => (
                  <li key={tag} className="chip">
                    {tag}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="card p-4">
            <MediaPicker
              id="post-cover"
              value={coverUrl}
              onChange={setCoverUrl}
              label="封面图（可选）"
            />
            <p className="mt-2 text-[11px] text-[var(--text-muted)]">
              可以从媒体库选择，也可以直接粘贴图片地址。
            </p>
          </div>
        </div>
      </div>

      {initial && revisions.length > 0 ? (
        <section className="card mt-5 p-5" aria-labelledby="revisions-heading">
          <h2 id="revisions-heading" className="text-sm font-medium">
            修订历史（最近 20 条）
          </h2>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            恢复前会先保存当前内容，正在编辑的版本不会丢失。
          </p>
          <ul className="mt-3 divide-y divide-white/[0.06]">
            {revisions.map((revision) => (
              <li
                key={revision.id}
                className="flex flex-wrap items-center justify-between gap-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-[var(--text-primary)]">{revision.title}</p>
                  <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                    <time dateTime={revision.createdAt}>{formatDateTime(revision.createdAt)}</time>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRestore(revision)}
                  disabled={restoringId === revision.id}
                  className="btn btn-ghost !min-h-9 !px-3 text-xs"
                >
                  {restoringId === revision.id ? (
                    <Loader2 size={13} className="animate-spin" aria-hidden="true" />
                  ) : (
                    <RotateCcw size={13} aria-hidden="true" />
                  )}
                  恢复
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </form>
  );
}

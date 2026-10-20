'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Loader2, Save } from 'lucide-react';
import type { ProjectDetail, ProjectInput } from '@myself/shared';
import { slugify } from '@myself/shared';
import { createProject, updateProject } from '@/lib/client-api';
import { MediaPicker } from './MediaPicker';

type ProjectStatusInput = ProjectInput['status'];

const STATUS_OPTIONS: { value: ProjectStatusInput; label: string }[] = [
  { value: 'live', label: '线上' },
  { value: 'oss', label: '开源' },
  { value: 'archived', label: '归档' },
];

interface ProjectEditorProps {
  initial?: ProjectDetail;
}

export function ProjectEditor({ initial }: ProjectEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? '');
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [summary, setSummary] = useState(initial?.summary ?? '');
  const [body, setBody] = useState(initial?.body ?? '');
  const [role, setRole] = useState(initial?.role ?? '');
  const [year, setYear] = useState(String(initial?.year ?? new Date().getFullYear()));
  const [status, setStatus] = useState<ProjectStatusInput>(initial?.status ?? 'live');
  const [featured, setFeatured] = useState(initial?.featured ?? false);
  const [tech, setTech] = useState(initial?.tech.join(', ') ?? '');
  const [demoUrl, setDemoUrl] = useState(initial?.demoUrl ?? '');
  const [repoUrl, setRepoUrl] = useState(initial?.repoUrl ?? '');
  const [coverUrl, setCoverUrl] = useState(initial?.coverUrl ?? '');
  const [sortOrder, setSortOrder] = useState('0');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const techList = useMemo(
    () =>
      tech
        .split(/[,，]/)
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 12),
    [tech],
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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setNotice('');
    setPending(true);

    const payload: ProjectInput = {
      title: title.trim(),
      slug: slug.trim(),
      summary: summary.trim(),
      body,
      role: role.trim() ? role.trim() : null,
      year: Number(year),
      status,
      featured,
      tech: techList,
      demoUrl: demoUrl.trim() ? demoUrl.trim() : null,
      repoUrl: repoUrl.trim() ? repoUrl.trim() : null,
      coverUrl: coverUrl.trim() ? coverUrl.trim() : null,
      sortOrder: Number(sortOrder) || 0,
    };

    try {
      if (initial) {
        await updateProject(initial.id, payload);
      } else {
        await createProject(payload);
      }
      router.push('/admin/projects');
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
            href="/admin/projects"
            className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <ArrowLeft size={13} aria-hidden="true" />
            返回列表
          </Link>
          <h1 className="mt-2 text-xl font-semibold">{initial ? '编辑项目' : '新建项目'}</h1>
        </div>

        <div className="flex items-center gap-2">
          {initial ? (
            <Link
              href={`/projects/${initial.slug}`}
              target="_blank"
              className="btn btn-ghost !min-h-10"
            >
              <ExternalLink size={14} aria-hidden="true" />
              预览
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
            <label htmlFor="project-title" className="mb-1.5 block text-xs text-[var(--text-muted)]">
              标题
            </label>
            <input
              id="project-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              maxLength={200}
              className="field !text-base"
              placeholder="项目名称"
            />
          </div>

          <div>
            <label
              htmlFor="project-summary"
              className="mb-1.5 block text-xs text-[var(--text-muted)]"
            >
              一句话简介（列表与 SEO 使用，不超过 300 字）
            </label>
            <textarea
              id="project-summary"
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              required
              maxLength={300}
              className="field !min-h-20"
              placeholder="这个项目解决了什么问题"
            />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="project-body" className="text-xs text-[var(--text-muted)]">
                正文（Markdown：背景、角色、方案、结果）
              </label>
              <span className="text-[11px] tabular-nums text-[var(--text-muted)]">
                {body.length} 字符
              </span>
            </div>
            <textarea
              id="project-body"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              required
              spellCheck={false}
              className="field !min-h-[420px] font-mono !text-[13.5px] !leading-[1.75]"
              placeholder={'## 项目背景\n\n…\n\n## 方案与架构\n\n…'}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-4">
            <label htmlFor="project-status" className="mb-1.5 block text-xs text-[var(--text-muted)]">
              状态
            </label>
            <select
              id="project-status"
              value={status}
              onChange={(event) => setStatus(event.target.value as ProjectStatusInput)}
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
                checked={featured}
                onChange={(event) => setFeatured(event.target.checked)}
                className="size-4 accent-[var(--accent)]"
              />
              在首页展示
            </label>

            <label
              htmlFor="project-sort"
              className="mb-1.5 mt-4 block text-xs text-[var(--text-muted)]"
            >
              排序权重（小的在前）
            </label>
            <input
              id="project-sort"
              type="number"
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value)}
              className="field"
            />
          </div>

          <div className="card p-4">
            <label htmlFor="project-slug" className="mb-1.5 block text-xs text-[var(--text-muted)]">
              Slug（URL）
            </label>
            <input
              id="project-slug"
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              required
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              className="field font-mono !text-[13px]"
              placeholder="my-project"
            />
            <button
              type="button"
              onClick={handleGenerateSlug}
              className="mt-2 text-[11px] text-[var(--accent)] hover:underline"
            >
              根据标题生成
            </button>
            <p className="mt-2 text-[11px] leading-relaxed text-[var(--text-muted)]">
              修改 slug 会自动为旧链接建立 301 重定向。
            </p>
          </div>

          <div className="card p-4">
            <label htmlFor="project-year" className="mb-1.5 block text-xs text-[var(--text-muted)]">
              年份
            </label>
            <input
              id="project-year"
              type="number"
              min={1990}
              max={2100}
              value={year}
              onChange={(event) => setYear(event.target.value)}
              required
              className="field"
            />

            <label
              htmlFor="project-role"
              className="mb-1.5 mt-4 block text-xs text-[var(--text-muted)]"
            >
              我的角色
            </label>
            <input
              id="project-role"
              value={role}
              onChange={(event) => setRole(event.target.value)}
              maxLength={100}
              className="field"
              placeholder="独立开发 / 前端负责人"
            />
          </div>

          <div className="card p-4">
            <label htmlFor="project-tech" className="mb-1.5 block text-xs text-[var(--text-muted)]">
              技术栈（逗号分隔，最多 12 个）
            </label>
            <input
              id="project-tech"
              value={tech}
              onChange={(event) => setTech(event.target.value)}
              className="field"
              placeholder="React, TypeScript, MySQL"
            />
            {techList.length > 0 ? (
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {techList.map((item) => (
                  <li key={item} className="chip">
                    {item}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="card space-y-3 p-4">
            <div>
              <label
                htmlFor="project-demo"
                className="mb-1.5 block text-xs text-[var(--text-muted)]"
              >
                演示地址（可选）
              </label>
              <input
                id="project-demo"
                type="url"
                value={demoUrl}
                onChange={(event) => setDemoUrl(event.target.value)}
                className="field !text-[13px]"
                placeholder="https://…"
              />
            </div>
            <div>
              <label
                htmlFor="project-repo"
                className="mb-1.5 block text-xs text-[var(--text-muted)]"
              >
                仓库地址（可选）
              </label>
              <input
                id="project-repo"
                type="url"
                value={repoUrl}
                onChange={(event) => setRepoUrl(event.target.value)}
                className="field !text-[13px]"
                placeholder="https://github.com/…"
              />
            </div>
            <div>
              <MediaPicker
                id="project-cover"
                value={coverUrl}
                onChange={setCoverUrl}
                label="封面图（可选）"
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

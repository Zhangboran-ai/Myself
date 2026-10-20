'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Loader2, Plus, Save, Trash2 } from 'lucide-react';
import type { ExperienceInput, ProfileInput, SocialLink } from '@myself/shared';
import { saveExperiences, saveProfile } from '@/lib/client-api';
import type { SitePayload } from '@/lib/api';

interface ExperienceDraft {
  key: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  summary: string;
  kind: 'work' | 'education';
  visible: boolean;
}

let draftSeed = 0;
function nextKey(): string {
  draftSeed += 1;
  return `draft-${draftSeed}`;
}

function toDraft(experience: SitePayload['experiences'][number]): ExperienceDraft {
  return {
    key: experience.id,
    company: experience.company,
    role: experience.role,
    startDate: experience.startDate,
    endDate: experience.endDate ?? '',
    summary: experience.summary ?? '',
    kind: experience.kind,
    visible: true,
  };
}

export function ProfileEditor({ initial }: { initial: SitePayload }) {
  const router = useRouter();
  const [fields, setFields] = useState({
    name: initial.profile.name,
    handle: initial.profile.handle,
    headline: initial.profile.headline,
    email: initial.profile.email,
    location: initial.profile.location ?? '',
    statusLabel: initial.profile.statusLabel ?? '',
    statusAvailable: initial.profile.statusAvailable,
    avatarUrl: initial.profile.avatarUrl ?? '',
    resumeUrl: initial.profile.resumeUrl ?? '',
    bio: initial.profile.bio.join('\n\n'),
  });
  const [socials, setSocials] = useState<SocialLink[]>(initial.profile.socials);
  const [experiences, setExperiences] = useState<ExperienceDraft[]>(
    initial.experiences.map(toDraft),
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const update = <K extends keyof typeof fields>(key: K, value: (typeof fields)[K]) => {
    setFields((previous) => ({ ...previous, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError('');
    setNotice('');

    const payload: ProfileInput = {
      name: fields.name.trim(),
      handle: fields.handle.trim(),
      headline: fields.headline.trim(),
      bio: fields.bio.trim(),
      avatarUrl: fields.avatarUrl.trim() ? fields.avatarUrl.trim() : null,
      location: fields.location.trim() ? fields.location.trim() : null,
      statusLabel: fields.statusLabel.trim() ? fields.statusLabel.trim() : null,
      statusAvailable: fields.statusAvailable,
      email: fields.email.trim(),
      resumeUrl: fields.resumeUrl.trim() ? fields.resumeUrl.trim() : null,
      socials,
    };

    const experiencePayload: ExperienceInput[] = experiences.map((item) => ({
      company: item.company.trim(),
      role: item.role.trim(),
      startDate: item.startDate,
      endDate: item.endDate || null,
      summary: item.summary.trim() || null,
      kind: item.kind,
      visible: item.visible,
    }));

    try {
      await saveProfile(payload);
      await saveExperiences(experiencePayload);
      setNotice('已保存，前台会在数秒内更新。');
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '保存失败');
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">个人资料</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            这些内容会出现在首页 Hero、关于页与页脚。
          </p>
        </div>
        <button type="submit" className="btn btn-primary !min-h-10" disabled={pending}>
          {pending ? (
            <Loader2 size={15} className="animate-spin" aria-hidden="true" />
          ) : (
            <Save size={15} aria-hidden="true" />
          )}
          {pending ? '保存中…' : '保存全部'}
        </button>
      </div>

      {error ? (
        <p role="alert" className="mt-4 rounded-lg border border-[rgba(248,113,113,0.3)] bg-[rgba(248,113,113,0.08)] px-4 py-3 text-sm text-[var(--danger)]">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p role="status" className="mt-4 rounded-lg border border-[rgba(74,222,128,0.25)] bg-[rgba(74,222,128,0.06)] px-4 py-3 text-sm text-[var(--success)]">
          {notice}
        </p>
      ) : null}

      <section className="card mt-6 p-5" aria-labelledby="profile-basic">
        <h2 id="profile-basic" className="text-sm font-semibold">
          基本信息
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="姓名" id="profile-name">
            <input
              id="profile-name"
              value={fields.name}
              onChange={(event) => update('name', event.target.value)}
              required
              maxLength={50}
              className="field"
            />
          </Field>
          <Field label="用户名 / Handle" id="profile-handle">
            <input
              id="profile-handle"
              value={fields.handle}
              onChange={(event) => update('handle', event.target.value)}
              required
              maxLength={50}
              className="field"
            />
          </Field>
          <Field label="一句话定位" id="profile-headline" wide>
            <input
              id="profile-headline"
              value={fields.headline}
              onChange={(event) => update('headline', event.target.value)}
              required
              maxLength={120}
              className="field"
            />
          </Field>
          <Field label="邮箱" id="profile-email">
            <input
              id="profile-email"
              type="email"
              value={fields.email}
              onChange={(event) => update('email', event.target.value)}
              required
              maxLength={120}
              className="field"
            />
          </Field>
          <Field label="所在城市（可选）" id="profile-location">
            <input
              id="profile-location"
              value={fields.location}
              onChange={(event) => update('location', event.target.value)}
              maxLength={100}
              className="field"
            />
          </Field>
          <Field label="状态文案（可选）" id="profile-status">
            <input
              id="profile-status"
              value={fields.statusLabel}
              onChange={(event) => update('statusLabel', event.target.value)}
              maxLength={60}
              className="field"
              placeholder="开放远程合作"
            />
          </Field>
          <label className="flex items-end gap-2 pb-2 text-sm text-[var(--text-secondary)]">
            <input
              type="checkbox"
              checked={fields.statusAvailable}
              onChange={(event) => update('statusAvailable', event.target.checked)}
              className="size-4 accent-[var(--accent)]"
            />
            显示「可合作」状态
          </label>
          <Field label="头像 URL（可选）" id="profile-avatar">
            <input
              id="profile-avatar"
              type="url"
              value={fields.avatarUrl}
              onChange={(event) => update('avatarUrl', event.target.value)}
              className="field !text-[13px]"
              placeholder="https://…"
            />
          </Field>
          <Field label="简历 URL（可选）" id="profile-resume">
            <input
              id="profile-resume"
              type="url"
              value={fields.resumeUrl}
              onChange={(event) => update('resumeUrl', event.target.value)}
              className="field !text-[13px]"
              placeholder="https://…/resume.pdf"
            />
          </Field>
          <Field label="简介（段落之间空一行）" id="profile-bio" wide>
            <textarea
              id="profile-bio"
              value={fields.bio}
              onChange={(event) => update('bio', event.target.value)}
              required
              className="field !min-h-40"
            />
          </Field>
        </div>
      </section>

      <section className="card mt-6 p-5" aria-labelledby="profile-socials">
        <div className="flex items-center justify-between">
          <h2 id="profile-socials" className="text-sm font-semibold">
            社交链接
          </h2>
          <button
            type="button"
            onClick={() =>
              setSocials((previous) => [...previous, { label: '', href: '', icon: 'link' }])
            }
            className="inline-flex min-h-9 items-center gap-1 text-xs text-[var(--accent)]"
          >
            <Plus size={13} aria-hidden="true" />
            添加
          </button>
        </div>
        <div className="mt-4 space-y-3">
          {socials.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">还没有社交链接。</p>
          ) : null}
          {socials.map((social, index) => (
            <div key={index} className="grid gap-2 sm:grid-cols-[1fr_2fr_100px_auto]">
              <input
                aria-label={`社交链接 ${index + 1} 名称`}
                value={social.label}
                onChange={(event) =>
                  setSocials((previous) =>
                    previous.map((item, itemIndex) =>
                      itemIndex === index ? { ...item, label: event.target.value } : item,
                    ),
                  )
                }
                className="field"
                placeholder="GitHub"
              />
              <input
                aria-label={`社交链接 ${index + 1} 地址`}
                value={social.href}
                onChange={(event) =>
                  setSocials((previous) =>
                    previous.map((item, itemIndex) =>
                      itemIndex === index ? { ...item, href: event.target.value } : item,
                    ),
                  )
                }
                className="field !text-[13px]"
                placeholder="https://github.com/…"
              />
              <input
                aria-label={`社交链接 ${index + 1} 图标`}
                value={social.icon}
                onChange={(event) =>
                  setSocials((previous) =>
                    previous.map((item, itemIndex) =>
                      itemIndex === index ? { ...item, icon: event.target.value } : item,
                    ),
                  )
                }
                className="field !text-[13px]"
                placeholder="github"
              />
              <button
                type="button"
                onClick={() => setSocials((previous) => previous.filter((_, i) => i !== index))}
                className="inline-flex min-h-11 items-center justify-center rounded-lg px-2 text-[var(--text-muted)] hover:text-[var(--danger)]"
                aria-label={`删除社交链接 ${social.label || index + 1}`}
              >
                <Trash2 size={15} aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="card mt-6 p-5" aria-labelledby="profile-experiences">
        <div className="flex items-center justify-between">
          <div>
            <h2 id="profile-experiences" className="text-sm font-semibold">
              经历时间线
            </h2>
            <p className="mt-1 text-xs text-[var(--text-muted)]">按这里的顺序展示，结束时间留空表示「至今」。</p>
          </div>
          <button
            type="button"
            onClick={() =>
              setExperiences((previous) => [
                ...previous,
                {
                  key: nextKey(),
                  company: '',
                  role: '',
                  startDate: new Date().toISOString().slice(0, 10),
                  endDate: '',
                  summary: '',
                  kind: 'work',
                  visible: true,
                },
              ])
            }
            className="inline-flex min-h-9 items-center gap-1 text-xs text-[var(--accent)]"
          >
            <Plus size={13} aria-hidden="true" />
            添加
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {experiences.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">还没有经历条目。</p>
          ) : null}
          {experiences.map((experience, index) => (
            <div key={experience.key} className="rounded-xl border border-white/[0.06] p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--text-muted)]">第 {index + 1} 条</span>
                <button
                  type="button"
                  onClick={() =>
                    setExperiences((previous) => previous.filter((_, i) => i !== index))
                  }
                  className="inline-flex min-h-8 items-center gap-1 rounded-md px-2 text-xs text-[var(--text-muted)] hover:text-[var(--danger)]"
                  aria-label={`删除第 ${index + 1} 条经历`}
                >
                  <Trash2 size={13} aria-hidden="true" />
                  删除
                </button>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <input
                  aria-label={`第 ${index + 1} 条公司或学校`}
                  value={experience.company}
                  onChange={(event) =>
                    setExperiences((previous) =>
                      previous.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, company: event.target.value } : item,
                      ),
                    )
                  }
                  className="field"
                  placeholder="公司 / 学校"
                  required
                />
                <input
                  aria-label={`第 ${index + 1} 条职位`}
                  value={experience.role}
                  onChange={(event) =>
                    setExperiences((previous) =>
                      previous.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, role: event.target.value } : item,
                      ),
                    )
                  }
                  className="field"
                  placeholder="职位 / 专业"
                  required
                />
                <input
                  aria-label={`第 ${index + 1} 条开始日期`}
                  type="date"
                  value={experience.startDate}
                  onChange={(event) =>
                    setExperiences((previous) =>
                      previous.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, startDate: event.target.value } : item,
                      ),
                    )
                  }
                  className="field"
                  required
                />
                <input
                  aria-label={`第 ${index + 1} 条结束日期`}
                  type="date"
                  value={experience.endDate}
                  onChange={(event) =>
                    setExperiences((previous) =>
                      previous.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, endDate: event.target.value } : item,
                      ),
                    )
                  }
                  className="field"
                />
                <select
                  aria-label={`第 ${index + 1} 条类型`}
                  value={experience.kind}
                  onChange={(event) =>
                    setExperiences((previous) =>
                      previous.map((item, itemIndex) =>
                        itemIndex === index
                          ? { ...item, kind: event.target.value as 'work' | 'education' }
                          : item,
                      ),
                    )
                  }
                  className="field"
                >
                  <option value="work">工作</option>
                  <option value="education">教育</option>
                </select>
                <input
                  aria-label={`第 ${index + 1} 条一句话成果`}
                  value={experience.summary}
                  onChange={(event) =>
                    setExperiences((previous) =>
                      previous.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, summary: event.target.value } : item,
                      ),
                    )
                  }
                  className="field"
                  placeholder="一句话成果（可选）"
                  maxLength={500}
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    </form>
  );
}

function Field({
  label,
  id,
  wide,
  children,
}: {
  label: string;
  id: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={wide ? 'sm:col-span-2' : undefined}>
      <label htmlFor={id} className="mb-1.5 block text-xs text-[var(--text-muted)]">
        {label}
      </label>
      {children}
    </div>
  );
}

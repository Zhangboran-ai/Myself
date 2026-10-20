'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Loader2, Plus, Save, Trash2 } from 'lucide-react';
import type { SkillGroup, SkillGroupInput, SkillLevel } from '@myself/shared';
import { saveSkills } from '@/lib/client-api';

const LEVEL_OPTIONS: { value: SkillLevel; label: string }[] = [
  { value: 'proficient', label: '熟练' },
  { value: 'familiar', label: '熟悉' },
  { value: 'learning', label: '了解' },
];

interface SkillDraft {
  key: string;
  name: string;
  level: SkillLevel;
  note: string;
}

interface GroupDraft {
  key: string;
  name: string;
  items: SkillDraft[];
}

let draftSeed = 0;
function nextKey(): string {
  draftSeed += 1;
  return `skill-${draftSeed}`;
}

function toDrafts(groups: SkillGroup[]): GroupDraft[] {
  return groups.map((group) => ({
    key: group.id,
    name: group.name,
    items: group.items.map((item) => ({
      key: item.id,
      name: item.name,
      level: item.level,
      note: item.note ?? '',
    })),
  }));
}

export function SkillsEditor({ initial }: { initial: SkillGroup[] }) {
  const router = useRouter();
  const [groups, setGroups] = useState<GroupDraft[]>(toDrafts(initial));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const updateGroupName = (index: number, name: string) => {
    setGroups((previous) =>
      previous.map((group, groupIndex) => (groupIndex === index ? { ...group, name } : group)),
    );
  };

  const updateItem = (
    groupIndex: number,
    itemIndex: number,
    patch: Partial<Pick<SkillDraft, 'name' | 'level' | 'note'>>,
  ) => {
    setGroups((previous) =>
      previous.map((group, index) =>
        index === groupIndex
          ? {
              ...group,
              items: group.items.map((item, innerIndex) =>
                innerIndex === itemIndex ? { ...item, ...patch } : item,
              ),
            }
          : group,
      ),
    );
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError('');
    setNotice('');

    const payload: SkillGroupInput[] = groups.map((group) => ({
      name: group.name.trim(),
      items: group.items.map((item) => ({
        name: item.name.trim(),
        level: item.level,
        note: item.note.trim() || null,
        icon: null,
      })),
    }));

    try {
      await saveSkills(payload);
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
          <h1 className="text-xl font-semibold">技能管理</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            分类与条目按这里从上到下展示，建议 3–6 个分类、总数不超过 30 项。
          </p>
        </div>
        <button type="submit" className="btn btn-primary !min-h-10" disabled={pending}>
          {pending ? (
            <Loader2 size={15} className="animate-spin" aria-hidden="true" />
          ) : (
            <Save size={15} aria-hidden="true" />
          )}
          {pending ? '保存中…' : '保存'}
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

      <div className="mt-6 space-y-5">
        {groups.map((group, groupIndex) => (
          <section key={group.key} className="card p-5" aria-label={`技能分类 ${group.name}`}>
            <div className="flex flex-wrap items-center gap-3">
              <input
                aria-label={`第 ${groupIndex + 1} 个分类名称`}
                value={group.name}
                onChange={(event) => updateGroupName(groupIndex, event.target.value)}
                className="field max-w-xs !text-base"
                placeholder="分类名称"
                required
                maxLength={50}
              />
              <button
                type="button"
                onClick={() =>
                  setGroups((previous) =>
                    previous.map((item, index) =>
                      index === groupIndex
                        ? {
                            ...item,
                            items: [
                              ...item.items,
                              { key: nextKey(), name: '', level: 'familiar', note: '' },
                            ],
                          }
                        : item,
                    ),
                  )
                }
                className="inline-flex min-h-9 items-center gap-1 text-xs text-[var(--accent)]"
              >
                <Plus size={13} aria-hidden="true" />
                添加技能
              </button>
              <button
                type="button"
                onClick={() => setGroups((previous) => previous.filter((_, i) => i !== groupIndex))}
                className="ml-auto inline-flex min-h-9 items-center gap-1 rounded-md px-2 text-xs text-[var(--text-muted)] hover:text-[var(--danger)]"
                aria-label={`删除分类 ${group.name || groupIndex + 1}`}
              >
                <Trash2 size={13} aria-hidden="true" />
                删除分类
              </button>
            </div>

            <div className="mt-4 space-y-2">
              {group.items.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)]">这个分类还没有技能。</p>
              ) : null}
              {group.items.map((item, itemIndex) => (
                <div
                  key={item.key}
                  className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_110px_minmax(0,1.4fr)_auto]"
                >
                  <input
                    aria-label={`分类 ${groupIndex + 1} 第 ${itemIndex + 1} 个技能名`}
                    value={item.name}
                    onChange={(event) => updateItem(groupIndex, itemIndex, { name: event.target.value })}
                    className="field"
                    placeholder="技能名"
                    required
                    maxLength={50}
                  />
                  <select
                    aria-label={`分类 ${groupIndex + 1} 第 ${itemIndex + 1} 个技能等级`}
                    value={item.level}
                    onChange={(event) =>
                      updateItem(groupIndex, itemIndex, {
                        level: event.target.value as SkillLevel,
                      })
                    }
                    className="field"
                  >
                    {LEVEL_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <input
                    aria-label={`分类 ${groupIndex + 1} 第 ${itemIndex + 1} 个技能说明`}
                    value={item.note}
                    onChange={(event) => updateItem(groupIndex, itemIndex, { note: event.target.value })}
                    className="field"
                    placeholder="一句话说明（可选）"
                    maxLength={200}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setGroups((previous) =>
                        previous.map((group2, index) =>
                          index === groupIndex
                            ? {
                                ...group2,
                                items: group2.items.filter((_, innerIndex) => innerIndex !== itemIndex),
                              }
                            : group2,
                        ),
                      )
                    }
                    className="inline-flex min-h-11 items-center justify-center rounded-lg px-2 text-[var(--text-muted)] hover:text-[var(--danger)]"
                    aria-label={`删除技能 ${item.name || itemIndex + 1}`}
                  >
                    <Trash2 size={15} aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <button
        type="button"
        onClick={() =>
          setGroups((previous) => [...previous, { key: nextKey(), name: '', items: [] }])
        }
        className="btn btn-ghost mt-5 !min-h-10"
      >
        <Plus size={14} aria-hidden="true" />
        添加分类
      </button>
    </form>
  );
}

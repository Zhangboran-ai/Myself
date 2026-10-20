import type { SkillGroup } from '@myself/shared';
import { SKILL_LEVEL_LABELS } from '@myself/shared';

export function SkillsSection({ groups }: { groups: SkillGroup[] }) {
  if (groups.length === 0) return null;

  return (
    <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {groups.map((group) => (
        <section key={group.id} className="card p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium tracking-wide text-[var(--text-primary)]">
              {group.name}
            </h3>
            <span className="text-[11px] tabular-nums text-[var(--text-muted)]">
              {group.items.length} 项
            </span>
          </div>

          <ul className="mt-4 space-y-3.5">
            {group.items.map((skill) => (
              <li key={skill.id}>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-[var(--text-primary)]">{skill.name}</span>
                  <span
                    className={
                      skill.level === 'proficient'
                        ? 'text-[11px] text-[var(--accent)]'
                        : skill.level === 'familiar'
                          ? 'text-[11px] text-[var(--text-secondary)]'
                          : 'text-[11px] text-[var(--text-muted)]'
                    }
                  >
                    {SKILL_LEVEL_LABELS[skill.level] ?? skill.level}
                  </span>
                </div>
                {skill.note ? (
                  <p className="mt-0.5 text-xs leading-relaxed text-[var(--text-muted)]">
                    {skill.note}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

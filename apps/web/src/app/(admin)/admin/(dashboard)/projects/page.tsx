import Link from 'next/link';
import { cookies } from 'next/headers';
import { Plus } from 'lucide-react';
import { getAdminProjects } from '@/lib/api';
import { adminData } from '@/lib/admin';
import { DeleteProjectButton } from '@/components/admin/DeleteProjectButton';

export const dynamic = 'force-dynamic';

const STATUS_LABELS: Record<string, string> = {
  live: '线上',
  oss: '开源',
  archived: '归档',
};

export default async function AdminProjectsPage() {
  const cookieHeader = (await cookies()).toString();
  const projects = await adminData(() => getAdminProjects(cookieHeader));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">项目管理</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            共 {projects.length} 个。标记为「首页展示」的项目会出现在首页精选区。
          </p>
        </div>
        <Link href="/admin/projects/new" className="btn btn-primary !min-h-10">
          <Plus size={15} aria-hidden="true" />
          新建项目
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="card mt-8 p-10 text-center">
          <p className="text-sm text-[var(--text-secondary)]">还没有项目。</p>
          <Link href="/admin/projects/new" className="btn btn-primary mt-4">
            添加第一个项目
          </Link>
        </div>
      ) : (
        <div className="card mt-8 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.08] text-xs text-[var(--text-muted)]">
                  <th className="px-4 py-3 font-normal">项目</th>
                  <th className="px-4 py-3 font-normal">年份</th>
                  <th className="px-4 py-3 font-normal">状态</th>
                  <th className="px-4 py-3 font-normal">操作</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project.id} className="border-b border-white/[0.05] last:border-0">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/projects/${project.id}`}
                        className="font-medium text-[var(--text-primary)] hover:text-[var(--accent)]"
                      >
                        {project.title}
                      </Link>
                      <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                        /{project.slug}
                        {project.featured ? ' · 首页展示' : ''}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-xs tabular-nums text-[var(--text-muted)]">
                      {project.year}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-[var(--text-secondary)]">
                        {STATUS_LABELS[project.status] ?? project.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/admin/projects/${project.id}`}
                          className="text-xs text-[var(--text-secondary)] hover:text-[var(--accent)]"
                        >
                          编辑
                        </Link>
                        <Link
                          href={`/projects/${project.slug}`}
                          target="_blank"
                          className="text-xs text-[var(--text-secondary)] hover:text-[var(--accent)]"
                        >
                          查看
                        </Link>
                        <DeleteProjectButton id={project.id} title={project.title} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

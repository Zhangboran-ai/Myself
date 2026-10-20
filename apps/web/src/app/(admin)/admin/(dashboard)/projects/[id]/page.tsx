import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { ApiError, getAdminProject } from '@/lib/api';
import { adminData } from '@/lib/admin';
import { ProjectEditor } from '@/components/admin/ProjectEditor';

export const dynamic = 'force-dynamic';

interface EditProjectPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProjectPage({ params }: EditProjectPageProps) {
  const { id } = await params;
  const cookieHeader = (await cookies()).toString();

  const project = await adminData(async () => {
    try {
      return await getAdminProject(id, cookieHeader);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  });
  if (!project) notFound();

  return <ProjectEditor initial={project} />;
}

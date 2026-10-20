import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { ApiError, getAdminPost, getAdminRevisions } from '@/lib/api';
import { adminData } from '@/lib/admin';
import { PostEditor } from '@/components/admin/PostEditor';

export const dynamic = 'force-dynamic';

interface EditPostPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const { id } = await params;
  const cookieHeader = (await cookies()).toString();

  const { post, revisions } = await adminData(async () => {
    try {
      const [post, revisions] = await Promise.all([
        getAdminPost(id, cookieHeader),
        getAdminRevisions(id, cookieHeader),
      ]);
      return { post, revisions };
    } catch (error) {
      // 只有 404 视为文章不存在；401 由 adminData 转成登录页跳转。
      if (error instanceof ApiError && error.status === 404) {
        return { post: null, revisions: [] };
      }
      throw error;
    }
  });

  if (!post) notFound();

  return <PostEditor initial={post} revisions={revisions} />;
}

import { cookies } from 'next/headers';
import { getAdminMedia } from '@/lib/api';
import { adminData } from '@/lib/admin';
import { MediaLibrary } from '@/components/admin/MediaLibrary';

export const dynamic = 'force-dynamic';

export default async function AdminMediaPage() {
  const cookieHeader = (await cookies()).toString();
  const media = await adminData(() => getAdminMedia(cookieHeader, { pageSize: 24 }));

  return <MediaLibrary initial={media.items} initialMeta={media.meta} />;
}

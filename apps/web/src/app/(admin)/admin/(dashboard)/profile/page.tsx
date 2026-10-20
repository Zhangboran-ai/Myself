import { getSite } from '@/lib/api';
import { ProfileEditor } from '@/components/admin/ProfileEditor';

export const dynamic = 'force-dynamic';

export default async function AdminProfilePage() {
  const site = await getSite();

  return <ProfileEditor initial={site} />;
}

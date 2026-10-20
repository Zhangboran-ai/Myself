import { getSkills } from '@/lib/api';
import { SkillsEditor } from '@/components/admin/SkillsEditor';

export const dynamic = 'force-dynamic';

export default async function AdminSkillsPage() {
  const groups = await getSkills();

  return <SkillsEditor initial={groups} />;
}

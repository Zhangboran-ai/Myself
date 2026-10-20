import { cookies } from 'next/headers';
import { getAdminContactMessages } from '@/lib/api';
import { adminData } from '@/lib/admin';
import { MessagesInbox } from '@/components/admin/MessagesInbox';

export const dynamic = 'force-dynamic';

export default async function AdminMessagesPage() {
  const cookieHeader = (await cookies()).toString();
  const messages = await adminData(() =>
    getAdminContactMessages(cookieHeader, { pageSize: 20 }),
  );

  return <MessagesInbox initial={messages.items} initialMeta={messages.meta} />;
}

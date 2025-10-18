import { notFound } from 'next/navigation';
import UserDetail from '@/features/users/components/UserDetail';
import { ServerDataFetcher } from '@/lib/data-fetchers';
import { generatePageMetadata, generateUserMetadata } from '@/lib/metadata';
import { ServerAuth } from '@/lib/server-auth';

export async function generateMetadata({ params }: UserDetailPageProps) {
  const { id } = await params;
  const dataFetcher = new ServerDataFetcher();
  const user = await dataFetcher.getUserById(id);
  if (!user || !user.data) {
    // アクセス拒否メタデータ生成
    return generatePageMetadata({
      title: 'User Not Found',
      url: 'users/not-found',
    });
  }

  return generateUserMetadata({ userId: id });
}

interface UserDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const auth = new ServerAuth();
  const requireAdminAuth = await auth.requireAdminAuth();

  const { id } = await params;
  const dataFetcher = new ServerDataFetcher();
  const user = await dataFetcher.getUserById(id); // 存在しないIDの場合はnot-found.tsx
  if (!user || !user.data || !requireAdminAuth) {
    notFound();
  }

  const todos = await dataFetcher.getTodosByUserId(id);

  return <UserDetail user={user.data} todos={todos} />;
}

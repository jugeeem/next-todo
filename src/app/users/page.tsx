import { redirect } from 'next/navigation';
import UserList from '@/features/users/components/UserList';
import { ServerDataFetcher } from '@/lib/data-fetchers';
import { generatePageMetadata } from '@/lib/metadata';
import { ServerAuth } from '@/lib/server-auth';

export const metadata = generatePageMetadata({
  title: 'ユーザー一覧',
  url: 'users',
});

export default async function UsersPage() {
  // 認証チェック
  const auth = new ServerAuth();
  // 基本認証状態の確認
  const requireAuth = await auth.requireAuth();
  // 管理者権限の確認
  const requireAdminAuth = await auth.requireAdminAuth();
  if (!requireAuth) {
    redirect('/');
  }
  if (!requireAdminAuth) {
    // 管理者でない場合は403ページへリダイレクト
    redirect('/users/403');
  }

  const dataFetcher = new ServerDataFetcher();
  const users = await dataFetcher.getAllUsers();

  return <UserList users={users} />;
}

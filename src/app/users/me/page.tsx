import { redirect } from 'next/navigation';
import UserProfile from '@/features/users/components/UserProfile';
import { ServerDataFetcher } from '@/lib/data-fetchers';
import { generatePageMetadata } from '@/lib/metadata';
import { ServerAuth } from '@/lib/server-auth';

export const metadata = generatePageMetadata({
  title: 'プロフィール',
  url: 'users/me',
});

export default async function ProfilePage() {
  //認証状態の確認
  const auth = new ServerAuth();
  const authState = await auth.getAuthState();
  const requireAuth = await auth.requireAuth();

  if (!requireAuth || !authState || !authState.userId) {
    // 未認証の場合はログインページへリダイレクト
    redirect('/');
  }
  const dataFetcher = new ServerDataFetcher();
  const user = await dataFetcher.getUserById(authState.userId);
  if (!user || !user.data) {
    redirect('/');
  }
  return <UserProfile profile={user.data} />;
}

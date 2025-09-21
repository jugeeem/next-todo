import { redirect } from 'next/navigation';
import LoginForm from '@/features/auth/login/components/LoginForm';
import { generatePageMetadata } from '@/lib/metadata';
import { ServerAuth } from '@/lib/server-auth';

export const metadata = generatePageMetadata({
  title: 'ログイン',
  url: '/auth/login',
});

export default async function LoginPage() {
  // 認証状態の確認
  const auth = new ServerAuth();
  const isAuthenticated = await auth.requireAuth();

  // 既に認証されている場合はリダイレクト
  if (isAuthenticated) {
    // サーバーサイドでのリダイレクト
    return redirect('/todos');
  }

  return <LoginForm />;
}

import LoginForm from '@/features/auth/login/components/LoginForm';
import { generatePageMetadata } from '@/lib/metadata';
import { ServerAuth } from '@/lib/server-auth';

export const metadata = generatePageMetadata({
  title: 'ログイン',
  url: '/auth/login',
});

export default async function LoginPage() {
  // 認証状態の確認とリダイレクト
  const auth = new ServerAuth();
  await auth.redirectIfAuthenticated();

  return <LoginForm />;
}

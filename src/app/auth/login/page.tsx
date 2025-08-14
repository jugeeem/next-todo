import LoginIndex from '@/features/auth/login/components/Index';

export const metadata = {
  title: 'ログイン',
  description: 'ログインページ',
};

export default async function LoginPage() {
  return <LoginIndex />;
}

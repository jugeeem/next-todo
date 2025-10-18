import RegisterForm from '@/features/auth/register/components/RegisterForm';
import { generatePageMetadata } from '@/lib/metadata';

export const metadata = generatePageMetadata({
  title: 'ユーザー登録',
  url: '/auth/register',
});

export default function RegisterPage() {
  return <RegisterForm />;
}

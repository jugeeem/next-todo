import UserDetail from '@/features/users/components/Detail';

export const metadata = {
  title: 'ユーザー詳細',
  description: 'ユーザー詳細ページ',
};

interface UserDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const { id } = await params;

  return <UserDetail userId={id} />;
}

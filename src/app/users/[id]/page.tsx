import { UserDetailPage } from '@/features/users/UserDetailPage';

interface UserDetailProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function UserDetail({ params }: UserDetailProps) {
  const { id } = await params;
  return <UserDetailPage userId={id} />;
}

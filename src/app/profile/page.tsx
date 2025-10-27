import { redirect } from 'next/navigation';
import { ProfilePage } from '@/features/profile/ProfilePage';
import { fetchCurrentUser, fetchTodoStats, fetchUserTodos } from '@/lib/api';

export default async function ProfileServerPage() {
  try {
    const [user, stats, todos] = await Promise.all([
      fetchCurrentUser(),
      fetchTodoStats(),
      fetchUserTodos(),
    ]);

    // APIから取得したデータは既にシリアライズ済み（日時は文字列）
    // そのまま渡す
    return <ProfilePage initialUser={user} initialStats={stats} initialTodos={todos} />;
  } catch (error) {
    // 認証エラーの場合はログインページにリダイレクト
    if (error instanceof Error && error.message === 'Unauthorized') {
      redirect('/login');
    }
    // その他のエラーはエラーページにスロー
    throw error;
  }
}

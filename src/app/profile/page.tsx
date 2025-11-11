'use server';

// STEP2: server_component(2025-11) ADD START
import { redirect } from 'next/navigation';
import ProfilePage from '@/features/profile/ProfilePage';
import { fetchCurrentUser, fetchTodoStats, fetchUserTodos } from '@/lib/api';

/**
 * プロフィールページのサーバーコンポーネント。
 * ユーザー情報、Todo統計情報、ユーザーのTodo一覧を取得して表示します。
 *
 * @returns プロフィールページコンポーネント
 */
export default async function Page() {
  try {
    // ユーザー情報、Todo統計情報、ユーザーのTodo一覧を並行して取得
    const [userInfo, todoStats, userTodos] = await Promise.all([
      fetchCurrentUser(),
      fetchTodoStats(),
      fetchUserTodos(),
    ]);

    // クライアントコンポーネントへデータを渡す。
    return (
      <ProfilePage userInfo={userInfo} todoStats={todoStats} userTodos={userTodos} />
    );
  } catch (err) {
    // 認証エラーの場合はログインページにリダイレクト
    if (err instanceof Error && err.message === '認証エラーが発生しました') {
      redirect('/login');
    }
    // その他のエラーページにスロー
    throw err;
  }
}
// STEP2: server_component(2025-11) ADD END

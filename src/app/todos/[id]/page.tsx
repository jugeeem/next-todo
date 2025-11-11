import { redirect } from 'next/navigation';
import TodoDetailPage from '@/features/todos/TodoDetailPage';
import { fetchCurrentUser, fetchTodoById } from '@/lib/api';

// STEP2: server_component(2025-11) ADD START
/**
 * Todo詳細ページ（サーバーコンポーネント）。
 * Todo詳細表示のために必要なデータをサーバー側で取得し、TodoDetailPageコンポーネントに渡します。
 *
 */
export default async function TodoDetailServerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  try {
    // パラメータの取得
    const { id } = await params;

    // サーバー側でTodo詳細表示用のデータとユーザー情報を取得
    const [todo, currentUser] = await Promise.all([
      fetchTodoById(id),
      fetchCurrentUser(),
    ]);

    // サーバーで取得したデータをクライアントコンポーネントに渡すためのpropsを設定して返却
    return <TodoDetailPage selectedTodo={todo} currentUserRole={currentUser.role} />;
  } catch (err) {
    // 認証エラー発生時はログインページへリダイレクト
    if (err instanceof Error && err.message === '認証エラーが発生しました') {
      redirect('/login');
    }
    // その他のエラーはエラーページへスロー
    throw err;
  }
}

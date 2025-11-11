// STEP2: server_component(2025-11) DEL START
// 'use client';
// STEP2: server_component(2025-11) DEL END

import { redirect } from 'next/navigation';
import TodoListPage from '@/features/todos/TodoListPage';
import { fetchCurrentUser, fetchTodos } from '@/lib/api';

// STEP2: server_component(2025-11) ADD START
/**
 * Todo一覧ページ（サーバーコンポーネント）。
 * Todo一覧表示のために必要なデータをサーバー側で取得し、TodoListPageコンポーネントに渡します。
 *
 */
export default async function TodosServerPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    perPage?: string;
    completedFilter?: 'all' | 'completed' | 'incomplete';
    sortBy?: 'createdAt' | 'updatedAt' | 'title';
    sortOrder?: 'asc' | 'desc';
  }>;
}) {
  try {
    // サーチパラメータの取得
    const params = await searchParams;

    // 取得したパラメータを変数に設定
    // ページ番号
    const page = Number(params.page) || 1;
    // 1ページあたりのTodo表示数
    const perPage = Number(params.perPage) || 20;
    // 完了状態フィルター
    const completedFilter = params.completedFilter || 'all';
    // ソート項目
    const sortBy = params.sortBy || 'createdAt';
    // ソート順
    const sortOrder = params.sortOrder || 'desc';

    // サーバー側でTodo一覧初期表示用のデータとユーザー情報を取得
    const [initialData, currentUser] = await Promise.all([
      fetchTodos({ page, perPage, completedFilter, sortBy, sortOrder }),
      fetchCurrentUser(),
    ]);
    // クライアントコンポーネントへデータを渡すためのpropsを設定して返却
    return (
      <TodoListPage initialData={initialData} currentUserRole={currentUser.role} />
    );
  } catch (err) {
    // 認証エラー発生時はログインページへリダイレクト
    if (err instanceof Error && err.message === '認証エラーが発生しました') {
      redirect('/login');
    }
    // その他のエラーはエラーページへスロー
    throw err;
  }
}
// STEP2: server_component(2025-11) ADD END

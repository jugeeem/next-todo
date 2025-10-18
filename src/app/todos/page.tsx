import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import TodoList from '@/features/todos/components/TodoList';
import { ServerDataFetcher } from '@/lib/data-fetchers';
import { generatePageMetadata } from '@/lib/metadata';
import { ServerAuth } from '@/lib/server-auth';

// メタデータ生成
export const metadata = generatePageMetadata({
  title: 'Todo一覧',
  url: 'todos',
});

export default async function TodosPage() {
  // 認証状態確認・リダイレクト処理
  const auth = new ServerAuth();
  const authState = await auth.getAuthState();
  const authResponse = await auth.requireAuth();
  if (!authResponse || !authState) {
    return redirect('/');
  }
  const userId = authState.userId;

  /**
   * サーバーコンポーネントでのデータ取得
   * TODO: ユーザー情報も一緒に取得するようにする
   */
  const dataFetcher = new ServerDataFetcher();
  const todos = await dataFetcher.getTodosByUserId(userId);
  const userDetail = await dataFetcher.getUserById(userId);

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TodoList initialTodos={todos} user={userDetail.data} />
    </Suspense>
  );
}

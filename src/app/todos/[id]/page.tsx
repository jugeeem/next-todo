import { notFound, redirect } from 'next/navigation';
import TodoDetail from '@/features/todos/components/TodoDetail';
import { ServerDataFetcher } from '@/lib/data-fetchers';
import { generatePageMetadata, generateTodoMetadata } from '@/lib/metadata';
import { ServerAuth } from '@/lib/server-auth';

interface TodoDetailPageProps {
  params: Promise<{ id: string }>;
}

// 抽出したURLパラメータ(id)に基づくメタデータ生成
export async function generateMetadata({ params }: TodoDetailPageProps) {
  const { id } = await params;
  const dataFetcher = new ServerDataFetcher();
  const todo = await dataFetcher.getTodoById(id);
  if (!todo || !todo.data) {
    // アクセス拒否メタデータ生成
    return generatePageMetadata({ title: 'Todo Not Found', url: 'todos/not-found' });
  }

  return generateTodoMetadata({ todoId: id });
}

export default async function TodoDetailPage({ params }: TodoDetailPageProps) {
  // 認証状態確認・リダイレクト処理
  const auth = new ServerAuth();
  const authState = await auth.getAuthState();
  if (!authState) {
    redirect('/auth/login');
  }

  // Todo詳細データの取得
  const { id } = await params;
  const dataFetcher = new ServerDataFetcher();
  const todo = await dataFetcher.getTodoById(id);
  // エラー時のフォールバック処理
  if (!todo || !todo.data || todo.data.userId !== authState.userId) {
    notFound();
  }

  return <TodoDetail todoDetail={todo.data} role={authState.role} />;
}

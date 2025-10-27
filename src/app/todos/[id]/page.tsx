import { redirect } from 'next/navigation';
import { TodoDetailPage } from '@/features/todos/TodoDetailPage';
import { fetchTodoById } from '@/lib/api';

export default async function TodoDetailServerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  try {
    const { id } = await params;
    const todo = await fetchTodoById(id);

    // APIから取得したデータは既にシリアライズ済み（日時は文字列）
    return <TodoDetailPage initialTodo={todo} />;
  } catch (error) {
    // 認証エラーの場合はログインページにリダイレクト
    if (error instanceof Error && error.message === 'Unauthorized') {
      redirect('/login');
    }
    // その他のエラーはエラーページにスロー
    throw error;
  }
}

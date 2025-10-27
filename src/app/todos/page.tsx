import { redirect } from 'next/navigation';
import { TodoListPage } from '@/features/todos/TodoListPage';
import { fetchTodos } from '@/lib/api';

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
    const params = await searchParams;

    // パラメータの解析
    const page = Number(params.page) || 1;
    const perPage = Number(params.perPage) || 20;
    const completedFilter = params.completedFilter || 'all';
    const sortBy = params.sortBy || 'createdAt';
    const sortOrder = params.sortOrder || 'desc';

    const initialData = await fetchTodos({
      page,
      perPage,
      completedFilter,
      sortBy,
      sortOrder,
    });

    // APIから取得したデータは既にシリアライズ済み（日時は文字列）
    // そのまま渡す
    return <TodoListPage initialData={initialData} />;
  } catch (error) {
    // 認証エラーの場合はログインページにリダイレクト
    if (error instanceof Error && error.message === 'Unauthorized') {
      redirect('/login');
    }
    // その他のエラーはエラーページにスロー
    throw error;
  }
}

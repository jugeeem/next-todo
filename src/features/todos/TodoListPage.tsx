'use client';

import { useCallback, useEffect, useState } from 'react';
import { getTodoList } from '@/lib/api';
import { TodoCreateForm } from './components/TodoCreateForm';
import { TodoFilter } from './components/TodoFilter';
import { TodoList } from './components/TodoList';
import { TodoPagination } from './components/TodoPagination';
import { TodoSort } from './components/TodoSort';

interface Todo {
  id: string;
  title: string;
  descriptions?: string;
  completed: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

interface TodoListResponse {
  success: boolean;
  data: {
    data: Todo[];
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
}

interface TodoListPageProps {
  initialData?: TodoListResponse;
}

export function TodoListPage({ initialData }: TodoListPageProps) {
  const [todos, setTodos] = useState<Todo[]>(initialData?.data?.data || []);
  const [page, setPage] = useState<number>(initialData?.data?.page || 1);
  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo | null>(
    initialData
      ? {
          currentPage: initialData.data.page,
          totalPages: initialData.data.totalPages,
          totalItems: initialData.data.total,
          itemsPerPage: initialData.data.perPage,
        }
      : null,
  );
  const [completedFilter, setCompletedFilter] = useState<
    'all' | 'completed' | 'incomplete'
  >('all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'updatedAt' | 'title'>(
    'createdAt',
  );
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Todo一覧を取得
  const fetchTodos = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const result = await getTodoList({
        page,
        perPage: 20,
        completedFilter,
        sortBy,
        sortOrder,
      });

      if (!result.success) {
        throw new Error(result.error || 'Todoの取得に失敗しました');
      }

      const responseData = result.data;
      setTodos(responseData.data || []);
      setPaginationInfo({
        currentPage: responseData.page,
        totalPages: responseData.totalPages,
        totalItems: responseData.total,
        itemsPerPage: responseData.perPage,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Todoの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [page, completedFilter, sortBy, sortOrder]);

  // ページ読み込み時・フィルター変更時にTodoを取得
  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Todo作成フォーム */}
        <TodoCreateForm onSuccess={fetchTodos} />

        {/* フィルター・ソート */}
        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <TodoFilter
              value={completedFilter}
              onChange={(value) => {
                setCompletedFilter(value);
                setPage(1);
              }}
            />
            <TodoSort
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortByChange={setSortBy}
              onSortOrderChange={setSortOrder}
            />
          </div>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-md p-3 mb-4">
            {error}
          </div>
        )}

        {/* Todo一覧 */}
        <TodoList
          todos={todos}
          paginationInfo={paginationInfo}
          onUpdate={fetchTodos}
          isLoading={isLoading}
        />

        {/* ページネーション */}
        {paginationInfo && (
          <TodoPagination
            paginationInfo={paginationInfo}
            page={page}
            onPageChange={setPage}
          />
        )}
      </main>
    </div>
  );
}

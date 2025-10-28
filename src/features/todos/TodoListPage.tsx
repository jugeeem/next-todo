'use client';

import Link from 'next/link';
import { type FormEvent, useCallback, useEffect, useState } from 'react';
import {
  createTodo,
  deleteTodo,
  getTodoList,
  getUserInfo,
  logout,
  updateTodo,
} from '@/lib/api';

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
  currentUserRole?: number;
}

export function TodoListPage({
  initialData,
  currentUserRole: initialUserRole,
}: TodoListPageProps) {
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
  const [newTodoTitle, setNewTodoTitle] = useState<string>('');
  const [newTodoDescription, setNewTodoDescription] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [currentUserRole, setCurrentUserRole] = useState<number>(initialUserRole || 4);

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

  // ユーザー情報を取得してロールを設定（初期値がない場合のみ）
  useEffect(() => {
    if (initialUserRole !== undefined) {
      // サーバーから渡された場合はスキップ
      return;
    }

    const fetchUserInfo = async () => {
      try {
        const result = await getUserInfo();
        if (result.success && result.data) {
          setCurrentUserRole(result.data.role);
        }
      } catch (err) {
        console.error('Failed to fetch user info:', err);
      }
    };

    fetchUserInfo();
  }, [initialUserRole]);

  // ページ読み込み時・フィルター変更時にTodoを取得
  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  // Todo作成
  const handleCreateTodo = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!newTodoTitle.trim()) {
      setError('タイトルは必須です');
      return;
    }

    if (newTodoTitle.length > 32) {
      setError('タイトルは32文字以内で入力してください');
      return;
    }

    if (newTodoDescription && newTodoDescription.length > 128) {
      setError('説明は128文字以内で入力してください');
      return;
    }

    setIsCreating(true);

    try {
      const result = await createTodo({
        title: newTodoTitle,
        descriptions: newTodoDescription || undefined,
      });

      if (!result.success) {
        throw new Error(result.error || 'Todoの作成に失敗しました');
      }

      // フォームをリセット
      setNewTodoTitle('');
      setNewTodoDescription('');

      // 一覧を再取得
      await fetchTodos();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Todoの作成に失敗しました');
    } finally {
      setIsCreating(false);
    }
  };

  // Todo削除
  const handleDeleteTodo = async (id: string) => {
    if (!confirm('このTodoを削除してもよろしいですか?')) {
      return;
    }

    try {
      const result = await deleteTodo(id);

      if (!result.success) {
        throw new Error(result.error || 'Todoの削除に失敗しました');
      }

      // 一覧を再取得
      await fetchTodos();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Todoの削除に失敗しました');
    }
  };

  // Todo完了状態の切り替え
  const handleToggleComplete = async (todo: Todo) => {
    try {
      const result = await updateTodo(todo.id, {
        title: todo.title,
        descriptions: todo.descriptions,
        completed: !todo.completed,
      });

      if (!result.success) {
        throw new Error(result.error || 'Todoの更新に失敗しました');
      }

      // 一覧を再取得
      await fetchTodos();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Todoの更新に失敗しました');
    }
  };

  // ログアウト
  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Todo アプリ</h1>
          <nav className="flex items-center gap-4">
            <Link
              href="/todos"
              className="text-gray-700 hover:text-blue-500 font-medium"
            >
              Todo一覧
            </Link>
            <Link
              href="/profile"
              className="text-gray-700 hover:text-blue-500 font-medium"
            >
              プロフィール
            </Link>
            {currentUserRole <= 2 && (
              <Link
                href="/users"
                className="text-gray-700 hover:text-blue-500 font-medium"
              >
                ユーザー管理
              </Link>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              ログアウト
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Todo作成フォーム */}
        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">新しいTodoを作成</h2>
          <form onSubmit={handleCreateTodo} className="space-y-4">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                タイトル <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                value={newTodoTitle}
                onChange={(e) => setNewTodoTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Todoのタイトル（32文字以内）"
                disabled={isCreating}
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                説明
              </label>
              <textarea
                id="description"
                value={newTodoDescription}
                onChange={(e) => setNewTodoDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Todoの説明（128文字以内）"
                rows={3}
                disabled={isCreating}
              />
            </div>

            <button
              type="submit"
              disabled={isCreating}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isCreating ? '作成中...' : '作成'}
            </button>
          </form>
        </div>

        {/* フィルター・ソート */}
        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 完了状態フィルター */}
            <div>
              <label
                htmlFor="completedFilter"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                表示フィルター
              </label>
              <select
                id="completedFilter"
                value={completedFilter}
                onChange={(e) => {
                  setCompletedFilter(
                    e.target.value as 'all' | 'completed' | 'incomplete',
                  );
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">すべて</option>
                <option value="completed">完了済み</option>
                <option value="incomplete">未完了</option>
              </select>
            </div>

            {/* ソート項目 */}
            <div>
              <label
                htmlFor="sortBy"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                並び順
              </label>
              <select
                id="sortBy"
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as 'createdAt' | 'updatedAt' | 'title')
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="createdAt">作成日時</option>
                <option value="updatedAt">更新日時</option>
                <option value="title">タイトル</option>
              </select>
            </div>

            {/* ソート順 */}
            <div>
              <label
                htmlFor="sortOrder"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                順序
              </label>
              <select
                id="sortOrder"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="asc">昇順</option>
                <option value="desc">降順</option>
              </select>
            </div>
          </div>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-md p-3 mb-4">
            {error}
          </div>
        )}

        {/* ローディング表示 */}
        {isLoading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
            <p className="mt-2 text-gray-600">読み込み中...</p>
          </div>
        )}

        {/* Todo一覧 */}
        {!isLoading && (
          <>
            <div className="bg-white shadow-md rounded-lg p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Todo一覧
                {paginationInfo && (
                  <span className="text-sm font-normal text-gray-600 ml-2">
                    （全{paginationInfo.totalItems}件）
                  </span>
                )}
              </h2>

              {todos.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Todoがありません</p>
              ) : (
                <div className="space-y-2">
                  {todos.map((todo) => (
                    <div
                      key={todo.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <input
                          type="checkbox"
                          checked={todo.completed}
                          onChange={() => handleToggleComplete(todo)}
                          className="w-5 h-5 text-blue-500 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <Link href={`/todos/${todo.id}`} className="block">
                            <h3
                              className={`font-medium ${
                                todo.completed
                                  ? 'line-through text-gray-500'
                                  : 'text-gray-900'
                              }`}
                            >
                              {todo.title}
                            </h3>
                            {todo.descriptions && (
                              <p className="text-sm text-gray-600 mt-1">
                                {todo.descriptions}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                              作成: {new Date(todo.createdAt).toLocaleString('ja-JP')}
                            </p>
                          </Link>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/todos/${todo.id}`}
                          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                        >
                          詳細
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDeleteTodo(todo.id)}
                          className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                        >
                          削除
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ページネーション */}
            {paginationInfo && paginationInfo.totalPages > 1 && (
              <div className="bg-white shadow-md rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setPage(page - 1)}
                    disabled={page <= 1}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    前のページ
                  </button>

                  <span className="text-gray-700">
                    ページ {page} / {paginationInfo.totalPages}
                  </span>

                  <button
                    type="button"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= paginationInfo.totalPages}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    次のページ
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

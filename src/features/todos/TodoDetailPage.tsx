'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { type FormEvent, useCallback, useEffect, useState } from 'react';

interface Todo {
  id: string;
  title: string;
  descriptions?: string;
  completed: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

interface TodoDetailPageProps {
  initialTodo?: Todo;
}

export function TodoDetailPage({ initialTodo }: TodoDetailPageProps) {
  const router = useRouter();
  const params = useParams();
  const todoId = params?.id as string;

  const [todo, setTodo] = useState<Todo | null>(initialTodo || null);
  const [title, setTitle] = useState<string>(initialTodo?.title || '');
  const [descriptions, setDescriptions] = useState<string>(
    initialTodo?.descriptions || '',
  );
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [currentUserRole, setCurrentUserRole] = useState<number>(4); // デフォルトはUSER

  // 現在のユーザー情報を取得
  const fetchCurrentUser = useCallback(async () => {
    try {
      const response = await fetch('/api/users/me');
      if (response.ok) {
        const data = await response.json();
        setCurrentUserRole(data.data.role);
      }
    } catch (err) {
      console.error('Failed to fetch current user:', err);
    }
  }, []);

  // Todo詳細を取得
  const fetchTodoDetail = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/todos/${todoId}`);

      if (response.status === 401) {
        router.push('/login');
        return;
      }

      if (response.status === 404) {
        setError('Todoが見つかりません');
        return;
      }

      if (!response.ok) {
        throw new Error('Todoの取得に失敗しました');
      }

      const data = await response.json();
      const todoData = data.data;
      setTodo(todoData);
      setTitle(todoData.title);
      setDescriptions(todoData.descriptions || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Todoの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [router, todoId]);

  // 初回読み込み時にTodo詳細を取得（初期データがない場合のみ）
  useEffect(() => {
    if (!initialTodo && todoId) {
      fetchTodoDetail();
    }
    // 現在のユーザー情報を取得
    fetchCurrentUser();
  }, [todoId, fetchTodoDetail, initialTodo, fetchCurrentUser]);

  // Todo更新
  const handleUpdateTodo = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('タイトルは必須です');
      return;
    }

    if (title.length > 32) {
      setError('タイトルは32文字以内で入力してください');
      return;
    }

    if (descriptions && descriptions.length > 128) {
      setError('説明は128文字以内で入力してください');
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(`/api/todos/${todoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          descriptions: descriptions || undefined,
          completed: todo?.completed || false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Todoの更新に失敗しました');
      }

      // 更新成功後、編集モードを解除して最新データを取得
      setIsEditing(false);
      await fetchTodoDetail();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Todoの更新に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  // Todo削除
  const handleDeleteTodo = async () => {
    if (!confirm('このTodoを削除してもよろしいですか?')) {
      return;
    }

    try {
      const response = await fetch(`/api/todos/${todoId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Todoの削除に失敗しました');
      }

      // 削除成功後、一覧ページに戻る
      router.push('/todos');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Todoの削除に失敗しました');
    }
  };

  // 編集キャンセル
  const handleCancelEdit = () => {
    if (todo) {
      setTitle(todo.title);
      setDescriptions(todo.descriptions || '');
    }
    setIsEditing(false);
    setError('');
  };

  // ログアウト
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
      router.push('/login');
    } catch (err) {
      console.error('Logout error:', err);
      router.push('/login');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

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

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* エラー表示 */}
        {error && (
          <div className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-md p-3 mb-4">
            {error}
          </div>
        )}

        {!todo && !isLoading && (
          <div className="bg-white shadow-md rounded-lg p-8 text-center">
            <p className="text-gray-600 mb-4">Todoが見つかりません</p>
            <Link
              href="/todos"
              className="inline-block px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              一覧に戻る
            </Link>
          </div>
        )}

        {todo && (
          <div className="bg-white shadow-md rounded-lg p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Todo詳細</h2>
              <div className="flex items-center gap-2">
                {!isEditing && (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                    >
                      編集
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteTodo}
                      className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                    >
                      削除
                    </button>
                  </>
                )}
              </div>
            </div>

            {isEditing ? (
              <form onSubmit={handleUpdateTodo} className="space-y-6">
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
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Todoのタイトル（32文字以内）"
                    disabled={isSaving}
                  />
                </div>

                <div>
                  <label
                    htmlFor="descriptions"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    説明
                  </label>
                  <textarea
                    id="descriptions"
                    value={descriptions}
                    onChange={(e) => setDescriptions(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Todoの説明（128文字以内）"
                    rows={5}
                    disabled={isSaving}
                  />
                </div>

                <div className="flex items-center gap-4">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSaving ? '保存中...' : '保存'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    キャンセル
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">タイトル</h3>
                  <p className="text-lg text-gray-900">{todo.title}</p>
                </div>

                {todo.descriptions && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">説明</h3>
                    <p className="text-gray-900 whitespace-pre-wrap">
                      {todo.descriptions}
                    </p>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">ステータス</h3>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      todo.completed
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {todo.completed ? '完了' : '未完了'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">作成日時</h3>
                    <p className="text-gray-900">
                      {new Date(todo.createdAt).toLocaleString('ja-JP')}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">更新日時</h3>
                    <p className="text-gray-900">
                      {new Date(todo.updatedAt).toLocaleString('ja-JP')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-gray-200">
              <Link
                href="/todos"
                className="inline-block px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                ← 一覧に戻る
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

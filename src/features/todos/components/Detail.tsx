'use client';

import { useRouter } from 'next/navigation';
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import {
  deleteAuthCookiesFromClient,
  getClientCookie,
  getUserFromClient,
} from '@/lib/cookie';

export default function TodoDetail({ todoId }: { todoId: string }) {
  const [todo, setTodo] = useState<Todo | null>(null);
  const [form, setForm] = useState<TodoForm>({
    title: '',
    descriptions: '',
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState<boolean>(false);
  const router = useRouter();

  interface Todo {
    completed: boolean;
    id: number;
    title: string;
    descriptions: string;
    userId: number;
    createdAt: string;
    updatedAt: string;
  }

  interface TodoForm {
    title: string;
    descriptions: string;
  }

  interface TodoResponse {
    success: boolean;
    message: string;
    data: Todo;
  }

  interface UpdateTodoResponse {
    success: boolean;
    message: string;
    data: Todo;
  }

  interface User {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    role: number;
  }
  // Todoの詳細を取得する関数
  const fetchTodo = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    // 認証トークンを取得
    const token = getClientCookie('token');
    if (!token) {
      setError('認証トークンが見つかりません');
      setIsLoading(false);
      deleteAuthCookiesFromClient(); // トークンとユーザー情報のクッキーを削除
      router.push('/auth/login'); // ログインページへリダイレクト
      return;
    }

    try {
      const response = await fetch(`/api/todos/${todoId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const responseData = (await response.json()) as TodoResponse;

      if (response.status === 404) {
        setError('タスク情報が見つかりません');
        return;
      }

      if (response.ok && responseData.success) {
        setTodo(responseData.data);
        setForm({
          title: responseData.data.title,
          descriptions: responseData.data.descriptions,
        });
      } else {
        setError('タスク情報が見つかりません');
        return;
      }
    } catch {
      setError('タスク詳細の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [todoId, router]);

  useEffect(() => {
    const token = getClientCookie('token');
    const user = getUserFromClient();
    if (user && token) {
      setUser({
        id: user.id,
        username: user?.username,
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        role: user?.role,
      });
    } else {
      deleteAuthCookiesFromClient(); // トークンとユーザー情報のクッキーを削除
      router.push('/auth/login'); // ログインページへリダイレクト
      return;
    }
    if (todoId) {
      fetchTodo();
    }
  }, [todoId, router, fetchTodo]);

  const handleUpdate = async () => {
    setIsSubmitting(true);
    setError(null);

    // 作成者本人かどうかのチェック
    if (todo?.userId !== user?.id) {
      setError('このタスクを編集する権限がありません');
      setIsSubmitting(false);
      return;
    }

    if (!validateInputForm()) {
      setIsSubmitting(false);
      return;
    }

    if (!todoId) {
      setError('タスクIDが不正です');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`/api/todos/${todoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(form),
      });

      const data: UpdateTodoResponse = await response.json();

      if (response.ok && data.success) {
        setTodo(data.data);
        setIsEditOpen(false);
      }
    } catch {
      setError('タスクの更新に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    // 作成者本人かどうかのチェック
    if (todo?.userId !== user?.id) {
      setError('このタスクを削除する権限がありません');
      setIsDeleting(false);
      return;
    }

    if (!todoId) {
      setError('タスクIDが不正です');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`/api/todos/${todoId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsDeleteOpen(false);
        router.push('/todos');
      } else {
        setError(data.message || 'タスクの削除に失敗しました');
      }
    } catch {
      setError('タスクの削除に失敗しました');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const validateInputForm = () => {
    if (!form.title) {
      setError('タイトルは必須です');
      setIsLoading(false);
      return;
    }

    if (form.title.length > 32) {
      setError('タイトルは32文字までしか入力できません');
      return false;
    }
    if (form.descriptions.length > 128) {
      setError('説明は128文字までしか入力できません');
      return false;
    }
    setError(null);
    return true;
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <header className="flex justify-between items-center p-4 bg-blue-500 text-white">
        <button
          type="button"
          onClick={() => router.push('/todos')}
          className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded transition-colors"
        >
          戻る
        </button>
        <h1>Todo Detail</h1>
        <button
          type="button"
          onClick={() => setIsEditOpen(!isEditOpen)}
          className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded transition-colors"
        >
          編集
        </button>
      </header>

      <main className="p-4 flex flex-col items-center">
        <h1 className="text-2xl font-bold mb-4">Todo詳細</h1>

        {/* Todo詳細表示 */}
        <div className="w-full max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            {todo && (
              <div>
                <h2 className="text-xl font-semibold mb-4">{todo.title}</h2>
                <div className="space-y-3">
                  <p>
                    <span className="font-medium">説明:</span> {todo.descriptions}
                  </p>
                  <p>
                    <span className="font-medium">ステータス:</span>{' '}
                    {todo.completed ? '完了' : '未完了'}
                  </p>
                  <p>
                    <span className="font-medium">作成者:</span> {user?.username}
                  </p>
                  <p>
                    <span className="font-medium">作成日:</span>{' '}
                    {formatDate(todo.createdAt)}
                  </p>
                  <p>
                    <span className="font-medium">更新日:</span>{' '}
                    {formatDate(todo.updatedAt)}
                  </p>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => setIsEditOpen(!isEditOpen)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
                  >
                    編集
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsDeleteOpen(!isDeleteOpen)}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition-colors"
                  >
                    削除
                  </button>
                </div>
              </div>
            )}
            {!todo && <p className="text-red-500">タスク情報が見つかりません</p>}
          </div>
        </div>
      </main>

      {/* 削除確認モーダル */}
      {isDeleteOpen && (
        <div className="fixed inset-0 bg-white/50 flex justify-center items-center z-50">
          <div className="w-96 bg-white p-6 rounded-lg shadow-lg">
            <div className="flex flex-col items-center relative">
              <h3 className="text-lg font-bold mb-4">タスクを削除</h3>
              <p className="text-center mb-6">
                本当に削除しますか？
                <br />
                一度削除すると復元できません。
              </p>
              <div className="flex gap-2 justify-end w-full">
                <button
                  type="button"
                  onClick={() => setIsDeleteOpen(false)}
                  className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white py-2 px-4 rounded transition-colors"
                >
                  削除
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 編集モーダル */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-white/50 flex justify-center items-center z-50">
          <div className="w-96 bg-white p-6 rounded-lg shadow-lg">
            <div className="flex flex-col relative">
              <h2 className="text-lg font-bold mb-4">Todo編集</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium mb-1">
                    タイトル:
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={form.title}
                    onChange={handleInputChange}
                    onBlur={validateInputForm}
                    placeholder="タイトルを入力"
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="descriptions"
                    className="block text-sm font-medium mb-1"
                  >
                    説明:
                  </label>
                  <input
                    type="text"
                    name="descriptions"
                    value={form.descriptions}
                    onChange={handleInputChange}
                    onBlur={validateInputForm}
                    placeholder="説明を入力"
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditOpen(false);
                    setError(null);
                  }}
                  className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  onClick={handleUpdate}
                  disabled={isSubmitting}
                  className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white py-2 px-4 rounded transition-colors"
                >
                  {isSubmitting ? '更新中...' : '更新'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ローディングオーバーレイ */}
      {isLoading && (
        <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-50 z-50">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-500"></div>
        </div>
      )}
      {/* エラーメッセージ表示 */}
      <div className="fixed right-4 z-[9999] bottom-4 max-w-sm">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg animate-in slide-in-from-right-full duration-300">
            <div className="flex items-start justify-between">
              <span className="text-sm font-medium">{error}</span>
              <button
                type="button"
                onClick={() => setError(null)}
                className="ml-2 text-red-600 hover:text-red-800 flex-shrink-0"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

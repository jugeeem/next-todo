'use client';

import { useRouter } from 'next/navigation';
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import {
  deleteAuthCookiesFromClient,
  getClientCookie,
  getUserFromClient,
} from '@/lib/cookie';

export default function TodosIndex() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [form, setForm] = useState<TodoForm>({
    title: '',
    descriptions: '',
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const router = useRouter();

  interface Todo {
    id: number;
    title: string;
    descriptions: string;
    completed: boolean;
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
    data: Todo[];
  }

  interface CreateTodoResponse {
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

  // Todosを取得する関数
  const fetchTodos = useCallback(async () => {
    // ローディング状態に変更
    setIsLoading(true);
    // エラーメッセージをリセット
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
      const response = await fetch('/api/todos', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data: TodoResponse = await response.json();

      if (response.ok && data.success) {
        setTodos(data.data);
      } else {
        setError(data.message || 'Todoの取得に失敗しました');
      }
    } catch {
      setError('ネットワークエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  // コンポーネントマウント時にTodosを取得
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
    fetchTodos();
  }, [router, fetchTodos]);

  // フォームの送信処理
  const handleSubmit = async () => {
    // ローディング状態に変更
    setIsLoading(true);
    // エラーメッセージをリセット
    setError(null);

    if (!validateInputForm()) {
      setIsLoading(false);
      return;
    }

    const request: TodoForm = {
      title: form.title,
      descriptions: form.descriptions,
    };

    try {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const responseData: CreateTodoResponse = await response.json();

      if (response.ok && responseData.success) {
        setTodos([...todos, responseData.data]);
      } else {
        setError(responseData.message || 'Todoの作成に失敗しました');
      }
    } catch {
      setError('ネットワークエラーが発生しました');
    } finally {
      setIsLoading(false);
      setShowModal(false); // モーダルを閉じる
      setForm({ title: '', descriptions: '' }); // フォームをリセット
    }
  };

  // 入力変更時の処理
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((prevForm) => ({
      ...prevForm,
      [name]: value,
    }));
  };

  // ログアウト処理
  const handleLogout = async () => {
    setError(null);
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch {
      setError('ログアウトに失敗しました');
      return;
    }
    router.push('/auth/login');
  };

  // 日付をフォーマットする関数
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // 入力フォームのバリデーション
  // タイトルと説明の長さをチェック
  // タイトルは必須、最大32文字、説明は最大128文字
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
        <h1 className="text-xl font-bold">Todoアプリ</h1>
        <h2>Hello! {user?.username}!</h2>
        <button
          type="button"
          onClick={() => router.push('/users/me')}
          className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded transition-colors"
        >
          プロフィール
        </button>
        {user?.role === 1 && (
          <button
            type="button"
            onClick={() => router.push('/users')}
            className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded transition-colors"
          >
            ユーザ一覧
          </button>
        )}
        <button
          type="button"
          onClick={handleLogout}
          className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded transition-colors"
        >
          ログアウト
        </button>
      </header>
      <main className="p-4 flex flex-col items-center">
        <h2 className="text-xl font-bold mb-4">Todo一覧</h2>
        <h2 className="text-xl font-bold mb-4">{todos.length}件</h2>
        <button
          type="button"
          onClick={() => {
            setShowModal(!showModal);
          }}
          className="bg-blue-500 text-white py-1 px-4 my-4 rounded-full hover:bg-blue-600 transition-colors"
        >
          新規作成
        </button>
        <div className="w-full max-w-2xl mx-auto">
          {todos.map((todo) => {
            return (
              <div
                key={todo.id}
                className="bg-white rounded-lg shadow-md mb-6 overflow-hidden "
              >
                <div className="mb-2 flex justify-between items-center bg-blue-500 text-white  p-2">
                  <h3 className="text-lg font-bold">{todo.title}</h3>
                  <p>{todo.completed ? '完了' : '未完了'}</p>
                </div>
                <div className="p-2">
                  <p>{todo.descriptions}</p>
                  <p>作成日: {formatDate(todo.createdAt)}</p>
                  <p>更新日: {formatDate(todo.updatedAt)}</p>
                  <button
                    type="button"
                    onClick={() => router.push(`todos/${todo.id}`)}
                    className="bg-blue-500 text-white py-1 px-4 rounded-full hover:bg-blue-600 transition-colors"
                  >
                    詳細
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        {todos.length === 0 && (
          <div className="w-100 bg-white rounded-lg shadow-md p-4 my-4 text-center">
            <p>Todoがありません</p>
          </div>
        )}
      </main>

      {/*  モーダルの作成 */}
      {showModal && (
        <div className="fixed inset-0 bg-white/50 flex justify-center items-center">
          <div className="w-96 bg-white p-6 rounded shadow-lg">
            <div className="flex flex-col items-center relative">
              <h2 className="text-lg font-bold mb-4">新規Todo作成</h2>
              <input
                type="text"
                placeholder="タイトル"
                value={form.title}
                onChange={handleInputChange}
                onBlur={validateInputForm}
                name="title"
                className="w-full border py-2 px-4 mb-5 rounded-lg border-gray-400 focus:border-blue-500 focus:ring-blue-500 focus:ring-1"
                // maxLength={32}
                required
              />
              <input
                type="text"
                placeholder="説明"
                value={form.descriptions}
                onChange={handleInputChange}
                onBlur={validateInputForm}
                name="descriptions"
                className="w-full border py-2 px-4 mb-5 rounded-lg border-gray-400 focus:border-blue-500 focus:ring-blue-500 focus:ring-1"
                // maxLength={128}
              />
            </div>
            <div className="flex justify-end mt-4">
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setError(null);
                }}
                className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded transition-colors"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="bg-blue-500 text-white py-1 px-4 ml-2 rounded hover:bg-blue-600 transition-colors"
              >
                作成
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ローディング状態 */}
      {isLoading && (
        <div className="fixed inset-0 flex items-center justify-center bg-white/50">
          <div className="animate-spin rounded-full h-12 w-12 border-5 border-gray-300 border-t-blue-500"></div>
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

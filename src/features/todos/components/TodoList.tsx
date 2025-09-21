'use client';

import { useRouter } from 'next/navigation';
import { startTransition, useOptimistic, useState } from 'react';
import TodoForm from '@/features/todos/components/TodoForm';
import { deleteClientCookie } from '@/lib/cookie';

export default function TodoList({
  initialTodos,
  user,
}: {
  initialTodos: Array<{
    id: string;
    title: string;
    descriptions?: string | undefined;
    completed: boolean;
    userId: string;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
  user: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    role: number;
  };
}) {
  type Todo = {
    id: string;
    title: string;
    descriptions?: string | undefined;
    completed: boolean;
    userId: string;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
  };

  const [todos, setTodos] = useState<Todo[]>(initialTodos);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // useOptimistic: 楽観的UI用の状態管理
  const [optimisticTodos, addOptimisticTodos] = useOptimistic(
    todos,
    (state: Todo[], newTodo: Todo) => [newTodo, ...state],
  );

  // 日付フォーマット関数
  const formatDate = (dateValue: string | Date) => {
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    return date.toLocaleDateString();
  };

  const handleLogout = async () => {
    // token cookieを削除
    deleteClientCookie('token');
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch {
      return;
    }
    router.push('/auth/login');
  };

  const router = useRouter();

  // handleAddTodoをフォームデータを受け取る形に修正
  const handleAddTodo = async (formData: { title: string; descriptions?: string }) => {
    setIsLoading(true);
    setShowModal(false);

    const newTodo: Todo = {
      id: (Math.random() * 1000000).toString(),
      title: formData.title,
      descriptions: formData.descriptions,
      completed: false,
      userId: user.id,
      createdBy: user.username,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    // 楽観的UI更新
    startTransition(async () => {
      addOptimisticTodos(newTodo);

      const request = {
        title: formData.title,
        descriptions: formData.descriptions,
      };

      try {
        const response = await fetch('/api/todos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
          credentials: 'include',
        });

        const responseData = await response.json();

        // サーバー反映後に両方更新
        if (response.ok && responseData.success) {
          setTodos([responseData.data, ...todos]);
        } else {
          setError(responseData.message || 'Todoの作成に失敗しました');
        }
      } catch {
        setError('ネットワークエラーが発生しました');
      } finally {
        setIsLoading(false);
      }
    });
    setIsLoading(false);
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <header className="flex justify-between items-center p-4 bg-blue-500 text-white">
        <h1 className="text-xl font-bold">Todoアプリ</h1>
        <h2>Hello! {user?.username}!</h2>
        <button
          type="button"
          className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded transition-colors"
          onClick={() => router.push('/users/me')}
        >
          プロフィール
        </button>
        {user?.role === 1 && (
          <button
            type="button"
            className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded transition-colors"
            onClick={() => router.push('/users')}
          >
            ユーザ一覧
          </button>
        )}
        <button
          type="button"
          className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded transition-colors"
          onClick={handleLogout}
        >
          ログアウト
        </button>
      </header>
      <main className="p-4 flex flex-col items-center">
        <h2 className="text-xl font-bold mb-4">Todo一覧</h2>
        <h2 className="text-xl font-bold mb-4">{optimisticTodos.length}件</h2>
        <button
          type="button"
          className="bg-blue-500 text-white py-1 px-4 my-4 rounded-full hover:bg-blue-600 transition-colors"
          onClick={() => setShowModal(!showModal)}
        >
          新規作成
        </button>
        <div className="w-full max-w-2xl mx-auto">
          {optimisticTodos.map((todo) => (
            <div
              key={todo.id}
              className="bg-white rounded-lg shadow-md mb-6 overflow-hidden"
            >
              <div className="mb-2 flex justify-between items-center bg-blue-500 text-white p-2">
                <h3 className="text-lg font-bold">{todo.title}</h3>
                <p>{todo.completed ? '完了' : '未完了'}</p>
              </div>
              <div className="p-2">
                <p>{todo.descriptions}</p>
                <p>作成日: {formatDate(todo.createdAt)}</p>
                <p>更新日: {formatDate(todo.updatedAt)}</p>
                <button
                  onClick={() => router.push(`/todos/${todo.id}`)}
                  type="button"
                  className="bg-blue-500 text-white py-1 px-4 rounded-full hover:bg-blue-600 transition-colors"
                >
                  詳細
                </button>
              </div>
            </div>
          ))}
        </div>
        {optimisticTodos.length === 0 && (
          <div className="w-100 bg-white rounded-lg shadow-md p-4 my-4 text-center">
            <p>Todoがありません</p>
          </div>
        )}
      </main>
      {showModal && (
        <div className="fixed inset-0 bg-white/50 flex justify-center items-center">
          <TodoForm
            mode="create"
            initialValues={{ title: '', descriptions: '' }}
            onSubmit={(formData) => handleAddTodo(formData)}
            onCancel={() => setShowModal(false)}
            isLoading={isLoading}
          />
        </div>
      )}
      {error && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded">
          {error}
        </div>
      )}
    </div>
  );
}

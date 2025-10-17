'use client';

import { Button, Card, CardBody, CardFooter, CardHeader, Link } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { startTransition, useMemo, useOptimistic, useState } from 'react';
import TodoForm from '@/features/todos/components/TodoForm';
import { deleteClientCookie } from '@/lib/cookie';

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

type User = {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  role: number;
};

export default function TodoList({
  initialTodos,
  user,
}: {
  initialTodos: Array<Todo>;
  user: User;
}) {
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
  const formatDate = useMemo(() => {
    return (dateValue: Date) => {
      if (!(dateValue instanceof Date)) {
        dateValue = new Date(dateValue);
      }
      return dateValue.toLocaleDateString();
    };
  }, []);

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
      <header className="h-15 p-5 flex justify-between items-center bg-blue-500 text-white">
        <h1 className="text-xl font-bold">Todoアプリ</h1>
        <h2>Hello! {user?.username}!</h2>
        <div className="flex gap-2">
          <Link
            className="bg-blue-600 text-white hover:bg-blue-700 px-3 py-1 rounded transition-colors"
            href="/users/me"
          >
            プロフィール
          </Link>
          {user?.role === 1 && (
            <Link
              className="bg-blue-600 text-white hover:bg-blue-700 px-3 py-1 rounded transition-colors"
              href="/users"
            >
              ユーザーリスト
            </Link>
          )}
          <button
            type="button"
            className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded transition-colors"
            onClick={handleLogout}
          >
            ログアウト
          </button>
        </div>
      </header>
      <main className="p-4 flex flex-col items-center">
        <Card shadow="sm" className="w-fit p-5 text-center">
          <h2 className="text-xl font-bold">Todo一覧</h2>
          <h2 className="text-xl font-bold">{optimisticTodos.length}件</h2>
        </Card>
        <Button
          color="primary"
          className="font-bold py-1 px-4 my-4 rounded-full sticky top-5 z-1 border-2 border-white"
          onPress={() => setShowModal(!showModal)}
        >
          <span className="text-xl align-middle">+</span>タスクを作成
        </Button>
        <div className="w-full max-w-2xl mx-auto">
          {optimisticTodos.map((todo) => (
            <Card key={todo.id} className="max-w-[600px] mx-auto mb-5 p-2 z-0 relative">
              <CardHeader className="box-shadow rounded-lg justify-between items-center bg-blue-500 text-white p-2">
                <h3 className="text-lg font-bold ml-1">{todo.title}</h3>
              </CardHeader>
              <CardBody className="min-h-[50px]">
                {!todo.descriptions ? (
                  <p className="text-gray-400">説明がありません</p>
                ) : (
                  <p>{todo.descriptions}</p>
                )}
              </CardBody>
              <CardFooter className="text-sm text-gray-500 my-2 gap-2 flex justify-between items-end py-0">
                <div>
                  <p>作成日: {formatDate(todo.createdAt)}</p>
                  <p>更新日: {formatDate(todo.updatedAt)}</p>
                </div>
                <Link
                  className="bg-blue-600 font-bold text-white py-1 px-5 rounded-full"
                  href={`/todos/${todo.id}`}
                >
                  詳細
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
        {optimisticTodos.length === 0 && (
          <div className="w-100 bg-white rounded-lg shadow-md p-4 my-4 text-center">
            <p>Todoがありません</p>
          </div>
        )}
      </main>
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-10">
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
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded z-999">
          {error}
        </div>
      )}
    </div>
  );
}

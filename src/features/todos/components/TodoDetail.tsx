'use client';

import TodoForm from '@/features/todos/components/TodoForm';
import { useRouter } from 'next/navigation';
import { startTransition, useOptimistic, useState } from 'react';

export default function TodoDetail({
  todo,
}: {
  todo: {
    id: number;
    title: string;
    descriptions?: string | undefined;
    completed: boolean;
    userId: number;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
  };
}) {
  const [form, setForm] = useState({
    title: todo.title,
    descriptions: todo.descriptions || '',
    completed: todo.completed,
  });
  const [initialTodo, setInitialTodo] = useState(todo);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [optimisticTodo, addOptimisticTodo] = useOptimistic(
    initialTodo,
    (state: Todo, newTodo: Todo) => ({ ...state, ...newTodo }),
  );
  const router = useRouter();

  interface Todo {
    id: number;
    title: string;
    descriptions?: string | undefined;
    completed: boolean;
    userId: number;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
  }

  interface UpdateTodoResponse {
    success: boolean;
    message: string;
    data: Todo;
  }

  const handleTaskUpdate = async (updatedForm: {
    title: string;
    descriptions?: string;
  }) => {
    setIsEditing(false);
    // バリデーション
    if (!updatedForm.title) {
      setError('タイトルは必須です');
      setIsSending(false);
      return;
    }

    startTransition(async () => {
      addOptimisticTodo({ ...optimisticTodo, ...updatedForm });
      setIsEditing(false);

      // API呼び出しでタスクを更新
      try {
        const response = await fetch(`/api/todos/${todo.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(updatedForm),
        });

        const data: UpdateTodoResponse = await response.json();
        const updatedData = data.data;
        if (!response.ok || !data.success) {
          throw new Error(data.message || 'タスクの更新に失敗しました');
        }
        setInitialTodo(updatedData);
        setForm({
          title: updatedData.title,
          descriptions: updatedData.descriptions || '',
          completed: updatedData.completed,
        });
      } catch (error) {
        setError((error as Error).message);
      } finally {
        setIsSending(false);
      }
    });
  };

  const handleTaskDelete = async () => {
    setIsSending(true);
    try {
      const response = await fetch(`/api/todos/${todo.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'タスクの削除に失敗しました');
      }
      // 削除成功後、Todo一覧ページへリダイレクト
      router.push('/todos');
    } catch (error) {
      setError((error as Error).message || 'タスクの削除に失敗しました');
    } finally {
      setIsSending(false);
    }
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
      </header>

      <main className="p-4 flex flex-col items-center">
        <h1 className="text-2xl font-bold mb-4">Todo詳細</h1>

        {/* Todo詳細表示 */}
        <div className="w-full max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div>
              <div className="space-y-3">
                <p>
                  <span className="font-medium">タイトル:</span>
                  {optimisticTodo.title}
                </p>
                <p>
                  <span className="font-medium">説明:</span>
                  {optimisticTodo.descriptions}
                </p>
                <p>
                  <span className="font-medium">ステータス:</span>{' '}
                  <span
                    className={`px-2 py-1 rounded-full text-white ${optimisticTodo.completed ? 'bg-green-500' : 'bg-red-500'}`}
                  >
                    {optimisticTodo.completed ? '完了' : '未完了'}
                  </span>
                </p>
                <p>
                  <span className="font-medium">作成者:</span>{' '}
                  {optimisticTodo.createdBy}
                </p>
                <p>
                  <span className="font-medium">作成日:</span>{' '}
                  {optimisticTodo.createdAt}
                </p>
                <p>
                  <span className="font-medium">更新日:</span>{' '}
                  {optimisticTodo.updatedAt}
                </p>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  編集
                </button>
                <button
                  type="button"
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition-colors"
                  onClick={handleTaskDelete}
                >
                  削除
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
      {isEditing && (
        <div className="fixed inset-0 bg-white/50 flex justify-center items-center">
          <TodoForm
            mode="edit"
            initialValues={{ title: form.title, descriptions: form.descriptions }}
            onSubmit={handleTaskUpdate}
            onCancel={() => setIsEditing(false)}
            isLoading={isSending}
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

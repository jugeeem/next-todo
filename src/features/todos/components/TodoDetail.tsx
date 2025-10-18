'use client';

import { Button, Card, CardBody, CardHeader, Chip, Link } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { startTransition, useMemo, useOptimistic, useState } from 'react';
import TodoForm from '@/features/todos/components/TodoForm';

type TodoDetail = {
  id: number;
  title: string;
  descriptions?: string | undefined;
  completed: boolean;
  userId: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
};

type TypeTodoForm = {
  title: string;
  descriptions: string;
  completed?: boolean;
};

type UpdateTodoResponse = {
  success: boolean;
  message: string;
  data: TodoDetail;
};

export default function TodoDetail({
  todoDetail,
  role,
}: {
  todoDetail: TodoDetail;
  role: number;
}) {
  const [form, setForm] = useState<TypeTodoForm>({
    title: todoDetail.title,
    descriptions: todoDetail.descriptions || '',
    completed: todoDetail.completed,
  });
  const [initialTodo, setInitialTodo] = useState(todoDetail);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [optimisticTodo, addOptimisticTodo] = useOptimistic(
    initialTodo,
    (state: TodoDetail, newTodo: TodoDetail) => ({ ...state, ...newTodo }),
  );
  const router = useRouter();

  const handleTaskUpdate = async (updatedForm: TypeTodoForm) => {
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
        const response = await fetch(`/api/todos/${todoDetail.id}`, {
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

  // 日付フォーマット関数
  const formatDate = useMemo(() => {
    return (dateValue: Date) => {
      if (!(dateValue instanceof Date)) {
        dateValue = new Date(dateValue);
      }
      return dateValue.toLocaleDateString();
    };
  }, []);

  const handleTaskDelete = async () => {
    setIsSending(true);
    try {
      const response = await fetch(`/api/todos/${todoDetail.id}`, {
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
      <header className="h-15 p-5 flex justify-between items-center bg-blue-500 text-white">
        <h1 className="text-xl font-bold">Todo詳細</h1>
        <div className="flex gap-2">
          <Link
            className="bg-blue-600 text-white hover:bg-blue-700 px-3 py-1 rounded transition-colors"
            href="/users/me"
          >
            プロフィール
          </Link>
          {role === 1 && (
            <Link
              className="bg-blue-600 text-white hover:bg-blue-700 px-3 py-1 rounded transition-colors"
              href="/users"
            >
              ユーザーリスト
            </Link>
          )}
          <Link
            href="/todos"
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition-colors"
          >
            Todo一覧
          </Link>
        </div>
      </header>

      <Card className="max-w-[600px] mx-auto mt-5 relative bg-blue-100 p-3">
        <CardHeader className="pt-0">
          <h1 className="text-xl font-bold text-gray-600">Todo詳細</h1>
        </CardHeader>
        <CardBody className="bg-white rounded-lg">
          <div className="w-full max-w-2xl mx-auto">
            <div className="space-y-3">
              <p>
                <span className="font-medium">タイトル:</span>
                {optimisticTodo.title}
              </p>
              <p>
                <span className="font-medium">説明:</span>
                {optimisticTodo.descriptions ? (
                  <span>{optimisticTodo.descriptions}</span>
                ) : (
                  <span className="text-gray-500">説明がありません</span>
                )}
              </p>
              <span className="font-medium">ステータス:</span>{' '}
              <Chip color={optimisticTodo.completed ? 'success' : 'danger'}>
                {optimisticTodo.completed ? '完了' : '未完了'}
              </Chip>
              <p>
                <span className="font-medium">作成者:</span> {optimisticTodo.createdBy}
              </p>
              <p>
                <span className="font-medium">作成日:</span>{' '}
                {formatDate(optimisticTodo.createdAt)}
              </p>
              <p>
                <span className="font-medium">更新日:</span>{' '}
                {formatDate(optimisticTodo.updatedAt)}
              </p>
            </div>
            <div className="flex gap-2 mt-4">
              <Button
                color="primary"
                className="px-4 py-2"
                onPress={() => setIsEditing(!isEditing)}
              >
                編集
              </Button>
              <Button
                color="danger"
                className="px-4 py-2"
                onPress={() => setIsDeleting(true)}
              >
                削除
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>
      {isEditing && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center">
          <TodoForm
            mode="edit"
            initialValues={{
              title: form.title,
              descriptions: form.descriptions,
            }}
            onSubmit={handleTaskUpdate}
            onCancel={() => setIsEditing(false)}
            isLoading={isSending}
          />
        </div>
      )}
      {/* 削除確認モーダル */}
      {isDeleting && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center">
          <Card shadow="none" className="w-80 p-3">
            <CardHeader>
              <h2 className="text-xl font-bold text-red-600">タスクの削除</h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <div>
                <p>本当にこのタスクを削除しますか？</p>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button
                  color="danger"
                  variant="light"
                  className={`px-4 py-2 ${
                    isSending ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  onPress={() => setIsDeleting(false)}
                  disabled={isSending}
                >
                  キャンセル
                </Button>
                <Button
                  color="danger"
                  className={`px-4 py-2 ${
                    isSending ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  onPress={handleTaskDelete}
                  disabled={isSending}
                >
                  {isSending ? '削除中...' : '削除'}
                </Button>
              </div>
            </CardBody>
          </Card>
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

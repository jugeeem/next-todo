'use client';

import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Input,
  Link,
  Textarea,
} from '@heroui/react';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import type { Todo } from '@/types/todo';

export default function TodoDetailPage() {
  // ダイナミックルーティングのパラメータ取得
  const params = useParams();
  const todoId = params.id as string;
  const router = useRouter();

  const [todo, setTodo] = useState<Todo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<number>(4);
  const [isInlineEditing, setIsInlineEditing] = useState<boolean>(false);
  const [inlineForm, setInlineForm] = useState<{
    title: string;
    descriptions: string;
  }>({ title: '', descriptions: '' });
  const [showModal, setShowModal] = useState(false);

  const fetchTodoDetail = useCallback(async () => {
    if (!todoId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/todos/${todoId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setTodo(data.data);
        setInlineForm({
          title: data.data.title,
          descriptions: data.data.descriptions || '',
        });
      } else {
        setError(data.message || 'Todoの取得に失敗しました');
      }
    } catch (error) {
      console.error('Failed to fetch todo detail:', error);
      setError('ネットワークエラーが発生しました');

      // 認証エラーの場合はログインページにリダイレクト
      if (error instanceof Error && error.message.includes('401')) {
        router.push('/login');
      }
    } finally {
      setIsLoading(false);
    }
  }, [todoId, router]);

  const handleDeleteTodo = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const resoponse = await fetch(`/api/todos/${todoId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const data = await resoponse.json();

      if (resoponse.ok && data.success) {
        // Todo一覧ページへリダイレクト
        router.push('/todos');
      } else {
        setError(data.message || 'Todoの削除に失敗しました');
      }
    } catch (error) {
      console.error('Delete todo error:', error);
      setError('ネットワークエラーが発生しました。Todoの削除に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        // ログアウト成功時にログインページへリダイレクト
        router.push('/login');
      } else {
        console.error('Logout failed');
        setError('ログアウトに失敗しました。');
      }
    } catch (error) {
      console.error('Failed to logout:', error);
      setError('ネットワークエラーが発生しました。ログアウトに失敗しました。');
    }
  };

  const saveInlineEdit = async () => {
    const { title, descriptions } = inlineForm;

    try {
      const response = await fetch(`/api/todos/${todoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ title, descriptions }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setTodo(data.data);
        setIsInlineEditing(false);
      } else {
        setError(data.message || 'Todoの更新に失敗しました');
      }
    } catch (error) {
      console.error('Save inline edit error:', error);
      setError('ネットワークエラーが発生しました。Todoの更新に失敗しました。');
    }
  };

  const cancelInlineEdit = () => {
    setIsInlineEditing(false);
    if (todo) {
      setInlineForm({
        title: todo.title,
        descriptions: todo.descriptions || '',
      });
    }
  };

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch('/api/users/me');
        if (response.ok) {
          const data = await response.json();
          setCurrentUserRole(data.data.role);
        }
      } catch (err) {
        console.error('Failed to fetch current user:', err);
        setError('ユーザー情報の取得に失敗しました。');
      }
    };

    fetchCurrentUser();
  }, []);

  useEffect(() => {
    fetchTodoDetail();
  }, [fetchTodoDetail]);

  return (
    <div className="bg-gray-50 min-h-screen">
      <header className="h-15 p-5 flex justify-between items-center bg-blue-500 text-white">
        <h1 className="text-xl font-bold">Todoアプリ</h1>
        <div className="flex gap-2">
          <Link
            className="bg-blue-600 text-white hover:bg-blue-700 px-3 py-1 rounded transition-colors"
            href="/todos"
          >
            Todo一覧
          </Link>
          <Link
            className="bg-blue-600 text-white hover:bg-blue-700 px-3 py-1 rounded transition-colors"
            href="/profile"
          >
            プロフィール
          </Link>
          {currentUserRole <= 2 && (
            <Link
              className="bg-blue-600 text-white hover:bg-blue-700 px-3 py-1 rounded transition-colors"
              href="/users"
            >
              ユーザーリスト
            </Link>
          )}
          <Button
            className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded transition-colors text-white"
            onPress={handleLogout}
          >
            ログアウト
          </Button>
        </div>
      </header>
      <main className="p-4 flex flex-col items-center">
        <div className="w-[600px] mx-auto">
          {/* ローディング状態 */}
          {isLoading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="mt-2 text-gray-600">読み込み中...</p>
            </div>
          )}

          {/* Todo詳細表示 */}
          {todo && !isLoading && (
            <Card className="w-full bg-blue-100 p-4">
              <CardHeader className="pt-0 px-0 flex justify-between items-center">
                <h1 className="text-xl font-bold text-blue-900">
                  Todo詳細{isInlineEditing && ' (編集モード)'}
                </h1>
                <div className="flex gap-2">
                  {isInlineEditing ? (
                    <>
                      <Button
                        color="primary"
                        size="sm"
                        onPress={() => saveInlineEdit()}
                      >
                        保存
                      </Button>
                      <Button
                        color="danger"
                        variant="bordered"
                        size="sm"
                        onPress={() => cancelInlineEdit()}
                      >
                        キャンセル
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        color="primary"
                        size="sm"
                        onPress={() => setIsInlineEditing(true)}
                      >
                        編集
                      </Button>
                      <Button
                        color="danger"
                        variant="bordered"
                        size="sm"
                        onPress={() => setShowModal(true)}
                      >
                        削除
                      </Button>
                    </>
                  )}
                </div>
              </CardHeader>
              <CardBody className="bg-white rounded-lg p-6">
                <div className="space-y-6">
                  {/* タイトルとステータス */}
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      {isInlineEditing ? (
                        <Input
                          type="text"
                          value={inlineForm.title}
                          className="mb-2 text-2xl font-bold"
                          onChange={(e) =>
                            setInlineForm({
                              ...inlineForm,
                              title: e.target.value,
                            })
                          }
                        />
                      ) : (
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                          {todo.title}
                        </h2>
                      )}
                      {todo.completed !== undefined && (
                        <Chip color={todo.completed ? 'success' : 'danger'} size="lg">
                          {todo.completed ? '完了' : '未完了'}
                        </Chip>
                      )}
                    </div>
                  </div>

                  {/* 説明 */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-700 mb-3">説明</h3>
                    {isInlineEditing ? (
                      <Textarea
                        rows={5}
                        value={inlineForm.descriptions}
                        onChange={(e) =>
                          setInlineForm({
                            ...inlineForm,
                            descriptions: e.target.value,
                          })
                        }
                      />
                    ) : (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        {todo.descriptions ? (
                          <p className="text-gray-900 whitespace-pre-wrap">
                            {todo.descriptions}
                          </p>
                        ) : (
                          <p className="text-gray-500 italic">説明がありません</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 日時情報 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-700 mb-2">
                        作成日時
                      </h3>
                      <p className="text-gray-900">
                        {todo.createdAt
                          ? new Date(todo.createdAt).toLocaleString('ja-JP')
                          : '-'}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-700 mb-2">
                        更新日時
                      </h3>
                      <p className="text-gray-900">
                        {todo.updatedAt
                          ? new Date(todo.updatedAt).toLocaleString('ja-JP')
                          : '-'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Todoが見つからない場合 */}
          {!todo && !isLoading && !error && (
            <Card className="w-full p-8 text-center">
              <p className="text-gray-500 text-lg mb-2">Todoが見つかりません</p>
              <p className="text-gray-400 text-sm mb-4">
                指定されたIDのTodoが存在しないか、アクセス権限がありません。
              </p>
              <Link href="/todos" className="text-blue-600 hover:underline">
                Todo一覧に戻る
              </Link>
            </Card>
          )}

          {/* Todoの削除時確認モーダル表示 */}
          {showModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-10">
              <div className="bg-white rounded-lg p-6 w-96">
                <h2 className="text-xl font-bold mb-4">確認</h2>
                <p className="mb-6">このTodoを削除しますか？</p>
                <div className="flex justify-end gap-4">
                  <Button
                    color="danger"
                    radius="full"
                    onPress={() => {
                      handleDeleteTodo();
                      setShowModal(false);
                    }}
                  >
                    削除
                  </Button>
                  <Button
                    color="primary"
                    variant="light"
                    radius="full"
                    onPress={() => setShowModal(false)}
                  >
                    キャンセル
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* エラートースト通知 */}
      {error && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 border border-red-500 bg-red-300 text-white px-6 py-3 rounded-lg shadow-lg z-50 max-w-sm">
          <div className="flex items-center justify-between">
            <span className="text-red-800">{error}</span>
            <Button
              color="danger"
              onPress={() => setError(null)}
              className="ml-4 text-white"
            >
              ×
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

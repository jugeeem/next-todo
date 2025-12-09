'use client';

import { Button, Card, CardBody, CardHeader, Input, Link } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import type { Todo } from '@/types/todo';
import type { TodoStats } from '@/types/todoStats';
import type { User } from '@/types/user';

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<TodoStats | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPasswordChangeOpen, setIsPasswordChangeOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState({
    currentPasswordError: '',
    newPasswordError: '',
    confirmPasswordError: '',
    generalPasswordError: '',
  });
  const [isInlineEditing, setIsInlineEditing] = useState(false);
  const [inlineForm, setInlineForm] = useState({
    firstName: '',
    lastName: '',
  });
  const [editError, setEditError] = useState<string | null>(null);
  const router = useRouter();

  // 現在のユーザー情報取得
  const fetchCurrentUser = useCallback(async () => {
    try {
      const response = await fetch('/api/users/me', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      return data;
    } catch {}
  }, []);

  // Todo統計取得
  const fetchTodoData = useCallback(async () => {
    try {
      const response = await fetch('/api/users/me/todos/stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      return data;
    } catch {}
  }, []);

  // Todo統計取得
  const fetchTodo = useCallback(async () => {
    try {
      const response = await fetch('/api/users/me/todos', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      return data;
    } catch {}
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [userResponse, todoStatsResponse, todosResponse] = await Promise.all([
        fetchCurrentUser(),
        fetchTodoData(),
        fetchTodo(),
      ]);

      setUser(userResponse?.data || null);
      setStats(todoStatsResponse?.data || null);
      setTodos(todosResponse?.data || []);
    } catch (err) {
      setError('データの取得に失敗しました');

      // 認証エラーの場合はログインページにリダイレクト
      if (err instanceof Error && err.message.includes('401')) {
        router.push('/login');
      }
    } finally {
      setIsLoading(false);
    }
  }, [fetchCurrentUser, fetchTodoData, fetchTodo, router]);

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
      }
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  // パスワードフォーム入力変更（リアルタイムバリデーション付き）
  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));

    // リアルタイムバリデーション
    setPasswordError((prev) => {
      const newError = { ...prev };

      // 現在のパスワード
      if (name === 'currentPassword' && !value) {
        newError.currentPasswordError = '現在のパスワードを入力してください。';
      } else if (name === 'currentPassword') {
        newError.currentPasswordError = '';
      }

      // 新しいパスワード
      if (name === 'newPassword' || name === 'confirmPassword') {
        const newPassword = name === 'newPassword' ? value : passwordForm.newPassword;
        const confirmPassword =
          name === 'confirmPassword' ? value : passwordForm.confirmPassword;

        if (newPassword.length < 8) {
          newError.newPasswordError =
            '新しいパスワードは8文字以上である必要があります。';
        } else {
          newError.newPasswordError = '';
        }

        if (confirmPassword && newPassword !== confirmPassword) {
          newError.confirmPasswordError =
            '新しいパスワードと確認用パスワードが一致しません。';
        } else {
          newError.confirmPasswordError = '';
        }
      }

      return newError;
    });
  };

  // パスワードバリデーション（送信時用）
  const validatePasswordForm = () => {
    let valid = true;
    const newError = {
      currentPasswordError: '',
      newPasswordError: '',
      confirmPasswordError: '',
      generalPasswordError: '',
    };

    if (!passwordForm.currentPassword) {
      newError.currentPasswordError = '現在のパスワードを入力してください。';
      valid = false;
    }
    if (!passwordForm.newPassword || passwordForm.newPassword.length < 8) {
      newError.newPasswordError = '新しいパスワードは8文字以上である必要があります。';
      valid = false;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      newError.confirmPasswordError =
        '新しいパスワードと確認用パスワードが一致しません。';
      valid = false;
    }
    setPasswordError(newError);
    return valid;
  };

  const handlePasswordChange = async () => {
    if (!validatePasswordForm()) {
      return;
    }
    try {
      const response = await fetch('/api/users/me/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(passwordForm),
        credentials: 'include',
      });
      const result = await response.json();
      if (response.ok) {
        alert('パスワードが正常に変更されました。');
        setIsPasswordChangeOpen(false);
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        setPasswordError({
          currentPasswordError: '',
          newPasswordError: '',
          confirmPasswordError: '',
          generalPasswordError: '',
        });
      } else {
        setPasswordError((prev) => ({
          ...prev,
          generalPasswordError:
            result.error || 'パスワード変更中にエラーが発生しました。',
        }));
      }
    } catch (error) {
      setPasswordError((prev) => ({
        ...prev,
        generalPasswordError:
          (error as Error).message || 'パスワード変更中にエラーが発生しました。',
      }));
    }
  };

  // インライン編集関連の関数
  const startInlineEdit = () => {
    if (user) {
      setInlineForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
      });
      setIsInlineEditing(true);
      setEditError(null);
    }
  };

  const cancelInlineEdit = () => {
    setIsInlineEditing(false);
    setEditError(null);
    if (user) {
      setInlineForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
      });
    }
  };

  const handleInlineInputChange = (field: 'firstName' | 'lastName', value: string) => {
    setInlineForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const saveInlineEdit = async () => {
    try {
      setEditError(null);

      const response = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(inlineForm),
        credentials: 'include',
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // ローカル状態を更新
        setUser((prev) =>
          prev
            ? {
                ...prev,
                firstName: inlineForm.firstName,
                lastName: inlineForm.lastName,
              }
            : null,
        );
        setIsInlineEditing(false);
      } else {
        setEditError(result.message || 'プロフィールの更新に失敗しました');
      }
    } catch (_error) {
      setEditError('ネットワークエラーが発生しました');
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
          {user && user.role <= 2 && (
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

          {/* エラー表示 */}
          {error && (
            <Card className="w-full mb-4 p-4 bg-red-50 border-red-200">
              <p className="text-red-600 text-center">{error}</p>
              <div className="text-center mt-4">
                <Button color="primary" variant="bordered" onPress={fetchData}>
                  再試行
                </Button>
              </div>
            </Card>
          )}

          {/* プロフィール表示 */}
          {user && !isLoading && (
            <div className="space-y-6">
              {/* ユーザー基本情報 */}
              <Card className="w-full bg-blue-100 p-4">
                <CardHeader className="pt-0 px-0 flex justify-between items-center">
                  <h1 className="text-xl font-bold text-blue-900">
                    プロフィール {isInlineEditing && '(編集モード)'}
                  </h1>
                  <div className="flex gap-2">
                    {isInlineEditing ? (
                      <>
                        <Button onPress={saveInlineEdit} color="primary" size="sm">
                          保存
                        </Button>
                        <Button
                          onPress={cancelInlineEdit}
                          color="danger"
                          variant="bordered"
                          size="sm"
                        >
                          キャンセル
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          onPress={() => setIsPasswordChangeOpen(true)}
                          color="primary"
                          size="sm"
                        >
                          パスワード変更
                        </Button>
                        <Button onPress={startInlineEdit} color="primary" size="sm">
                          プロフィール編集
                        </Button>
                      </>
                    )}
                  </div>
                </CardHeader>
                <CardBody className="bg-white rounded-lg p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <h3 className="text-lg font-medium text-gray-700 mb-2">名前</h3>
                      {isInlineEditing ? (
                        <div className="flex gap-2">
                          <Input
                            type="text"
                            value={inlineForm.lastName}
                            onChange={(e) =>
                              handleInlineInputChange('lastName', e.target.value)
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                saveInlineEdit();
                              } else if (e.key === 'Escape') {
                                e.preventDefault();
                                cancelInlineEdit();
                              }
                            }}
                            placeholder="姓を入力 - Enterで保存、Escでキャンセル"
                            label="姓"
                            className="flex-1"
                          />
                          <Input
                            type="text"
                            value={inlineForm.firstName}
                            onChange={(e) =>
                              handleInlineInputChange('firstName', e.target.value)
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                saveInlineEdit();
                              } else if (e.key === 'Escape') {
                                e.preventDefault();
                                cancelInlineEdit();
                              }
                            }}
                            placeholder="名を入力 - Enterで保存、Escでキャンセル"
                            label="名"
                            className="flex-1"
                          />
                        </div>
                      ) : (
                        <p className="text-gray-900 text-xl">
                          {user.lastName} {user.firstName}
                        </p>
                      )}
                      {editError && (
                        <p className="text-red-500 text-sm mt-2">{editError}</p>
                      )}
                    </div>

                    <div>
                      <h3 className="text-lg font-medium text-gray-700 mb-2">
                        ユーザー名
                      </h3>
                      <p className="text-gray-900">{user.username}</p>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium text-gray-700 mb-2">役割</h3>
                      <p className="text-gray-900">
                        {user.role === 1
                          ? '管理者'
                          : user.role === 2
                            ? 'マネージャー'
                            : user.role === 3
                              ? '一般ユーザー'
                              : 'ゲスト'}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium text-gray-700 mb-2">
                        登録日時
                      </h3>
                      <p className="text-gray-900">
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleString('ja-JP')
                          : '-'}
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Todo統計情報 */}
              {stats && (
                <Card className="w-full bg-blue-100 p-4">
                  <CardHeader className="pt-0">
                    <h2 className="text-xl font-bold text-blue-900">Todo統計</h2>
                  </CardHeader>
                  <CardBody className="bg-white rounded-lg p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-yellow-50 rounded-lg">
                        <h3 className="text-sm font-medium text-gray-600 mb-1">総数</h3>
                        <p className="text-2xl font-bold text-yellow-600">
                          {stats.totalTodos || 0}
                        </p>
                      </div>

                      <div className="text-center p-4 bg-yellow-50 rounded-lg">
                        <h3 className="text-sm font-medium text-gray-600 mb-1">
                          完了済み
                        </h3>
                        <p className="text-2xl font-bold text-yellow-600">
                          {stats.completedTodos || 0}
                        </p>
                      </div>

                      <div className="text-center p-4 bg-yellow-50 rounded-lg">
                        <h3 className="text-sm font-medium text-gray-600 mb-1">
                          未完了
                        </h3>
                        <p className="text-2xl font-bold text-yellow-600">
                          {stats.pendingTodos || 0}
                        </p>
                      </div>

                      <div className="text-center p-4 bg-yellow-50 rounded-lg">
                        <h3 className="text-sm font-medium text-gray-600 mb-1">
                          完了率
                        </h3>
                        <p className="text-2xl font-bold text-yellow-600">
                          {Math.round(stats.completionRate || 0)}%
                        </p>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              )}

              {/* 最近のTodo一覧 */}
              <Card className="w-full bg-blue-100 p-4">
                <CardHeader className="pt-0">
                  <h2 className="text-xl font-bold text-blue-900">最近のTodo</h2>
                </CardHeader>
                <CardBody className="bg-white rounded-lg p-6">
                  {todos.length > 0 ? (
                    <div className="space-y-3">
                      {todos.slice(0, 5).map((todo) => (
                        <div
                          key={todo.id}
                          className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <Link
                                href={`/todos/${todo.id}`}
                                className="text-lg font-medium text-blue-600 hover:underline"
                              >
                                {todo.title}
                              </Link>
                              {todo.descriptions && (
                                <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                                  {todo.descriptions}
                                </p>
                              )}
                              <p className="text-xs text-gray-500 mt-2">
                                {todo.createdAt
                                  ? new Date(todo.createdAt).toLocaleString('ja-JP')
                                  : ''}
                              </p>
                            </div>
                            <div className="ml-4">
                              {todo.completed !== undefined && (
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    todo.completed
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}
                                >
                                  {todo.completed ? '完了' : '未完了'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}

                      {todos.length > 5 && (
                        <div className="text-center pt-4">
                          <Link href="/todos" className="text-blue-600 hover:underline">
                            すべてのTodoを見る ({todos.length}件)
                          </Link>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500 text-lg mb-2">Todoがありません</p>
                      <p className="text-gray-400 text-sm mb-4">
                        新しいタスクを作成してみましょう。
                      </p>
                      <Link href="/todos" className="text-blue-600 hover:underline">
                        Todo一覧に移動
                      </Link>
                    </div>
                  )}
                </CardBody>
              </Card>
            </div>
          )}

          {/* データが見つからない場合 */}
          {!user && !isLoading && !error && (
            <Card className="w-full p-8 text-center">
              <p className="text-gray-500 text-lg mb-2">
                プロフィール情報が見つかりません
              </p>
              <p className="text-gray-400 text-sm mb-4">ログインしてください。</p>
              <Link href="/login" className="text-blue-600 hover:underline">
                ログインページに移動
              </Link>
            </Card>
          )}
        </div>
      </main>

      {/* パスワード変更モーダル */}
      {isPasswordChangeOpen && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <Card shadow="none" className="w-96 p-4">
            <CardHeader>
              <h2 className="text-xl font-bold">パスワード変更</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div>
                  <Input
                    type="password"
                    name="currentPassword"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordInputChange}
                    label="現在のパスワード"
                    placeholder="現在のパスワードを入力"
                  />
                  {passwordError.currentPasswordError && (
                    <p className="text-red-500 text-sm mt-1">
                      {passwordError.currentPasswordError}
                    </p>
                  )}
                </div>

                <div>
                  <Input
                    type="password"
                    name="newPassword"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordInputChange}
                    label="新しいパスワード"
                    placeholder="8文字以上で入力"
                  />
                  {passwordError.newPasswordError && (
                    <p className="text-red-500 text-sm mt-1">
                      {passwordError.newPasswordError}
                    </p>
                  )}
                </div>

                <div>
                  <Input
                    type="password"
                    name="confirmPassword"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordInputChange}
                    label="パスワード確認"
                    placeholder="新しいパスワードを再入力"
                  />
                  {passwordError.confirmPasswordError && (
                    <p className="text-red-500 text-sm mt-1">
                      {passwordError.confirmPasswordError}
                    </p>
                  )}
                </div>

                {passwordError.generalPasswordError && (
                  <p className="text-red-500 text-sm text-center">
                    {passwordError.generalPasswordError}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button onPress={handlePasswordChange} color="primary">
                  変更
                </Button>
                <Button
                  onPress={() => {
                    setIsPasswordChangeOpen(false);
                    setPasswordError({
                      currentPasswordError: '',
                      newPasswordError: '',
                      confirmPasswordError: '',
                      generalPasswordError: '',
                    });
                    setPasswordForm({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: '',
                    });
                  }}
                  color="danger"
                  variant="light"
                >
                  キャンセル
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}

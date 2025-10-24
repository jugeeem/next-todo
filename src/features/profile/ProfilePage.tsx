'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type FormEvent, useEffect, useState } from 'react';

interface User {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  role: number;
}

interface TodoStats {
  total: number;
  completed: number;
  pending: number;
  completionRate: number;
}

interface Todo {
  id: string;
  title: string;
  descriptions?: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [stats, setStats] = useState<TodoStats | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [isChangingPassword, setIsChangingPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);
  const [isSavingPassword, setIsSavingPassword] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // ユーザー情報を取得
  const fetchUserInfo = async () => {
    try {
      const response = await fetch('/api/users/me');

      if (response.status === 401) {
        router.push('/login');
        return;
      }

      if (!response.ok) {
        throw new Error('ユーザー情報の取得に失敗しました');
      }

      const data = await response.json();
      const userData = data.data;
      setUser(userData);
      setFirstName(userData.firstName || '');
      setLastName(userData.lastName || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ユーザー情報の取得に失敗しました');
    }
  };

  // Todo統計を取得
  const fetchTodoStats = async () => {
    try {
      const response = await fetch('/api/users/me/todos/stats');

      if (!response.ok) {
        throw new Error('Todo統計の取得に失敗しました');
      }

      const data = await response.json();
      setStats(data.data);
    } catch (err) {
      console.error('Todo統計の取得エラー:', err);
    }
  };

  // Todo一覧を取得
  const fetchTodos = async () => {
    try {
      const response = await fetch('/api/users/me/todos?page=1&perPage=10');

      if (!response.ok) {
        throw new Error('Todo一覧の取得に失敗しました');
      }

      const data = await response.json();
      setTodos(data.data || []);
    } catch (err) {
      console.error('Todo一覧の取得エラー:', err);
    }
  };

  // 初回読み込み時に全データを取得
  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoading(true);
      await Promise.all([fetchUserInfo(), fetchTodoStats(), fetchTodos()]);
      setIsLoading(false);
    };

    fetchAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchTodoStats, fetchTodos, fetchUserInfo]);

  // プロフィール更新
  const handleUpdateProfile = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    setIsSavingProfile(true);

    try {
      const response = await fetch('/api/users/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: firstName || undefined,
          lastName: lastName || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'プロフィールの更新に失敗しました');
      }

      await fetchUserInfo();
      setIsEditingProfile(false);
      setSuccessMessage('プロフィールを更新しました');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'プロフィールの更新に失敗しました');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // パスワード変更
  const handleChangePassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPasswordError('');
    setSuccessMessage('');

    if (!currentPassword) {
      setPasswordError('現在のパスワードは必須です');
      return;
    }

    if (!newPassword) {
      setPasswordError('新しいパスワードは必須です');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('新しいパスワードは6文字以上で入力してください');
      return;
    }

    setIsSavingPassword(true);

    try {
      const response = await fetch('/api/users/me/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'パスワードの変更に失敗しました');
      }

      setCurrentPassword('');
      setNewPassword('');
      setIsChangingPassword(false);
      setSuccessMessage('パスワードを変更しました');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setPasswordError(
        err instanceof Error ? err.message : 'パスワードの変更に失敗しました',
      );
    } finally {
      setIsSavingPassword(false);
    }
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
        {/* 成功メッセージ */}
        {successMessage && (
          <div className="text-green-600 text-sm bg-green-50 border border-green-200 rounded-md p-3 mb-4">
            {successMessage}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 左カラム: ユーザー情報とパスワード変更 */}
          <div className="space-y-8">
            {/* ユーザー情報 */}
            <div className="bg-white shadow-md rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">プロフィール</h2>
                {!isEditingProfile && (
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(true)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                  >
                    編集
                  </button>
                )}
              </div>

              {error && (
                <div className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                  {error}
                </div>
              )}

              {isEditingProfile ? (
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <label
                      htmlFor="username"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      ユーザー名
                    </label>
                    <input
                      type="text"
                      id="username"
                      value={user?.username || ''}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      ユーザー名は変更できません
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="lastName"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        姓
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="姓"
                        disabled={isSavingProfile}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="firstName"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        名
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="名"
                        disabled={isSavingProfile}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pt-4">
                    <button
                      type="submit"
                      disabled={isSavingProfile}
                      className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isSavingProfile ? '保存中...' : '保存'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingProfile(false);
                        setFirstName(user?.firstName || '');
                        setLastName(user?.lastName || '');
                        setError('');
                      }}
                      disabled={isSavingProfile}
                      className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      キャンセル
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">
                      ユーザー名
                    </h3>
                    <p className="text-gray-900">{user?.username}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-1">姓</h3>
                      <p className="text-gray-900">{user?.lastName || '未設定'}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-1">名</h3>
                      <p className="text-gray-900">{user?.firstName || '未設定'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* パスワード変更 */}
            <div className="bg-white shadow-md rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">パスワード変更</h2>
                {!isChangingPassword && (
                  <button
                    type="button"
                    onClick={() => setIsChangingPassword(true)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                  >
                    変更
                  </button>
                )}
              </div>

              {isChangingPassword ? (
                <form onSubmit={handleChangePassword} className="space-y-4">
                  {passwordError && (
                    <div className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-md p-3">
                      {passwordError}
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="currentPassword"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      現在のパスワード <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      id="currentPassword"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="現在のパスワード"
                      disabled={isSavingPassword}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="newPassword"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      新しいパスワード <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      id="newPassword"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="新しいパスワード（6文字以上）"
                      disabled={isSavingPassword}
                    />
                  </div>

                  <div className="flex items-center gap-4 pt-4">
                    <button
                      type="submit"
                      disabled={isSavingPassword}
                      className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isSavingPassword ? '変更中...' : '変更'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsChangingPassword(false);
                        setCurrentPassword('');
                        setNewPassword('');
                        setPasswordError('');
                      }}
                      disabled={isSavingPassword}
                      className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      キャンセル
                    </button>
                  </div>
                </form>
              ) : (
                <p className="text-gray-600">
                  パスワードを変更する場合は「変更」ボタンをクリックしてください。
                </p>
              )}
            </div>
          </div>

          {/* 右カラム: Todo統計と一覧 */}
          <div className="space-y-8">
            {/* Todo統計 */}
            <div className="bg-white shadow-md rounded-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Todo統計</h2>

              {stats ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">総数</p>
                    <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">完了数</p>
                    <p className="text-3xl font-bold text-green-600">
                      {stats.completed}
                    </p>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">未完了数</p>
                    <p className="text-3xl font-bold text-yellow-600">
                      {stats.pending}
                    </p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">完了率</p>
                    <p className="text-3xl font-bold text-purple-600">
                      {stats.completionRate.toFixed(1)}%
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">統計情報を読み込めませんでした</p>
              )}
            </div>

            {/* Todo一覧（簡易版） */}
            <div className="bg-white shadow-md rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">最近のTodo</h2>
                <Link
                  href="/todos"
                  className="text-blue-500 hover:text-blue-600 font-medium text-sm"
                >
                  すべて見る →
                </Link>
              </div>

              {todos.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Todoがありません</p>
              ) : (
                <div className="space-y-2">
                  {todos.map((todo) => (
                    <Link
                      key={todo.id}
                      href={`/todos/${todo.id}`}
                      className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={todo.completed}
                          readOnly
                          className="w-4 h-4 text-blue-500 rounded"
                        />
                        <div className="flex-1">
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
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

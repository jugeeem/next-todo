'use client';

import Link from 'next/link';
import { type FormEvent, useCallback, useEffect, useState } from 'react';
import {
  deleteUser,
  getUserDetail,
  getUserInfo,
  getUserTodoList,
  logout,
  updateUser,
} from '@/lib/api';

interface User {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  role: number;
  createdAt: string;
  updatedAt: string;
}

interface Todo {
  id: string;
  title: string;
  descriptions?: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

const roleLabels: Record<number, string> = {
  1: 'ADMIN',
  2: 'MANAGER',
  3: 'USER',
  4: 'GUEST',
};

const getRoleBadgeClass = (role: number): string => {
  switch (role) {
    case 1:
      return 'px-2 py-1 text-xs font-semibold rounded bg-red-100 text-red-800';
    case 2:
      return 'px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800';
    case 3:
      return 'px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-800';
    case 4:
      return 'px-2 py-1 text-xs font-semibold rounded bg-gray-100 text-gray-800';
    default:
      return 'px-2 py-1 text-xs font-semibold rounded bg-gray-100 text-gray-800';
  }
};

export function UserDetailPage({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [role, setRole] = useState<number>(4);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [currentUserRole, setCurrentUserRole] = useState<number>(4);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [isCheckingPermission, setIsCheckingPermission] = useState<boolean>(true);

  // 権限チェック
  useEffect(() => {
    const checkPermission = async () => {
      try {
        const result = await getUserInfo();

        if (!result.success) {
          window.location.href = '/login';
          return;
        }

        const userRole = result.data.role;
        const currentId = result.data.id;

        // ADMIN・MANAGER のみアクセス可能
        if (userRole >= 3) {
          window.location.href = '/todos';
          return;
        }

        setCurrentUserRole(userRole);
        setCurrentUserId(currentId);
        setHasPermission(true);
      } catch (err) {
        console.error('Permission check error:', err);
        window.location.href = '/login';
      } finally {
        setIsCheckingPermission(false);
      }
    };

    checkPermission();
  }, []);

  // ユーザー情報を取得
  const fetchUserInfo = useCallback(async () => {
    try {
      const result = await getUserDetail(userId);

      if (!result.success) {
        setError(result.error || 'ユーザー情報の取得に失敗しました');
        return;
      }

      const userData = result.data;
      setUser(userData);
      setFirstName(userData.firstName || '');
      setLastName(userData.lastName || '');
      setRole(userData.role);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ユーザー情報の取得に失敗しました');
    }
  }, [userId]);

  // Todo一覧を取得
  const fetchTodos = useCallback(async () => {
    try {
      const result = await getUserTodoList(userId, { page: 1, perPage: 10 });

      if (!result.success) {
        console.error('Todo一覧の取得エラー:', result.error);
        return;
      }

      setTodos(result.data?.data || []);
    } catch (err) {
      console.error('Todo一覧の取得エラー:', err);
    }
  }, [userId]);

  // 初回読み込み時に全データを取得
  useEffect(() => {
    if (hasPermission) {
      const fetchAllData = async () => {
        setIsLoading(true);
        await Promise.all([fetchUserInfo(), fetchTodos()]);
        setIsLoading(false);
      };

      fetchAllData();
    }
  }, [hasPermission, fetchUserInfo, fetchTodos]);

  // ユーザー情報更新
  const handleUpdateUser = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    setIsSaving(true);

    try {
      const result = await updateUser(userId, {
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        role,
      });

      if (!result.success) {
        setError(result.error || 'ユーザー情報の更新に失敗しました');
        return;
      }

      await fetchUserInfo();
      setIsEditing(false);
      setSuccessMessage('ユーザー情報を更新しました');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ユーザー情報の更新に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  // ユーザー削除
  const handleDeleteUser = async () => {
    if (!confirm(`ユーザー「${user?.username}」を削除してもよろしいですか?`)) {
      return;
    }

    try {
      const result = await deleteUser(userId);

      if (!result.success) {
        setError(result.error || 'ユーザーの削除に失敗しました');
        return;
      }

      window.location.href = '/users';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ユーザーの削除に失敗しました');
    }
  };

  // ログアウト
  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Logout error:', err);
      window.location.href = '/login';
    }
  };

  // 権限チェック中
  if (isCheckingPermission) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">権限を確認中...</p>
        </div>
      </div>
    );
  }

  // 権限なし
  if (!hasPermission) {
    return null;
  }

  // ローディング中
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

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* 戻るリンク */}
        <div className="mb-4">
          <Link href="/users" className="text-blue-500 hover:text-blue-600 font-medium">
            ← ユーザー一覧に戻る
          </Link>
        </div>

        {/* 成功メッセージ */}
        {successMessage && (
          <div className="text-green-600 text-sm bg-green-50 border border-green-200 rounded-md p-3 mb-4">
            {successMessage}
          </div>
        )}

        {/* エラー表示 */}
        {error && (
          <div className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-md p-3 mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 左カラム: ユーザー情報 */}
          <div className="space-y-8">
            {/* ユーザー情報 */}
            <div className="bg-white shadow-md rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">ユーザー情報</h2>
                <div className="flex items-center gap-2">
                  {currentUserRole === 1 && !isEditing && (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                    >
                      編集
                    </button>
                  )}
                  {currentUserRole === 1 && user?.id !== currentUserId && (
                    <button
                      type="button"
                      onClick={handleDeleteUser}
                      className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                    >
                      削除
                    </button>
                  )}
                </div>
              </div>

              {isEditing ? (
                <form onSubmit={handleUpdateUser} className="space-y-4">
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
                        disabled={isSaving}
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
                        disabled={isSaving}
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="role"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      ロール
                    </label>
                    <select
                      id="role"
                      value={role}
                      onChange={(e) => setRole(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isSaving}
                    >
                      <option value={1}>ADMIN</option>
                      <option value={2}>MANAGER</option>
                      <option value={3}>USER</option>
                      <option value={4}>GUEST</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-4 pt-4">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isSaving ? '保存中...' : '保存'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setFirstName(user?.firstName || '');
                        setLastName(user?.lastName || '');
                        setRole(user?.role || 4);
                        setError('');
                      }}
                      disabled={isSaving}
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

                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">ロール</h3>
                    <span className={getRoleBadgeClass(user?.role || 4)}>
                      {roleLabels[user?.role || 4]}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">作成日時</h3>
                    <p className="text-gray-900">
                      {user?.createdAt
                        ? new Date(user.createdAt).toLocaleString('ja-JP')
                        : '-'}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">更新日時</h3>
                    <p className="text-gray-900">
                      {user?.updatedAt
                        ? new Date(user.updatedAt).toLocaleString('ja-JP')
                        : '-'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 右カラム: Todo一覧 */}
          <div className="space-y-8">
            {/* Todo一覧（簡易版） */}
            <div className="bg-white shadow-md rounded-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">最近のTodo</h2>

              {todos.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Todoがありません</p>
              ) : (
                <div className="space-y-2">
                  {todos.map((todo) => (
                    <div key={todo.id} className="p-4 bg-gray-50 rounded-lg">
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
                    </div>
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

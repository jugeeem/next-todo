'use client';

import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
} from '@heroui/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type FormEvent, useCallback, useEffect, useState } from 'react';

interface User {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  role: number;
}

interface TodoStats {
  totalTodos: number;
  completedTodos: number;
  pendingTodos: number;
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

interface ProfilePageProps {
  initialUser?: User;
  initialStats?: TodoStats;
  initialTodos?: Todo[];
}

export function ProfilePage({
  initialUser,
  initialStats,
  initialTodos,
}: ProfilePageProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(initialUser || null);
  const [firstName, setFirstName] = useState<string>(initialUser?.firstName || '');
  const [lastName, setLastName] = useState<string>(initialUser?.lastName || '');
  const [stats, setStats] = useState<TodoStats | null>(initialStats || null);
  const [todos, setTodos] = useState<Todo[]>(initialTodos || []);
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [isChangingPassword, setIsChangingPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);
  const [isSavingPassword, setIsSavingPassword] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // ユーザー情報を取得
  const fetchUserInfo = useCallback(async () => {
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
  }, [router]);

  // Todo統計を取得
  const fetchTodoStats = useCallback(async () => {
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
  }, []);

  // Todo一覧を取得
  const fetchTodos = useCallback(async () => {
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
  }, []);

  // 初回読み込み時に全データを取得（初期データがない場合のみ）
  useEffect(() => {
    if (initialUser && initialStats && initialTodos) {
      // サーバーから渡された場合はスキップ
      return;
    }

    const fetchAllData = async () => {
      setIsLoading(true);
      await Promise.all([fetchUserInfo(), fetchTodoStats(), fetchTodos()]);
      setIsLoading(false);
    };

    fetchAllData();
  }, [
    fetchTodoStats,
    fetchTodos,
    fetchUserInfo,
    initialUser,
    initialStats,
    initialTodos,
  ]);

  // プロフィール更新
  const handleUpdateProfile = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    setIsSavingProfile(true);

    try {
      const response = await fetch('/api/users/me', {
        method: 'PATCH',
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

    if (!confirmPassword) {
      setPasswordError('パスワード確認は必須です');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('新しいパスワードとパスワード確認が一致しません');
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
          confirmPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'パスワードの変更に失敗しました');
      }

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
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
      <Navbar>
        <NavbarBrand>
          <p className="font-bold text-inherit">Todo アプリ</p>
        </NavbarBrand>
        <NavbarContent className="hidden sm:flex gap-4" justify="center">
          <NavbarItem>
            <Link href="/todos" className="text-foreground">
              Todo一覧
            </Link>
          </NavbarItem>
          <NavbarItem>
            <Link href="/profile" className="text-foreground">
              プロフィール
            </Link>
          </NavbarItem>
          {user && user.role <= 2 && (
            <NavbarItem>
              <Link href="/users" className="text-foreground">
                ユーザー管理
              </Link>
            </NavbarItem>
          )}
        </NavbarContent>
        <NavbarContent justify="end">
          <NavbarItem>
            <Button color="default" variant="flat" onPress={handleLogout}>
              ログアウト
            </Button>
          </NavbarItem>
        </NavbarContent>
      </Navbar>

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
            <Card>
              <CardHeader className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">プロフィール</h2>
                {!isEditingProfile && (
                  <Button color="primary" onPress={() => setIsEditingProfile(true)}>
                    編集
                  </Button>
                )}
              </CardHeader>
              <CardBody>
                {error && (
                  <div className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                    {error}
                  </div>
                )}

                {isEditingProfile ? (
                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <Input
                      type="text"
                      label="ユーザー名"
                      value={user?.username || ''}
                      isDisabled
                      description="ユーザー名は変更できません"
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        type="text"
                        label="姓"
                        placeholder="姓"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        isDisabled={isSavingProfile}
                      />

                      <Input
                        type="text"
                        label="名"
                        placeholder="名"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        isDisabled={isSavingProfile}
                      />
                    </div>

                    <div className="flex items-center gap-4 pt-4">
                      <Button type="submit" color="primary" isLoading={isSavingProfile}>
                        保存
                      </Button>
                      <Button
                        color="default"
                        variant="flat"
                        onPress={() => {
                          setIsEditingProfile(false);
                          setFirstName(user?.firstName || '');
                          setLastName(user?.lastName || '');
                          setError('');
                        }}
                        isDisabled={isSavingProfile}
                      >
                        キャンセル
                      </Button>
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
              </CardBody>
            </Card>

            {/* パスワード変更 */}
            <Card>
              <CardHeader className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">パスワード変更</h2>
                {!isChangingPassword && (
                  <Button color="primary" onPress={() => setIsChangingPassword(true)}>
                    変更
                  </Button>
                )}
              </CardHeader>
              <CardBody>
                {isChangingPassword ? (
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    {passwordError && (
                      <div className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-md p-3">
                        {passwordError}
                      </div>
                    )}

                    <Input
                      type="password"
                      label="現在のパスワード"
                      placeholder="現在のパスワード"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      isDisabled={isSavingPassword}
                      isRequired
                    />

                    <Input
                      type="password"
                      label="新しいパスワード"
                      placeholder="新しいパスワード（6文字以上）"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      isDisabled={isSavingPassword}
                      isRequired
                    />

                    <Input
                      type="password"
                      label="新しいパスワード（確認）"
                      placeholder="新しいパスワードを再入力"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      isDisabled={isSavingPassword}
                      isRequired
                    />

                    <div className="flex items-center gap-4 pt-4">
                      <Button
                        type="submit"
                        color="primary"
                        isLoading={isSavingPassword}
                      >
                        変更
                      </Button>
                      <Button
                        color="default"
                        variant="flat"
                        onPress={() => {
                          setIsChangingPassword(false);
                          setCurrentPassword('');
                          setNewPassword('');
                          setConfirmPassword('');
                          setPasswordError('');
                        }}
                        isDisabled={isSavingPassword}
                      >
                        キャンセル
                      </Button>
                    </div>
                  </form>
                ) : (
                  <p className="text-gray-600">
                    パスワードを変更する場合は「変更」ボタンをクリックしてください。
                  </p>
                )}
              </CardBody>
            </Card>
          </div>

          {/* 右カラム: Todo統計と一覧 */}
          <div className="space-y-8">
            {/* Todo統計 */}
            <Card>
              <CardHeader>
                <h2 className="text-xl font-bold text-gray-900">Todo統計</h2>
              </CardHeader>
              <CardBody>
                {stats ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">総数</p>
                      <p className="text-3xl font-bold text-blue-600">
                        {stats.totalTodos}
                      </p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">完了数</p>
                      <p className="text-3xl font-bold text-green-600">
                        {stats.completedTodos}
                      </p>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">未完了数</p>
                      <p className="text-3xl font-bold text-yellow-600">
                        {stats.pendingTodos}
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
              </CardBody>
            </Card>

            {/* Todo一覧（簡易版） */}
            <Card>
              <CardHeader className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">最近のTodo</h2>
                <Link
                  href="/todos"
                  className="text-blue-500 hover:text-blue-600 font-medium text-sm"
                >
                  すべて見る →
                </Link>
              </CardHeader>
              <CardBody>
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
                            className="w-4 h-4 text-blue-500 rounded pointer-events-none"
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
              </CardBody>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

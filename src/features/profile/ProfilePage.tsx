'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { PasswordChangeForm } from './components/PasswordChangeForm';
import { ProfileInfo } from './components/ProfileInfo';
import { TodoStatsDisplay } from './components/TodoStatsDisplay';
import type { Todo, TodoStats, User } from './components/types';
import { UserTodoList } from './components/UserTodoList';

interface ProfilePageProps {
  initialUser?: User;
  initialStats?: TodoStats;
  initialTodos?: Todo[];
}

/**
 * プロフィールページコンポーネント
 */
export function ProfilePage({
  initialUser,
  initialStats,
  initialTodos,
}: ProfilePageProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(initialUser || null);
  const [stats, setStats] = useState<TodoStats | null>(initialStats || null);
  const [todos, setTodos] = useState<Todo[]>(initialTodos || []);
  const [isLoading, setIsLoading] = useState<boolean>(false);
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
    } catch (err) {
      console.error('ユーザー情報の取得エラー:', err);
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
  const handleUpdateProfile = async (firstName?: string, lastName?: string) => {
    const response = await fetch('/api/users/me', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        firstName,
        lastName,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'プロフィールの更新に失敗しました');
    }

    await fetchUserInfo();
    setSuccessMessage('プロフィールを更新しました');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // パスワード変更
  const handleChangePassword = async (
    currentPassword: string,
    newPassword: string,
    confirmPassword: string,
  ) => {
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

    setSuccessMessage('パスワードを変更しました');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">プロフィール</h1>

        {/* 成功メッセージ */}
        {successMessage && (
          <div className="text-green-600 text-sm bg-green-50 border border-green-200 rounded-md p-3 mb-4">
            {successMessage}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 左カラム: ユーザー情報とパスワード変更 */}
          <div className="space-y-8">
            {user && <ProfileInfo user={user} onUpdate={handleUpdateProfile} />}
            <PasswordChangeForm onChangePassword={handleChangePassword} />
          </div>

          {/* 右カラム: Todo統計と一覧 */}
          <div className="space-y-8">
            <TodoStatsDisplay stats={stats} />
            <UserTodoList todos={todos} />
          </div>
        </div>
      </main>
    </div>
  );
}

'use client';

import { useCallback, useEffect, useState } from 'react';
import { getTodoStats, getUserInfo, getUserTodos } from '@/lib/api';
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

export function ProfilePage({
  initialUser,
  initialStats,
  initialTodos,
}: ProfilePageProps) {
  const [user, setUser] = useState<User | null>(initialUser || null);
  const [stats, setStats] = useState<TodoStats | null>(initialStats || null);
  const [todos, setTodos] = useState<Todo[]>(initialTodos || []);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  // ユーザー情報を取得
  const fetchUserInfo = useCallback(async () => {
    try {
      const result = await getUserInfo();

      if (!result.success) {
        console.error('ユーザー情報の取得エラー:', result.error);
        return;
      }

      const userData = result.data;
      setUser(userData);
    } catch (err) {
      console.error('ユーザー情報の取得エラー:', err);
    }
  }, []);

  // Todo統計を取得
  const fetchTodoStats = useCallback(async () => {
    try {
      const result = await getTodoStats();

      if (!result.success) {
        console.error('Todo統計の取得エラー:', result.error);
        return;
      }

      setStats(result.data);
    } catch (err) {
      console.error('Todo統計の取得エラー:', err);
    }
  }, []);

  // Todo一覧を取得
  const fetchTodos = useCallback(async () => {
    try {
      const result = await getUserTodos();

      if (!result.success) {
        console.error('Todo一覧の取得エラー:', result.error);
        return;
      }

      setTodos(result.data || []);
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

  // プロフィール更新成功時のコールバック
  const handleProfileUpdateSuccess = () => {
    fetchUserInfo();
    setSuccessMessage('プロフィールを更新しました');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // パスワード変更成功時のコールバック
  const handlePasswordChangeSuccess = () => {
    setSuccessMessage('パスワードを変更しました');
    setTimeout(() => setSuccessMessage(''), 3000);
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
            {/* プロフィール情報 */}
            {user && <ProfileInfo user={user} onUpdate={handleProfileUpdateSuccess} />}

            {/* パスワード変更 */}
            <PasswordChangeForm onSuccess={handlePasswordChangeSuccess} />
          </div>

          {/* 右カラム: Todo統計と一覧 */}
          <div className="space-y-8">
            {/* Todo統計 */}
            <TodoStatsDisplay stats={stats} />

            {/* Todo一覧（簡易版） */}
            <UserTodoList todos={todos} />
          </div>
        </div>
      </main>
    </div>
  );
}

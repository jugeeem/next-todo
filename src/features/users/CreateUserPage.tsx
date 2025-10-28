'use client';

import Link from 'next/link';
import { type FormEvent, useEffect, useState } from 'react';
import { createUser, getUserInfo, logout } from '@/lib/api';

const roleLabels: Record<number, string> = {
  1: 'ADMIN',
  2: 'MANAGER',
  3: 'USER',
  4: 'GUEST',
};

export function CreateUserPage() {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [role, setRole] = useState<number>(4);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [currentUserRole, setCurrentUserRole] = useState<number>(4);
  const [availableRoles, setAvailableRoles] = useState<number[]>([]);
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

        // ADMIN・MANAGER のみアクセス可能
        if (userRole >= 3) {
          window.location.href = '/todos';
          return;
        }

        setCurrentUserRole(userRole);

        // 利用可能なロールを設定
        if (userRole === 1) {
          // ADMIN: 全てのロールを作成可能
          setAvailableRoles([1, 2, 3, 4]);
        } else if (userRole === 2) {
          // MANAGER: ADMIN以外を作成可能
          setAvailableRoles([2, 3, 4]);
          setRole(2); // デフォルトをMANAGERに設定
        }

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

  // ログアウト
  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Logout error:', err);
      window.location.href = '/login';
    }
  };

  // ユーザー作成
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    // バリデーション
    if (!username.trim()) {
      setError('ユーザー名を入力してください');
      return;
    }

    if (username.length > 32) {
      setError('ユーザー名は32文字以内で入力してください');
      return;
    }

    if (!password) {
      setError('パスワードを入力してください');
      return;
    }

    if (password.length < 8) {
      setError('パスワードは8文字以上で入力してください');
      return;
    }

    if (password !== confirmPassword) {
      setError('パスワードが一致しません');
      return;
    }

    if (firstName && firstName.length > 32) {
      setError('名は32文字以内で入力してください');
      return;
    }

    if (lastName && lastName.length > 32) {
      setError('姓は32文字以内で入力してください');
      return;
    }

    // MANAGER が ADMIN を作成しようとした場合
    if (currentUserRole === 2 && role === 1) {
      setError('MANAGER は ADMIN ユーザーを作成できません');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createUser({
        username,
        password,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        role,
      });

      if (!result.success) {
        setError(result.error || 'ユーザーの作成に失敗しました');
        return;
      }

      const createdUserId = result.data.id;

      // 作成したユーザーの詳細ページに遷移
      window.location.href = `/users/${createdUserId}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ユーザーの作成に失敗しました');
    } finally {
      setIsSubmitting(false);
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

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* 戻るリンク */}
        <div className="mb-4">
          <Link href="/users" className="text-blue-500 hover:text-blue-600 font-medium">
            ← ユーザー一覧に戻る
          </Link>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">ユーザー作成</h2>

          {/* エラー表示 */}
          {error && (
            <div className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-md p-3 mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* ユーザー名 */}
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                ユーザー名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="username"
                maxLength={32}
                required
                disabled={isSubmitting}
              />
              <p className="text-xs text-gray-500 mt-1">最大32文字</p>
            </div>

            {/* パスワード */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                パスワード <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="8文字以上"
                required
                disabled={isSubmitting}
              />
              <p className="text-xs text-gray-500 mt-1">最小8文字</p>
            </div>

            {/* パスワード（確認） */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                パスワード（確認） <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="パスワードを再入力"
                required
                disabled={isSubmitting}
              />
            </div>

            {/* 姓・名 */}
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
                  maxLength={32}
                  disabled={isSubmitting}
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
                  maxLength={32}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* ロール */}
            <div>
              <label
                htmlFor="role"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                ロール <span className="text-red-500">*</span>
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={isSubmitting}
              >
                {availableRoles.map((roleValue) => (
                  <option key={roleValue} value={roleValue}>
                    {roleLabels[roleValue]}
                  </option>
                ))}
              </select>
              {currentUserRole === 2 && (
                <p className="text-xs text-gray-500 mt-1">
                  MANAGER は ADMIN ユーザーを作成できません
                </p>
              )}
            </div>

            {/* 送信ボタン */}
            <div className="flex items-center gap-4 pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isSubmitting ? '作成中...' : 'ユーザーを作成'}
              </button>
              <Link
                href="/users"
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors font-medium text-center"
              >
                キャンセル
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

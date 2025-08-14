'use client';

import { useRouter } from 'next/navigation';
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { deleteAuthCookiesFromClient, getClientCookie } from '@/lib/cookie';

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [profileForm, setProfileForm] = useState<ProfileForm>({
    firstName: '',
    lastName: '',
    firstNameRuby: '',
    lastNameRuby: '',
  });
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [todoStats, setTodoStats] = useState<TodoStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmittingProfile, setIsSubmittingProfile] = useState<boolean>(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isProfileEditOpen, setIsProfileEditOpen] = useState<boolean>(false);
  const [isPasswordChangeOpen, setIsPasswordChangeOpen] = useState<boolean>(false);
  const router = useRouter();

  interface User {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    firstNameRuby: string;
    lastNameRuby: string;
    role: number;
    createdAt: string;
    updatedAt: string;
  }

  interface ProfileForm {
    firstName: string;
    lastName: string;
    firstNameRuby: string;
    lastNameRuby: string;
  }

  interface PasswordForm {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }

  interface TodoStats {
    totalTodos: number;
    completedTodos: number;
    pendingTodos: number;
  }

  interface ProfileResponse {
    success: boolean;
    data: User;
    message: string;
  }

  interface UpdateProfileResponse {
    success: boolean;
    data: User;
    message: string;
  }

  interface ChangePasswordResponse {
    success: boolean;
    message: string;
    data: string;
  }

  interface TodoStatsResponse {
    success: boolean;
    data: TodoStats;
    message: string;
  }

  // プロフィールを取得する関数
  const fetchProfile = useCallback(async () => {
    setIsSubmittingProfile(true);
    setError(null);

    const token = getClientCookie('token');
    if (!token) {
      setError('認証トークンが見つかりません。ログインしてください。');
      setIsSubmittingProfile(false);
      return;
    }

    try {
      const response = await fetch(`/api/users/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const responseData: ProfileResponse = await response.json();

      if (response.ok && responseData.success) {
        setUser(responseData.data);
        setProfileForm({
          firstName: responseData.data.firstName,
          lastName: responseData.data.lastName,
          firstNameRuby: responseData.data.firstNameRuby || '',
          lastNameRuby: responseData.data.lastNameRuby || '',
        });
      } else {
        setError(responseData.message || 'プロフィールの取得に失敗しました');
      }
    } catch {
      setError('プロフィールの取得中にエラーが発生しました');
    }
  }, []);

  // Todo統計を取得する関数
  const fetchTodoStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    // 認証トークンを取得
    const token = getClientCookie('token');
    if (!token) {
      setError('認証トークンが見つかりません。ログインしてください。');
      setIsLoading(false);
      router.push('/auth/login');
      return;
    }

    try {
      const response = await fetch(`/api/users/me/todos/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const responseData: TodoStatsResponse = await response.json();

      if (response.ok && responseData.success) {
        setTodoStats(responseData.data);
      } else {
        setError(responseData.message || 'Todo統計の取得に失敗しました');
      }
    } catch {
      setError('Todo統計の取得中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  // 初期データの取得
  useEffect(() => {
    const token = getClientCookie('token');
    const currentUser = getClientCookie('user');

    if (!currentUser || !token) {
      deleteAuthCookiesFromClient();
      router.push('/auth/login');
      return;
    }
    fetchProfile();
    fetchTodoStats();

    setIsLoading(false);
  }, [router, fetchProfile, fetchTodoStats]);

  const handleProfileUpdate = async () => {
    setIsSubmittingProfile(true);
    setError(null);

    const token = getClientCookie('token');
    if (!token) {
      setError('認証トークンが見つかりません。ログインしてください。');
      setIsSubmittingProfile(false);
      router.push('/auth/login');
      return;
    }

    try {
      const response = await fetch(`/api/users/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileForm),
      });

      const responseData: UpdateProfileResponse = await response.json();

      if (response.ok && responseData.success) {
        setUser(responseData.data);
        setSuccessMessage('プロフィールが更新されました');
        setIsProfileEditOpen(false); // 編集モードを閉じる
      } else {
        setError(responseData.message || 'プロフィールの更新に失敗しました');
      }
    } catch {
      setError('プロフィールの更新中にエラーが発生しました');
    } finally {
      setIsSubmittingProfile(false);
    }
  };

  // パスワード変更のハンドラー
  const handlePasswordChange = async () => {
    setIsSubmittingPassword(true);
    setError(null);

    const token = getClientCookie('token');
    if (!token) {
      setError('認証トークンが見つかりません。ログインしてください。');
      setIsSubmittingPassword(false);
      router.push('/auth/login');
      return;
    }

    const requestBody = {
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
      confirmPassword: passwordForm.confirmPassword,
    };

    if (!validatePasswordForm()) {
      return;
    }

    try {
      const response = await fetch(`/api/users/me/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const responseData: ChangePasswordResponse = await response.json();
      if (response.ok && responseData.success) {
        setSuccessMessage('パスワードが変更されました');
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        setIsPasswordChangeOpen(false); // 編集モードを閉じる
      } else {
        setError(
          responseData.message ||
            `パスワードの変更に失敗しました ${responseData.message}`,
        );
      }
    } catch {
      setError('パスワードの変更中にエラーが発生しました');
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  // 入力フィールドの変更ハンドラー
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // プロフィールフォームの更新
    if (
      name === 'firstName' ||
      name === 'lastName' ||
      name === 'firstNameRuby' ||
      name === 'lastNameRuby'
    ) {
      setProfileForm((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    // パスワードフォームの更新
    if (
      name === 'currentPassword' ||
      name === 'newPassword' ||
      name === 'confirmPassword'
    ) {
      setPasswordForm((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // パスワードフォームのバリデーション
  const validatePasswordForm = () => {
    if (
      !passwordForm.currentPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmPassword
    ) {
      setError('すべてのフィールドを入力してください');
      return false;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('新しいパスワードが一致しません');
      return false;
    }
    setError(null);
    return true;
  };

  // ユーザーの役割名を取得する関数
  const getUserRoleName = (role: number) => {
    switch (role) {
      case 1:
        return '管理者';
      case 2:
        return 'マネージャー';
      case 4:
        return 'ユーザー';
      case 8:
        return 'ゲスト';
      default:
        return '不明';
    }
  };

  // 日付をフォーマットする関数
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* ヘッダー - Index.tsxと同じスタイル */}
      <header className="flex justify-between items-center p-4 bg-blue-500 text-white">
        <h1 className="text-xl font-bold">プロフィール</h1>
        <h2 className="text-lg">Hello! {user?.username}!</h2>
        <button
          type="button"
          onClick={() => router.push('/todos')}
          className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded transition-colors"
        >
          Todo一覧へ
        </button>
      </header>

      {/* メインコンテンツ */}
      <main className="p-4 flex flex-col items-center">
        <h2 className="text-2xl font-bold mb-4">ユーザー情報</h2>

        {user && (
          <div className="w-full max-w-2xl space-y-4">
            {/* ユーザー情報カード */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden pb-4">
              <div className="bg-blue-500 text-white p-4">
                <h3 className="text-lg font-bold">基本情報</h3>
              </div>
              <div className="p-4 space-y-2">
                <p>
                  <span className="font-semibold">ユーザー名:</span> {user.username}
                </p>
                <p>
                  <span className="font-semibold">名前:</span> {user.firstName}{' '}
                  {user.lastName}
                </p>
                <p>
                  <span className="font-semibold">ふりがな:</span> {user.firstNameRuby}{' '}
                  {user.lastNameRuby}
                </p>
                <p>
                  <span className="font-semibold">権限:</span>{' '}
                  {getUserRoleName(user.role)}
                </p>
                <p>
                  <span className="font-semibold">作成日:</span>{' '}
                  {formatDate(user.createdAt)}
                </p>
                <p>
                  <span className="font-semibold">更新日:</span>{' '}
                  {formatDate(user.updatedAt)}
                </p>
              </div>
              {/* アクションボタン */}
              <div className="flex flex-wrap gap-2 justify-center">
                <button
                  type="button"
                  onClick={() => setIsProfileEditOpen(!isProfileEditOpen)}
                  className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded transition-colors"
                >
                  プロフィール編集
                </button>
                <button
                  type="button"
                  onClick={() => setIsPasswordChangeOpen(!isPasswordChangeOpen)}
                  className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded transition-colors"
                >
                  パスワード変更
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Todo統計カード */}
        {todoStats && (
          <div className="w-full max-w-2xl mt-6">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-blue-500 text-white p-4">
                <h3 className="text-lg font-bold">Todo統計</h3>
              </div>
              <div className="p-4 space-y-2">
                <p>
                  <span className="font-semibold">総Todo数:</span>{' '}
                  {todoStats.totalTodos}
                </p>
                <p>
                  <span className="font-semibold">完了したTodo数:</span>{' '}
                  {todoStats.completedTodos}
                </p>
                <p>
                  <span className="font-semibold">未完了のTodo数:</span>{' '}
                  {todoStats.pendingTodos}
                </p>
                <p>
                  <span className="font-semibold">完了率:</span>{' '}
                  {Math.round(
                    (todoStats.completedTodos / todoStats.totalTodos) * 100,
                  ) || 0}
                  %
                </p>
              </div>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2">読み込み中...</span>
          </div>
        )}
      </main>

      {/* プロフィール編集モーダル */}
      {isProfileEditOpen && (
        <div className="fixed inset-0 bg-white/50 flex justify-center items-center z-50">
          <div className="w-96 bg-white p-6 rounded-lg shadow-xl mx-4">
            <div className="flex flex-col relative">
              <h2 className="text-lg font-bold mb-4 text-center">プロフィール編集</h2>

              <div className="space-y-4">
                <input
                  type="text"
                  name="firstName"
                  value={profileForm.firstName}
                  onChange={handleInputChange}
                  placeholder="名前"
                  className="w-full border py-2 px-4 rounded-lg border-gray-400 focus:border-blue-500 focus:ring-blue-500 focus:ring-1"
                  maxLength={32}
                />
                <input
                  type="text"
                  name="lastName"
                  value={profileForm.lastName}
                  onChange={handleInputChange}
                  placeholder="名字"
                  className="w-full border py-2 px-4 rounded-lg border-gray-400 focus:border-blue-500 focus:ring-blue-500 focus:ring-1"
                  maxLength={32}
                />
                <input
                  type="text"
                  name="firstNameRuby"
                  value={profileForm.firstNameRuby}
                  onChange={handleInputChange}
                  placeholder="名前のふりがな"
                  className="w-full border py-2 px-4 rounded-lg border-gray-400 focus:border-blue-500 focus:ring-blue-500 focus:ring-1"
                  maxLength={32}
                />
                <input
                  type="text"
                  name="lastNameRuby"
                  value={profileForm.lastNameRuby}
                  onChange={handleInputChange}
                  placeholder="名字のふりがな"
                  className="w-full border py-2 px-4 rounded-lg border-gray-400 focus:border-blue-500 focus:ring-blue-500 focus:ring-1"
                  maxLength={32}
                />
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileEditOpen(false);
                    setError(null);
                  }}
                  className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  onClick={handleProfileUpdate}
                  className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded transition-colors"
                >
                  更新
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* パスワード変更モーダル */}
      {isPasswordChangeOpen && (
        <div className="fixed inset-0 bg-white/50 flex justify-center items-center z-50">
          <div className="w-96 bg-white p-6 rounded-lg shadow-xl mx-4">
            <div className="flex flex-col relative">
              <h2 className="text-lg font-bold mb-4 text-center">パスワード変更</h2>

              <div className="space-y-4">
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordForm.currentPassword}
                  onChange={handleInputChange}
                  placeholder="現在のパスワード"
                  className="w-full border py-2 px-4 rounded-lg border-gray-400 focus:border-blue-500 focus:ring-blue-500 focus:ring-1"
                />
                <input
                  type="password"
                  name="newPassword"
                  value={passwordForm.newPassword}
                  onChange={handleInputChange}
                  onBlur={validatePasswordForm}
                  placeholder="新しいパスワード"
                  className="w-full border py-2 px-4 rounded-lg border-gray-400 focus:border-blue-500 focus:ring-blue-500 focus:ring-1"
                />
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={handleInputChange}
                  onBlur={validatePasswordForm}
                  placeholder="新しいパスワードの確認"
                  className="w-full border py-2 px-4 rounded-lg border-gray-400 focus:border-blue-500 focus:ring-blue-500 focus:ring-1"
                />
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsPasswordChangeOpen(false);
                    setError(null);
                  }}
                  className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  onClick={handlePasswordChange}
                  className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white py-2 px-4 rounded transition-colors"
                >
                  パスワード変更
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ローディングオーバーレイ */}
      {isLoading && (
        <div className="fixed inset-0 flex items-center justify-center bg-white/50">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-300 border-t-blue-500"></div>
          {isSubmittingProfile && (
            <span className="ml-4 text-gray-700">プロフィール更新中...</span>
          )}
          {isSubmittingPassword && (
            <span className="ml-4 text-gray-700">パスワード変更中...</span>
          )}
        </div>
      )}

      <div className="fixed right-4 z-[9999] bottom-4 max-w-sm">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg animate-in slide-in-from-right-full duration-300">
            <div className="flex items-start justify-between">
              <span className="text-sm font-medium">{error}</span>
              <button
                type="button"
                onClick={() => setError(null)}
                className="ml-2 text-red-600 hover:text-red-800 flex-shrink-0"
              >
                ✕
              </button>
            </div>
          </div>
        )}
        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg shadow-lg animate-in slide-in-from-right-full duration-300">
            <div className="flex items-start justify-between">
              <span className="text-sm font-medium">{successMessage}</span>
              <button
                type="button"
                onClick={() => setSuccessMessage(null)}
                className="ml-2 text-green-600 hover:text-green-800 flex-shrink-0"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useRouter } from 'next/navigation';
import { startTransition, useOptimistic, useState } from 'react';

export default function UserProfile({
  profile,
}: {
  profile: {
    id: string;
    username: string;
    firstName?: string | undefined;
    firstNameRuby?: string | undefined;
    lastName?: string | undefined;
    lastNameRuby?: string | undefined;
    role: number;
    createdAt: Date;
    createdBy: string;
    updatedAt: Date;
    updatedBy: string;
    deleted: boolean;
  };
}) {
  const router = useRouter();
  const [initialProfile, setInitialProfile] = useState(profile);
  const [form, setForm] = useState<Form>({
    firstName: profile?.firstName || '',
    lastName: profile?.lastName || '',
    firstNameRuby: profile?.firstNameRuby || '',
    lastNameRuby: profile?.lastNameRuby || '',
  });
  const [isProfileEditOpen, setIsProfileEditOpen] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
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
  type Profile = {
    id: string;
    username: string;
    firstName?: string | undefined;
    firstNameRuby?: string | undefined;
    lastName?: string | undefined;
    lastNameRuby?: string | undefined;
    role: number;
    createdAt: Date;
    createdBy: string;
    updatedAt: Date;
    updatedBy: string;
    deleted: boolean;
  };

  const [optimisticProfile, addOptimisticProfile] = useOptimistic(
    initialProfile,
    (state: Profile, newProfile: Partial<Profile>) => ({
      ...state,
      ...newProfile,
    }),
  );

  type Form = {
    firstName: string;
    lastName: string;
    firstNameRuby: string;
    lastNameRuby: string;
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
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
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
            result.message || 'パスワード変更中にエラーが発生しました。',
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

  const handleProfileUpdate = () => {
    setIsProfileEditOpen(false);
    startTransition(async () => {
      addOptimisticProfile(form);

      try {
        const response = await fetch('/api/users/me', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
          credentials: 'include',
        });

        if (response.ok) {
          setInitialProfile({ ...optimisticProfile, ...form });
        } else {
          setEditError('プロフィール更新中にエラーが発生しました。');
        }
      } catch (error) {
        setEditError(
          (error as Error).message || 'プロフィール更新中にエラーが発生しました。',
        );
      }
    });
  };

  // 日付フォーマット関数
  const formatDate = (dateValue: string | Date) => {
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <header className="flex justify-between items-center p-4 bg-blue-500 text-white">
        <h1 className="text-xl font-bold">プロフィール</h1>
        <div className="flex gap-2">
          <button
            type="button"
            className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded transition-colors"
            onClick={() => router.push('/todos')}
          >
            Todo一覧
          </button>
          {profile?.role === 1 && (
            <button
              type="button"
              className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded transition-colors"
              onClick={() => router.push('/users')}
            >
              ユーザー一覧
            </button>
          )}
        </div>
      </header>
      <main className="p-6 w-[80%] max-w-2xl bg-white rounded-lg shadow-md mt-6 mx-auto flex flex-col items-center">
        <h2 className="text-2xl font-bold mb-4">ユーザープロフィール</h2>
        <div className="w-full">
          <p className="mb-2">
            <span className="font-semibold">ユーザー名:</span>{' '}
            {optimisticProfile.username}
          </p>
          <p className="mb-2">
            <span className="font-semibold">名前:</span>
            {optimisticProfile.lastName} {optimisticProfile.firstName}
          </p>
          <p className="mb-2">
            <span className="font-semibold">ふりがな:</span>
            {optimisticProfile.lastNameRuby} {optimisticProfile.firstNameRuby}
          </p>
          <p className="mb-2">
            <span className="font-semibold">役割:</span>{' '}
            {getUserRoleName(optimisticProfile.role)}
          </p>
          <p className="mb-2">
            <span className="font-semibold">作成日:</span>{' '}
            {formatDate(optimisticProfile.createdAt)}
          </p>
          <p className="mb-2">
            <span className="font-semibold">更新日:</span>{' '}
            {formatDate(optimisticProfile.updatedAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 justify-center">
          <button
            type="button"
            // onClick={() => setIsProfileEditOpen(!isProfileEditOpen)}
            className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded transition-colors"
            onClick={() => setIsProfileEditOpen(!isProfileEditOpen)}
          >
            プロフィール編集
          </button>
          <button
            type="button"
            className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded transition-colors"
            onClick={() => setIsPasswordChangeOpen(!isPasswordChangeOpen)}
          >
            パスワード変更
          </button>
        </div>
      </main>
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
                  onChange={handlePasswordInputChange}
                  placeholder="現在のパスワード"
                  className="w-full border py-2 px-4 rounded-lg border-gray-400 focus:border-blue-500 focus:ring-blue-500 focus:ring-1"
                />
                {passwordError.currentPasswordError && (
                  <p className="text-red-500">{passwordError.currentPasswordError}</p>
                )}
                <input
                  type="password"
                  name="newPassword"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordInputChange}
                  placeholder="新しいパスワード"
                  className="w-full border py-2 px-4 rounded-lg border-gray-400 focus:border-blue-500 focus:ring-blue-500 focus:ring-1"
                />
                {passwordError.newPasswordError && (
                  <p className="text-red-500">{passwordError.newPasswordError}</p>
                )}
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordInputChange}
                  placeholder="新しいパスワードの確認"
                  className="w-full border py-2 px-4 rounded-lg border-gray-400 focus:border-blue-500 focus:ring-blue-500 focus:ring-1"
                />
                {passwordError.confirmPasswordError && (
                  <p className="text-red-500">{passwordError.confirmPasswordError}</p>
                )}
                {passwordError.generalPasswordError && (
                  <p className="text-red-500">{passwordError.generalPasswordError}</p>
                )}
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => {
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
      {isProfileEditOpen && (
        <div className="fixed inset-0 bg-white/50 flex justify-center items-center z-50">
          <div className="w-96 bg-white p-6 rounded-lg shadow-xl mx-4">
            <div className="flex flex-col relative">
              <h2 className="text-lg font-bold mb-4 text-center">プロフィール編集</h2>
              <div className="space-y-4">
                <input
                  type="text"
                  name="lastName"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  placeholder="名前（姓）"
                  className="w-full border py-2 px-4 rounded-lg border-gray-400 focus:border-blue-500 focus:ring-blue-500 focus:ring-1"
                />
                <input
                  type="text"
                  name="firstName"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  placeholder="名前（名）"
                  className="w-full border py-2 px-4 rounded-lg border-gray-400 focus:border-blue-500 focus:ring-blue-500 focus:ring-1"
                />
                <input
                  type="text"
                  name="lastNameRuby"
                  value={form.lastNameRuby}
                  onChange={(e) => setForm({ ...form, lastNameRuby: e.target.value })}
                  placeholder="ふりがな（姓）"
                  className="w-full border py-2 px-4 rounded-lg border-gray-400 focus:border-blue-500 focus:ring-blue-500 focus:ring-1"
                />
                <input
                  type="text"
                  name="firstNameRuby"
                  value={form.firstNameRuby}
                  onChange={(e) => setForm({ ...form, firstNameRuby: e.target.value })}
                  placeholder="ふりがな（名）"
                  className="w-full border py-2 px-4 rounded-lg border-gray-400 focus:border-blue-500 focus:ring-blue-500 focus:ring-1"
                />
              </div>
              {editError && (
                <p className="text-red-500 mt-2 text-center">{editError}</p>
              )}
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setIsProfileEditOpen(false)}
                  className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  onClick={handleProfileUpdate}
                  className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white py-2 px-4 rounded transition-colors"
                >
                  プロフィール更新
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

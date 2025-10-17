'use client';

import { Button, Card, CardBody, CardHeader, Chip, Input, Link } from '@heroui/react';
import { startTransition, useOptimistic, useState } from 'react';

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

type Form = {
  firstName: string;
  lastName: string;
  firstNameRuby: string;
  lastNameRuby: string;
};

export default function UserProfile({ profile }: { profile: Profile }) {
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

  const [optimisticProfile, addOptimisticProfile] = useOptimistic(
    initialProfile,
    (state: Profile, newProfile: Partial<Profile>) => ({
      ...state,
      ...newProfile,
    }),
  );

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
      <header className="h-15 p-5 flex justify-between items-center bg-blue-500 text-white">
        <h1 className="text-xl font-bold">プロフィール</h1>
        <div className="flex gap-2">
          <Link
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition-colors"
            href="/todos"
          >
            Todo一覧
          </Link>
          {profile?.role === 1 && (
            <Link
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition-colors"
              href="/users"
            >
              ユーザーリスト
            </Link>
          )}
        </div>
      </header>

      <Card className="max-w-[600px] mx-auto mt-5 relative bg-blue-100 p-3">
        <CardHeader className="pt-0">
          <h2 className="text-xl font-bold text-gray-600">ユーザープロフィール</h2>
        </CardHeader>
        <CardBody className="bg-white rounded-lg">
          <div className="h-fit w-full mb-2 text-md font-bold text-gray-800">
            <p className="text-xs">ユーザー名</p>
            <p className="text-lg">
              {optimisticProfile?.username ?? '（ユーザー名なし）'}
            </p>
          </div>
          <div className="h-fit w-full mb-2 text-md font-bold text-gray-800">
            <p className="text-xs">名前</p>
            <p className="text-lg">
              {`${optimisticProfile?.lastName ?? '-'} ${
                optimisticProfile?.firstName ?? '-'
              }`}
            </p>
          </div>
          <div className="flex gap-4 mb-4">
            <div className="w-fit text-center">
              <span className="block text-gray-700 font-semibold text-xs mb-1">
                役割
              </span>
              <Chip
                className={`${
                  optimisticProfile?.role === 1
                    ? 'bg-red-100 text-red-800'
                    : optimisticProfile?.role === 2
                      ? 'bg-yellow-100 text-yellow-800'
                      : optimisticProfile?.role === 4
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                }`}
              >
                {getUserRoleName(optimisticProfile?.role)}
              </Chip>
            </div>
            <div className="w-fit text-center">
              <span className="block text-gray-700 font-semibold text-xs mb-1">
                作成日
              </span>
              <p className="text-gray-600 font-bold">
                {optimisticProfile?.createdAt
                  ? formatDate(optimisticProfile.createdAt)
                  : '―'}
              </p>
            </div>
            <div className="w-fit text-center">
              <span className="block text-gray-700 font-semibold text-xs mb-1">
                更新日
              </span>
              <p className="text-gray-600 font-bold">
                {optimisticProfile?.updatedAt
                  ? formatDate(optimisticProfile.updatedAt)
                  : '―'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              color="primary"
              className="py-2 px-4"
              onPress={() => setIsProfileEditOpen(!isProfileEditOpen)}
            >
              プロフィール編集
            </Button>
            <Button
              color="secondary"
              className="py-2 px-4"
              onPress={() => setIsPasswordChangeOpen(!isPasswordChangeOpen)}
            >
              パスワード変更
            </Button>
          </div>
        </CardBody>
      </Card>
      {/* パスワード変更モーダル */}
      {isPasswordChangeOpen && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <Card shadow="none" className="w-80 p-3">
            <CardHeader>
              <h2 className="text-lg font-bold">パスワード変更</h2>
            </CardHeader>
            <CardBody>
              <Input
                type="password"
                name="currentPassword"
                value={passwordForm.currentPassword}
                onChange={handlePasswordInputChange}
                placeholder="現在のパスワード"
                className="mb-5"
              />
              {passwordError.currentPasswordError && (
                <p className="text-red-500">{passwordError.currentPasswordError}</p>
              )}
              <Input
                type="password"
                name="newPassword"
                value={passwordForm.newPassword}
                onChange={handlePasswordInputChange}
                placeholder="新しいパスワード"
                className="mb-5"
              />
              {passwordError.newPasswordError && (
                <p className="text-red-500">{passwordError.newPasswordError}</p>
              )}
              <Input
                type="password"
                name="confirmPassword"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordInputChange}
                placeholder="新しいパスワードの確認"
                className="mb-5"
              />
              {passwordError.confirmPasswordError && (
                <p className="text-red-500">{passwordError.confirmPasswordError}</p>
              )}
              {passwordError.generalPasswordError && (
                <p className="text-red-500">{passwordError.generalPasswordError}</p>
              )}
              <div className="flex justify-end gap-2 mt-6">
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
                <Button onPress={handlePasswordChange} color="primary">
                  パスワード変更
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
      {/* プロフィール編集モーダル */}
      {isProfileEditOpen && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <Card shadow="none" className="w-80 p-3">
            <CardHeader>
              <h2 className="text-lg font-bold">プロフィール編集</h2>
            </CardHeader>
            <CardBody>
              <Input
                type="text"
                name="lastName"
                value={form.lastName}
                label="名前（姓）"
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                className="mb-5"
              />
              <Input
                type="text"
                name="firstName"
                value={form.firstName}
                label="名前（名）"
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                className="mb-5                                                             "
              />
              <Input
                type="text"
                name="lastNameRuby"
                value={form.lastNameRuby}
                label="ふりがな（姓）"
                onChange={(e) => setForm({ ...form, lastNameRuby: e.target.value })}
                className="mb-5"
              />
              <Input
                type="text"
                name="firstNameRuby"
                value={form.firstNameRuby}
                label="ふりがな（名）"
                onChange={(e) => setForm({ ...form, firstNameRuby: e.target.value })}
                className="mb-5"
              />
              {editError && <p className="text-red-500 text-center">{editError}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  onPress={() => setIsProfileEditOpen(false)}
                  color="danger"
                  variant="light"
                >
                  キャンセル
                </Button>
                <Button onPress={handleProfileUpdate} color="primary">
                  プロフィール更新
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}

'use client';

import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Link,
  Select,
  SelectItem,
} from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

type CreateUserFormState = {
  username: string;
  firstName: string;
  firstNameRuby: string;
  lastName: string;
  lastNameRuby: string;
  password: string;
  confirmPassword: string;
  role: number;
};

export default function CreateUserPage() {
  const router = useRouter();
  const [currentUserRole, setCurrentUserRole] = useState<number>(4);

  const [form, setForm] = useState<CreateUserFormState>({
    username: '',
    firstName: '',
    firstNameRuby: '',
    lastName: '',
    lastNameRuby: '',
    password: '',
    confirmPassword: '',
    role: 4,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<{
    usernameError: string;
    passwordError: string;
    confirmPasswordError: string;
    generalError: string;
  }>({
    usernameError: '',
    passwordError: '',
    confirmPasswordError: '',
    generalError: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const USER_ROLES = {
    管理者: 1,
    マネージャー: 2,
    一般ユーザー: 3,
    ゲスト: 4,
  };

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = event.target;
    setForm((prevForm) => ({
      ...prevForm,
      [name]: type === 'number' || name === 'role' ? parseInt(value, 10) : value,
    }));
  };

  const handleFieldBlur = (field: keyof CreateUserFormState) => {
    const validationError = validateForm(form);
    setError((prev) => ({
      ...prev,
      [`${field}Error`]:
        validationError[`${field}Error` as keyof typeof validationError] || '',
    }));
  };

  const validateForm = (form: CreateUserFormState) => {
    const newError = {
      usernameError: '',
      passwordError: '',
      confirmPasswordError: '',
      generalError: '',
    };

    // ユーザー名バリデーション
    if (!form.username) {
      newError.usernameError = 'ユーザー名は必須です';
    } else if (form.username.length < 3 || form.username.length > 20) {
      newError.usernameError = 'ユーザー名は3文字以上20文字以下である必要があります';
    } else if (!/^[a-zA-Z0-9_]+$/.test(form.username)) {
      newError.usernameError = 'ユーザー名は英数字とアンダースコアのみ使用できます';
    }

    // パスワードバリデーション
    if (!form.password) {
      newError.passwordError = 'パスワードは必須です';
    } else if (form.password.length < 8) {
      newError.passwordError = 'パスワードは8文字以上である必要があります';
    }

    // パスワード確認バリデーション
    if (!form.confirmPassword) {
      newError.confirmPasswordError = '確認用パスワードは必須です';
    } else if (form.password !== form.confirmPassword) {
      newError.confirmPasswordError = 'パスワードが一致しません';
    }

    return newError;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // 送信時バリデーション
    const validationError = validateForm(form);
    setError(validationError);

    // エラーがあれば送信中止
    if (
      validationError.usernameError ||
      validationError.passwordError ||
      validationError.confirmPasswordError
    ) {
      setIsLoading(false);
      return;
    }

    const request = {
      username: form.username,
      firstName: form.firstName || undefined,
      firstNameRuby: form.firstNameRuby || undefined,
      lastName: form.lastName || undefined,
      lastNameRuby: form.lastNameRuby || undefined,
      password: form.password,
      role: form.role,
    };

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
        credentials: 'include',
      });

      const responseData = await response.json();

      if (response.ok && responseData.success) {
        // 作成成功後、ユーザー一覧にリダイレクト
        router.push('/users');
      } else {
        setError((prev) => ({
          ...prev,
          generalError: responseData.message || 'ユーザー作成に失敗しました',
        }));

        if (
          responseData.error?.includes('duplicate') ||
          responseData.error?.includes('already exists')
        ) {
          setError((prev) => ({
            ...prev,
            usernameError:
              'このユーザー名は既に使用されています。別のユーザー名を入力してください。',
          }));
        }
      }
    } catch {
      setError((prev) => ({
        ...prev,
        generalError: 'エラーが発生しました',
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/users');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    // Ctrl+Enterのみ送信、Enter単体は無効化
    if (e.key === 'Enter' && !e.ctrlKey) {
      e.preventDefault();
    }
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  // ログアウト処理
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
        router.push('/login');
      } else {
        console.error('Logout failed');
      }
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  const handleCreateUser = async () => {
    const varidationError = validateForm(form);
    setError(varidationError);

    if (
      varidationError.usernameError ||
      varidationError.passwordError ||
      varidationError.confirmPasswordError
    ) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
        credentials: 'include',
      });

      if (response.ok) {
        router.push('/users');
      } else {
        console.error('User creation failed');
      }
    } catch (error) {
      console.error('Failed to create user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 現在のユーザー情報を取得
  const checkPermission = useCallback(async () => {
    try {
      const response = await fetch('/api/users/me');
      if (response.ok) {
        const data = await response.json();

        if (data.data.role >= 3) {
          router.push('/todos');
          return;
        }

        setCurrentUserRole(data.data.role);
      }
    } catch (err) {
      console.error('Failed to fetch current user:', err);
    }
  }, [router]);

  // 初期化
  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  return (
    <div className="bg-gray-50 min-h-screen">
      <header className="h-15 p-5 flex justify-between items-center bg-blue-500 text-white">
        <h1 className="text-xl font-bold">新規ユーザー作成</h1>
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
          {currentUserRole <= 2 && (
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
        <Card className="max-w-[500px] mx-auto mt-6 p-3">
          <CardHeader className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">新規ユーザー作成</h1>
            <Button
              color="danger"
              variant="bordered"
              size="sm"
              onPress={handleCancel}
              isDisabled={isLoading}
            >
              キャンセル
            </Button>
          </CardHeader>
          <CardBody>
            <form
              onSubmit={handleSubmit}
              onKeyDown={handleKeyDown}
              aria-busy={isLoading}
              aria-label="新規ユーザー作成フォーム"
            >
              {/* ユーザー名 */}
              <div className="mb-4">
                <Input
                  name="username"
                  value={form.username}
                  label="ユーザー名"
                  onChange={handleInputChange}
                  onBlur={() => handleFieldBlur('username')}
                  placeholder="ユーザー名を入力"
                  autoComplete="username"
                  variant="bordered"
                  aria-label="ユーザー名を入力"
                  required
                />
                {error.usernameError && (
                  <p className="text-red-500 mt-1 text-sm" role="alert">
                    {error.usernameError}
                  </p>
                )}
              </div>

              {/* 名前フィールド */}
              <div className="mb-4 md:flex md:gap-2">
                <div className="w-full mb-4 md:mb-0">
                  <Input
                    name="firstName"
                    label="名（任意）"
                    placeholder="名を入力"
                    value={form.firstName}
                    onChange={handleInputChange}
                    variant="bordered"
                    aria-label="名を入力"
                  />
                </div>
                <div className="w-full">
                  <Input
                    name="lastName"
                    label="姓（任意）"
                    placeholder="姓を入力"
                    value={form.lastName}
                    onChange={handleInputChange}
                    variant="bordered"
                    aria-label="姓を入力"
                  />
                </div>
              </div>

              {/* よみ仮名フィールド */}
              <div className="mb-4 md:flex md:gap-2">
                <div className="w-full mb-4 md:mb-0">
                  <Input
                    name="firstNameRuby"
                    label="名のよみ仮名（任意）"
                    placeholder="名のよみ仮名を入力"
                    value={form.firstNameRuby}
                    onChange={handleInputChange}
                    variant="bordered"
                    aria-label="名のよみ仮名を入力"
                  />
                </div>
                <div className="w-full">
                  <Input
                    name="lastNameRuby"
                    label="姓のよみ仮名（任意）"
                    placeholder="姓のよみ仮名を入力"
                    value={form.lastNameRuby}
                    onChange={handleInputChange}
                    variant="bordered"
                    aria-label="姓のよみ仮名を入力"
                  />
                </div>
              </div>

              {/* ロール選択 */}
              <div className="mb-4">
                <Select
                  name="role"
                  label="ユーザーロール"
                  placeholder="ユーザーロールを選択"
                  selectedKeys={[form.role.toString()]}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;
                    setForm((prev) => ({ ...prev, role: parseInt(selected) }));
                  }}
                  variant="bordered"
                  isRequired
                  aria-label="ユーザーロールを選択"
                >
                  {Object.entries(USER_ROLES).map(([roleName, roleValue]) => (
                    <SelectItem key={roleValue}>{roleName}</SelectItem>
                  ))}
                </Select>
              </div>

              {/* パスワード */}
              <div className="mb-4">
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    label="パスワード"
                    onChange={handleInputChange}
                    onBlur={() => handleFieldBlur('password')}
                    placeholder="パスワードを入力"
                    autoComplete="new-password"
                    variant="bordered"
                    isRequired
                    aria-label="パスワードを入力"
                  />
                  <Button
                    type="button"
                    className="absolute right-2 top-2 text-gray-500"
                    tabIndex={-1}
                    onPress={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'パスワード非表示' : 'パスワード表示'}
                    size="sm"
                    variant="light"
                  >
                    {showPassword ? 'ー' : '〇'}
                  </Button>
                </div>
                {error.passwordError && (
                  <p className="text-red-500 mt-1 text-sm" role="alert">
                    {error.passwordError}
                  </p>
                )}
              </div>

              {/* 確認用パスワード */}
              <div className="mb-4">
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={form.confirmPassword}
                    label="確認用パスワード"
                    onChange={handleInputChange}
                    onBlur={() => handleFieldBlur('confirmPassword')}
                    placeholder="パスワードを再入力"
                    autoComplete="new-password"
                    variant="bordered"
                    isRequired
                    aria-label="確認用パスワードを入力"
                  />
                  <Button
                    type="button"
                    className="absolute right-2 top-2 text-gray-500"
                    tabIndex={-1}
                    onPress={() => setShowConfirmPassword((v) => !v)}
                    aria-label={
                      showConfirmPassword ? 'パスワード非表示' : 'パスワード表示'
                    }
                    size="sm"
                    variant="light"
                  >
                    {showConfirmPassword ? 'ー' : '〇'}
                  </Button>
                </div>
                {error.confirmPasswordError && (
                  <p className="text-red-500 mt-1 text-sm" role="alert">
                    {error.confirmPasswordError}
                  </p>
                )}
              </div>

              {/* 一般エラーメッセージ */}
              {error.generalError && (
                <div className="mb-4">
                  <p className="text-red-500 text-sm" role="alert">
                    {error.generalError}
                  </p>
                </div>
              )}

              {/* 送信ボタン */}
              <div className="flex gap-2">
                <Button
                  type="submit"
                  color="primary"
                  className="flex-1"
                  disabled={isLoading}
                  aria-busy={isLoading}
                  onPress={handleCreateUser}
                >
                  {isLoading ? '作成中...' : 'ユーザー作成'}
                </Button>
                <Button
                  type="button"
                  color="default"
                  variant="bordered"
                  onPress={handleCancel}
                  isDisabled={isLoading}
                  className="flex-1"
                >
                  一覧に戻る
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>

        {/* ローディングオーバーレイ */}
        {isLoading && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
            <div className="bg-white rounded-lg p-6 flex items-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-500"></div>
              <p className="text-gray-700">ユーザーを作成しています...</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

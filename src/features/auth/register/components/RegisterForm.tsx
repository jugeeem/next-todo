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
import { useState } from 'react';

export default function RegisterForm() {
  const router = useRouter();

  const [form, setForm] = useState<RegisterFormState>({
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
    ユーザー: 4,
    ゲスト: 8,
  };

  type RegisterFormState = {
    username: string;
    firstName: string;
    firstNameRuby: string;
    lastName: string;
    lastNameRuby: string;
    password: string;
    confirmPassword: string;
    role: number;
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

  const handleFieldBlur = (field: keyof RegisterFormState) => {
    const validationError = validateForm(form);
    setError((prev) => ({
      ...prev,
      [`${field}Error`]:
        validationError[`${field}Error` as keyof typeof validationError] || '',
    }));
  };

  const validateForm = (form: RegisterFormState) => {
    const newError = {
      usernameError: '',
      passwordError: '',
      confirmPasswordError: '',
      generalError: '',
    };
    // ユーザー名必須
    if (!form.username) {
      newError.usernameError = 'ユーザー名は必須です';
    } else if (form.username.length < 3 || form.username.length > 20) {
      newError.usernameError = 'ユーザー名は3文字以上20文字以下である必要があります';
    } else if (!/^[a-zA-Z0-9_]+$/.test(form.username)) {
      newError.usernameError = 'ユーザー名は英数字とアンダースコアのみ使用できます';
    }
    // パスワード必須・長さ
    if (!form.password) {
      newError.passwordError = 'パスワードは必須です';
    } else if (form.password.length < 8) {
      newError.passwordError = 'パスワードは8文字以上である必要があります';
    }
    // パスワード確認
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

    // どれかエラーがあれば送信中止
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
      });

      const responseData = await response.json();

      if (response.ok && responseData.success) {
        // 登録成功後の自動ログイン
        const LoginResponse = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: form.username,
            password: form.password,
          }),
          credentials: 'include',
        });

        const loginData = await LoginResponse.json();

        if (!LoginResponse.ok) {
          setError((prev) => ({
            ...prev,
            generalError: loginData.message || '自動ログインに失敗しました',
          }));
        }
        router.push('/users/me');
      } else {
        setError((prev) => ({
          ...prev,
          generalError: responseData.message || '登録に失敗しました',
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
          setIsLoading(false);
          return;
        }

        setError((prev) => ({
          ...prev,
          generalError: responseData.message || '登録に失敗しました',
        }));
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

  return (
    <div className="bg-gray-50 min-h-screen">
      <header className="h-15 p-5 flex justify-between items-center bg-blue-500 text-white">
        <h1 className="text-xl font-bold">ユーザー登録</h1>
        <Link
          href="/auth/login"
          className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded transition-colors text-white"
        >
          戻る
        </Link>
      </header>
      <Card className="max-w-[500px] mx-auto mt-10 p-3">
        <CardHeader>
          <h1 className="text-2xl font-bold">ユーザー登録</h1>
        </CardHeader>
        <CardBody>
          <form
            onSubmit={handleSubmit}
            onKeyDown={handleKeyDown}
            aria-busy={isLoading}
            aria-label="ユーザー登録フォーム"
          >
            <div className="mb-4">
              <Input
                name="username"
                value={form.username}
                label="ユーザ名"
                onChange={handleInputChange}
                onBlur={() => handleFieldBlur('username')}
                placeholder="ユーザー名を入力"
                autoComplete="username"
              />
              {error.usernameError && (
                <p className="text-red-500 mt-1" role="alert">
                  {error.usernameError}
                </p>
              )}
            </div>
            <div className="mb-4 md:flex md:gap-2">
              <div className="w-full mb-4">
                <Input
                  name="firstName"
                  label="名(任意)"
                  placeholder="名を入力"
                  value={form.firstName}
                  onChange={handleInputChange}
                />
              </div>
              <div className="w-full">
                <Input
                  name="lastName"
                  label="性(任意)"
                  placeholder="性を入力"
                  value={form.lastName}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="mb-4 md:flex md:gap-2">
              <div className="w-full mb-4">
                <Input
                  name="firstNameRuby"
                  label="名のよみ仮名(任意)"
                  placeholder="名のよみ仮名を入力"
                  value={form.firstNameRuby}
                  onChange={handleInputChange}
                />
              </div>
              <div className="w-full">
                <Input
                  name="lastNameRuby"
                  label="性のよみ仮名(任意)"
                  placeholder="性のよみ仮名を入力"
                  value={form.lastNameRuby}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="mb-4">
              <Select
                name="role"
                id="role"
                defaultSelectedKeys={form.role.toString()}
                onChange={handleInputChange}
                aria-label="ユーザーロール選択"
              >
                {Object.entries(USER_ROLES).map(([roleName, roleValue]) => (
                  <SelectItem key={roleValue}>{roleName}</SelectItem>
                ))}
              </Select>
            </div>
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
                  className="my-5"
                  autoComplete="new-password"
                />
                <Button
                  type="button"
                  className="absolute right-2 top-2 text-gray-500"
                  tabIndex={-1}
                  onPress={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'パスワード非表示' : 'パスワード表示'}
                >
                  {showPassword ? 'ー' : '〇'}
                </Button>
              </div>
              {error.passwordError && (
                <p className="text-red-500 mt-1" role="alert">
                  {error.passwordError}
                </p>
              )}
            </div>
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
                  className="my-5"
                  autoComplete="new-password"
                />
                <Button
                  className="absolute right-2 top-2 text-gray-500"
                  tabIndex={-1}
                  onPress={() => setShowConfirmPassword((v) => !v)}
                  aria-label={
                    showConfirmPassword ? 'パスワード非表示' : 'パスワード表示'
                  }
                >
                  {showConfirmPassword ? 'ー' : '〇'}
                </Button>
              </div>
              {error.confirmPasswordError && (
                <p className="text-red-500 mt-1" role="alert">
                  {error.confirmPasswordError}
                </p>
              )}
            </div>
            {error && (
              <p className="text-red-500 mb-4" role="alert">
                {error.generalError}
              </p>
            )}
            <Button
              type="submit"
              color="primary"
              className={`w-full py-2 ${
                isLoading ? 'opacity-60 cursor-not-allowed' : ''
              }`}
              disabled={isLoading}
              aria-busy={isLoading}
            >
              {isLoading ? '登録中...' : '登録'}
            </Button>
          </form>
        </CardBody>
      </Card>
      <div className="text-center my-4">
        <Link href="/auth/login" className="text-blue-500 hover:underline">
          既にアカウントをお持ちの方はこちら
        </Link>
      </div>
      {isLoading && (
        <div className="fixed inset-0 flex items-center justify-center bg-white/50 z-50">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-300 border-t-blue-500"></div>
        </div>
      )}
    </div>
  );
}

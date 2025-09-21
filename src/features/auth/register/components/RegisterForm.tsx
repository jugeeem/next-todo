'use client';

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
          body: JSON.stringify({ username: form.username, password: form.password }),
          credentials: 'include',
        });

        const loginData = await LoginResponse.json();

        if (!LoginResponse.ok) {
          throw new Error(loginData.message || '自動ログインに失敗しました');
        }
        router.push('/users/me');
      } else {
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
      <header className="flex justify-between items-center p-4 bg-blue-500 text-white">
        <h1>ユーザー登録</h1>
        <button
          type="button"
          onClick={() => router.push('/auth/login')}
          className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded transition-colors"
        >
          戻る
        </button>
      </header>
      <form
        action={'/api/auth/register'}
        method="POST"
        className="w-full max-w-md bg-white rounded shadow-md p-8 mx-auto mt-12"
        onSubmit={handleSubmit}
        onKeyDown={handleKeyDown}
        aria-busy={isLoading}
        aria-label="ユーザー登録フォーム"
      >
        <h1 className="text-2xl font-bold mb-6 text-center">ユーザー登録</h1>
        <div className="mb-4">
          <label htmlFor="username" className="block font-semibold mb-1">
            ユーザー名
          </label>
          <input
            type="text"
            name="username"
            id="username"
            value={form.username}
            onChange={handleInputChange}
            onBlur={() => handleFieldBlur('username')}
            placeholder="ユーザー名を入力"
            className="w-full border px-3 py-2 rounded focus:outline-blue-500"
            autoComplete="username"
            required
          />
          {error.usernameError && (
            <p className="text-red-500 mt-1" role="alert">
              {error.usernameError}
            </p>
          )}
        </div>
        <div className="mb-4 md:flex md:gap-2">
          <div className="w-full">
            <label htmlFor="firstName" className="block mb-2">
              名（任意）
            </label>
            <input
              type="text"
              name="firstName"
              id="firstName"
              placeholder="名を入力"
              value={form.firstName}
              onChange={handleInputChange}
              className="w-full border py-2 px-4 rounded-lg border-gray-400 focus:border-blue-500 focus:ring-blue-500 focus:ring-1 mb-4"
            />
          </div>
          <div className="w-full">
            <label htmlFor="lastName" className="block mb-2">
              性（任意）
            </label>
            <input
              type="text"
              name="lastName"
              id="lastName"
              placeholder="性を入力"
              value={form.lastName}
              onChange={handleInputChange}
              className="w-full border py-2 px-4 rounded-lg border-gray-400 focus:border-blue-500 focus:ring-blue-500 focus:ring-1 mb-4"
            />
          </div>
        </div>
        <div className="mb-4 md:flex md:gap-2">
          <div className="w-full">
            <label htmlFor="firstNameRuby" className="block mb-2">
              名のよみ仮名（任意）
            </label>
            <input
              type="text"
              name="firstNameRuby"
              id="firstNameRuby"
              placeholder="名のよみ仮名"
              value={form.firstNameRuby}
              onChange={handleInputChange}
              className="w-full border py-2 px-4 rounded-lg border-gray-400 focus:border-blue-500 focus:ring-blue-500 focus:ring-1 mb-4"
            />
          </div>
          <div className="w-full">
            <label htmlFor="lastNameRuby" className="block mb-2">
              性のよみ仮名（任意）
            </label>
            <input
              type="text"
              name="lastNameRuby"
              id="lastNameRuby"
              placeholder="性のよみ仮名"
              value={form.lastNameRuby}
              onChange={handleInputChange}
              className="w-full border py-2 px-4 rounded-lg border-gray-400 focus:border-blue-500 focus:ring-blue-500 focus:ring-1 mb-4"
            />
          </div>
        </div>
        <div className="mb-4">
          <label htmlFor="role" className="block mb-2">
            権限を選択してください
          </label>
          <select
            name="role"
            id="role"
            value={form.role}
            onChange={handleInputChange}
            className="w-full border py-2 px-4 rounded-lg border-gray-400 focus:border-blue-500 focus:ring-blue-500 focus:ring-1 mb-4"
          >
            {Object.entries(USER_ROLES).map(([roleName, roleValue]) => (
              <option key={roleValue} value={roleValue}>
                {roleName}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label htmlFor="password" className="block font-semibold mb-1">
            パスワード
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              id="password"
              value={form.password}
              onChange={handleInputChange}
              onBlur={() => handleFieldBlur('password')}
              placeholder="パスワードを入力"
              className="w-full border px-3 py-2 rounded focus:outline-blue-500"
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              className="absolute right-2 top-2 text-gray-500"
              tabIndex={-1}
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'パスワード非表示' : 'パスワード表示'}
            >
              {showPassword ? 'ー' : '〇'}
            </button>
          </div>
          {error.passwordError && (
            <p className="text-red-500 mt-1" role="alert">
              {error.passwordError}
            </p>
          )}
        </div>
        <div className="mb-4">
          <label htmlFor="confirmPassword" className="block font-semibold mb-1">
            パスワード確認
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              id="confirmPassword"
              value={form.confirmPassword}
              onChange={handleInputChange}
              onBlur={() => handleFieldBlur('confirmPassword')}
              placeholder="確認用パスワードを入力"
              className="w-full border px-3 py-2 rounded focus:outline-blue-500"
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              className="absolute right-2 top-2 text-gray-500"
              tabIndex={-1}
              onClick={() => setShowConfirmPassword((v) => !v)}
              aria-label={showConfirmPassword ? 'パスワード非表示' : 'パスワード表示'}
            >
              {showConfirmPassword ? 'ー' : '〇'}
            </button>
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
        <button
          type="submit"
          className={`w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition-colors ${
            isLoading ? 'opacity-60 cursor-not-allowed' : ''
          }`}
          disabled={isLoading}
          aria-busy={isLoading}
        >
          {isLoading ? '登録中...' : '登録'}
        </button>
      </form>
      {isLoading && (
        <div className="fixed inset-0 flex items-center justify-center bg-white/50 z-50">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-300 border-t-blue-500"></div>
        </div>
      )}
    </div>
  );
}

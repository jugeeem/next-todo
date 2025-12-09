'use client';

import { Button, Card, CardBody, CardHeader, Input } from '@heroui/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useActionState, useState } from 'react';

export default function LoginPage() {
  const [form, setForm] = useState({
    username: '',
    password: '',
  });
  const router = useRouter();

  const LoginFormAction = async (
    _state: { success: boolean; message?: string },
    formData: FormData,
  ) => {
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    // 簡易的なバリデーション
    if (!username || !password) {
      return {
        success: false,
        message: 'ユーザー名とパスワードを入力してください',
      };
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
        credentials: 'include', // Cookieを含める
      });

      const data = await response.json();

      if (response.status === 401) {
        return {
          success: false,
          message: 'ユーザー名またはパスワードが間違っています。再度お試しください。',
        };
      }

      if (!response.ok) {
        const errorMessage =
          response.status === 500
            ? 'サーバーエラーが発生しました。しばらく時間をおいて再度お試しください。'
            : data.message || `エラーが発生しました（${response.status}）`;

        return {
          success: false,
          message: errorMessage,
        };
      }

      // APIレスポンスがエラーの場合
      if (!data.success) {
        return {
          success: false,
          message: data.message || 'ログインに失敗しました',
        };
      }

      // ログイン成功時の処理（例: ホームページへリダイレクト）
      router.push('/todos');

      return { success: true };
    } catch {
      return {
        success: false,
        message:
          'ネットワークエラーが発生しました。インターネット接続を確認してください。',
      };
    }
  };

  const [formState, formAction, isLoading] = useActionState(LoginFormAction, {
    success: false,
    message: undefined,
  });
  // 入力変更ハンドラ
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="bg-gray-50 h-screen">
      <header className="h-15 p-5 flex justify-between items-center bg-blue-500 text-white">
        <h1 className="text-xl font-bold">Todoアプリ</h1>
      </header>
      <div className="flex items-center justify-center mt-20">
        <Card className="w-96 p-4 bg-white text-center relative">
          <CardHeader className="w-fit mx-auto">
            <h1 className="text-2xl font-bold">Welcome!</h1>
          </CardHeader>
          <CardBody>
            <form action={formAction} className="mx-7">
              <div className="mb-4">
                <Input
                  type="text"
                  name="username"
                  label="ユーザ名"
                  onChange={handleChange}
                  maxLength={32}
                  value={form.username}
                />
              </div>
              <div className="mb-4">
                <Input
                  type="password"
                  name="password"
                  label="パスワード"
                  onChange={handleChange}
                  value={form.password}
                />
              </div>
              <div className="mb-4">
                <Button
                  type="submit"
                  color="primary"
                  className="w-full py-1 px-4"
                  disabled={isLoading}
                  aria-busy={isLoading}
                  aria-disabled={isLoading}
                >
                  {isLoading ? 'ログイン中...' : 'ログイン'}
                </Button>
              </div>
            </form>
            {formState.message && (
              <div className="text-center">
                <p
                  className={`text-sm ${
                    formState.success ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {formState.message}
                </p>
              </div>
            )}
          </CardBody>
          <div>
            <Link
              className="bg-blue-500 text-white py-1 px-4 rounded-lg"
              href="/register"
            >
              新規登録
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

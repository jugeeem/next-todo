'use client';

import { Button, Card, CardBody, CardHeader, Input, Link } from '@heroui/react';
import { redirect } from 'next/navigation';
import { useActionState, useState } from 'react';

type LoginFormResponseType = {
  success: boolean;
  message?: string;
};

const fetchLogin = async (
  username: string,
  password: string,
): Promise<LoginFormResponseType> => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
    credentials: 'include', // Cookieを含める
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    return { success: false, message: data.message || 'ログインに失敗しました' };
  }

  return { success: true };
};

// useActionStateの活用
const LoginFormAction = async (
  _state: LoginFormResponseType,
  formData: FormData,
): Promise<LoginFormResponseType> => {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  // 簡易的なバリデーション
  if (!username || !password) {
    return { success: false, message: 'ユーザー名とパスワードを入力してください' };
  }

  const response = await fetchLogin(username, password);

  if (response.success) {
    // ログイン成功時の処理（例: ホームページへリダイレクト）
    redirect('/');
  }

  return response;
};

export default function LoginForm() {
  const [form, setForm] = useState({
    username: '',
    password: '',
  });

  const [formState, formAction, isLoading] = useActionState(LoginFormAction, {
    success: false,
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
                  className={`w-full py-1 px-4 ${isLoading ? 'cursor-not-allowed' : ''}`}
                  disabled={isLoading}
                  aria-busy={isLoading}
                  aria-disabled={isLoading}
                >
                  {isLoading ? 'ログイン中...' : 'ログイン'}
                </Button>
                {formState.message && (
                  <p className="text-red-500 mt-2" role="alert">
                    {formState.message}
                  </p>
                )}
              </div>
            </form>
          </CardBody>
          <div>
            <Link
              className="bg-blue-500 text-white py-1 px-4 rounded-lg"
              href="/auth/register"
            >
              新規登録
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

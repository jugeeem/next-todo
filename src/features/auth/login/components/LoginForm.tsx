'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginForm() {
  const [form, setForm] = useState({
    username: '',
    password: '',
  });
  const [isPending, setIsPending] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // 入力変更ハンドラ
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // ログイン処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    setError(null);

    if (!form.username || !form.password) {
      setError('ユーザー名とパスワードを入力してください');
      setIsPending(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
        credentials: 'include', // Cookieを含める
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'ログインに失敗しました');
      }

      // ログイン成功後の処理（例：トークン保存、リダイレクトなど）
      localStorage.setItem('user', JSON.stringify(data.data.user));
      router.push('/todos');
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="bg-gray-50 h-screen">
      <header className="flex justify-between items-center p-4 bg-blue-500 text-white">
        <h1>Todoアプリ</h1>
      </header>
      <div className="flex items-center justify-center mt-20">
        <div className="w-96 p-4 bg-white rounded shadow-md text-center relative">
          <h1 className="text-2xl font-bold mb-4">Welome!</h1>
          <form
            action="/api/auth/login"
            method="POST"
            onSubmit={handleSubmit}
            className="mx-7 mb-10"
          >
            <div className="mb-4">
              <input
                type="text"
                placeholder="ユーザ名を入力"
                name="username"
                className="w-full border py-2 px-4 rounded-lg border-gray-400 focus:border-blue-500 focus:ring-blue-500 focus:ring-1"
                onChange={handleChange}
                maxLength={32}
              />
            </div>
            <div className="mb-4">
              <input
                type="password"
                placeholder="パスワードを入力"
                name="password"
                className="w-full border py-2 px-4 rounded-lg border-gray-400 focus:border-blue-500 focus:ring-blue-500 focus:ring-1"
                onChange={handleChange}
              />
            </div>
            <div className="mb-4">
              <button
                type="submit"
                className={`w-full bg-blue-500 text-white py-1 px-4 rounded-full hover:bg-blue-600 transition-colors ${isPending ? 'bg-blue-800 cursor-not-allowed' : ''}`}
                disabled={isPending}
                aria-busy={isPending}
                aria-disabled={isPending}
              >
                ログイン
              </button>
              {error && (
                <p className="text-red-500 mt-2" role="alert">
                  {error}
                </p>
              )}
              {isPending && <div className="text-gray-500 mt-2">Loading...</div>}
            </div>
          </form>
          <div>
            <button
              type="button"
              className="bg-blue-500 text-white py-1 px-4 rounded-full hover:bg-blue-600 transition-colors"
              onClick={() => router.push('/auth/register')}
            >
              新規登録
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

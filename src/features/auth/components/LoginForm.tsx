'use client';

import { Button, Card, CardBody, Input } from '@heroui/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';
import { login } from '@/lib/api';

/**
 * ログインフォームコンポーネント
 */
export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    // クライアント側バリデーション
    if (!username.trim()) {
      setError('ユーザー名は必須です');
      return;
    }

    if (!password) {
      setError('パスワードは必須です');
      return;
    }

    setIsLoading(true);

    try {
      // Server Action を使用
      const result = await login({ username, password });

      if (!result.success) {
        throw new Error(result.error || 'ログインに失敗しました');
      }

      // ログイン成功後、Todoページにリダイレクト
      router.push('/todos');
      router.refresh(); // サーバーコンポーネントを再レンダリング
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ログインに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-md w-full">
      <CardBody className="px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            type="text"
            label="ユーザー名"
            placeholder="ユーザー名を入力"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            isDisabled={isLoading}
            isRequired
          />

          <Input
            type="password"
            label="パスワード"
            placeholder="パスワードを入力"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            isDisabled={isLoading}
            isRequired
          />

          {error && (
            <div className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-md p-3">
              {error}
            </div>
          )}

          <Button
            type="submit"
            color="primary"
            isLoading={isLoading}
            className="w-full"
          >
            ログイン
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            アカウントをお持ちでない方は{' '}
            <Link
              href="/register"
              className="text-blue-500 hover:text-blue-600 font-medium"
            >
              新規登録
            </Link>
          </p>
        </div>
      </CardBody>
    </Card>
  );
}

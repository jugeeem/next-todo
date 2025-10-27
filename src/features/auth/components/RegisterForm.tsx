'use client';

import { Button, Card, CardBody, Input } from '@heroui/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';

/**
 * 新規登録フォームコンポーネント
 */
export function RegisterForm() {
  const router = useRouter();
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
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

    if (username.length > 50) {
      setError('ユーザー名は50文字以内で入力してください');
      return;
    }

    if (!password) {
      setError('パスワードは必須です');
      return;
    }

    if (password.length < 6) {
      setError('パスワードは6文字以上で入力してください');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
          firstName: firstName || undefined,
          lastName: lastName || undefined,
          role: 4, // ユーザーロール
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'ユーザー登録に失敗しました');
      }

      // 登録成功後、ログインページにリダイレクト
      router.push('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ユーザー登録に失敗しました');
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
            placeholder="ユーザー名を入力（1〜50文字）"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            isDisabled={isLoading}
            isRequired
          />

          <Input
            type="password"
            label="パスワード"
            placeholder="パスワードを入力（6文字以上）"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            isDisabled={isLoading}
            isRequired
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="text"
              label="姓"
              placeholder="姓（任意）"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              isDisabled={isLoading}
            />

            <Input
              type="text"
              label="名"
              placeholder="名（任意）"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              isDisabled={isLoading}
            />
          </div>

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
            登録
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            既にアカウントをお持ちの方は{' '}
            <Link
              href="/login"
              className="text-blue-500 hover:text-blue-600 font-medium"
            >
              ログイン
            </Link>
          </p>
        </div>
      </CardBody>
    </Card>
  );
}

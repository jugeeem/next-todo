'use client';

import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Select,
  SelectItem,
} from '@heroui/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type FormEvent, useEffect, useState } from 'react';

const roleLabels: Record<number, string> = {
  1: 'ADMIN',
  2: 'MANAGER',
  3: 'USER',
  4: 'GUEST',
};

export function CreateUserPage() {
  const router = useRouter();
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [role, setRole] = useState<number>(4);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [currentUserRole, setCurrentUserRole] = useState<number>(4);
  const [availableRoles, setAvailableRoles] = useState<number[]>([]);
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [isCheckingPermission, setIsCheckingPermission] = useState<boolean>(true);

  // 権限チェック
  useEffect(() => {
    const checkPermission = async () => {
      try {
        const response = await fetch('/api/users/me');

        if (response.status === 401) {
          router.push('/login');
          return;
        }

        const data = await response.json();
        const userRole = data.data.role;

        // ADMIN・MANAGER のみアクセス可能
        if (userRole >= 3) {
          router.push('/todos');
          return;
        }

        setCurrentUserRole(userRole);

        // 利用可能なロールを設定
        if (userRole === 1) {
          // ADMIN: 全てのロールを作成可能
          setAvailableRoles([1, 2, 3, 4]);
        } else if (userRole === 2) {
          // MANAGER: ADMIN以外を作成可能
          setAvailableRoles([2, 3, 4]);
          setRole(2); // デフォルトをMANAGERに設定
        }

        setHasPermission(true);
      } catch (err) {
        console.error('Permission check error:', err);
        router.push('/login');
      } finally {
        setIsCheckingPermission(false);
      }
    };

    checkPermission();
  }, [router]);

  // ログアウト
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
      router.push('/login');
    } catch (err) {
      console.error('Logout error:', err);
      router.push('/login');
    }
  };

  // ユーザー作成
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    // バリデーション
    if (!username.trim()) {
      setError('ユーザー名を入力してください');
      return;
    }

    if (username.length > 32) {
      setError('ユーザー名は32文字以内で入力してください');
      return;
    }

    if (!password) {
      setError('パスワードを入力してください');
      return;
    }

    if (password.length < 8) {
      setError('パスワードは8文字以上で入力してください');
      return;
    }

    if (password !== confirmPassword) {
      setError('パスワードが一致しません');
      return;
    }

    if (firstName && firstName.length > 32) {
      setError('名は32文字以内で入力してください');
      return;
    }

    if (lastName && lastName.length > 32) {
      setError('姓は32文字以内で入力してください');
      return;
    }

    // MANAGER が ADMIN を作成しようとした場合
    if (currentUserRole === 2 && role === 1) {
      setError('MANAGER は ADMIN ユーザーを作成できません');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
          firstName: firstName || undefined,
          lastName: lastName || undefined,
          role,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'ユーザーの作成に失敗しました');
      }

      const data = await response.json();
      const createdUserId = data.data.id;

      // 作成したユーザーの詳細ページに遷移
      router.push(`/users/${createdUserId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ユーザーの作成に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 権限チェック中
  if (isCheckingPermission) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">権限を確認中...</p>
        </div>
      </div>
    );
  }

  // 権限なし
  if (!hasPermission) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* ヘッダー */}
      <Navbar>
        <NavbarBrand>
          <h1 className="text-2xl font-bold">Todo アプリ</h1>
        </NavbarBrand>
        <NavbarContent className="hidden sm:flex gap-4" justify="center">
          <NavbarItem>
            <Link
              href="/todos"
              className="text-gray-700 hover:text-blue-500 font-medium"
            >
              Todo一覧
            </Link>
          </NavbarItem>
          <NavbarItem>
            <Link
              href="/profile"
              className="text-gray-700 hover:text-blue-500 font-medium"
            >
              プロフィール
            </Link>
          </NavbarItem>
          {currentUserRole <= 2 && (
            <NavbarItem>
              <Link
                href="/users"
                className="text-gray-700 hover:text-blue-500 font-medium"
              >
                ユーザー管理
              </Link>
            </NavbarItem>
          )}
        </NavbarContent>
        <NavbarContent justify="end">
          <NavbarItem>
            <Button color="default" variant="flat" onPress={handleLogout}>
              ログアウト
            </Button>
          </NavbarItem>
        </NavbarContent>
      </Navbar>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* 戻るリンク */}
        <div className="mb-4">
          <Link href="/users" className="text-blue-500 hover:text-blue-600 font-medium">
            ← ユーザー一覧に戻る
          </Link>
        </div>

        <Card>
          <CardHeader>
            <h2 className="text-2xl font-bold">ユーザー作成</h2>
          </CardHeader>
          <CardBody>
            {/* エラー表示 */}
            {error && (
              <div className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-md p-3 mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* ユーザー名 */}
              <Input
                type="text"
                label="ユーザー名"
                placeholder="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={32}
                isRequired
                isDisabled={isSubmitting}
                description="最大32文字"
              />

              {/* パスワード */}
              <Input
                type="password"
                label="パスワード"
                placeholder="8文字以上"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                isRequired
                isDisabled={isSubmitting}
                description="最小8文字"
              />

              {/* パスワード（確認） */}
              <Input
                type="password"
                label="パスワード（確認）"
                placeholder="パスワードを再入力"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                isRequired
                isDisabled={isSubmitting}
              />

              {/* 姓・名 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  type="text"
                  label="姓"
                  placeholder="姓"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  maxLength={32}
                  isDisabled={isSubmitting}
                />

                <Input
                  type="text"
                  label="名"
                  placeholder="名"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  maxLength={32}
                  isDisabled={isSubmitting}
                />
              </div>

              {/* ロール */}
              <Select
                label="ロール"
                selectedKeys={[role.toString()]}
                onChange={(e) => setRole(Number(e.target.value))}
                isRequired
                isDisabled={isSubmitting}
                description={
                  currentUserRole === 2
                    ? 'MANAGER は ADMIN ユーザーを作成できません'
                    : undefined
                }
              >
                {availableRoles.map((roleValue) => (
                  <SelectItem key={roleValue.toString()}>
                    {roleLabels[roleValue]}
                  </SelectItem>
                ))}
              </Select>

              {/* 送信ボタン */}
              <div className="flex items-center gap-4 pt-4">
                <Button type="submit" color="primary" isLoading={isSubmitting}>
                  ユーザーを作成
                </Button>
                <Button as={Link} href="/users" color="default" variant="flat">
                  キャンセル
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </main>
    </div>
  );
}

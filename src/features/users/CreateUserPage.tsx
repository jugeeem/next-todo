'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { UserCreateForm } from './components/UserCreateForm';

export function CreateUserPage() {
  const router = useRouter();
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

  // ユーザー作成
  const handleCreateUser = async (userData: {
    username: string;
    password: string;
    firstName: string;
    lastName: string;
    role: number;
  }) => {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: userData.username,
        password: userData.password,
        firstName: userData.firstName || undefined,
        lastName: userData.lastName || undefined,
        role: userData.role,
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
  };

  // 権限チェック中
  if (isCheckingPermission) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
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
      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* 戻るリンク */}
        <div className="mb-4">
          <Link href="/users" className="text-blue-500 hover:text-blue-600 font-medium">
            ← ユーザー一覧に戻る
          </Link>
        </div>

        <h2 className="text-3xl font-bold text-gray-900 mb-8">新規ユーザー作成</h2>

        <UserCreateForm
          currentUserRole={currentUserRole}
          availableRoles={availableRoles}
          onCreateUser={handleCreateUser}
        />
      </main>
    </div>
  );
}

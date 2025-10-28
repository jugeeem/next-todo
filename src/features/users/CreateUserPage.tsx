'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createUser, getUserInfo } from '@/lib/api';
import { UserCreateForm } from './components/UserCreateForm';

export function CreateUserPage() {
  const [currentUserRole, setCurrentUserRole] = useState<number>(4);
  const [availableRoles, setAvailableRoles] = useState<number[]>([]);
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [isCheckingPermission, setIsCheckingPermission] = useState<boolean>(true);

  // 権限チェック
  useEffect(() => {
    const checkPermission = async () => {
      try {
        const result = await getUserInfo();

        if (!result.success) {
          window.location.href = '/login';
          return;
        }

        const userRole = result.data.role;

        // ADMIN・MANAGER のみアクセス可能
        if (userRole >= 3) {
          window.location.href = '/todos';
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
        window.location.href = '/login';
      } finally {
        setIsCheckingPermission(false);
      }
    };

    checkPermission();
  }, []);

  // ユーザー作成ハンドラー
  const handleCreateUser = async (userData: {
    username: string;
    password: string;
    firstName: string;
    lastName: string;
    role: number;
  }) => {
    const result = await createUser({
      username: userData.username,
      password: userData.password,
      firstName: userData.firstName || undefined,
      lastName: userData.lastName || undefined,
      role: userData.role,
    });

    if (!result.success) {
      throw new Error(result.error || 'ユーザーの作成に失敗しました');
    }

    const createdUserId = result.data.id;

    // 作成したユーザーの詳細ページに遷移
    window.location.href = `/users/${createdUserId}`;
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
      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* 戻るリンク */}
        <div className="mb-4">
          <Link href="/users" className="text-blue-500 hover:text-blue-600 font-medium">
            ← ユーザー一覧に戻る
          </Link>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">ユーザー作成</h2>

          <UserCreateForm
            currentUserRole={currentUserRole}
            availableRoles={availableRoles}
            onCreateUser={handleCreateUser}
          />
        </div>
      </main>
    </div>
  );
}

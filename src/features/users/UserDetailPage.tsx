'use client';

import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from '@heroui/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import type { Todo, User } from './components/types';
import { UserInfoDisplay } from './components/UserInfoDisplay';
import { UserInfoEditForm } from './components/UserInfoEditForm';
import { UserTodoList } from './components/UserTodoList';

export function UserDetailPage({ userId }: { userId: string }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [currentUserRole, setCurrentUserRole] = useState<number>(4);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [isCheckingPermission, setIsCheckingPermission] = useState<boolean>(true);
  const { isOpen, onOpen, onClose } = useDisclosure();

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
        const currentId = data.data.id;

        // ADMIN・MANAGER のみアクセス可能
        if (userRole >= 3) {
          router.push('/todos');
          return;
        }

        setCurrentUserRole(userRole);
        setCurrentUserId(currentId);
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

  // ユーザー情報とTodo一覧を取得
  const fetchUserData = useCallback(async () => {
    if (!hasPermission) return;

    setIsLoading(true);
    setError('');

    try {
      // ユーザー情報を取得
      const userResponse = await fetch(`/api/users/${userId}`);
      if (!userResponse.ok) {
        throw new Error('ユーザー情報の取得に失敗しました');
      }
      const userData = await userResponse.json();
      setUser(userData.data);

      // Todo一覧を取得（最新10件）
      const todosResponse = await fetch(
        `/api/users/${userId}/todos?page=1&perPage=10&sortBy=created_at&sortOrder=desc`,
      );
      if (todosResponse.ok) {
        const todosData = await todosResponse.json();
        setTodos(todosData.data || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'データの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [userId, hasPermission]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // ユーザー情報更新
  const handleUpdateUser = async (updatedData: {
    firstName?: string;
    lastName?: string;
    role: number;
  }) => {
    const response = await fetch(`/api/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'ユーザー情報の更新に失敗しました');
    }

    const data = await response.json();
    setUser(data.data);
    setIsEditing(false);
    setSuccessMessage('ユーザー情報を更新しました');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // ユーザー削除
  const handleDeleteUser = async () => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'ユーザーの削除に失敗しました');
      }

      router.push('/users');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ユーザーの削除に失敗しました');
      onClose();
    }
  };

  // 権限チェック中またはデータ読み込み中
  if (isCheckingPermission || isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  // 権限なし
  if (!hasPermission || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* 戻るリンク */}
        <div className="mb-4">
          <Link href="/users" className="text-blue-500 hover:text-blue-600 font-medium">
            ← ユーザー一覧に戻る
          </Link>
        </div>

        {/* 成功メッセージ */}
        {successMessage && (
          <div className="text-green-600 text-sm bg-green-50 border border-green-200 rounded-md p-3 mb-4">
            {successMessage}
          </div>
        )}

        {/* エラーメッセージ */}
        {error && (
          <div className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-md p-3 mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 左カラム: ユーザー情報 */}
          <div className="space-y-8">
            {isEditing ? (
              <UserInfoEditForm
                user={user}
                onSave={handleUpdateUser}
                onCancel={() => setIsEditing(false)}
                currentUserRole={currentUserRole}
              />
            ) : (
              <UserInfoDisplay
                user={user}
                onEdit={() => setIsEditing(true)}
                onDelete={onOpen}
                currentUserRole={currentUserRole}
                currentUserId={currentUserId}
              />
            )}
          </div>

          {/* 右カラム: Todo一覧 */}
          <div className="space-y-8">
            <UserTodoList todos={todos} />
          </div>
        </div>
      </main>

      {/* 削除確認モーダル */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader>ユーザー削除の確認</ModalHeader>
          <ModalBody>
            <p>
              本当にユーザー <strong>{user.username}</strong> を削除しますか？
            </p>
            <p className="text-sm text-red-600 mt-2">この操作は取り消せません。</p>
          </ModalBody>
          <ModalFooter>
            <Button color="default" variant="flat" onPress={onClose}>
              キャンセル
            </Button>
            <Button color="danger" onPress={handleDeleteUser}>
              削除
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}

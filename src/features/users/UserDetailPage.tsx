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
import { useCallback, useEffect, useState } from 'react';
import {
  deleteUser,
  getUserDetail,
  getUserInfo,
  getUserTodoList,
  updateUser,
} from '@/lib/api';
import type { Todo, User } from './components/types';
import { UserInfoDisplay } from './components/UserInfoDisplay';
import { UserInfoEditForm } from './components/UserInfoEditForm';
import { UserTodoList } from './components/UserTodoList';

export function UserDetailPage({ userId }: { userId: string }) {
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

  // 削除確認モーダルの状態管理
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();

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
        const currentId = result.data.id;

        // ADMIN・MANAGER のみアクセス可能
        if (userRole >= 3) {
          window.location.href = '/todos';
          return;
        }

        setCurrentUserRole(userRole);
        setCurrentUserId(currentId);
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

  // ユーザー情報を取得
  const fetchUserInfo = useCallback(async () => {
    try {
      const result = await getUserDetail(userId);

      if (!result.success) {
        setError(result.error || 'ユーザー情報の取得に失敗しました');
        return;
      }

      const userData = result.data;
      setUser(userData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ユーザー情報の取得に失敗しました');
    }
  }, [userId]);

  // Todo一覧を取得
  const fetchTodos = useCallback(async () => {
    try {
      const result = await getUserTodoList(userId, { page: 1, perPage: 10 });

      if (!result.success) {
        console.error('Todo一覧の取得エラー:', result.error);
        return;
      }

      setTodos(result.data?.data || []);
    } catch (err) {
      console.error('Todo一覧の取得エラー:', err);
    }
  }, [userId]);

  // 初回読み込み時に全データを取得
  useEffect(() => {
    if (hasPermission) {
      const fetchAllData = async () => {
        setIsLoading(true);
        await Promise.all([fetchUserInfo(), fetchTodos()]);
        setIsLoading(false);
      };

      fetchAllData();
    }
  }, [hasPermission, fetchUserInfo, fetchTodos]);

  // ユーザー情報更新のハンドラー
  const handleUpdateUser = async (updatedData: {
    firstName?: string;
    lastName?: string;
    role: number;
  }) => {
    setError('');
    setSuccessMessage('');

    const result = await updateUser(userId, updatedData);

    if (!result.success) {
      throw new Error(result.error || 'ユーザー情報の更新に失敗しました');
    }

    await fetchUserInfo();
    setIsEditing(false);
    setSuccessMessage('ユーザー情報を更新しました');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // ユーザー削除
  const handleDeleteUser = async () => {
    onDeleteClose();

    try {
      const result = await deleteUser(userId);

      if (!result.success) {
        setError(result.error || 'ユーザーの削除に失敗しました');
        return;
      }

      window.location.href = '/users';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ユーザーの削除に失敗しました');
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

  // ローディング中
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
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

        {/* エラー表示 */}
        {error && (
          <div className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-md p-3 mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 左カラム: ユーザー情報 */}
          <div className="space-y-8">
            {user &&
              (isEditing ? (
                <UserInfoEditForm
                  user={user}
                  onSave={handleUpdateUser}
                  onCancel={() => {
                    setIsEditing(false);
                    setError('');
                  }}
                  currentUserRole={currentUserRole}
                />
              ) : (
                <UserInfoDisplay
                  user={user}
                  onEdit={() => setIsEditing(true)}
                  onDelete={onDeleteOpen}
                  currentUserRole={currentUserRole}
                  currentUserId={currentUserId}
                />
              ))}
          </div>

          {/* 右カラム: Todo一覧 */}
          <div className="space-y-8">
            <UserTodoList todos={todos} />
          </div>
        </div>

        {/* 削除確認モーダル */}
        <Modal isOpen={isDeleteOpen} onClose={onDeleteClose}>
          <ModalContent>
            <ModalHeader>確認</ModalHeader>
            <ModalBody>
              <p>ユーザー「{user?.username}」を削除してもよろしいですか?</p>
            </ModalBody>
            <ModalFooter>
              <Button color="default" variant="light" onPress={onDeleteClose}>
                キャンセル
              </Button>
              <Button color="danger" onPress={handleDeleteUser}>
                削除
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </main>
    </div>
  );
}

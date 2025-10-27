'use client';

import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  useDisclosure,
} from '@heroui/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type FormEvent, useCallback, useEffect, useState } from 'react';

interface User {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  role: number;
  createdAt: string;
  updatedAt: string;
}

interface Todo {
  id: string;
  title: string;
  descriptions?: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

const roleLabels: Record<number, string> = {
  1: 'ADMIN',
  2: 'MANAGER',
  3: 'USER',
  4: 'GUEST',
};

const getRoleBadgeClass = (role: number): string => {
  switch (role) {
    case 1:
      return 'px-2 py-1 text-xs font-semibold rounded bg-red-100 text-red-800';
    case 2:
      return 'px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800';
    case 3:
      return 'px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-800';
    case 4:
      return 'px-2 py-1 text-xs font-semibold rounded bg-gray-100 text-gray-800';
    default:
      return 'px-2 py-1 text-xs font-semibold rounded bg-gray-100 text-gray-800';
  }
};

export function UserDetailPage({ userId }: { userId: string }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [role, setRole] = useState<number>(4);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
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

  // ユーザー情報を取得
  const fetchUserInfo = useCallback(async () => {
    try {
      const response = await fetch(`/api/users/${userId}`);

      if (response.status === 401) {
        router.push('/login');
        return;
      }

      if (response.status === 404) {
        setError('ユーザーが見つかりません');
        return;
      }

      if (!response.ok) {
        throw new Error('ユーザー情報の取得に失敗しました');
      }

      const data = await response.json();
      const userData = data.data;
      setUser(userData);
      setFirstName(userData.firstName || '');
      setLastName(userData.lastName || '');
      setRole(userData.role);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ユーザー情報の取得に失敗しました');
    }
  }, [userId, router]);

  // Todo一覧を取得
  const fetchTodos = useCallback(async () => {
    try {
      const response = await fetch(`/api/users/${userId}/todos?page=1&perPage=10`);

      if (!response.ok) {
        throw new Error('Todo一覧の取得に失敗しました');
      }

      const data = await response.json();
      setTodos(data.data?.data || []);
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

  // ユーザー情報更新
  const handleUpdateUser = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    setIsSaving(true);

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: firstName || undefined,
          lastName: lastName || undefined,
          role,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'ユーザー情報の更新に失敗しました');
      }

      await fetchUserInfo();
      setIsEditing(false);
      setSuccessMessage('ユーザー情報を更新しました');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ユーザー情報の更新に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  // ユーザー削除
  const handleDeleteUser = () => {
    onOpen();
  };

  // ユーザー削除を実行
  const confirmDeleteUser = async () => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'ユーザーの削除に失敗しました');
      }

      onClose();
      router.push('/users');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ユーザーの削除に失敗しました');
      onClose();
    }
  };

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
            {/* ユーザー情報 */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between w-full">
                  <h2 className="text-xl font-bold">ユーザー情報</h2>
                  <div className="flex items-center gap-2">
                    {currentUserRole === 1 && !isEditing && (
                      <Button color="primary" onPress={() => setIsEditing(true)}>
                        編集
                      </Button>
                    )}
                    {currentUserRole === 1 && user?.id !== currentUserId && (
                      <Button color="danger" onPress={handleDeleteUser}>
                        削除
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardBody>
                {isEditing ? (
                  <form onSubmit={handleUpdateUser} className="space-y-4">
                    <div>
                      <label
                        htmlFor="username"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        ユーザー名
                      </label>
                      <input
                        type="text"
                        id="username"
                        value={user?.username || ''}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        ユーザー名は変更できません
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="lastName"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          姓
                        </label>
                        <input
                          type="text"
                          id="lastName"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="姓"
                          disabled={isSaving}
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="firstName"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          名
                        </label>
                        <input
                          type="text"
                          id="firstName"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="名"
                          disabled={isSaving}
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="role"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        ロール
                      </label>
                      <select
                        id="role"
                        value={role}
                        onChange={(e) => setRole(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isSaving}
                      >
                        <option value={1}>ADMIN</option>
                        <option value={2}>MANAGER</option>
                        <option value={3}>USER</option>
                        <option value={4}>GUEST</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-4 pt-4">
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isSaving ? '保存中...' : '保存'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditing(false);
                          setFirstName(user?.firstName || '');
                          setLastName(user?.lastName || '');
                          setRole(user?.role || 4);
                          setError('');
                        }}
                        disabled={isSaving}
                        className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        キャンセル
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-1">
                        ユーザー名
                      </h3>
                      <p className="text-gray-900">{user?.username}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-1">姓</h3>
                        <p className="text-gray-900">{user?.lastName || '未設定'}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-1">名</h3>
                        <p className="text-gray-900">{user?.firstName || '未設定'}</p>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-1">ロール</h3>
                      <span className={getRoleBadgeClass(user?.role || 4)}>
                        {roleLabels[user?.role || 4]}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-1">
                        作成日時
                      </h3>
                      <p className="text-gray-900">
                        {user?.createdAt
                          ? new Date(user.createdAt).toLocaleString('ja-JP')
                          : '-'}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-1">
                        更新日時
                      </h3>
                      <p className="text-gray-900">
                        {user?.updatedAt
                          ? new Date(user.updatedAt).toLocaleString('ja-JP')
                          : '-'}
                      </p>
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>

          {/* 右カラム: Todo一覧 */}
          <div className="space-y-8">
            {/* Todo一覧（簡易版） */}
            <Card>
              <CardHeader>
                <h2 className="text-xl font-bold">最近のTodo</h2>
              </CardHeader>
              <CardBody>
                {todos.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Todoがありません</p>
                ) : (
                  <div className="space-y-2">
                    {todos.map((todo) => (
                      <div key={todo.id} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={todo.completed}
                            readOnly
                            className="w-4 h-4 text-blue-500 rounded"
                          />
                          <div className="flex-1">
                            <h3
                              className={`font-medium ${
                                todo.completed
                                  ? 'line-through text-gray-500'
                                  : 'text-gray-900'
                              }`}
                            >
                              {todo.title}
                            </h3>
                            {todo.descriptions && (
                              <p className="text-sm text-gray-600 mt-1">
                                {todo.descriptions}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </div>

        {/* 削除確認モーダル */}
        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalContent>
            <ModalHeader>ユーザー削除の確認</ModalHeader>
            <ModalBody>
              <p>ユーザー「{user?.username}」を削除してもよろしいですか?</p>
              <p className="text-sm text-gray-500 mt-2">この操作は取り消せません。</p>
            </ModalBody>
            <ModalFooter>
              <Button color="default" variant="flat" onPress={onClose}>
                キャンセル
              </Button>
              <Button color="danger" onPress={confirmDeleteUser}>
                削除
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </main>
    </div>
  );
}

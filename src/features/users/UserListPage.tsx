'use client';

import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Select,
  SelectItem,
  useDisclosure,
} from '@heroui/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

interface User {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  role: number;
  createdAt: string;
  updatedAt: string;
}

interface TodoStats {
  totalTodos: number;
  completedTodos: number;
  pendingTodos: number;
  completionRate: number;
}

interface UserWithStats extends User {
  stats?: TodoStats;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
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

export function UserListPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [page, setPage] = useState<number>(1);
  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo | null>(null);
  const [roleFilter, setRoleFilter] = useState<number | 'all'>('all');
  const [sortBy, setSortBy] = useState<
    'created_at' | 'username' | 'first_name' | 'last_name' | 'role'
  >('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [currentUserRole, setCurrentUserRole] = useState<number>(4);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [isCheckingPermission, setIsCheckingPermission] = useState<boolean>(true);
  const [userToDelete, setUserToDelete] = useState<{
    id: string;
    username: string;
  } | null>(null);
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
        const userId = data.data.id;

        // ADMIN・MANAGER のみアクセス可能
        if (userRole >= 3) {
          router.push('/todos');
          return;
        }

        setCurrentUserRole(userRole);
        setCurrentUserId(userId);
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

  // ユーザー一覧を取得
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        perPage: '20',
        sortBy,
        sortOrder,
      });

      // roleFilter が 'all' でない場合のみ role パラメータを追加
      if (roleFilter !== 'all') {
        params.append('role', roleFilter.toString());
      }

      // searchQuery が空でない場合、username と firstName で検索
      if (searchQuery.trim()) {
        params.append('username', searchQuery.trim());
      }

      const response = await fetch(`/api/users?${params}`);

      if (response.status === 401) {
        router.push('/login');
        return;
      }

      if (!response.ok) {
        throw new Error('ユーザー一覧の取得に失敗しました');
      }

      const data = await response.json();
      const responseData = data.data;

      setUsers(responseData.data || []);
      setPaginationInfo({
        currentPage: responseData.page,
        totalPages: responseData.totalPages,
        totalItems: responseData.total,
        itemsPerPage: responseData.perPage,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ユーザー一覧の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [page, roleFilter, sortBy, sortOrder, searchQuery, router]);

  // ページ読み込み時・フィルター変更時にユーザーを取得
  useEffect(() => {
    if (hasPermission) {
      fetchUsers();
    }
  }, [hasPermission, fetchUsers]);

  // ユーザー削除
  const handleDeleteUser = (userId: string, username: string) => {
    setUserToDelete({ id: userId, username });
    onOpen();
  };

  // ユーザー削除を実行
  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      const response = await fetch(`/api/users/${userToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'ユーザーの削除に失敗しました');
      }

      // 一覧を再取得
      await fetchUsers();
      onClose();
      setUserToDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ユーザーの削除に失敗しました');
      onClose();
      setUserToDelete(null);
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
              <Link href="/users" className="text-blue-500 font-medium">
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
        {/* ページタイトル */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-gray-900">ユーザー管理</h2>
          <Button as={Link} href="/users/create" color="primary">
            新規ユーザー作成
          </Button>
        </div>

        {/* 検索・フィルター・ソート */}
        <Card className="mb-8">
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* 検索 */}
              <Input
                type="text"
                label="検索"
                placeholder="ユーザー名、名前で検索"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
              />

              {/* ロールフィルター */}
              <Select
                label="ロールフィルター"
                selectedKeys={[roleFilter.toString()]}
                onChange={(e) => {
                  setRoleFilter(
                    e.target.value === 'all' ? 'all' : Number(e.target.value),
                  );
                  setPage(1);
                }}
              >
                <SelectItem key="all">すべて</SelectItem>
                <SelectItem key="1">ADMIN</SelectItem>
                <SelectItem key="2">MANAGER</SelectItem>
                <SelectItem key="3">USER</SelectItem>
                <SelectItem key="4">GUEST</SelectItem>
              </Select>

              {/* ソート項目 */}
              <Select
                label="並び順"
                selectedKeys={[sortBy]}
                onChange={(e) =>
                  setSortBy(
                    e.target.value as
                      | 'created_at'
                      | 'username'
                      | 'first_name'
                      | 'last_name'
                      | 'role',
                  )
                }
              >
                <SelectItem key="created_at">作成日時</SelectItem>
                <SelectItem key="username">ユーザー名</SelectItem>
                <SelectItem key="first_name">名前</SelectItem>
                <SelectItem key="last_name">姓</SelectItem>
                <SelectItem key="role">ロール</SelectItem>
              </Select>

              {/* ソート順 */}
              <Select
                label="順序"
                selectedKeys={[sortOrder]}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              >
                <SelectItem key="asc">昇順</SelectItem>
                <SelectItem key="desc">降順</SelectItem>
              </Select>
            </div>
          </CardBody>
        </Card>

        {/* エラー表示 */}
        {error && (
          <div className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-md p-3 mb-4">
            {error}
          </div>
        )}

        {/* ローディング表示 */}
        {isLoading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
            <p className="mt-2 text-gray-600">読み込み中...</p>
          </div>
        )}

        {/* ユーザー一覧 */}
        {!isLoading && (
          <>
            <Card className="mb-8">
              <CardHeader>
                <h3 className="text-xl font-bold">
                  ユーザー一覧
                  {paginationInfo && (
                    <span className="text-sm font-normal text-gray-500 ml-2">
                      （全{paginationInfo.totalItems}件）
                    </span>
                  )}
                </h3>
              </CardHeader>
              <CardBody>
                {users.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    ユーザーが見つかりません
                  </p>
                ) : (
                  <div className="space-y-3">
                    {users.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Link
                              href={`/users/${user.id}`}
                              className="text-lg font-semibold text-gray-900 hover:text-blue-500"
                            >
                              {user.username}
                            </Link>
                            <span className={getRoleBadgeClass(user.role)}>
                              {roleLabels[user.role]}
                            </span>
                          </div>

                          {(user.firstName || user.lastName) && (
                            <p className="text-sm text-gray-600 mb-2">
                              {user.lastName} {user.firstName}
                            </p>
                          )}

                          <p className="text-xs text-gray-500 mt-2">
                            作成: {new Date(user.createdAt).toLocaleString('ja-JP')}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Link
                            href={`/users/${user.id}`}
                            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                          >
                            詳細
                          </Link>
                          {currentUserRole === 1 && user.id !== currentUserId && (
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(user.id, user.username)}
                              className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                            >
                              削除
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>

            {/* ページネーション */}
            {paginationInfo && paginationInfo.totalPages > 1 && (
              <Card>
                <CardBody>
                  <div className="flex items-center justify-between">
                    <Button
                      onPress={() => setPage((prev) => Math.max(1, prev - 1))}
                      isDisabled={page === 1}
                      color="default"
                    >
                      前へ
                    </Button>
                    <span className="text-gray-700">
                      {page} / {paginationInfo.totalPages} ページ
                    </span>
                    <Button
                      onPress={() =>
                        setPage((prev) => Math.min(paginationInfo.totalPages, prev + 1))
                      }
                      isDisabled={page === paginationInfo.totalPages}
                      color="default"
                    >
                      次へ
                    </Button>
                  </div>
                </CardBody>
              </Card>
            )}
          </>
        )}

        {/* 削除確認モーダル */}
        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalContent>
            <ModalHeader>ユーザー削除の確認</ModalHeader>
            <ModalBody>
              <p>ユーザー「{userToDelete?.username}」を削除してもよろしいですか?</p>
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

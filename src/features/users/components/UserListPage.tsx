'use client';

import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Chip,
  Input,
  Link,
  Select,
  SelectItem,
} from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { PaginationInfo } from '@/types/pagenationInfo';
import type { User } from '@/types/user';

export default function UserListPage() {
  const [users, setUsers] = useState<User[]>([]);
  const router = useRouter();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  //   ページネーション機能の状態
  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<number>(3);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  // フィルター機能の状態
  const [searchQuery, setSearchQuery] = useState<string>(''); // 表示用
  const [internalSearchQuery, setInternalSearchQuery] = useState<string>(''); // API呼び出し用
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<string>('desc');

  const [showModal, setShowModal] = useState<boolean>(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  // デバウンス用のtimer ref
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        // ログアウト成功時にログインページへリダイレクト
        router.push('/login');
      } else {
        console.error('Logout failed');
      }
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const queryParams = new URLSearchParams({
      page: paginationInfo?.currentPage.toString() || '1',
      sortBy: sortBy,
      sortOrder: sortOrder,
    });

    // フィルターパラメータを追加
    if (internalSearchQuery.trim()) {
      queryParams.append('username', internalSearchQuery.trim());
    }
    if (roleFilter !== 'all') {
      queryParams.append('role', roleFilter);
    }

    try {
      const response = await fetch(`/api/users?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setUsers(data.data.data);
      setPaginationInfo(data.data.pagination);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setIsLoading(false);
    }
  }, [paginationInfo?.currentPage, sortBy, sortOrder, internalSearchQuery, roleFilter]);

  //   ユーザー権限の確認とリダイレクト
  const checkPermission = useCallback(async () => {
    try {
      const response = await fetch('/api/users/me');
      if (response.ok) {
        const data = await response.json();

        if (data.data.role >= 3) {
          router.push('/todos');
          return;
        }

        setCurrentUserRole(data.data.role);
        setCurrentUserId(data.data.id);
      }
    } catch (err) {
      console.error('Failed to fetch current user:', err);
    }
  }, [router]);

  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        // ユーザー削除成功後、ユーザーリストを再取得
        fetchUsers();
      } else {
        console.error('Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  //   ユーザー権限の確認
  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  // 検索入力のデバウンス処理
  useEffect(() => {
    // 既存のタイマーをクリア
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // 1秒後に検索を実行
    debounceRef.current = setTimeout(() => {
      setInternalSearchQuery(searchQuery);
    }, 500);

    // クリーンアップ関数
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchQuery]);

  // データ取得のuseEffect
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // 検索のクリア機能
  const clearFilters = () => {
    setSearchQuery('');
    setInternalSearchQuery('');
    setRoleFilter('all');
    setSortBy('createdAt');
    setSortOrder('desc');
    // デバウンスタイマーもクリア
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <header className="h-15 p-5 flex justify-between items-center bg-blue-500 text-white">
        <h1 className="text-xl font-bold">Todoアプリ</h1>
        <div className="flex gap-2">
          <Link
            className="bg-blue-600 text-white hover:bg-blue-700 px-3 py-1 rounded transition-colors"
            href="/todos"
          >
            Todo一覧
          </Link>
          <Link
            className="bg-blue-600 text-white hover:bg-blue-700 px-3 py-1 rounded transition-colors"
            href="/profile"
          >
            プロフィール
          </Link>
          {currentUserRole <= 2 && (
            <Link
              className="bg-blue-600 text-white hover:bg-blue-700 px-3 py-1 rounded transition-colors"
              href="/users"
            >
              ユーザーリスト
            </Link>
          )}
          <Button
            className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded transition-colors text-white"
            onPress={handleLogout}
          >
            ログアウト
          </Button>
        </div>
      </header>
      <main className="p-4 flex flex-col items-center">
        <div className="w-[600px] mx-auto">
          {/* タイトルカード */}
          <Card shadow="sm" className="w-fit p-5 text-center mb-4 mx-auto">
            <h2 className="text-xl font-bold">ユーザー一覧</h2>
            <p className="text-sm text-gray-600">
              {paginationInfo?.totalItems || users.length}人
            </p>
          </Card>

          {/* フィルター機能 */}
          <Card className="w-full mb-4 p-4">
            <div className="flex flex-col space-y-4">
              {/* 検索ボックス */}
              <div className="flex-1">
                <Input
                  label="ユーザー検索"
                  placeholder="ユーザー名で検索"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  variant="bordered"
                  size="sm"
                  aria-label="ユーザー検索入力フィールド"
                />
              </div>
              <div className="flex flex-col md:flex-row gap-4">
                {/* 役割フィルター */}
                <div className="w-full md:w-48">
                  <Select
                    label="役割フィルター"
                    placeholder="役割で絞り込み"
                    selectedKeys={[roleFilter]}
                    onSelectionChange={(keys) => {
                      const selected = Array.from(keys)[0] as string;
                      setRoleFilter(selected || 'all');
                    }}
                    variant="bordered"
                    size="sm"
                    aria-label="ユーザー役割でフィルターする"
                  >
                    <SelectItem key="all">すべての役割</SelectItem>
                    <SelectItem key="1">管理者</SelectItem>
                    <SelectItem key="2">マネージャー</SelectItem>
                    <SelectItem key="3">ユーザー</SelectItem>
                    <SelectItem key="4">ゲスト</SelectItem>
                  </Select>
                </div>

                {/* 並び順 */}
                <div className="w-full md:w-48">
                  <Select
                    label="並び順"
                    placeholder="並び順を選択"
                    selectedKeys={[`${sortBy}_${sortOrder}`]}
                    onSelectionChange={(keys) => {
                      const selected = Array.from(keys)[0] as string;
                      const [field, order] = selected.split('_');
                      setSortBy(field);
                      setSortOrder(order);
                    }}
                    variant="bordered"
                    size="sm"
                    aria-label="ユーザー一覧の並び順を変更する"
                  >
                    <SelectItem key="createdAt_desc">登録日（新しい順）</SelectItem>
                    <SelectItem key="createdAt_asc">登録日（古い順）</SelectItem>
                    <SelectItem key="username_asc">ユーザー名（昇順）</SelectItem>
                    <SelectItem key="username_desc">ユーザー名（降順）</SelectItem>
                    <SelectItem key="lastName_asc">姓名（昇順）</SelectItem>
                    <SelectItem key="lastName_desc">姓名（降順）</SelectItem>
                  </Select>
                </div>

                {/* クリアボタン */}
                <Button
                  color="default"
                  variant="bordered"
                  size="sm"
                  onPress={clearFilters}
                  className="w-full md:w-auto"
                  aria-label="すべてのフィルターをクリアする"
                >
                  クリア
                </Button>
              </div>

              {/* アクティブなフィルター表示 */}
              <div className="flex flex-wrap gap-2">
                {internalSearchQuery && (
                  <Chip
                    size="sm"
                    color="primary"
                    variant="flat"
                    onClose={() => {
                      setSearchQuery('');
                      setInternalSearchQuery('');
                    }}
                    aria-label={`検索フィルター ${internalSearchQuery} を解除`}
                  >
                    検索: {internalSearchQuery}
                  </Chip>
                )}
                {roleFilter !== 'all' && (
                  <Chip
                    size="sm"
                    color="secondary"
                    variant="flat"
                    onClose={() => setRoleFilter('all')}
                    aria-label={`役割フィルター ${
                      roleFilter === '1'
                        ? '管理者'
                        : roleFilter === '2'
                          ? 'マネージャー'
                          : roleFilter === '3'
                            ? 'ユーザー'
                            : 'ゲスト'
                    } を解除`}
                  >
                    役割:{' '}
                    {roleFilter === '1'
                      ? '管理者'
                      : roleFilter === '2'
                        ? 'マネージャー'
                        : roleFilter === '3'
                          ? 'ユーザー'
                          : 'ゲスト'}
                  </Chip>
                )}
                {(sortBy !== 'createdAt' || sortOrder !== 'desc') && (
                  <Chip
                    size="sm"
                    color="success"
                    variant="flat"
                    onClose={() => {
                      setSortBy('createdAt');
                      setSortOrder('desc');
                    }}
                    aria-label={`並び順フィルター ${
                      sortBy === 'username'
                        ? 'ユーザー名'
                        : sortBy === 'lastName'
                          ? '姓名'
                          : '登録日'
                    } ${sortOrder === 'asc' ? '昇順' : '降順'} を解除`}
                  >
                    並び順:{' '}
                    {sortBy === 'username'
                      ? 'ユーザー名'
                      : sortBy === 'lastName'
                        ? '姓名'
                        : '登録日'}{' '}
                    ({sortOrder === 'asc' ? '昇順' : '降順'})
                  </Chip>
                )}
              </div>
            </div>
          </Card>

          {/* ローディング状態 */}
          {isLoading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="mt-2 text-gray-600">読み込み中...</p>
            </div>
          )}

          {/* エラー表示 */}
          {error && (
            <Card className="w-full mb-4 p-4 bg-red-50 border-red-200">
              <p className="text-red-600 text-center">{error}</p>
              <div className="text-center mt-4">
                <Button color="primary" variant="bordered" onPress={fetchUsers}>
                  再試行
                </Button>
              </div>
            </Card>
          )}

          {/* ユーザーリスト */}
          <div className="w-full space-y-4">
            {users.map((user) => (
              <Card
                key={user.id}
                className="w-full bg-white shadow-md hover:shadow-lg transition-shadow p-2"
              >
                <CardHeader className="box-shadow rounded-lg justify-between items-center bg-blue-500 text-white p-2">
                  <div className="flex justify-between items-center w-full">
                    <div>
                      <h3 className="text-lg font-bold">{user.username}</h3>
                      <p className="text-blue-100 text-sm">
                        {user.lastName} {user.firstName}
                      </p>
                    </div>
                    <Chip
                      color={
                        user.role === 1
                          ? 'danger'
                          : user.role === 2
                            ? 'warning'
                            : user.role === 3
                              ? 'success'
                              : 'default'
                      }
                      variant="flat"
                      size="sm"
                    >
                      {user.role === 1
                        ? '管理者'
                        : user.role === 2
                          ? 'マネージャー'
                          : user.role === 3
                            ? 'ユーザー'
                            : 'ゲスト'}
                    </Chip>
                  </div>
                </CardHeader>
                <CardBody className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">ユーザーID:</span>
                      <p className="font-mono text-xs bg-gray-100 px-2 py-1 rounded mt-1">
                        {user.id}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">登録日:</span>
                      <p className="mt-1">
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString('ja-JP')
                          : '-'}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">最終更新:</span>
                      <p className="mt-1">
                        {user.updatedAt
                          ? new Date(user.updatedAt).toLocaleDateString('ja-JP')
                          : '-'}
                      </p>
                    </div>
                  </div>
                </CardBody>
                <CardFooter className="px-4 py-3 bg-gray-50 flex justify-end gap-2">
                  <Link
                    href={`/users/${user.id}`}
                    className="bg-blue-600 text-white py-1 px-5 rounded-full text-sm"
                  >
                    詳細表示
                  </Link>
                  {currentUserId !== user.id && currentUserRole === 1 && (
                    <Button
                      color="danger"
                      variant="bordered"
                      size="sm"
                      onPress={() => {
                        setShowModal(true);
                        setDeletingUserId(user.id);
                      }}
                    >
                      削除
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* ユーザーがいない場合 */}
          {users.length === 0 && !isLoading && !error && (
            <Card className="w-full p-8 text-center">
              <p className="text-gray-500 text-lg mb-2">ユーザーがいません</p>
              <p className="text-gray-400 text-sm">ユーザーが登録されていません。</p>
            </Card>
          )}
        </div>

        {/* ページネーション */}
        {paginationInfo && paginationInfo.totalPages > 1 && (
          <Card className="w-full mt-6 p-4">
            <div className="flex justify-center items-center space-x-2">
              {/* 前へボタン */}
              <Button
                isDisabled={paginationInfo?.currentPage === 1}
                onPress={() =>
                  setPaginationInfo((prev) =>
                    prev ? { ...prev, currentPage: prev.currentPage - 1 } : null,
                  )
                }
                className="px-3 py-1"
                variant="bordered"
              >
                前へ
              </Button>

              {/* ページ番号 */}
              {Array.from({ length: paginationInfo?.totalPages || 1 }, (_, i) => i + 1)
                .filter((pageNum) => {
                  // 現在のページを中心に前後2ページを表示
                  const start = Math.max(1, (paginationInfo?.currentPage || 1) - 2);
                  const end = Math.min(
                    paginationInfo?.totalPages || 1,
                    (paginationInfo?.currentPage || 1) + 2,
                  );
                  return pageNum >= start && pageNum <= end;
                })
                .map((pageNum) => (
                  <Button
                    key={pageNum}
                    isDisabled={isLoading}
                    onPress={() =>
                      setPaginationInfo((prev) =>
                        prev ? { ...prev, currentPage: pageNum } : null,
                      )
                    }
                    className={`px-3 py-1 min-w-[40px] ${
                      (paginationInfo?.currentPage || 1) === pageNum
                        ? 'bg-blue-500 text-white'
                        : 'bg-white text-blue-500 border border-blue-500 hover:bg-blue-50'
                    }`}
                  >
                    {pageNum}
                  </Button>
                ))}

              {/* 次へボタン */}
              <Button
                isDisabled={paginationInfo?.currentPage === paginationInfo?.totalPages}
                onPress={() =>
                  setPaginationInfo((prev) =>
                    prev ? { ...prev, currentPage: prev.currentPage + 1 } : null,
                  )
                }
                className="px-3 py-1"
                variant="bordered"
              >
                次へ
              </Button>
            </div>
          </Card>
        )}
      </main>

      {/* Todo削除時確認モーダル表示 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-10">
          <div className="bg-white rounded-lg p-6 w-96">
            <h2 className="text-xl font-bold mb-4">ユーザー削除確認</h2>
            <p className="mb-6">このユーザーを削除しますか？</p>
            <div className="flex justify-end gap-2">
              <Button
                color="danger"
                radius="full"
                onPress={async () => {
                  if (deletingUserId) {
                    await handleDeleteUser(deletingUserId);
                    setShowModal(false);
                    setDeletingUserId(null);
                  }
                }}
              >
                削除
              </Button>
              <Button
                color="primary"
                variant="light"
                radius="full"
                onPress={() => {
                  setShowModal(false);
                  setDeletingUserId(null);
                }}
              >
                キャンセル
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

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
    'createdAt' | 'username' | 'firstName' | 'lastName' | 'role'
  >('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [currentUserRole, setCurrentUserRole] = useState<number>(4);
  const [currentUserId, setCurrentUserId] = useState<string>('');
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
  const handleDeleteUser = async (userId: string, username: string) => {
    if (!confirm(`ユーザー「${username}」を削除してもよろしいですか?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'ユーザーの削除に失敗しました');
      }

      // 一覧を再取得
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ユーザーの削除に失敗しました');
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
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Todo アプリ</h1>
          <nav className="flex items-center gap-4">
            <Link
              href="/todos"
              className="text-gray-700 hover:text-blue-500 font-medium"
            >
              Todo一覧
            </Link>
            <Link
              href="/profile"
              className="text-gray-700 hover:text-blue-500 font-medium"
            >
              プロフィール
            </Link>
            {currentUserRole <= 2 && (
              <Link href="/users" className="text-blue-500 font-medium">
                ユーザー管理
              </Link>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              ログアウト
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* ページタイトル */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-gray-900">ユーザー管理</h2>
          <Link
            href="/users/create"
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            新規ユーザー作成
          </Link>
        </div>

        {/* 検索・フィルター・ソート */}
        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* 検索 */}
            <div>
              <label
                htmlFor="search"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                検索
              </label>
              <input
                type="text"
                id="search"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ユーザー名、名前で検索"
              />
            </div>

            {/* ロールフィルター */}
            <div>
              <label
                htmlFor="roleFilter"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                ロールフィルター
              </label>
              <select
                id="roleFilter"
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(
                    e.target.value === 'all' ? 'all' : Number(e.target.value),
                  );
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">すべて</option>
                <option value={1}>ADMIN</option>
                <option value={2}>MANAGER</option>
                <option value={3}>USER</option>
                <option value={4}>GUEST</option>
              </select>
            </div>

            {/* ソート項目 */}
            <div>
              <label
                htmlFor="sortBy"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                並び順
              </label>
              <select
                id="sortBy"
                value={sortBy}
                onChange={(e) =>
                  setSortBy(
                    e.target.value as
                      | 'createdAt'
                      | 'username'
                      | 'firstName'
                      | 'lastName'
                      | 'role',
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="createdAt">作成日時</option>
                <option value="username">ユーザー名</option>
                <option value="firstName">名前</option>
                <option value="lastName">姓</option>
                <option value="role">ロール</option>
              </select>
            </div>

            {/* ソート順 */}
            <div>
              <label
                htmlFor="sortOrder"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                順序
              </label>
              <select
                id="sortOrder"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="asc">昇順</option>
                <option value="desc">降順</option>
              </select>
            </div>
          </div>
        </div>

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
            <div className="bg-white shadow-md rounded-lg p-6 mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                ユーザー一覧
                {paginationInfo && (
                  <span className="text-sm font-normal text-gray-600 ml-2">
                    （全{paginationInfo.totalItems}件）
                  </span>
                )}
              </h3>

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
            </div>

            {/* ページネーション */}
            {paginationInfo && paginationInfo.totalPages > 1 && (
              <div className="bg-white shadow-md rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setPage(page - 1)}
                    disabled={page <= 1}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    前のページ
                  </button>

                  <span className="text-gray-700">
                    ページ {page} / {paginationInfo.totalPages}
                  </span>

                  <button
                    type="button"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= paginationInfo.totalPages}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    次のページ
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

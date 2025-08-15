'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { deleteAuthCookiesFromClient, getClientCookie } from '@/lib/cookie';

export default function UsersIndex() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchFilter, setSearchFilter] = useState<SearchFilter>({
    searchTerm: '',
    roleFilter: 0,
  });
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
    perPage: 20,
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const router = useRouter();

  interface User {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    role: number;
    createdAt: string;
    updatedAt: string;
  }

  interface UsersResponse {
    success: boolean; // 成功フラグ
    message: string;
    data: {
      data: User[]; // ユーザーデータの配列
      pagination: Pagination;
    };
  }

  interface SearchFilter {
    searchTerm: string; // 検索キーワード
    roleFilter: number; // ユーザーロールフィルター
  }

  interface Pagination {
    currentPage: number; // 現在のページ番号
    totalPages: number; // 総ページ数
    totalUsers: number;
    perPage: number; // 1ページあたりのユーザー数
  }

  // useMemoで自動的にフィルタリング結果を計算
  const filteredUsers = useMemo(() => {
    if (!searchFilter.searchTerm && searchFilter.roleFilter === 0) {
      return users; // フィルターがない場合は全ユーザーを返す
    }
    // 検索条件に基づいてユーザーをフィルタリング
    return users.filter((user) => {
      const matchesSearch = user.username
        .toLowerCase()
        .includes(searchFilter.searchTerm.toLowerCase());
      // 役割フィルターの適用
      const matchesRole =
        searchFilter.roleFilter === 0 || user.role === searchFilter.roleFilter;
      // 検索条件と役割フィルターの両方にマッチするユーザーを返す
      return matchesSearch && matchesRole;
    });
  }, [users, searchFilter.searchTerm, searchFilter.roleFilter]);

  // ユーザーを取得する関数
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const token = getClientCookie('token');
    if (!token) {
      setError('認証トークンが見つかりません。ログインしてください。');
      setIsLoading(false);
      deleteAuthCookiesFromClient(); // トークンがない場合はクッキーを削除
      router.push('/auth/login'); // ログインページへリダイレクト
      return;
    }

    try {
      const response = await fetch(`/api/users?page=${pagination.currentPage}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${token}`,
        },
      });

      const responseData: UsersResponse = await response.json();

      if (response.ok && responseData.success) {
        if (responseData.data.data.length === 0) {
          setError('ユーザーが見つかりません');
        }
        const users = responseData.data.data;
        const paginationData = responseData.data.pagination;
        setUsers(users);
        setPagination({
          currentPage: paginationData.currentPage,
          totalPages: paginationData.totalPages,
          totalUsers: paginationData.totalUsers,
          perPage: paginationData.perPage,
        });
      }
    } catch {
      setError('ユーザーの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [pagination.currentPage, router]);

  useEffect(() => {
    const token = getClientCookie('token');
    const user = getClientCookie('user');

    if (!token || !user) {
      deleteAuthCookiesFromClient(); // トークンとユーザー情報のクッキーを削除
      router.push('/auth/login'); // ログインページへリダイレクト
      return;
    }
    setCurrentUser(user ? JSON.parse(user) : null);
    fetchUsers();
  }, [router, fetchUsers]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchFilter((prev) => ({
        ...prev,
        searchTerm: debouncedSearchTerm,
      }));
    }, 300);

    return () => clearTimeout(timer);
  }, [debouncedSearchTerm]);

  // 検索入力のハンドラー
  const handleSearch = (value: string) => {
    setDebouncedSearchTerm(value);
  };

  // 役割フィルターのハンドラー
  const handleRoleFilter = (role: number) => {
    setSearchFilter((prev) => ({
      ...prev,
      roleFilter: role,
    }));
  };

  // ページ変更のハンドラー
  const handlePageChange = (direction: 'next' | 'prev') => {
    setPagination((prev) => {
      const newPage =
        direction === 'next' ? prev.currentPage + 1 : prev.currentPage - 1;
      if (newPage < 1 || newPage > prev.totalPages) {
        return prev; // ページ範囲外の場合は何もしない
      }
      return {
        ...prev,
        currentPage: newPage,
      };
    });
  };

  // ユーザーの役割名を取得する関数
  const getUserRoleName = (role: number) => {
    switch (role) {
      case 1:
        return '管理者';
      case 2:
        return 'マネージャー';
      case 4:
        return 'ユーザー';
      case 8:
        return 'ゲスト';
      default:
        return '不明';
    }
  };

  // 日付をフォーマットする関数
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // ログアウト処理
  const handleLogout = async () => {
    setError(null);
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch {
      setError('ログアウトに失敗しました');
      return;
    }
    router.push('/auth/login');
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <header className="flex justify-between items-center p-4 bg-blue-500 text-white">
        <h1 className="text-xl font-bold">ユーザー一覧</h1>
        <h2>Hello! {currentUser?.username}</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => router.push('/users/me')}
            className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded transition-colors"
          >
            プロフィール
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded transition-colors"
          >
            ログアウト
          </button>
        </div>
      </header>

      <main className="p-4">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end">
            <div className="flex-1">
              <label
                htmlFor="searchInput"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                ユーザー検索
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="ユーザー名で検索..."
                  value={debouncedSearchTerm}
                  id="searchInput"
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div className="w-full lg:w-48">
              <label
                htmlFor="roleFilter"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                役割フィルター
              </label>
              <select
                value={searchFilter.roleFilter}
                onChange={(e) => handleRoleFilter(Number(e.target.value))}
                id="roleFilter"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
              >
                <option value="0">全ての役割</option>
                <option value="1">管理者</option>
                <option value="2">マネージャー</option>
                <option value="4">ユーザー</option>
                <option value="8">ゲスト</option>
              </select>
            </div>

            {/* 統計情報 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5">
              <div className="text-sm text-blue-700">
                <span className="font-medium">表示中:</span>
                <span className="ml-1 font-bold">{filteredUsers.length}</span>
                <span className="text-gray-600 ml-1">/ {users.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ユーザーリスト */}
        <div>
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className="flex justify-between items-center p-4 drop-shadow-md bg-white rounded-lg mb-2 hover:shadow-lg transition-shadow"
            >
              <div>
                <p className="font-medium text-gray-700">ユーザー名</p>
                <div className="text-lg">{user.username}</div>
              </div>
              <div className="flex flex-col">
                <p className="font-medium text-gray-700">名前</p>
                <div className="flex items-center gap-2">
                  <div>{user.lastName}</div>
                  <div>{user.firstName}</div>
                </div>
              </div>
              <div className="text-center">
                <p className="font-medium text-gray-700 mb-1">役割</p>
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user.role === 1
                      ? 'bg-red-100 text-red-800'
                      : user.role === 2
                        ? 'bg-yellow-100 text-yellow-800'
                        : user.role === 4
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {getUserRoleName(user.role)}
                </span>
              </div>
              <div className="text-center">
                <p className="font-medium text-gray-700">作成日</p>
                <div className="text-sm text-gray-600">
                  {formatDate(user.createdAt)}
                </div>
              </div>
              <div className="text-center">
                <p className="font-medium text-gray-700">更新日</p>
                <div className="text-sm text-gray-600">
                  {formatDate(user.updatedAt)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => router.push(`/users/${user.id}`)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                詳細
              </button>
            </div>
          ))}

          {/* 空状態の改善 */}
          {filteredUsers.length === 0 && !isLoading && (
            <div className="text-center p-8 bg-white rounded-lg shadow-md">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                ユーザーが見つかりません
              </h3>
              <p className="text-gray-600 mb-4">
                {searchFilter.searchTerm || searchFilter.roleFilter !== 0
                  ? '検索条件に一致するユーザーがいません。'
                  : 'まだユーザーが登録されていません。'}
              </p>
            </div>
          )}
        </div>

        {/* 既存のページネーション */}
        <div className="flex justify-center items-center mt-8 space-x-4">
          <button
            type="button"
            onClick={() => handlePageChange('prev')}
            disabled={pagination.currentPage <= 1}
            className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
              pagination.currentPage <= 1
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600 shadow-md hover:shadow-lg'
            }`}
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            前のページ
          </button>

          <div className="flex items-center space-x-4 bg-white px-4 py-2 rounded-lg shadow-sm border">
            <span className="text-sm text-gray-600">ページ</span>
            <span className="font-bold text-blue-600 text-lg">
              {pagination.currentPage}
            </span>
            <span className="text-gray-400">/</span>
            <span className="font-semibold text-gray-700">{pagination.totalPages}</span>
          </div>

          <button
            type="button"
            onClick={() => handlePageChange('next')}
            disabled={pagination.currentPage >= pagination.totalPages}
            className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
              pagination.currentPage >= pagination.totalPages
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600 shadow-md hover:shadow-lg'
            }`}
          >
            次のページ
            <svg
              className="w-4 h-4 ml-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </main>

      {/* 既存のエラー通知 */}
      <div className="fixed right-4 z-[9999] bottom-4 max-w-sm">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg animate-in slide-in-from-right-full duration-300">
            <div className="flex items-start justify-between">
              <span className="text-sm font-medium">{error}</span>
              <button
                type="button"
                onClick={() => setError(null)}
                className="ml-2 text-red-600 hover:text-red-800 flex-shrink-0"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

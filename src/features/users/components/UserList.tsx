'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { deleteClientCookie } from '@/lib/cookie';

const PAGE_SIZE = 20;

export default function UserList({
  users,
}: {
  users: Array<{
    id: string;
    username: string;
    firstName?: string | undefined;
    firstNameRuby?: string | undefined;
    lastName?: string | undefined;
    lastNameRuby?: string | undefined;
    role: number;
    createdAt: Date;
    createdBy: string;
    updatedAt: Date;
    updatedBy: string;
    deleted: boolean;
  }>;
}) {
  const router = useRouter();

  // 検索・フィルター用state
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // 検索・フィルター適用済みユーザーリスト
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.firstNameRuby?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastNameRuby?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 0 || user.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  // ページネーション
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const pagedUsers = filteredUsers.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  // ページ切り替え関数
  const handlePageChange = (direction: 'prev' | 'next') => {
    setCurrentPage((prev) => {
      if (direction === 'prev' && prev > 1) return prev - 1;
      if (direction === 'next' && prev < totalPages) return prev + 1;
      return prev;
    });
  };

  // 役割名取得関数
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

  // 日付フォーマット関数
  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const handleLogout = async () => {
    // token cookieを削除
    deleteClientCookie('token');
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch {
      return;
    }
    router.push('/auth/login');
  };

  useMemo(() => setCurrentPage(1), []);

  return (
    <div className="bg-gray-50 min-h-screen">
      <header className="flex justify-between items-center p-4 bg-blue-500 text-white">
        <h1 className="text-xl font-bold">ユーザー一覧</h1>
        <h2>Hello! admin</h2>
        <div className="flex gap-2">
          <button
            type="button"
            className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded transition-colors"
            onClick={() => router.push('/users/me')}
          >
            プロフィール
          </button>
          <button
            type="button"
            className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded transition-colors"
            onClick={handleLogout}
          >
            ログアウト
          </button>
        </div>
      </header>

      <main className="p-4">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end">
            <div className="flex-1 w-full">
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
                  placeholder="ユーザー名、名前、フリガナで検索"
                  id="searchInput"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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
                id="roleFilter"
                value={roleFilter}
                onChange={(e) => setRoleFilter(Number(e.target.value))}
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
                <span className="ml-1 font-bold">{pagedUsers.length}</span>
                <span className="text-gray-600 ml-1">/ {users.length}</span>
              </div>
            </div>
          </div>
        </div>
        {/* ユーザーリスト */}
        <div>
          {pagedUsers.map((user) => (
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
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                onClick={() => router.push(`/users/${user.id}`)}
              >
                詳細
              </button>
            </div>
          ))}
          {/* 空状態 */}
          {pagedUsers.length === 0 && (
            <div className="text-center p-8 bg-white rounded-lg shadow-md">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                ユーザーが見つかりません
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || roleFilter !== 0
                  ? '検索条件に一致するユーザーがいません。'
                  : 'まだユーザーが登録されていません。'}
              </p>
            </div>
          )}
        </div>
        {/* ページネーション */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center mt-8 space-x-4">
            <button
              type="button"
              onClick={() => handlePageChange('prev')}
              disabled={currentPage <= 1}
              className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                currentPage <= 1
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
              <span className="font-bold text-blue-600 text-lg">{currentPage}</span>
              <span className="text-gray-400">/</span>
              <span className="font-semibold text-gray-700">{totalPages}</span>
            </div>

            <button
              type="button"
              onClick={() => handlePageChange('next')}
              disabled={currentPage >= totalPages}
              className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                currentPage >= totalPages
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
        )}
      </main>
    </div>
  );
}

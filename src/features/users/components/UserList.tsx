'use client';

import {
  Button,
  Card,
  CardBody,
  Chip,
  Input,
  Link,
  Select,
  SelectItem,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { deleteClientCookie } from '@/lib/cookie';

const PAGE_SIZE = 20;

type User = {
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
};

export default function UserList({ users }: { users: Array<User> }) {
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
      <header className="h-15 p-5 flex justify-between items-center bg-blue-500 text-white">
        <h1 className="text-xl font-bold">ユーザーリスト</h1>
        <h2>Hello! admin</h2>
        <div className="flex gap-2">
          <Link
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition-colors"
            href="/users/me"
          >
            プロフィール
          </Link>
          <Link
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition-colors"
            href="/todos"
          >
            Todo一覧
          </Link>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition-colors"
            onPress={handleLogout}
          >
            ログアウト
          </Button>
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
                <Input
                  type="text"
                  placeholder="ユーザー名、名前、フリガナで検索"
                  id="searchInput"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5"
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
              <Select
                id="role"
                name="role"
                value={roleFilter}
                onChange={(e) => setRoleFilter(Number(e.target.value))}
                defaultSelectedKeys={roleFilter.toString()}
                aria-label="役割を選択"
              >
                <SelectItem key={0}>すべての役割</SelectItem>
                <SelectItem key={1}>管理者</SelectItem>
                <SelectItem key={2}>マネージャー</SelectItem>
                <SelectItem key={4}>ユーザー</SelectItem>
                <SelectItem key={8}>ゲスト</SelectItem>
              </Select>
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

        {/* ユーザーテーブル */}
        <Card className="w-full shadow-md">
          <CardBody className="p-0">
            <Table aria-label="ユーザーリスト" className="min-w-full" removeWrapper>
              <TableHeader>
                <TableColumn className="bg-gray-50 text-left font-semibold text-gray-700 px-4 py-3">
                  ユーザー名
                </TableColumn>
                <TableColumn className="bg-gray-50 text-left font-semibold text-gray-700 px-4 py-3">
                  名前
                </TableColumn>
                <TableColumn className="bg-gray-50 text-center font-semibold text-gray-700 px-4 py-3">
                  役割
                </TableColumn>
                <TableColumn className="bg-gray-50 text-center font-semibold text-gray-700 px-4 py-3">
                  作成日
                </TableColumn>
                <TableColumn className="bg-gray-50 text-center font-semibold text-gray-700 px-4 py-3">
                  更新日
                </TableColumn>
                <TableColumn className="bg-gray-50 text-center font-semibold text-gray-700 px-4 py-3">
                  操作
                </TableColumn>
              </TableHeader>
              <TableBody emptyContent="ユーザーが見つかりません">
                {pagedUsers.map((user) => (
                  <TableRow
                    key={user.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <TableCell className="px-4 py-3">
                      <div className="text-lg font-semibold">{user.username}</div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span>{user.lastName}</span>
                        <span>{user.firstName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-center">
                      <Chip
                        className={`${
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
                      </Chip>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-center">
                      <div className="text-sm text-gray-600">
                        {formatDate(user.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-center">
                      <div className="text-sm text-gray-600">
                        {formatDate(user.updatedAt)}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-center">
                      <Button
                        color="primary"
                        size="sm"
                        className="px-4 py-2"
                        onPress={() => router.push(`/users/${user.id}`)}
                      >
                        詳細
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>

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

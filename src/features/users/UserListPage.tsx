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
import { deleteUser, getUserInfo, getUserList } from '@/lib/api';
import type { PaginationInfo, UserWithStats } from './components/types';
import { UserList } from './components/UserList';
import { UserPagination } from './components/UserPagination';
import { UserSearchFilter } from './components/UserSearchFilter';
import { UserSortSelect } from './components/UserSortSelect';

export function UserListPage() {
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

  // 削除確認モーダルの状態管理
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    username: string;
  } | null>(null);

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
        const userId = result.data.id;

        // ADMIN・MANAGER のみアクセス可能
        if (userRole >= 3) {
          window.location.href = '/todos';
          return;
        }

        setCurrentUserRole(userRole);
        setCurrentUserId(userId);
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

  // ユーザー一覧を取得
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const params: {
        page: number;
        perPage: number;
        sortBy: 'createdAt' | 'username' | 'firstName' | 'lastName' | 'role';
        sortOrder: 'asc' | 'desc';
        role?: number;
        username?: string;
      } = {
        page,
        perPage: 20,
        sortBy,
        sortOrder,
      };

      // roleFilter が 'all' でない場合のみ role パラメータを追加
      if (roleFilter !== 'all') {
        params.role = roleFilter;
      }

      // searchQuery が空でない場合、username で検索
      if (searchQuery.trim()) {
        params.username = searchQuery.trim();
      }

      const result = await getUserList(params);

      if (!result.success) {
        setError(result.error || 'ユーザー一覧の取得に失敗しました');
        return;
      }

      const responseData = result.data;

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
  }, [page, roleFilter, sortBy, sortOrder, searchQuery]);

  // ページ読み込み時・フィルター変更時にユーザーを取得
  useEffect(() => {
    if (hasPermission) {
      fetchUsers();
    }
  }, [hasPermission, fetchUsers]);

  // ユーザー削除
  const handleDeleteUser = async (userId: string, username: string) => {
    setDeleteTarget({ id: userId, username });
    onDeleteOpen();
  };

  // 削除実行
  const confirmDelete = async () => {
    if (!deleteTarget) return;

    onDeleteClose();

    try {
      const result = await deleteUser(deleteTarget.id);

      if (!result.success) {
        setError(result.error || 'ユーザーの削除に失敗しました');
        return;
      }

      // 一覧を再取得
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ユーザーの削除に失敗しました');
    } finally {
      setDeleteTarget(null);
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
          <UserSearchFilter
            searchQuery={searchQuery}
            roleFilter={roleFilter}
            onSearchChange={(query) => {
              setSearchQuery(query);
              setPage(1);
            }}
            onRoleFilterChange={(role) => {
              setRoleFilter(role);
              setPage(1);
            }}
          />
          <UserSortSelect
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortByChange={setSortBy}
            onSortOrderChange={setSortOrder}
          />
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-md p-3 mb-4">
            {error}
          </div>
        )}

        {/* ユーザー一覧 */}
        <UserList
          users={users}
          isLoading={isLoading}
          currentUserRole={currentUserRole}
          currentUserId={currentUserId}
          onDeleteUser={handleDeleteUser}
          paginationInfo={paginationInfo}
        />

        {/* ページネーション */}
        {paginationInfo && paginationInfo.totalPages > 1 && (
          <UserPagination
            currentPage={paginationInfo.currentPage}
            totalPages={paginationInfo.totalPages}
            onPageChange={setPage}
          />
        )}

        {/* 削除確認モーダル */}
        <Modal isOpen={isDeleteOpen} onClose={onDeleteClose}>
          <ModalContent>
            <ModalHeader>確認</ModalHeader>
            <ModalBody>
              <p>ユーザー「{deleteTarget?.username}」を削除してもよろしいですか?</p>
            </ModalBody>
            <ModalFooter>
              <Button color="default" variant="light" onPress={onDeleteClose}>
                キャンセル
              </Button>
              <Button color="danger" onPress={confirmDelete}>
                削除
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </main>
    </div>
  );
}

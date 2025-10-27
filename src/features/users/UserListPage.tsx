'use client';

import {
  Button,
  Card,
  CardBody,
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
import type { PaginationInfo, UserWithStats } from './components/types';
import { UserList } from './components/UserList';
import { UserPagination } from './components/UserPagination';
import { UserSearchFilter } from './components/UserSearchFilter';
import { UserSortSelect } from './components/UserSortSelect';

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
      // クエリパラメータを構築
      const params = new URLSearchParams({
        page: page.toString(),
        perPage: '10',
        sortBy,
        sortOrder,
      });

      if (searchQuery) {
        params.append('search', searchQuery);
      }

      if (roleFilter !== 'all') {
        params.append('role', roleFilter.toString());
      }

      const response = await fetch(`/api/users?${params.toString()}`);

      if (response.status === 401) {
        router.push('/login');
        return;
      }

      if (!response.ok) {
        throw new Error('ユーザー一覧の取得に失敗しました');
      }

      const data = await response.json();

      // APIレスポンス構造: { data: { data: [...users], pagination: {...} } }
      const responseData = data.data || {};
      setUsers(responseData.data || []);
      setPaginationInfo({
        currentPage: responseData.pagination?.currentPage || 1,
        totalPages: responseData.pagination?.totalPages || 1,
        totalItems: responseData.pagination?.totalUsers || 0,
        itemsPerPage: responseData.pagination?.perPage || 10,
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

  // ユーザー削除確認ダイアログを開く
  const handleDeleteUser = (userId: string, username: string) => {
    setUserToDelete({ id: userId, username });
    onOpen();
  };

  // ユーザー削除を実行
  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    try {
      const response = await fetch(`/api/users/${userToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'ユーザーの削除に失敗しました');
      }

      // 削除成功後、一覧を再取得
      await fetchUsers();
      onClose();
      setUserToDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ユーザーの削除に失敗しました');
      onClose();
    }
  };

  // 権限チェック中
  if (isCheckingPermission) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
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
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-gray-900">ユーザー管理</h2>
          <Button as={Link} href="/users/create" color="primary">
            新規ユーザー作成
          </Button>
        </div>

        {/* 検索・フィルター・ソート */}
        <Card className="mb-6">
          <CardBody className="gap-4">
            {/* 検索・フィルター */}
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

            {/* ソート */}
            <UserSortSelect
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortByChange={setSortBy}
              onSortOrderChange={setSortOrder}
            />
          </CardBody>
        </Card>

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
            currentPage={page}
            totalPages={paginationInfo.totalPages}
            onPageChange={setPage}
          />
        )}
      </main>

      {/* 削除確認モーダル */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader>ユーザー削除の確認</ModalHeader>
          <ModalBody>
            {userToDelete && (
              <>
                <p>
                  本当にユーザー <strong>{userToDelete.username}</strong>{' '}
                  を削除しますか？
                </p>
                <p className="text-sm text-red-600 mt-2">この操作は取り消せません。</p>
              </>
            )}
          </ModalBody>
          <ModalFooter>
            <Button color="default" variant="flat" onPress={onClose}>
              キャンセル
            </Button>
            <Button color="danger" onPress={handleConfirmDelete}>
              削除
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}

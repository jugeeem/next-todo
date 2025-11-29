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
  useDisclosure,
} from '@heroui/react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { deleteUser } from '@/lib/api';
import type {
  PaginationInfo,
  RoleFilter,
  SortBy,
  SortOrder,
  User,
} from './components/types';
import { UserList } from './components/UserList';
import { UserPagination } from './components/UserPagination';
import { UserSearchFilter } from './components/UserSearchFilter';

/**
 * Propsのインターフェース。
 * UserListPageコンポーネントに渡されるpropsの型を定義します。
 *
 * @property {string} currentUserId - 現在のログインユーザーのID
 * @property {number} currentUserRole - 現在のログインユーザーの権限情報
 */
interface Props {
  currentUserId: string;
  currentUserRole: number;
}

/**
 * ユーザー一覧ページコンポーネント。
 * ADMINおよびMANAGER専用のユーザー管理画面を表示するコンポーネントです。
 * @returns
 */
export default function UserListPage({ currentUserId, currentUserRole }: Props) {
  // ステートの管理

  // ユーザー一覧データ
  const [users, setUsers] = useState<User[]>([]);
  // 現在のページ番号
  const [page, setPage] = useState<number>(1);
  // ページネーション情報
  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo | null>(null);
  // ページの権限フィルター
  const [roleFilter, setRoleFilter] = useState<number | 'all'>('all');
  // ソート項目
  const [sortBy, setSortBy] = useState<
    'createdAt' | 'username' | 'firstName' | 'lastName' | 'role'
  >('createdAt');
  // ソート順序
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  // 検索キーワード(ユーザー名、名前で検索)
  const [searchQuery, setSearchQuery] = useState<string>('');
  // データ取得中フラグ
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // エラーメッセージ
  const [error, setError] = useState<string>('');
  // 成功メッセージ
  const [successMessage, setSuccessMessage] = useState<string>('');
  // 削除対象のユーザーIDを保存するステート
  const [userToDeleteId, setUserToDeleteId] = useState<string | null>(null);

  // ユーザー削除モーダル関連のステートと関数を追加
  const { isOpen, onOpen, onClose } = useDisclosure();

  /**
   * ユーザー一覧データを取得する非同期関数。
   * ユーザーの検索条件に基づいて、APIからユーザー一覧データを取得し、ステートに設定します。
   * useCallbackを使用して、依存配列内の値が変更された場合のみインスタンスが再生成されるようにします。
   * @return {Promise<void>}
   * @throws {Error} ユーザー一覧の取得に失敗した場合にエラーをスローします。
   */
  const fetchUsers = useCallback(async () => {
    // ローディング状態を設定し、エラーメッセージをクリア。
    setIsLoading(true);
    setError('');

    try {
      // クエリパラメータを構築
      const queryParams = new URLSearchParams({
        page: page.toString(),
        perPage: '20',
        sortBy,
        sortOrder,
      });

      // searchQueryが空でなければクエリパラメータに追加する。
      if (searchQuery.trim()) {
        queryParams.append('username', searchQuery.trim());
      }

      // roleFilterがallでなければクエリパラメータに追加する。
      if (roleFilter !== 'all') {
        queryParams.append('role', roleFilter.toString());
      }

      // 構築したクエリパラメータを使用してAPIエンドポイントを呼び出す
      const response = await fetch(`/api/users?${queryParams.toString()}`);

      // レスポンスのエラーチェック
      if (!response.ok) {
        throw new Error('ユーザー一覧の取得に失敗しました');
      }

      // レスポンスのデータをオブジェクトに変換
      const data = await response.json();

      // APIレスポンスは入れ子構造のため、ユーザーのデータを抽出して変数に格納
      const responseData = data.data;
      // ユーザー一覧データをステートに設定
      setUsers(responseData.data || []);
      // ページネーション情報をステートに設定
      setPaginationInfo({
        currentPage: responseData.pagination.currentPage,
        totalPages: responseData.pagination.totalPages,
        totalItems: responseData.pagination.totalUsers,
        itemsPerPage: responseData.pagination.perPage,
      });
    } catch (err) {
      // エラー発生時の処理
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    } finally {
      // ローディングの終了
      setIsLoading(false);
    }
  }, [page, roleFilter, sortBy, sortOrder, searchQuery]);

  // useEffectを使用して検索条件が変更されたときのデータの再取得処理を行います。
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  /**
   * 検索キーワード変更ハンドラー。
   *
   * @param {string} query - 新しい検索キーワード
   */
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setPage(1); // 検索条件変更時にページ番号をリセット
  };

  /**
   * ロールフィルター変更ハンドラー。
   *
   * @param {RoleFilter} role - 選択されたロールフィルター
   */
  const handleRoleFilterChange = (role: RoleFilter) => {
    setRoleFilter(role);
    setPage(1); // フィルター変更時にページ番号をリセット
  };

  /**
   * ソート基準変更ハンドラー。
   *
   * @param {SortBy} newSortBy - 選択されたソート基準
   */
  const handleSortByChange = (newSortBy: SortBy) => {
    setSortBy(newSortBy);
  };

  /**
   * ソート順序変更ハンドラー。
   *
   * @param {SortOrder} newSortOrder - 選択されたソート順序
   */
  const handleSortOrderChange = (newSortOrder: SortOrder) => {
    setSortOrder(newSortOrder);
  };

  /**
   * ページ変更ハンドラー。
   */
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  /**
   * ユーザー削除モーダルを開くハンドラー。
   *
   * @param {string} userId - 削除対象のユーザーID
   */
  const handleOpenDeleteModal = (userId: string) => {
    setUserToDeleteId(userId);
    onOpen();
  };

  /**
   * ユーザー削除用の非同期関数。
   * 指定されたユーザーIDのアカウントを削除します。（ADMIN専用機能）
   * @return {Promise<void>}
   * @throws {Error} ユーザー削除に失敗した場合にエラーをスローします。
   */
  const handleDeleteUser = async () => {
    // 削除対象のユーザーがない場合は処理を終了する。
    if (!userToDeleteId) return;

    // モーダルを閉じる
    onClose();

    // エラーメッセージと成功メッセージをクリア
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      // lib/api.tsの削除関数を使用
      const result = await deleteUser(userToDeleteId);

      // エラーレスポンスの場合は、例外をスロー
      if (!result.success) {
        throw new Error(result.error || 'ユーザーの削除に失敗しました');
      }

      // 削除成功メッセージを表示
      setSuccessMessage('ユーザーを削除しました');

      // ステートから削除されたユーザーを除外。現在のusersを参照してidが削除対象と異なるものだけを残す。
      setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userToDeleteId));

      // ページネーション情報を更新
      if (paginationInfo) {
        setPaginationInfo({
          ...paginationInfo,
          totalItems: paginationInfo.totalItems - 1,
        });
      }

      // 削除対象ユーザーをクリア
      setUserToDeleteId(null);

      // 成功メッセージを3秒後にクリア
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* メインコンテンツ */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-10 w-full">
        {/* エラーメッセージ表示 */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* 成功メッセージ表示 */}
        {successMessage && (
          <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700 text-sm">{successMessage}</p>
          </div>
        )}

        {/* ページタイトルと新規作成ボタン */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">ユーザー管理</h2>
          </div>
          {/* 新規ユーザー作成ボタン */}
          <Button
            as={Link}
            href="/users/create"
            color="primary"
            className="font-medium shadow-md hover:shadow-lg"
          >
            新規ユーザー作成
          </Button>
        </div>

        {/* 検索・フィルターCard */}
        <Card className="mb-8">
          <CardHeader>
            <h3 className="text-xl font-semibold text-gray-900">検索・フィルター</h3>
          </CardHeader>
          <CardBody className="space-y-4">
            {/* ロールフィルター、ソートのコントロール */}
            <UserSearchFilter
              searchQuery={searchQuery}
              roleFilter={roleFilter}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSearchChange={handleSearchChange}
              onRoleFilterChange={handleRoleFilterChange}
              onSortByChange={handleSortByChange}
              onSortOrderChange={handleSortOrderChange}
            />
          </CardBody>
        </Card>

        {/* ユーザー一覧Card */}
        <Card>
          <UserList
            users={users}
            paginationInfo={paginationInfo}
            currentUserRole={currentUserRole}
            currentUserId={currentUserId}
            isLoading={isLoading}
            onDelete={handleOpenDeleteModal}
          />

          {/* ページネーションフッター */}
          <UserPagination
            paginationInfo={paginationInfo}
            currentPage={page}
            onPageChange={handlePageChange}
          />
        </Card>

        <Modal isOpen={isOpen} onClose={onClose} isDismissable={false}>
          <ModalContent>
            <ModalHeader className="flex flex-col gap-1">削除確認</ModalHeader>
            <ModalBody>
              <p className="text-gray-700">このユーザーを削除してもよろしいですか？</p>
              <p className="text-sm text-gray-500 mt-2">
                この操作は取り消すことができません。
              </p>
            </ModalBody>
            <ModalFooter>
              <Button onPress={onClose}>キャンセル</Button>
              <Button color="danger" onPress={handleDeleteUser} isLoading={isLoading}>
                削除
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </main>
    </div>
  );
}

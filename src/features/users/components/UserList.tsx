'use client';
import { CardBody } from '@heroui/react';
import type { PaginationInfo, User } from './types';
import { UserListItem } from './UserListItem';

/**
 * UserListのPropsタイプ定義
 *
 */
interface UserListProps {
  users: User[];
  paginationInfo: PaginationInfo | null;
  currentUserRole: number;
  currentUserId: string;
  isLoading: boolean;
  onDelete: (userId: string) => void;
}

/**
 * ユーザーリストコンポーネント。
 * ユーザーの一覧を表示し、ページネーションを提供します。
 * ローディング中や空の状態も適切にハンドリングします。
 *
 * @param {UserListProps} props - コンポーネントのプロパティ
 * @return {JSX.Element} - ユーザーリストコンポーネント
 */
export function UserList({
  users,
  paginationInfo,
  currentUserRole,
  currentUserId,
  isLoading,
  onDelete,
}: UserListProps) {
  return (
    <CardBody>
      {/* ヘッダー部分 */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">ユーザー一覧</h2>

        {/* ページネーション情報 */}
        {paginationInfo && (
          <p className="text-sm text-gray-600">
            全{paginationInfo.totalItems}件中{' '}
            {(paginationInfo.currentPage - 1) * paginationInfo.itemsPerPage + 1}～
            {Math.min(
              paginationInfo.currentPage * paginationInfo.itemsPerPage,
              paginationInfo.totalItems,
            )}
            件を表示
          </p>
        )}
      </div>

      {/* ローディング表示 */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="text-gray-500">読み込み中...</div>
        </div>
      )}

      {/* ユーザーが存在しない場合の表示 */}
      {users.length === 0 && (
        <div className="text-center py-12 text-gray-500 text-lg">
          ユーザーが見つかりませんでした
        </div>
      )}

      {/* ユーザーリストの表示 */}
      <div className="space-y-4">
        {users.map((user) => (
          <UserListItem
            key={user.id}
            user={user}
            currentUserRole={currentUserRole}
            currentUserId={currentUserId}
            onDelete={onDelete}
          />
        ))}
      </div>
    </CardBody>
  );
}

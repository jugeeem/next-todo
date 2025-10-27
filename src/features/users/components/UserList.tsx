'use client';

import { Card, CardBody, CardHeader } from '@heroui/react';
import type { PaginationInfo, UserWithStats } from './types';
import { UserListItem } from './UserListItem';

interface Props {
  users: UserWithStats[];
  isLoading: boolean;
  currentUserRole: number;
  currentUserId: string;
  onDeleteUser: (userId: string, username: string) => void;
  paginationInfo: PaginationInfo | null;
}

/**
 * ユーザーリストコンポーネント
 */
export function UserList({
  users,
  isLoading,
  currentUserRole,
  currentUserId,
  onDeleteUser,
  paginationInfo,
}: Props) {
  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent" />
        <p className="mt-2 text-gray-600">読み込み中...</p>
      </div>
    );
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <h3 className="text-xl font-bold">
          ユーザー一覧
          {paginationInfo && (
            <span className="text-sm font-normal text-gray-600 ml-2">
              （全{paginationInfo.totalItems}件）
            </span>
          )}
        </h3>
      </CardHeader>
      <CardBody>
        {users.length === 0 ? (
          <p className="text-gray-500 text-center py-8">ユーザーが見つかりません</p>
        ) : (
          <div className="space-y-3">
            {users.map((user) => (
              <UserListItem
                key={user.id}
                user={user}
                currentUserRole={currentUserRole}
                currentUserId={currentUserId}
                onDelete={onDeleteUser}
              />
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

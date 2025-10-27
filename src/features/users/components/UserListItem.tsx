'use client';

import { Button } from '@heroui/react';
import Link from 'next/link';
import type { UserWithStats } from './types';
import { getRoleBadgeClass, roleLabels } from './types';

interface Props {
  user: UserWithStats;
  currentUserRole: number;
  currentUserId: string;
  onDelete: (userId: string, username: string) => void;
}

/**
 * ユーザーリスト項目コンポーネント
 */
export function UserListItem({
  user,
  currentUserRole,
  currentUserId,
  onDelete,
}: Props) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
      {/* 左側: ユーザー情報 */}
      <div className="flex-1">
        <Link href={`/users/${user.id}`} className="block hover:text-blue-500">
          <div className="flex items-center gap-3 mb-2">
            <span className="font-medium text-lg">{user.username}</span>
            <span className={getRoleBadgeClass(user.role)}>
              {roleLabels[user.role]}
            </span>
          </div>
          <div className="text-sm text-gray-600">
            {user.lastName && user.firstName
              ? `${user.lastName} ${user.firstName}`
              : 'name is not set'}
          </div>
          {user.stats && (
            <div className="text-xs text-gray-500 mt-2">
              Todo: {user.stats.totalTodos}件 (完了: {user.stats.completedTodos}件 /
              未完了: {user.stats.pendingTodos}件)
            </div>
          )}
        </Link>
      </div>

      {/* 右側: アクション */}
      <div className="flex items-center gap-2">
        <Link href={`/users/${user.id}`}>
          <Button size="sm" color="primary" variant="flat">
            詳細
          </Button>
        </Link>
        {currentUserRole === 1 && user.id !== currentUserId && (
          <Button
            size="sm"
            color="danger"
            variant="flat"
            onPress={() => onDelete(user.id, user.username)}
          >
            削除
          </Button>
        )}
      </div>
    </div>
  );
}

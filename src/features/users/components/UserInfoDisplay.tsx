'use client';

import { Button, Card, CardBody, CardHeader } from '@heroui/react';
import type { User } from './types';
import { getRoleBadgeClass, roleLabels } from './types';

interface Props {
  user: User;
  onEdit: () => void;
  onDelete: () => void;
  currentUserRole: number;
  currentUserId: string;
}

/**
 * ユーザー情報表示コンポーネント
 */
export function UserInfoDisplay({
  user,
  onEdit,
  onDelete,
  currentUserRole,
  currentUserId,
}: Props) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between w-full">
          <h2 className="text-xl font-bold">ユーザー情報</h2>
          <div className="flex items-center gap-2">
            {currentUserRole === 1 && (
              <Button size="sm" color="primary" variant="flat" onPress={onEdit}>
                編集
              </Button>
            )}
            {currentUserRole === 1 && user.id !== currentUserId && (
              <Button size="sm" color="danger" variant="flat" onPress={onDelete}>
                削除
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardBody>
        <div className="space-y-4">
          <div>
            <div className="text-sm text-gray-600 block mb-1">ユーザー名</div>
            <p className="text-base font-medium">{user.username}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600 block mb-1">姓</div>
              <p className="text-base">{user.lastName || '未設定'}</p>
            </div>
            <div>
              <div className="text-sm text-gray-600 block mb-1">名</div>
              <p className="text-base">{user.firstName || '未設定'}</p>
            </div>
          </div>

          <div>
            <div className="text-sm text-gray-600 block mb-1">ロール</div>
            <span className={getRoleBadgeClass(user.role)}>
              {roleLabels[user.role]}
            </span>
          </div>

          <div>
            <div className="text-sm text-gray-600 block mb-1">作成日時</div>
            <p className="text-base text-gray-700">{user.createdAt}</p>
          </div>

          <div>
            <div className="text-sm text-gray-600 block mb-1">更新日時</div>
            <p className="text-base text-gray-700">{user.updatedAt}</p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

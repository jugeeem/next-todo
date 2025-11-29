'use client';
import { Button, Card, CardBody } from '@heroui/react';
import Link from 'next/link';
import { getFullName, getRoleStyle, roleLabels, type User } from './types';

/**
 * UserListItemのPropsタイプ定義
 *
 * @interface UserListItemProps - UserListItemコンポーネントのプロパティタイプ定義
 */
interface UserListItemProps {
  user: User;
  currentUserRole: number;
  currentUserId: string;
  onDelete: (userId: string) => void;
}

/**
 * ユーザーリストアイテムコンポーネント。
 * 個々のユーザー情報をカード形式で表示します。
 * ADMIN権限のユーザーは削除ボタンも表示されます。
 *
 * @param {UserListItemProps} props - コンポーネントのプロパティ
 * @return {JSX.Element} - ユーザーリストアイテムコンポーネント
 */
export function UserListItem({
  user,
  currentUserRole,
  currentUserId,
  onDelete,
}: UserListItemProps) {
  return (
    <Card className="bg-gray-50 hover:bg-gray-100 hover:border-primary transition-all">
      <CardBody className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          {/* ユーザー情報 */}
          <div className="flex-1">
            {/* ユーザー名 */}
            <Link
              href={`/users/${user.id}`}
              className="hover:text-blue-600 transition-colors"
            >
              <h3 className="font-medium text-lg text-gray-900 flex items-center gap-3">
                {user.username}
                {/* ロールバッジ */}
                <span className={getRoleStyle(user.role)}>{roleLabels[user.role]}</span>
              </h3>
            </Link>

            {/* フルネーム */}
            <p className="text-sm text-gray-600 mt-2">{getFullName(user)}</p>

            {/* 作成日時 */}
            <p className="text-xs text-gray-400 mt-3">
              作成: {new Date(user.createdAt).toLocaleString('ja-JP')}
            </p>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="flex items-center gap-3 ml-4">
          {/* 詳細ボタン */}
          <Button
            as={Link}
            href={`/users/${user.id}`}
            color="primary"
            size="sm"
            className="font-medium"
          >
            詳細
          </Button>

          {/* ADMIN権限のユーザーのみ削除ボタンを表示 */}
          {currentUserRole === 1 && user.id !== currentUserId && (
            <Button
              type="button"
              onPress={() => onDelete(user.id)}
              color="danger"
              size="sm"
              className="font-medium"
            >
              削除
            </Button>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

'use client';

import { Button, Card, CardBody, CardFooter, CardHeader } from '@heroui/react';
import type { User } from './types';
import { getFullName, getRoleStyle, roleLabels } from './types';
/**
 * UserInfoDisplayのPropsタイプ定義
 *
 * @interface UserInfoDisplayProps - UserInfoDisplayコンポーネントのプロパティタイプ定義
 * @property {User} user - 表示するユーザー情報
 * @property {number} currentUserRole - 現在のログインユーザーの権限情報
 * @property {string} currentUserId - 現在のログインユーザーのID
 * @property {() => void} onEdit - 編集ボタン押下時のコールバック関数
 * @property {() => void} onDelete - 削除ボタン押下時のコールバック関数
 */
export interface UserInfoDisplayProps {
  user: User;
  currentUserRole: number;
  currentUserId: string;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * ユーザー情報表示コンポーネント。
 * ユーザーの詳細情報を表示し、管理者権限がある場合は編集・削除ボタンを提供します。
 *
 * @param {UserInfoDisplayProps} props - コンポーネントのプロパティ
 * @return {JSX.Element} - ユーザー情報表示コンポーネント
 */
export function UserInfoDisplay({
  user,
  currentUserRole,
  currentUserId,
  onEdit,
  onDelete,
}: UserInfoDisplayProps) {
  return (
    <Card className="p-8 mb-8">
      <CardHeader className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-semibold text-gray-900">ユーザー情報</h3>
        {/* 編集ボタン(ADMINのみ) */}
        {currentUserRole === 1 && (
          <Button
            type="button"
            onPress={onEdit}
            color="primary"
            className="font-medium"
          >
            編集
          </Button>
          // STEP3 MOD END
        )}
      </CardHeader>

      {/* ユーザー情報表示 */}

      {/* 編集モードでない場合 */}
      <CardBody className="space-y-4">
        {/* ユーザー名 */}
        <div>
          <label
            htmlFor="username-display"
            className="block text-sm font-medium text-gray-500 mb-1"
          >
            ユーザー名
          </label>
          <p id="username-display" className="text-lg text-gray-900">
            {user.username}
          </p>
        </div>
        {/* 名前・権限*/}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 名前 */}
          <div>
            <label
              htmlFor="fullname-display"
              className="block text-sm font-medium text-gray-500"
            >
              名前
            </label>
            <p id="fullname-display" className="text-lg text-gray-900">
              {getFullName(user)}
            </p>
          </div>
          {/* 権限 */}
          <div>
            <label
              htmlFor="role-display"
              className="block text-sm font-medium text-gray-500 mb-1"
            >
              ロール
            </label>
            <span id="role-display" className={getRoleStyle(user.role)}>
              {roleLabels[user.role]}
            </span>
          </div>
        </div>

        {/* 作成日時・更新日時 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 作成日時 */}
          <div>
            <label
              htmlFor="create-at-display"
              className="block text-sm font-medium text-gray-500 mb-1"
            >
              作成日時
            </label>
            <p id="create-at-display" className="text-gray-700">
              {new Date(user.createdAt).toLocaleString('ja-JP')}
            </p>
          </div>
          {/* 更新日時 */}
          <div>
            <label
              htmlFor="update-at-display"
              className="block text-sm font-medium text-gray-500 mb-1"
            >
              更新日時
            </label>
            <p id="update-at-display" className="text-gray-700">
              {new Date(user.updatedAt).toLocaleString('ja-JP')}
            </p>
          </div>
        </div>
      </CardBody>

      {/* 削除ボタン（ADMINのみ、自分以外） */}
      {currentUserRole === 1 && currentUserId !== user.id && (
        <CardFooter className="mt-6">
          {/* button → Button STEP3 MOD START */}
          <Button
            type="button"
            onPress={onDelete}
            color="danger"
            className="font-medium"
          >
            このユーザーを削除
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

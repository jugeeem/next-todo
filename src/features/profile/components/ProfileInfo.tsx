'use client';

import { Button, Card, CardBody, CardHeader, Input } from '@heroui/react';
import { type FormEvent, useState } from 'react';
import type { User } from './types';

interface ProfileInfoProps {
  user: User;
  onUpdate: (firstName?: string, lastName?: string) => Promise<void>;
}

/**
 * プロフィール情報コンポーネント
 */
export function ProfileInfo({ user, onUpdate }: ProfileInfoProps) {
  const [firstName, setFirstName] = useState<string>(user.firstName || '');
  const [lastName, setLastName] = useState<string>(user.lastName || '');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsSaving(true);

    try {
      await onUpdate(firstName || undefined, lastName || undefined);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'プロフィールの更新に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFirstName(user.firstName || '');
    setLastName(user.lastName || '');
    setError('');
  };

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">プロフィール</h2>
        {!isEditing && (
          <Button color="primary" onPress={() => setIsEditing(true)}>
            編集
          </Button>
        )}
      </CardHeader>
      <CardBody>
        {error && (
          <div className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-md p-3 mb-4">
            {error}
          </div>
        )}

        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="text"
              label="ユーザー名"
              value={user.username}
              isDisabled
              description="ユーザー名は変更できません"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                type="text"
                label="姓"
                placeholder="姓"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                isDisabled={isSaving}
              />

              <Input
                type="text"
                label="名"
                placeholder="名"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                isDisabled={isSaving}
              />
            </div>

            <div className="flex items-center gap-4 pt-4">
              <Button type="submit" color="primary" isLoading={isSaving}>
                保存
              </Button>
              <Button
                color="default"
                variant="flat"
                onPress={handleCancel}
                isDisabled={isSaving}
              >
                キャンセル
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-1">ユーザー名</h3>
              <p className="text-gray-900">{user.username}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-1">姓</h3>
                <p className="text-gray-900">{user.lastName || '未設定'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-1">名</h3>
                <p className="text-gray-900">{user.firstName || '未設定'}</p>
              </div>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

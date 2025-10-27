'use client';

import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Select,
  SelectItem,
} from '@heroui/react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import type { User } from './types';
import { roleLabels } from './types';

interface Props {
  user: User;
  onSave: (updatedData: {
    firstName?: string;
    lastName?: string;
    role: number;
  }) => Promise<void>;
  onCancel: () => void;
  currentUserRole: number;
}

/**
 * ユーザー情報編集フォームコンポーネント
 */
export function UserInfoEditForm({ user, onSave, onCancel, currentUserRole }: Props) {
  const [firstName, setFirstName] = useState<string>(user.firstName || '');
  const [lastName, setLastName] = useState<string>(user.lastName || '');
  const [role, setRole] = useState<number>(user.role);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    // バリデーション
    if (firstName && firstName.length > 32) {
      setError('名は32文字以内で入力してください');
      return;
    }

    if (lastName && lastName.length > 32) {
      setError('姓は32文字以内で入力してください');
      return;
    }

    setIsSaving(true);

    try {
      await onSave({
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        role,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ユーザー情報の更新に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-bold">ユーザー情報編集</h2>
      </CardHeader>
      <CardBody>
        {error && (
          <div className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-md p-3 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="text-sm text-gray-600 block mb-1">
              ユーザー名
            </label>
            <input
              type="text"
              id="username"
              value={user.username}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">ユーザー名は変更できません</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="text"
              label="姓"
              placeholder="姓"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              maxLength={32}
              isDisabled={isSaving}
            />

            <Input
              type="text"
              label="名"
              placeholder="名"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              maxLength={32}
              isDisabled={isSaving}
            />
          </div>

          <div>
            <Select
              label="ロール"
              selectedKeys={[role.toString()]}
              onChange={(e) => setRole(Number(e.target.value))}
              isRequired
              isDisabled={isSaving}
            >
              {currentUserRole === 1 ? (
                <>
                  <SelectItem key="1">{roleLabels[1]}</SelectItem>
                  <SelectItem key="2">{roleLabels[2]}</SelectItem>
                  <SelectItem key="3">{roleLabels[3]}</SelectItem>
                  <SelectItem key="4">{roleLabels[4]}</SelectItem>
                </>
              ) : (
                <>
                  <SelectItem key="2">{roleLabels[2]}</SelectItem>
                  <SelectItem key="3">{roleLabels[3]}</SelectItem>
                  <SelectItem key="4">{roleLabels[4]}</SelectItem>
                </>
              )}
            </Select>
          </div>

          <div className="flex items-center gap-4 pt-4">
            <Button type="submit" color="primary" isLoading={isSaving}>
              保存
            </Button>
            <Button
              type="button"
              color="default"
              variant="flat"
              onPress={onCancel}
              isDisabled={isSaving}
            >
              キャンセル
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}

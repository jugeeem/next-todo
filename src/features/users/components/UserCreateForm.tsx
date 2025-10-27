'use client';

import { Button, Card, CardBody, Input, Select, SelectItem } from '@heroui/react';
import Link from 'next/link';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { roleLabels } from './types';

interface Props {
  currentUserRole: number;
  availableRoles: number[];
  onCreateUser: (userData: {
    username: string;
    password: string;
    firstName: string;
    lastName: string;
    role: number;
  }) => Promise<void>;
}

/**
 * ユーザー作成フォームコンポーネント
 */
export function UserCreateForm({
  currentUserRole,
  availableRoles,
  onCreateUser,
}: Props) {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [role, setRole] = useState<number>(currentUserRole === 1 ? 4 : 2);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    // バリデーション
    if (!username.trim()) {
      setError('ユーザー名を入力してください');
      return;
    }

    if (username.length > 32) {
      setError('ユーザー名は32文字以内で入力してください');
      return;
    }

    if (!password) {
      setError('パスワードを入力してください');
      return;
    }

    if (password.length < 8) {
      setError('パスワードは8文字以上で入力してください');
      return;
    }

    if (password !== confirmPassword) {
      setError('パスワードが一致しません');
      return;
    }

    if (firstName && firstName.length > 32) {
      setError('名は32文字以内で入力してください');
      return;
    }

    if (lastName && lastName.length > 32) {
      setError('姓は32文字以内で入力してください');
      return;
    }

    // MANAGER が ADMIN を作成しようとした場合
    if (currentUserRole === 2 && role === 1) {
      setError('MANAGER は ADMIN ユーザーを作成できません');
      return;
    }

    setIsSubmitting(true);

    try {
      await onCreateUser({
        username,
        password,
        firstName,
        lastName,
        role,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ユーザーの作成に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardBody>
        {/* エラー表示 */}
        {error && (
          <div className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-md p-3 mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ユーザー名 */}
          <Input
            type="text"
            label="ユーザー名"
            placeholder="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={32}
            isRequired
            isDisabled={isSubmitting}
            description="最大32文字"
          />

          {/* パスワード */}
          <Input
            type="password"
            label="パスワード"
            placeholder="8文字以上"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            isRequired
            isDisabled={isSubmitting}
            description="最小8文字"
          />

          {/* パスワード（確認） */}
          <Input
            type="password"
            label="パスワード（確認）"
            placeholder="パスワードを再入力"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            isRequired
            isDisabled={isSubmitting}
          />

          {/* 姓・名 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="text"
              label="姓"
              placeholder="姓"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              maxLength={32}
              isDisabled={isSubmitting}
            />

            <Input
              type="text"
              label="名"
              placeholder="名"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              maxLength={32}
              isDisabled={isSubmitting}
            />
          </div>

          {/* ロール */}
          <Select
            label="ロール"
            selectedKeys={[role.toString()]}
            onChange={(e) => setRole(Number(e.target.value))}
            isRequired
            isDisabled={isSubmitting}
            description={
              currentUserRole === 2
                ? 'MANAGER は ADMIN ユーザーを作成できません'
                : undefined
            }
          >
            {availableRoles.map((roleValue) => (
              <SelectItem key={roleValue.toString()}>
                {roleLabels[roleValue]}
              </SelectItem>
            ))}
          </Select>

          {/* 送信ボタン */}
          <div className="flex items-center gap-4 pt-4">
            <Button type="submit" color="primary" isLoading={isSubmitting}>
              ユーザーを作成
            </Button>
            <Button as={Link} href="/users" color="default" variant="flat">
              キャンセル
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}

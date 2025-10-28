'use client';

import { Button, Card, CardBody, CardHeader, Input } from '@heroui/react';
import { type FormEvent, useState } from 'react';
import { changePassword } from '@/lib/api';

interface PasswordChangeFormProps {
  onSuccess?: () => void;
}

/**
 * パスワード変更フォームコンポーネント
 */
export function PasswordChangeForm({ onSuccess }: PasswordChangeFormProps) {
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [isChanging, setIsChanging] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!currentPassword) {
      setError('現在のパスワードは必須です');
      return;
    }

    if (!newPassword) {
      setError('新しいパスワードは必須です');
      return;
    }

    if (newPassword.length < 6) {
      setError('新しいパスワードは6文字以上で入力してください');
      return;
    }

    if (!confirmPassword) {
      setError('パスワード確認は必須です');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('新しいパスワードとパスワード確認が一致しません');
      return;
    }

    setIsSaving(true);

    try {
      // Server Action を使用
      const result = await changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      if (!result.success) {
        throw new Error(result.error || 'パスワードの変更に失敗しました');
      }

      // 成功したらフォームをリセット
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsChanging(false);

      // 成功コールバック
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'パスワードの変更に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsChanging(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
  };

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">パスワード変更</h2>
        {!isChanging && (
          <Button color="primary" onPress={() => setIsChanging(true)}>
            変更
          </Button>
        )}
      </CardHeader>
      <CardBody>
        {isChanging ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-md p-3">
                {error}
              </div>
            )}

            <Input
              type="password"
              label="現在のパスワード"
              placeholder="現在のパスワード"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              isDisabled={isSaving}
              isRequired
            />

            <Input
              type="password"
              label="新しいパスワード"
              placeholder="新しいパスワード（6文字以上）"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              isDisabled={isSaving}
              isRequired
            />

            <Input
              type="password"
              label="新しいパスワード（確認）"
              placeholder="新しいパスワードを再入力"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              isDisabled={isSaving}
              isRequired
            />

            <div className="flex items-center gap-4 pt-4">
              <Button type="submit" color="primary" isLoading={isSaving}>
                変更
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
          <p className="text-gray-600">
            パスワードを変更する場合は「変更」ボタンをクリックしてください。
          </p>
        )}
      </CardBody>
    </Card>
  );
}

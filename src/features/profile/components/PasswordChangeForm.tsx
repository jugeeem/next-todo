'use client';

import { Button, Card, CardBody, CardFooter, CardHeader, Input } from '@heroui/react';
import { type FormEvent, useCallback, useState } from 'react';
import { z } from 'zod';

/**
 * パスワード変更用のバリデーションスキーマ。
 * 現在のパスワード、新しいパスワード、確認用パスワードの各フィールドに対してバリデーションを行います。
 *
 * @property {string} currentPassword - 現在のパスワード（必須）
 * @property {string} newPassword - 新しいパスワード（6文字以上が必須）
 * @property {string} confirmPassword - 確認用パスワード（必須）
 */
const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, '現在のパスワードは必須です'),
  newPassword: z.string().min(6, '新しいパスワードは6文字以上で入力してください'),
  confirmPassword: z.string().min(1, '確認用パスワードは必須です'),
});

/**
 * パスワード変更フォームコンポーネント。
 * 現在のパスワード、新しいパスワード、確認用パスワードの入力フィールドを提供し、パスワード変更を行います。
 *
 * @returns {JSX.Element} パスワード変更フォームコンポーネント
 */
export function PasswordChangeForm() {
  // ステートの定義
  // 現在のパスワードの状態
  const [currentPassword, setCurrentPassword] = useState<string>('');
  // 新しいパスワードの状態
  const [newPassword, setNewPassword] = useState<string>('');
  // 確認用パスワードの状態
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  // 変更中の状態
  const [isChanging, setIsChanging] = useState<boolean>(false);
  // 保存中の状態
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // 共通エラーメッセージの状態
  const [error, setError] = useState<string>('');
  // 現在のパスワードエラーメッセージの状態
  const [currentPasswordError, setCurrentPasswordError] = useState<string>('');
  // 新しいパスワードエラーメッセージの状態
  const [newPasswordError, setNewPasswordError] = useState<string>('');
  // 確認用パスワードエラーメッセージの状態
  const [confirmPasswordError, setConfirmPasswordError] = useState<string>('');

  // 成功メッセージ
  const [successMessage, setSuccessMessage] = useState<string>('');

  /**
   * パスワード変更処理。
   * バリデーションを行い、エラーがなければパスワード変更APIを呼び出します。
   *
   * @param {FormEvent} e - フォーム送信イベント
   * @returns {Promise<void>} - 非同期処理の完了を示すPromise
   */
  const handleChange = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();

      // エラーメッセージのリセット
      setCurrentPasswordError('');
      setNewPasswordError('');
      setConfirmPasswordError('');
      setError('');
      setSuccessMessage('');

      // バリデーションの実行
      const result = passwordChangeSchema.safeParse({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      // バリデーション失敗時の処理
      if (!result.success) {
        // エラーメッセージを一覧で取得
        const errors = result.error.errors;
        // 各フィールドのエラーメッセージを設定
        errors.forEach((err) => {
          if (err.path[0] === 'currentPassword') {
            setCurrentPasswordError(err.message);
          }
          if (err.path[0] === 'newPassword') {
            setNewPasswordError(err.message);
          }
          if (err.path[0] === 'confirmPassword') {
            setConfirmPasswordError(err.message);
          }
        });
        return;
      }

      // パスワード一致チェック
      if (newPassword !== confirmPassword) {
        setError('新しいパスワードと確認用パスワードが一致しません。');
        return;
      }

      // 変更処理の開始
      setIsSaving(true);
      try {
        const response = await fetch('/api/users/me/password', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            currentPassword,
            newPassword,
            confirmPassword,
          }),
        });

        // パスワード変更失敗時の処理
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'パスワードの変更に失敗しました');
        }

        // 成功後入力フォームのリセット
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        // 成功メッセージの設定
        setSuccessMessage('パスワードが正常に変更されました。');
        // 変更モードを終了
        setIsChanging(false);

        // 3秒後に成功メッセージをクリア
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      } catch (err) {
        setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
      } finally {
        // 保存処理の終了
        setIsSaving(false);
      }
    },
    [currentPassword, newPassword, confirmPassword],
  );

  /**
   * 変更キャンセル処理。
   * フォームを元の値にリセットし、エラーメッセージをクリアして変更モードを終了します。
   *
   * @returns {void}
   */
  const handleCancel = () => {
    // フォームを元の値にリセット
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    // エラーメッセージをリセット
    setCurrentPasswordError('');
    setNewPasswordError('');
    setConfirmPasswordError('');
    setError('');
    // 変更モードを終了
    setIsChanging(false);
  };

  return (
    <Card className="p-6">
      <CardHeader className="justify-between mb-4">
        <h2 className="text-2xl font-semibold text-gray-900">パスワード変更</h2>
        {!isChanging && (
          <Button
            type="button"
            onPress={() => setIsChanging(true)}
            color="primary"
            className="font-medium"
          >
            変更
          </Button>
        )}
      </CardHeader>

      {/* 成功メッセージ */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-700 text-sm">{successMessage}</p>
        </div>
      )}

      {/* エラーメッセージ */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {isChanging ? (
        // 変更フォーム
        <form onSubmit={handleChange}>
          <CardBody className="space-y-6">
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => {
                setCurrentPassword(e.target.value);
                setCurrentPasswordError('');
                setError('');
              }}
              placeholder="現在のパスワード"
              label="現在のパスワード"
              isRequired
              validationBehavior="aria"
              isInvalid={!!currentPasswordError}
              errorMessage={currentPasswordError}
            />
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setNewPasswordError('');
                setError('');
              }}
              placeholder="新しいパスワード(6文字以上)"
              label="新しいパスワード"
              isRequired
              validationBehavior="aria"
              isInvalid={!!newPasswordError}
              errorMessage={newPasswordError}
            />
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setConfirmPasswordError('');
                setError('');
              }}
              placeholder="新しいパスワードを再入力"
              label="新しいパスワード(確認)"
              isRequired
              validationBehavior="aria"
              isInvalid={!!confirmPasswordError}
              errorMessage={confirmPasswordError}
            />
          </CardBody>

          <CardFooter className="justify-end gap-3">
            <Button
              type="button"
              onPress={handleCancel}
              disabled={isSaving}
              className="font-medium"
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              isLoading={isSaving}
              color="primary"
              className="font-medium"
            >
              {isSaving ? '変更中' : '変更'}
            </Button>
          </CardFooter>
        </form>
      ) : (
        // 通常表示
        <p className="text-gray-600">
          パスワードを変更する場合は変更ボタンをクリックしてください。
        </p>
      )}
    </Card>
  );
}

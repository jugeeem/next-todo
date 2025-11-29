'use client';

import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Input,
} from '@heroui/react';
import { type FormEvent, useCallback, useState } from 'react';
import { z } from 'zod';
import { updateCurrentUserProfile } from '@/lib/api';
import type { User } from './types';

/**
 * ProfileInfoのPropsインターフェース。
 * ユーザー情報の表示と編集を行うコンポーネントのプロパティを定義します。
 *
 * @interface EditProfileInfoProps
 * @property {User} user - 編集対象のユーザー情報
 * @property {(updateUser: User) => void} onSuccess - プロフィール更新成功時のコールバック関数
 * @property {() => void} onCancel - プロフィール編集キャンセル時のコールバック関数
 */
interface EditProfileInfoProps {
  user: User;
  onSuccess: (updateUser: User) => void;
  onCancel: () => void;
}

/**
 * プロフィール更新用のバリデーションスキーマ。
 * 名前と姓はそれぞれ50文字以内であることを検証します。
 *
 * @property {string} [firstName] - ユーザーの名前（任意）
 * @property {string} [lastName] - ユーザーの姓（任意）
 */
const profileUpdateSchema = z.object({
  firstName: z
    .string()
    .max(50, '名前は50文字以内で入力してください')
    .optional(),
  lastName: z.string().max(50, '姓は50文字以内で入力してください').optional(),
});

/**
 * プロフィール編集フォームコンポーネント。
 * ユーザーのプロフィール情報を編集するためのフォームを提供します。
 *
 * @param {ProfileInfoProps} props - コンポーネントのプロパティ
 * @returns {JSX.Element} プロフィール編集フォーム
 */
export function EditProfileInfo({
  user,
  onSuccess,
  onCancel,
}: EditProfileInfoProps) {
  // 名前の状態
  const [firstName, setFirstName] = useState<string>(user.firstName || '');
  // 姓の状態
  const [lastName, setLastName] = useState<string>(user.lastName || '');
  // 保存中の状態
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // エラーメッセージの状態
  // 全体のエラーメッセージ
  const [error, setError] = useState<string>('');
  // 名前のエラーメッセージ
  const [firstNameError, setFirstNameError] = useState<string>('');
  // 姓のエラーメッセージ
  const [lastNameError, setLastNameError] = useState<string>('');

  /**
   * プロフィール更新ハンドラ。
   * フォーム送信時に呼び出され、プロフィール情報の更新を行います。
   *
   * @param {FormEvent} e - フォーム送信イベント
   * @returns {Promise<void>}
   */
  const handleUpdate = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();

      // エラーメッセージをクリア
      setError('');
      setFirstNameError('');
      setLastNameError('');

      // バリデーションの実行
      const result = profileUpdateSchema.safeParse({
        firstName,
        lastName,
      });

      // バリデーション失敗時の処理
      if (!result.success) {
        // エラーメッセージを一覧で取得
        const errors = result.error.errors;
        // 各フィールドのエラーメッセージを設定
        errors.forEach((err) => {
          if (err.path[0] === 'firstName') {
            setFirstNameError(err.message);
          }
          if (err.path[0] === 'lastName') {
            setLastNameError(err.message);
          }
        });
        return;
      }

      // 保存処理の開始
      setIsSaving(true);
      try {
        // APIを呼び出してプロフィールを更新
        const response = await updateCurrentUserProfile({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        });

        // エラー発生時の処理
        if (!response.success) {
          throw new Error(response.error || 'プロフィールの更新に失敗しました');
        }

        // 更新成功時のコールバックを呼び出し
        onSuccess(response.data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : '不明なエラーが発生しました'
        );
      } finally {
        // 保存処理の終了
        setIsSaving(false);
      }
    },
    [firstName, lastName, onSuccess]
  );

  /**
   * 編集キャンセル処理。
   *
   * @returns {void}
   */
  const handleCancel = () => {
    // フォームを元の値にリセット
    setFirstName(user.firstName || '');
    setLastName(user.lastName || '');

    // エラーメッセージをリセット
    setFirstNameError('');
    setLastNameError('');
    setError('');

    // 親コンポーネントにキャンセルを通知
    onCancel();
  };

  return (
    <Card className='p-6 mb-8'>
      <CardHeader className='justify-between mb-4'>
        <h2 className='text-2xl font-semibold text-gray-900'>
          プロフィール情報
        </h2>
      </CardHeader>
      {/* エラーメッセージ */}
      {error && (
        <div className='mb-6 p-4 bg-red-50 border border-red-200 rounded-lg'>
          <p className='text-red-700 text-sm'>{error}</p>
        </div>
      )}

      <form onSubmit={handleUpdate}>
        <CardBody className='space-y-6'>
          <Input
            id='username'
            type='text'
            value={user.username}
            label='ユーザー名'
            isReadOnly
            isDisabled
            className='bg-gray-50'
          />
          <Input
            id='lastName'
            type='text'
            value={lastName}
            onChange={(e) => {
              setLastName(e.target.value);
              setLastNameError('');
            }}
            placeholder='姓を入力'
            label='姓'
            isInvalid={!!lastNameError}
            errorMessage={lastNameError}
          />
          <Input
            id='firstName'
            type='text'
            value={firstName}
            onChange={(e) => {
              setFirstName(e.target.value);
              setFirstNameError('');
            }}
            placeholder='名を入力'
            label='名'
            isInvalid={!!firstNameError}
            errorMessage={firstNameError}
          />
        </CardBody>

        <CardFooter className='justify-end gap-3'>
          <Button
            type='button'
            onPress={handleCancel}
            disabled={isSaving}
            className='font-medium'
          >
            キャンセル
          </Button>
          <Button
            type='submit'
            isLoading={isSaving}
            color='primary'
            className='font-medium'
          >
            {isSaving ? '保存中' : '保存'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

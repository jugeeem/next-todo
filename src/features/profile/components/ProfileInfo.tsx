'use client';

import { Button, Card, CardBody, CardFooter, CardHeader, Input } from '@heroui/react';
import { type FormEvent, useState } from 'react';
import { z } from 'zod';
import type { User } from './types';

/**
 * ProfileInfoのPropsインターフェース。
 * ユーザー情報の表示と編集を行うコンポーネントのプロパティを定義します。
 *
 * @interface ProfileInfoProps
 * @property {User} user - 表示および編集するユーザー情報オブジェクト
 * @property {(updateUser: User) => void} onUpdate - ユーザー情報が更新されたときに呼び出されるコールバック関数
 */
interface ProfileInfoProps {
  user: User;
  onUpdate: (updateUser: User) => void;
}

/**
 * プロフィール更新用のバリデーションスキーマ。
 * 名前と姓はそれぞれ50文字以内であることを検証します。
 *
 * @property {string} [firstName] - ユーザーの名前（任意）
 * @property {string} [lastName] - ユーザーの姓（任意）
 */
const profileUpdateSchema = z.object({
  firstName: z.string().max(50, '名前は50文字以内で入力してください').optional(),
  lastName: z.string().max(50, '姓は50文字以内で入力してください').optional(),
});

/**
 * プロフィール情報の表示・編集コンポーネント。
 * ユーザーの名前と姓を表示し、編集可能なフォームを提供します。
 *
 * @param {ProfileInfoProps} props - コンポーネントのプロパティ
 * @returns {JSX.Element} プロフィール情報コンポーネント
 */
export function ProfileInfo({ user, onUpdate }: ProfileInfoProps) {
  // ステートの定義
  // 名前の状態
  const [firstName, setFirstName] = useState<string>(user.firstName || '');
  // 姓の状態
  const [lastName, setLastName] = useState<string>(user.lastName || '');
  // 編集中の状態
  const [isEditing, setIsEditing] = useState<boolean>(false);
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
   * フォームの送信時に呼び出され、バリデーションとAPI呼び出しを行います。
   *
   * @param {FormEvent} e - フォーム送信イベント
   * @returns {Promise<void>}
   */
  const handleUpdate = async (e: FormEvent) => {
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
      const response = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        }),
      });

      // レスポンスの解析
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'プロフィールの更新に失敗しました');
      }

      // 更新されたユーザー情報を取得
      const data = await response.json();

      // 親コンポーネントに更新を通知
      onUpdate(data.data);

      // ステートを更新
      setFirstName(data.data.firstName || '');
      setLastName(data.data.lastName || '');
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    } finally {
      // 保存処理の終了
      setIsSaving(false);
    }
  };

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

    // 編集モードを終了
    setIsEditing(false);
  };

  return (
    <Card className="p-6 mb-8">
      <CardHeader className="justify-between mb-4">
        <h2 className="text-2xl font-semibold text-gray-900">プロフィール情報</h2>
        {!isEditing && (
          <Button
            type="button"
            onPress={() => setIsEditing(true)}
            color="primary"
            className="font-medium"
          >
            編集
          </Button>
        )}
      </CardHeader>

      {/* エラーメッセージ */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {isEditing ? (
        // 編集モード
        <form onSubmit={handleUpdate}>
          <CardBody className="space-y-6">
            <Input
              id="username"
              type="text"
              value={user.username}
              label="ユーザー名"
              isReadOnly
              isDisabled
              className="bg-gray-50"
            />
            <Input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => {
                setLastName(e.target.value);
                setLastNameError('');
              }}
              placeholder="姓を入力"
              label="姓"
              isInvalid={!!lastNameError}
              errorMessage={lastNameError}
            />
            <Input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value);
                setFirstNameError('');
              }}
              placeholder="名を入力"
              label="名"
              isInvalid={!!firstNameError}
              errorMessage={firstNameError}
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
              {isSaving ? '保存中' : '保存'}
            </Button>
          </CardFooter>
        </form>
      ) : (
        // 表示モード
        <CardBody className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">ユーザー名</p>
            <p className="text-gray-900">{user.username}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">姓</p>
            <p className="text-gray-900">{user.lastName || '未設定'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">名</p>
            <p className="text-gray-900">{user.firstName || '未設定'}</p>
          </div>
        </CardBody>
      )}
    </Card>
  );
}

'use client';

import { Button, Card, CardBody, CardHeader, Input, Textarea } from '@heroui/react';
import { type FormEvent, useState } from 'react';
import { z } from 'zod';
import type { Todo } from './types';

/**
 * TodoEditFormのPropsインターフェース。
 *
 * @property {Todo} todo - 編集対象のTodoオブジェクト
 * @property {(title: string, descriptions: string) => Promise<void>} onUpdate - Todo更新時のハンドラ関数
 * @property {() => void} onCancel - 編集キャンセル時のハンドラ関数
 * @property {boolean} isUpdating - Todo更新中かどうかを示すフラグ
 */
interface TodoEditFormProps {
  todo: Todo;
  onUpdate: (title: string, descriptions: string) => Promise<void>;
  onCancel: () => void;
  isUpdating: boolean;
}

/**
 * Todo更新用のバリデーションスキーマ。
 * タイトルは1文字以上32文字以下、説明は128文字以下であることを検証します。
 *
 * @property {string} title - Todoのタイトル
 * @property {string} [descriptions] - Todoの説明（任意）
 */
const updateTodoSchema = z.object({
  title: z
    .string()
    .min(1, 'タイトルは必須です')
    .max(32, 'タイトルは32文字以内で入力してください'),
  descriptions: z.string().max(128, '説明は128文字以内で入力してください').optional(),
});

/**
 * Todo編集フォームコンポーネント。
 * タイトルと説明の編集を行い、更新またはキャンセルの操作を提供します。
 *
 * @param {TodoEditFormProps} props - コンポーネントのプロパティ
 * @returns {JSX.Element} Todo編集フォームコンポーネント
 */
export function TodoEditForm({
  todo,
  onUpdate,
  onCancel,
  isUpdating,
}: TodoEditFormProps) {
  // ステートの定義
  // タイトルの状態
  const [title, setTitle] = useState<string>(todo.title);
  // 説明の状態
  const [descriptions, setDescriptions] = useState<string>(todo.descriptions || '');

  // タイトルエラーメッセージの状態
  const [titleError, setTitleError] = useState<string>('');
  // 説明エラーメッセージの状態
  const [descriptionsError, setDescriptionsError] = useState<string>('');

  /**
   * フォーム送信ハンドラ。
   * バリデーション処理を行い、エラーがなければonUpdateを呼び出します。
   *
   * @param {FormEvent<HTMLFormElement>} e - フォームイベント
   * @returns {Promise<void>} 非同期処理の完了を示すPromise
   */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // エラーメッセージをリセット
    setTitleError('');
    setDescriptionsError('');

    // バリデーションの実行
    const result = updateTodoSchema.safeParse({
      title,
      descriptions,
    });

    // バリデーション失敗時の処理
    if (!result.success) {
      // エラーメッセージを一覧で取得
      const errors = result.error.errors;
      // 各フィールドのエラーメッセージを設定
      errors.forEach((err) => {
        if (err.path[0] === 'title') {
          setTitleError(err.message);
        }
        if (err.path[0] === 'descriptions') {
          setDescriptionsError(err.message);
        }
      });
      return;
    }

    // 親コンポーネントに更新処理を移譲
    await onUpdate(title.trim(), descriptions.trim());
  };

  /**
   * キャンセルハンドラ。
   * 親コンポーネントにキャンセル処理を移譲します。
   */
  const handleCancel = () => {
    // フォームを元の値にリセット
    setTitle(todo.title);
    setDescriptions(todo.descriptions || '');
    // エラーメッセージをリセット
    setTitleError('');
    setDescriptionsError('');

    // 親コンポーネントにキャンセル処理を移譲
    onCancel();
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <h2 className="text-2xl font-semibold text-gray-900">Todo編集</h2>
      </CardHeader>
      <CardBody>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* タイトル入力欄 */}
          <Input
            id="title"
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setTitleError('');
            }}
            maxLength={32}
            placeholder="Todoのタイトル（32文字以内）"
            label="タイトル"
            isRequired
            validationBehavior="aria"
            isInvalid={!!titleError}
            errorMessage={titleError}
          />

          {/* 説明入力欄 */}
          <Textarea
            id="descriptions"
            label="説明"
            placeholder="Todoの説明（128文字以内）"
            value={descriptions}
            onChange={(e) => {
              setDescriptions(e.target.value);
              setDescriptionsError('');
            }}
            maxLength={128}
            isInvalid={!!descriptionsError}
            errorMessage={descriptionsError}
          />

          {/* ボタン群 */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              onPress={handleCancel}
              isDisabled={isUpdating} // 更新中はキャンセル不可
              className="font-medium"
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              color="primary"
              isLoading={isUpdating}
              className="font-medium"
            >
              {isUpdating ? '保存中' : '保存'}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}

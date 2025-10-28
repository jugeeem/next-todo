'use client';

import { Button, Card, CardBody, CardHeader, Input, Textarea } from '@heroui/react';
import { type FormEvent, useState } from 'react';
import { updateTodo } from '@/lib/api';
import type { Todo } from './types';

interface TodoEditFormProps {
  todo: Todo;
  onSuccess?: () => void;
  onCancel: () => void;
}

/**
 * Todo編集フォームコンポーネント
 */
export function TodoEditForm({ todo, onSuccess, onCancel }: TodoEditFormProps) {
  const [title, setTitle] = useState<string>(todo.title);
  const [descriptions, setDescriptions] = useState<string>(todo.descriptions || '');
  const [error, setError] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('タイトルは必須です');
      return;
    }

    if (title.length > 32) {
      setError('タイトルは32文字以内で入力してください');
      return;
    }

    if (descriptions && descriptions.length > 128) {
      setError('説明は128文字以内で入力してください');
      return;
    }

    setIsSaving(true);

    try {
      // Server Action を使用
      const result = await updateTodo(todo.id, {
        title,
        descriptions: descriptions || undefined,
        completed: todo.completed,
      });

      if (!result.success) {
        throw new Error(result.error || 'Todoの更新に失敗しました');
      }

      // 成功コールバック
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Todoの更新に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="text-2xl font-bold text-gray-900">Todo編集</h2>
      </CardHeader>
      <CardBody>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            type="text"
            label="タイトル"
            placeholder="Todoのタイトル（32文字以内）"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            isDisabled={isSaving}
            isRequired
          />

          <Textarea
            label="説明"
            placeholder="Todoの説明（128文字以内）"
            value={descriptions}
            onChange={(e) => setDescriptions(e.target.value)}
            minRows={5}
            isDisabled={isSaving}
          />

          {error && (
            <div className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-md p-3">
              {error}
            </div>
          )}

          <div className="flex items-center gap-4">
            <Button type="submit" color="primary" isLoading={isSaving}>
              保存
            </Button>
            <Button
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

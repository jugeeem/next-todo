'use client';

import { Button, Card, CardBody, CardHeader, Input, Textarea } from '@heroui/react';
import { type FormEvent, useState } from 'react';

interface TodoCreateFormProps {
  onCreateTodo: (title: string, descriptions?: string) => Promise<void>;
}

/**
 * Todo作成フォームコンポーネント
 */
export function TodoCreateForm({ onCreateTodo }: TodoCreateFormProps) {
  const [newTodoTitle, setNewTodoTitle] = useState<string>('');
  const [newTodoDescription, setNewTodoDescription] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isCreating, setIsCreating] = useState<boolean>(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!newTodoTitle.trim()) {
      setError('タイトルは必須です');
      return;
    }

    if (newTodoTitle.length > 32) {
      setError('タイトルは32文字以内で入力してください');
      return;
    }

    if (newTodoDescription && newTodoDescription.length > 128) {
      setError('説明は128文字以内で入力してください');
      return;
    }

    setIsCreating(true);

    try {
      await onCreateTodo(newTodoTitle, newTodoDescription || undefined);

      // フォームをリセット
      setNewTodoTitle('');
      setNewTodoDescription('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Todoの作成に失敗しました');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <h2 className="text-xl font-bold text-gray-900">新しいTodoを作成</h2>
      </CardHeader>
      <CardBody>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="text"
            label="タイトル"
            placeholder="Todoのタイトル（32文字以内）"
            value={newTodoTitle}
            onChange={(e) => setNewTodoTitle(e.target.value)}
            isDisabled={isCreating}
            isRequired
          />

          <Textarea
            label="説明"
            placeholder="Todoの説明（128文字以内）"
            value={newTodoDescription}
            onChange={(e) => setNewTodoDescription(e.target.value)}
            minRows={3}
            isDisabled={isCreating}
          />

          {error && (
            <div className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-md p-3">
              {error}
            </div>
          )}

          <Button type="submit" color="primary" isLoading={isCreating}>
            作成
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}

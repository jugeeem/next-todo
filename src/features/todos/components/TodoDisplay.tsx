'use client';

import { Button, Card, CardBody, CardHeader, Chip } from '@heroui/react';
import type { Todo } from './types';

/**
 * TodoDisplayのPropsインターフェース。
 *
 * @property {Todo} todo - 表示するTodoオブジェクト
 * @property {() => void} onEdit - 編集ボタンがクリックされたときのハンドラ関数
 * @property {() => void} onDelete - 削除ボタンがクリックされたときのハンドラ関数
 */
interface TodoDisplayProps {
  todo: Todo;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * Todo詳細表示コンポーネント。
 * Todoのタイトル、説明、作成日時、更新日時を表示します。
 */
export function TodoDisplay({ todo, onEdit, onDelete }: TodoDisplayProps) {
  // 日付を日本語形式でフォーマットするユーティリティ関数
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP');
  };

  return (
    <Card className="mb-8">
      <CardHeader className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900">Todo 詳細</h2>

        {/* 完了ステータス */}
        <Chip color={todo.completed ? 'success' : 'warning'} variant="flat" size="lg">
          {todo.completed ? '完了' : '未完了'}
        </Chip>
      </CardHeader>

      <CardBody className="space-y-6">
        {/* タイトル */}
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">タイトル</h3>
          <p
            className={`text-lg ${
              todo.completed ? 'line-through text-gray-500' : 'text-gray-900'
            }`}
          >
            {todo.title}
          </p>
        </div>

        {/* 説明 */}
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">説明</h3>
          {todo.descriptions ? (
            <p className="text-gray-700 whitespace-pre-wrap">{todo.descriptions}</p>
          ) : (
            <p className="text-gray-400 italic">説明はありません</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
          {/* 作成日時 */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">作成日時</h3>
            <p className="text-sm text-gray-700">{formatDate(todo.createdAt)}</p>
          </div>

          {/* 更新日時 */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">更新日時</h3>
            <p className="text-sm text-gray-700">{formatDate(todo.updatedAt)}</p>
          </div>
        </div>

        {/* 編集・削除ボタン */}
        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            color="danger"
            onPress={onDelete}
            className="font-medium"
          >
            削除
          </Button>
          <Button
            type="button"
            color="primary"
            onPress={onEdit}
            className="font-medium"
          >
            編集
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

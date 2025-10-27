'use client';

import { Button, Card, CardBody, CardHeader } from '@heroui/react';
import Link from 'next/link';
import type { Todo } from './types';

interface TodoDisplayProps {
  todo: Todo;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * Todo表示コンポーネント
 */
export function TodoDisplay({ todo, onEdit, onDelete }: TodoDisplayProps) {
  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Todo詳細</h2>
        <div className="flex items-center gap-2">
          <Button color="primary" onPress={onEdit}>
            編集
          </Button>
          <Button color="danger" onPress={onDelete}>
            削除
          </Button>
        </div>
      </CardHeader>
      <CardBody>
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">タイトル</h3>
            <p className="text-lg text-gray-900">{todo.title}</p>
          </div>

          {todo.descriptions && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">説明</h3>
              <p className="text-gray-900 whitespace-pre-wrap">{todo.descriptions}</p>
            </div>
          )}

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">ステータス</h3>
            <span
              className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                todo.completed
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {todo.completed ? '完了' : '未完了'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-1">作成日時</h3>
              <p className="text-gray-900">
                {new Date(todo.createdAt).toLocaleString('ja-JP')}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-1">更新日時</h3>
              <p className="text-gray-900">
                {new Date(todo.updatedAt).toLocaleString('ja-JP')}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <Button as={Link} href="/todos" color="default" variant="flat">
            ← 一覧に戻る
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

'use client';

import { Card, CardBody, CardHeader } from '@heroui/react';
import { TodoItem } from './TodoItem';
import type { PaginationInfo, Todo } from './types';

interface TodoListProps {
  todos: Todo[];
  paginationInfo: PaginationInfo | null;
  onUpdate?: () => void;
  isLoading: boolean;
}

/**
 * Todoリストコンポーネント
 */
export function TodoList({
  todos,
  paginationInfo,
  onUpdate,
  isLoading,
}: TodoListProps) {
  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
        <p className="mt-2 text-gray-600">読み込み中...</p>
      </div>
    );
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <h2 className="text-xl font-bold text-gray-900">
          Todo一覧
          {paginationInfo && (
            <span className="text-sm font-normal text-gray-600 ml-2">
              （全{paginationInfo.totalItems}件）
            </span>
          )}
        </h2>
      </CardHeader>
      <CardBody>
        {todos.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Todoがありません</p>
        ) : (
          <div className="space-y-2">
            {todos.map((todo) => (
              <TodoItem key={todo.id} todo={todo} onUpdate={onUpdate} />
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

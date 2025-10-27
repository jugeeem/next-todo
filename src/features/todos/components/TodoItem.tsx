'use client';

import { Button, Checkbox } from '@heroui/react';
import Link from 'next/link';
import type { Todo } from './types';

interface TodoItemProps {
  todo: Todo;
  onDelete: (id: string) => void;
  onToggleComplete: (todo: Todo) => void;
}

/**
 * Todoアイテムコンポーネント
 */
export function TodoItem({ todo, onDelete, onToggleComplete }: TodoItemProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div className="flex items-center gap-4 flex-1">
        <Checkbox
          isSelected={todo.completed}
          onValueChange={() => onToggleComplete(todo)}
        />
        <div className="flex-1">
          <Link href={`/todos/${todo.id}`} className="block">
            <h3
              className={`font-medium ${
                todo.completed ? 'line-through text-gray-500' : 'text-gray-900'
              }`}
            >
              {todo.title}
            </h3>
            {todo.descriptions && (
              <p className="text-sm text-gray-600 mt-1">{todo.descriptions}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              作成: {new Date(todo.createdAt).toLocaleString('ja-JP')}
            </p>
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button as={Link} href={`/todos/${todo.id}`} color="primary" size="sm">
          詳細
        </Button>
        <Button color="danger" size="sm" onPress={() => onDelete(todo.id)}>
          削除
        </Button>
      </div>
    </div>
  );
}

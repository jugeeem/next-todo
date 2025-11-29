'use client';

import Link from 'next/link';
import type { Todo } from './types';

/**
 * TodoItemのPropsインターフェース。
 *
 * @property {Todo} todo - 表示するTodoアイテムのデータ
 */
interface TodoItemProps {
  todo: Todo;
}

/**
 * 個別のTodoアイテムコンポーネント。
 * 1つのTodoの情報を表示のみを担当します。
 * @param {TodoItemProps} props - コンポーネントのプロパティ
 *
 */
export function TodoItem({ todo }: TodoItemProps) {
  return (
    <Link
      key={todo.id}
      href={`/todos/${todo.id}`}
      className="block p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
    >
      <div className="flex items-center gap-3">
        {/* 完了状態のチェックボックス（読み取り専用） */}
        <input
          type="checkbox"
          checked={todo.completed}
          readOnly
          className="w-5 h-5 text-blue-500 rounded-md border-gray-300"
        />
        <div className="flex-1">
          {/* Todoタイトル */}
          <h3
            className={`font-medium ${
              todo.completed ? 'line-through text-gray-500' : 'text-gray-900'
            }`}
          >
            {todo.title}
          </h3>
          {/* Todo説明（任意） */}
          {todo.descriptions && (
            <p className="text-sm text-gray-600 mt-1">{todo.descriptions}</p>
          )}
        </div>
      </div>
    </Link>
  );
}

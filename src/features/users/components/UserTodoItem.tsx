'use client';

import type { Todo } from './types';

/**
 * UserTodoItemのPropsインターフェース。
 *
 * @interface UserTodoItemProps
 * @property {Todo} todo - 表示するTodoアイテムのデータ
 */
interface UserTodoItemProps {
  todo: Todo;
}

/**
 * 個別のユーザーTodoアイテムコンポーネント。
 * 1つのTodoの情報表示のみを担当します。
 *
 * @param {UserTodoItemProps} props - コンポーネントのプロパティ
 * @return {JSX.Element} TodoアイテムのJSX要素。
 */
export function UserTodoItem({ todo }: UserTodoItemProps) {
  return (
    <div
      key={todo.id}
      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
    >
      {/* Todoタイトル */}
      <div className="flex items-center gap-3 flex-1">
        <input
          type="checkbox"
          checked={todo.completed}
          readOnly
          className="w-5 h-5 text-blue-600 rounded cursor-default"
        />
        <div className="flex-1">
          <p
            className={`font-medium ${
              todo.completed ? 'line-through text-gray-400' : 'text-gray-900'
            }`}
          >
            {todo.title}
          </p>

          {/* Todo説明 */}
          {todo.descriptions && (
            <p className="text-sm text-gray-500 mt-1">{todo.descriptions}</p>
          )}
        </div>
      </div>
    </div>
  );
}

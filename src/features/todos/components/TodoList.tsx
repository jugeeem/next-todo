'use client';

import { TodoItem } from './TodoItem';
import type { Todo } from './types';

/**
 * TodoListのPropsインターフェース。
 *
 * @property {Todo[]} todos - 表示するTodoアイテムの配列
 * @property {boolean} isLoading - ローディング状態を示すフラグ
 * @property {(todo: Todo) => void} onToggleComplete - 完了状態を切り替えるハンドラ関数
 * @property {(todoId: number) => void} onDelete - Todoを削除するハンドラ関数
 */
interface TodoListProps {
  todos: Todo[];
  isLoading: boolean;
  onToggleComplete: (todo: Todo) => void;
  onDelete: (todoId: number) => void;
}

/**
 * Todo一覧表示コンポーネント
 * Todoのリストを表示し、ローディング状態や空の状態もハンドリングします。
 *
 * @param {TodoListProps} props - コンポーネントのプロパティ
 * @returns {JSX.Element} Todo一覧コンポーネント
 */
export function TodoList({
  todos,
  isLoading,
  onToggleComplete,
  onDelete,
}: TodoListProps) {
  // ローディング中の表示
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    );
  }

  // Todoが0件の場合の表示
  if (todos.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 text-lg">Todoがありません。</div>
    );
  }

  // Todo一覧の表示
  return (
    <div className="space-y-4">
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggleComplete={onToggleComplete}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

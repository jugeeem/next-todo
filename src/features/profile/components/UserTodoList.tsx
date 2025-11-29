'use client';

import { Card, CardBody, CardFooter, CardHeader } from '@heroui/react';
import Link from 'next/link';
import { TodoItem } from './TodoItem';
import type { Todo } from './types';

/**
 * UserTodoListのPropsインターフェース。
 *
 * @interface UserTodoListProps
 * @property {Todo[]} todos - 表示するTodoの配列
 * @property {number} [maxDisplay] - 最大表示件数（デフォルトは20件）
 */
interface UserTodoListProps {
  todos: Todo[];
  maxDisplay?: number;
}

/**
 * ユーザーのTodo一覧を表示するコンポーネント。
 *
 */
export function UserTodoList({ todos, maxDisplay = 20 }: UserTodoListProps) {
  // 表示用に最新の件数だけスライス
  const displayTodos = todos.slice(0, maxDisplay);
  // 最大表示件数を超えているかどうかの判定
  const hasMoreTodos = todos.length > maxDisplay;

  return (
    <Card className="p-8 mb-8">
      <CardHeader>
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">最近のTodo</h2>
      </CardHeader>

      {/* Todoがない場合の表示 */}
      {todos.length === 0 && (
        <CardBody>
          <p className="text-center text-gray-500 py-8">Todoがありません</p>
        </CardBody>
      )}

      {/* Todo一覧の表示 */}
      <CardBody className="space-y-4">
        {displayTodos.map((todo) => (
          <TodoItem key={todo.id} todo={todo} />
        ))}
      </CardBody>

      {/* すべてのTodoを見るリンク */}
      {hasMoreTodos && (
        <CardFooter className="text-right">
          <Link
            href="/todos"
            className="text-blue-500 hover:text-blue-600 font-medium transition-colors"
          >
            すべてのTodoを見る ({todos.length}件) →
          </Link>
        </CardFooter>
      )}
    </Card>
  );
}

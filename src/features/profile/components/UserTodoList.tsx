'use client';

import { Card, CardBody, CardFooter, CardHeader } from '@heroui/react';
import Link from 'next/link';
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

      {todos.length === 0 ? (
        // Todo がない場合
        <CardBody>
          <p className="text-center text-gray-500 py-8">Todoがありません</p>
        </CardBody>
      ) : (
        // Todo を表示
        <CardBody className="space-y-4">
          {displayTodos.map((todo) => (
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
          ))}
        </CardBody>
      )}

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

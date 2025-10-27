'use client';

import { Card, CardBody, CardHeader } from '@heroui/react';
import Link from 'next/link';
import type { Todo } from './types';

interface UserTodoListProps {
  todos: Todo[];
}

/**
 * ユーザーのTodo一覧コンポーネント
 */
export function UserTodoList({ todos }: UserTodoListProps) {
  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">最近のTodo</h2>
        <Link
          href="/todos"
          className="text-blue-500 hover:text-blue-600 font-medium text-sm"
        >
          すべて見る →
        </Link>
      </CardHeader>
      <CardBody>
        {todos.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Todoがありません</p>
        ) : (
          <div className="space-y-2">
            {todos.map((todo) => (
              <Link
                key={todo.id}
                href={`/todos/${todo.id}`}
                className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    readOnly
                    className="w-4 h-4 text-blue-500 rounded pointer-events-none"
                  />
                  <div className="flex-1">
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
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

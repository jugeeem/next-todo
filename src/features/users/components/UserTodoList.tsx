'use client';

import { Card, CardBody, CardHeader, Checkbox } from '@heroui/react';
import Link from 'next/link';
import type { Todo } from './types';

interface Props {
  todos: Todo[];
}

/**
 * ユーザーのTodo一覧コンポーネント（簡易版）
 */
export function UserTodoList({ todos }: Props) {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-bold">最近のTodo</h2>
      </CardHeader>
      <CardBody>
        {todos.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Todoがありません</p>
        ) : (
          <div className="space-y-2">
            {todos.map((todo) => (
              <div
                key={todo.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <Checkbox isSelected={todo.completed} isReadOnly />
                  <Link
                    href={`/todos/${todo.id}`}
                    className="flex-1 hover:text-blue-500"
                  >
                    <div>
                      <p
                        className={`font-medium ${todo.completed ? 'line-through text-gray-500' : ''}`}
                      >
                        {todo.title}
                      </p>
                      {todo.descriptions && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                          {todo.descriptions}
                        </p>
                      )}
                    </div>
                  </Link>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(todo.createdAt).toLocaleDateString('ja-JP')}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

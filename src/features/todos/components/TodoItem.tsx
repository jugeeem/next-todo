'use client';

import { Button, Card, CardBody, Checkbox } from '@heroui/react';
import Link from 'next/link';
import type { Todo } from './types';

/**
 * TodoItemのPropsインターフェース。
 *
 * @property {Todo} todo - 表示するTodoアイテムのデータ
 * @property {(todo: Todo) => void} onToggleCompolete - 完了状態を切り替えるハンドラ関数
 * @property {(todoId: number) => void} onDelete - Todoを削除するハンドラ関数
 */
interface TodoItemProps {
  todo: Todo;
  onToggleComplete: (todo: Todo) => void;
  onDelete: (todoId: number) => void;
}

/**
 * 個別のTodoアイテムコンポーネント。
 * 1つのTodoの情報を表示のみを担当し、完了切り替えと削除の操作を親コンポーネントに移譲します。
 * @param {TodoItemProps} props - コンポーネントのプロパティ
 *
 */
export function TodoItem({ todo, onToggleComplete, onDelete }: TodoItemProps) {
  return (
    <Card
      key={todo.id}
      className="bg-gray-50 hover:bg-gray-100 hover:border-primary transition-all"
    >
      <CardBody className="flex flex-row items-center justify-between">
        <div className="flex items-start gap-4 flex-1">
          {/* 完了チェックボックス */}
          <Checkbox
            isSelected={todo.completed}
            onValueChange={() => onToggleComplete(todo)}
            className="mt-1 h-5"
          />

          <div className="flex-1">
            {/* タイトル */}
            <Link
              href={`/todos/${todo.id}`}
              className="hover:text-blue-600 transition-colors"
            >
              <h3
                className={`font-medium text-lg ${
                  todo.completed ? 'line-through text-gray-500' : 'text-gray-900'
                }`}
              >
                {todo.title}
              </h3>
            </Link>

            {/* 説明 */}
            {todo.descriptions && (
              <p className="text-sm text-gray-600 mt-2">{todo.descriptions}</p>
            )}

            {/* 作成・更新日時 */}
            <p className="text-xs text-gray-400 mt-3">
              作成: {new Date(todo.createdAt).toLocaleString('ja-JP')}
            </p>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="flex items-center gap-3 ml-4">
          {/* 詳細ボタン */}
          <Button
            type="button"
            color="primary"
            as={Link}
            href={`/todos/${todo.id}`}
            className="font-medium"
          >
            詳細
          </Button>

          {/* 削除ボタン */}
          <Button
            type="button"
            color="danger"
            onPress={() => onDelete(todo.id)}
            className="font-medium"
          >
            削除
          </Button>
          {/* STEP3 MOD END */}
        </div>
      </CardBody>
    </Card>
  );
}

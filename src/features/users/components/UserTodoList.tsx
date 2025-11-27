'use client';

import { Button, Card, CardBody, CardFooter, CardHeader } from '@heroui/react';
import { useState } from 'react';
import type { Todo } from './types';

/**
 * UserTodoListのPropsタイプ定義
 *
 * @interface UserTodoListProps - UserTodoListコンポーネントのプロパティタイプ定義
 * @property {Todo[]} todos - 表示するTodoリスト
 * @property {number} currentUserRole - 現在のログインユーザーの権限情報
 * @property {string} currentUserId - 現在のログインユーザーのID
 * @property {string} targetUserId - 表示対象のユーザーID
 */
interface UserTodoListProps {
  todos: Todo[];
  currentUserRole: number;
  currentUserId: string;
  targetUserId: string;
}

/**
 * ユーザーのTodoリスト表示コンポーネント。
 */
export function UserTodoList({
  todos,
  currentUserRole,
  currentUserId,
  targetUserId,
}: UserTodoListProps) {
  // ステートの定義
  // Todoの表示件数
  const [displayTodoCount, setDisplayTodoCount] = useState<number>(10); // 初期表示件数10件

  // 表示するTodoリストを取得
  const displayTodos = todos.slice(0, displayTodoCount);

  /**
   * もっと見るボタンのクリックハンドラ。
   * 表示するTodoの件数を増やします。
   *
   * @return {void}
   */
  const loadMoreTodos = () => {
    setDisplayTodoCount((prevState) => prevState + 10);
  };
  /** MANAGER権限でTodoの表示権限があるかどうかを判定する変数 */
  const cannotViewTodos = currentUserRole === 2 && currentUserId !== targetUserId;

  return (
    <Card className="p-8">
      <CardHeader className="justify-between">
        <h3 className="text-2xl font-semibold text-gray-900 mb-6">最近のTodo</h3>
        {todos.length > 0 && <span>全{todos.length}件</span>}
      </CardHeader>

      {/* MANAGER権限でほかのユーザーの詳細ページを参照している場合 */}
      {cannotViewTodos ? (
        <CardBody className="text-center py-12">
          <p className="text-gray-500 text-sm">他のユーザーのTodoは閲覧できません</p>
          <p className="text-gray-400 text-xs mt-2">
            MANAGER権限では自分のTodoのみ閲覧可能です
          </p>
        </CardBody>
      ) : todos.length === 0 ? ( // Todoがない場合
        <CardBody className="text-center py-12">
          <p className="text-gray-500">Todoがありません</p>
        </CardBody>
      ) : (
        // Todoリスト表示
        <CardBody className="space-y-4">
          {displayTodos.map((todo) => (
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
          ))}
          {/* もっと見るボタン */}
          {displayTodoCount < todos.length && (
            <CardFooter className="justify-center mt-4">
              <Button
                type="button"
                onPress={loadMoreTodos}
                color="primary"
                className="font-medium"
              >
                もっと見る
              </Button>
            </CardFooter>
          )}

          {/* 全件表示完了メッセージ */}
          {displayTodoCount >= todos.length && todos.length > 10 && (
            <CardFooter className="justify-center mt-4">
              <p className="text-sm text-gray-500">すべてのTodoが表示されています</p>
            </CardFooter>
          )}
        </CardBody>
      )}
    </Card>
  );
}

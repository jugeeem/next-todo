'use client';

import { Button, CardBody, CardFooter } from '@heroui/react';
import type { Todo } from './types';
import { UserTodoItem } from './UserTodoItem';

/**
 * UserTodoListContentのPropsタイプ定義
 *
 * @interface UserTodoListContentProps - UserTodoListContentコンポーネントのプロパティタイプ定義
 * @property {Todo[]} todos - 表示するTodoリスト
 * @property {number} displayTodoCount - 現在表示しているTodoの件数
 * @property {() => void} onLoadMore - もっと見るボタンのクリックハンドラ
 */
interface UserTodoListContentProps {
  todos: Todo[];
  displayTodoCount: number;
  onLoadMoreTodos: () => void;
}

/**
 * Todoリストコンテンツ表示コンポーネント。
 * ページネーション制御を含むTodoリストの表示を担当します。
 */
export function UserTodoListContent({
  todos,
  displayTodoCount,
  onLoadMoreTodos,
}: UserTodoListContentProps) {
  // 表示するTodoリストを取得
  const displayTodos = todos.slice(0, displayTodoCount);
  // もっと見るボタンを表示するかどうかの判定
  const hasMoreTodos = displayTodoCount < todos.length;
  // 全件表示完了判定
  const isAllDisplayed = displayTodoCount >= todos.length && todos.length > 10;

  return (
    <div>
      {/* Todoリストコンテンツ */}
      <CardBody className="space-y-4">
        {displayTodos.map((todo) => (
          <UserTodoItem key={todo.id} todo={todo} />
        ))}
      </CardBody>

      {/* もっと見るボタン */}
      {hasMoreTodos && (
        <CardFooter className="justify-center mt-4">
          <Button
            type="button"
            onPress={onLoadMoreTodos}
            color="primary"
            className="font-medium"
          >
            もっと見る
          </Button>
        </CardFooter>
      )}

      {/* 全件表示完了メッセージ */}
      {isAllDisplayed && (
        <CardFooter className="justify-center mt-4">
          <p className="text-sm text-gray-500">すべてのTodoが表示されています</p>
        </CardFooter>
      )}
    </div>
  );
}

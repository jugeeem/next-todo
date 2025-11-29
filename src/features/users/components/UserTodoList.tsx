'use client';

import { Card, CardBody, CardHeader } from '@heroui/react';
import { useState } from 'react';
import type { Todo } from './types';

import { UserTodoListContents } from './UserTodoListContets';

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
  const cannotViewTodos =
    currentUserRole === 2 && currentUserId !== targetUserId;

  return (
    <Card className='p-8'>
      <CardHeader className='justify-between'>
        <h3 className='text-2xl font-semibold text-gray-900 mb-6'>
          最近のTodo
        </h3>
        {todos.length > 0 && <span>全{todos.length}件</span>}
      </CardHeader>

      {/* Todoが一件もない場合の表示 */}
      {!cannotViewTodos && todos.length === 0 && (
        <CardBody className='text-center py-12'>
          <p className='text-gray-500'>Todoがありません</p>
        </CardBody>
      )}

      {/* MANAGER権限でほかのユーザーの詳細ページを参照している場合 */}
      {cannotViewTodos && (
        <CardBody className='text-center py-12'>
          <p className='text-gray-500 text-sm'>
            他のユーザーのTodoは閲覧できません
          </p>
          <p className='text-gray-400 text-xs mt-2'>
            MANAGER権限では自分のTodoのみ閲覧可能です
          </p>
        </CardBody>
      )}

      {/* Todoリスト表示部分 */}
      {!cannotViewTodos && todos.length > 0 && (
        <UserTodoListContents
          todos={todos}
          displayTodoCount={displayTodoCount}
          onLoadMoreTodos={loadMoreTodos}
        />
      )}
    </Card>
  );
}

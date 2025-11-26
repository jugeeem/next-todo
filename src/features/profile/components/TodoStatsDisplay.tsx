'use client';

import { Card, CardBody, CardHeader } from '@heroui/react';
import type { TodoStats } from './types';

/**
 * TodoStatsDisplayのPropsインターフェース。
 * Todoの統計情報を表示するコンポーネントのプロパティを定義します。
 *
 * @interface TodoStatsDisplayProps
 * @property {TodoStats | null} stats - 表示するTodo統計情報オブジェクト
 */
interface TodoStatsDisplayProps {
  stats: TodoStats | null;
}

/**
 * Todo統計情報表示コンポーネント。
 * 総Todo数、完了Todo数、未完了Todo数を表示します。
 *
 * @param {TodoStatsDisplayProps} props - コンポーネントのプロパティ
 * @returns {JSX.Element} Todo統計情報表示コンポーネント
 */
export function TodoStatsDisplay({ stats }: TodoStatsDisplayProps) {
  // 統計情報が存在しない場合の表示(何も表示しない)
  if (!stats) {
    return null;
  }

  return (
    <Card className="shadow-md rounded-lg p-8 mb-8">
      <CardHeader>
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Todo統計</h2>
      </CardHeader>

      <CardBody className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* 総Todo数 */}
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <p className="text-sm font-medium text-blue-600 mb-1">総Todo数</p>
          <p className="text-3xl font-bold text-blue-900">{stats.totalTodos}</p>
        </div>

        {/* 完了済みTodo数 */}
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <p className="text-sm font-medium text-green-600 mb-1">完了済み</p>
          <p className="text-3xl font-bold text-green-900">{stats.completedTodos}</p>
        </div>

        {/* 未完了Todo数 */}
        <div className="bg-yellow-50 rounded-lg p-4 text-center">
          <p className="text-sm font-medium text-yellow-600 mb-1">未完了</p>
          <p className="text-3xl font-bold text-yellow-900">{stats.pendingTodos}</p>
        </div>

        {/* 完了率 */}
        <div className="bg-purple-50 rounded-lg p-4 text-center">
          <p className="text-sm font-medium text-purple-600 mb-1">完了率</p>
          <p className="text-3xl font-bold text-purple-900">
            {stats.completionRate.toFixed(1)}%
          </p>
        </div>
      </CardBody>
    </Card>
  );
}

'use client';

import { Card, CardBody, CardHeader } from '@heroui/react';
import type { TodoStats } from './types';

interface TodoStatsDisplayProps {
  stats: TodoStats | null;
}

/**
 * Todo統計表示コンポーネント
 */
export function TodoStatsDisplay({ stats }: TodoStatsDisplayProps) {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-bold text-gray-900">Todo統計</h2>
      </CardHeader>
      <CardBody>
        {stats ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">総数</p>
              <p className="text-3xl font-bold text-blue-600">{stats.totalTodos}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">完了数</p>
              <p className="text-3xl font-bold text-green-600">
                {stats.completedTodos}
              </p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">未完了数</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.pendingTodos}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">完了率</p>
              <p className="text-3xl font-bold text-purple-600">
                {stats.completionRate.toFixed(1)}%
              </p>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">統計情報を読み込めませんでした</p>
        )}
      </CardBody>
    </Card>
  );
}

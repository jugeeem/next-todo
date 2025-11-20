'use client';

import { Card, CardBody, Skeleton } from '@heroui/react';

// スケルトン表示用のIDリスト。indexをキーとして使用した場合lintエラーになるため、固定のIDを使用。
const SKELETON_IDS = ['skeleton-1', 'skeleton-2', 'skeleton-3'] as const;

/**
 * プロフィールページの読み込み中表示コンポーネント
 *
 * @returns JSX.Element - ローディングUI
 */
export default function Loading() {
  return (
    <div className="container mx-auto p-4 max-w-4xl space-y-6">
      {/* プロフィール情報カード */}
      <Card>
        <CardBody className="gap-4">
          <Skeleton className="w-48 h-8 rounded-lg" />
          <div className="space-y-3">
            <Skeleton className="w-full h-6 rounded-lg" />
            <Skeleton className="w-3/4 h-6 rounded-lg" />
          </div>
          <Skeleton className="w-32 h-10 rounded-lg" />
        </CardBody>
      </Card>

      {/* 統計情報カード */}
      <Card>
        <CardBody className="gap-3">
          <Skeleton className="w-32 h-6 rounded-lg" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="w-full h-16 rounded-lg" />
            <Skeleton className="w-full h-16 rounded-lg" />
          </div>
        </CardBody>
      </Card>

      {/* Todoリストカード */}
      <Card>
        <CardBody>
          <Skeleton className="w-32 h-6 rounded-lg mb-4" />
          <div className="space-y-3">
            {SKELETON_IDS.map((id) => (
              <Skeleton key={id} className="w-full h-16 rounded-lg" />
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

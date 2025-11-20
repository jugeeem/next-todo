'use client';
import { Card, CardBody, Skeleton } from '@heroui/react';

// スケルトン表示用のIDリスト。indexをキーとして使用した場合lintエラーになるため、固定のIDを使用。
const SKELETON_IDS = ['skeleton-1', 'skeleton-2', 'skeleton-3'] as const;

/**
 * ユーザー詳細ページのローディング表示コンポーネント
 *
 * @returns ローディング表示用のReactコンポーネント
 */
export default function Loading() {
  return (
    <div className="container mx-auto p-4 max-w-4xl">
      {/* ユーザー情報カードのスケルトン */}
      <Card className="mb-6">
        <CardBody className="gap-4">
          <Skeleton className="w-48 h-8 rounded-lg" />
          <div className="space-y-3">
            <Skeleton className="w-full h-6 rounded-lg" />
            <Skeleton className="w-3/4 h-6 rounded-lg" />
            <Skeleton className="w-1/2 h-6 rounded-lg" />
          </div>
          <div className="flex gap-2 mt-4">
            <Skeleton className="flex-1 h-10 rounded-lg" />
            <Skeleton className="flex-1 h-10 rounded-lg" />
          </div>
        </CardBody>
      </Card>

      {/* Todoリストのスケルトン */}
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

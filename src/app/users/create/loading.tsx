'use client';
import { Card, CardBody, Skeleton } from '@heroui/react';

// スケルトン表示用のIDリスト。indexをキーとして使用した場合lintエラーになるため、固定のIDを使用。
const SKELETON_IDS = [
  'skeleton-1',
  'skeleton-2',
  'skeleton-3',
  'skeleton-4',
  'skeleton-5',
] as const;

/**
 * ユーザー作成ページのローディング表示コンポーネント
 *
 * @returns ローディング表示用のReactコンポーネント
 */
export default function Loading() {
  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <Card>
        <CardBody className="gap-4">
          <Skeleton className="w-48 h-8 rounded-lg mb-4" />
          {/* フォームフィールドのスケルトン（5件） */}
          {SKELETON_IDS.map((id) => (
            <div key={id} className="space-y-2">
              <Skeleton className="w-32 h-4 rounded-lg" />
              <Skeleton className="w-full h-10 rounded-lg" />
            </div>
          ))}
          {/* ボタンのスケルトン */}
          <div className="flex gap-2 mt-4">
            <Skeleton className="flex-1 h-10 rounded-lg" />
            <Skeleton className="flex-1 h-10 rounded-lg" />
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

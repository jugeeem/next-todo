'use client';

import { Card, CardBody, Skeleton } from '@heroui/react';

export default function Loading() {
  // スケルトン表示用の一意なIDを生成
  const userSkeletonIds = Array.from({ length: 6 }, () => crypto.randomUUID());

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      {/* ヘッダースケルトン */}
      <div className="mb-6">
        <Skeleton className="w-48 h-8 rounded-lg mb-4" />
      </div>

      {/* 検索・フィルタースケルトン */}
      <Card className="mb-6">
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="w-full h-10 rounded-lg" />
            <Skeleton className="w-full h-10 rounded-lg" />
            <Skeleton className="w-full h-10 rounded-lg" />
          </div>
        </CardBody>
      </Card>

      {/* ユーザーカードスケルトン */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {userSkeletonIds.map((id) => (
          <Card key={id}>
            <CardBody className="gap-3">
              <Skeleton className="w-full h-6 rounded-lg" />
              <Skeleton className="w-3/4 h-4 rounded-lg" />
              <Skeleton className="w-1/2 h-4 rounded-lg" />
              <div className="flex gap-2 mt-2">
                <Skeleton className="flex-1 h-10 rounded-lg" />
                <Skeleton className="flex-1 h-10 rounded-lg" />
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* ページネーションスケルトン */}
      <div className="flex justify-center gap-4 mt-6">
        <Skeleton className="w-24 h-10 rounded-lg" />
        <Skeleton className="w-24 h-10 rounded-lg" />
      </div>
    </div>
  );
}

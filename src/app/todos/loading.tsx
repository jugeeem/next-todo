import { Card, CardBody, CardHeader, Skeleton } from '@heroui/react';

export default function Loading() {
  // スケルトン表示用の一意なIDを生成
  const skeletonIds = Array.from({ length: 5 }, () => crypto.randomUUID());

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      {/* ヘッダースケルトン */}
      <div className="mb-6">
        <Skeleton className="w-48 h-8 rounded-lg mb-4" />
      </div>

      {/* フィルター・ソート部分 */}
      <div className="flex gap-4 mb-6">
        <Skeleton className="w-32 h-10 rounded-lg" />
        <Skeleton className="w-32 h-10 rounded-lg" />
        <Skeleton className="w-32 h-10 rounded-lg" />
      </div>

      {/* Todo作成フォームスケルトン */}
      <Card className="mb-6">
        <CardBody className="gap-3">
          <Skeleton className="w-full h-10 rounded-lg" />
          <Skeleton className="w-full h-20 rounded-lg" />
          <Skeleton className="w-24 h-10 rounded-lg" />
        </CardBody>
      </Card>

      {/* Todoリストスケルトン */}
      <div className="space-y-4">
        {skeletonIds.map((id) => (
          <Card key={id}>
            <CardHeader>
              <Skeleton className="w-3/4 h-6 rounded-lg" />
            </CardHeader>
            <CardBody>
              <Skeleton className="w-full h-4 rounded-lg mb-2" />
              <Skeleton className="w-2/3 h-4 rounded-lg" />
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

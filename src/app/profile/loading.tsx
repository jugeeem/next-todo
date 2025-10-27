import { Card, CardBody, CardHeader, Skeleton } from '@heroui/react';

export default function Loading() {
  // スケルトン表示用の一意なIDを生成
  const todoSkeletonIds = Array.from({ length: 3 }, () => crypto.randomUUID());

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      {/* ヘッダースケルトン */}
      <div className="mb-6">
        <Skeleton className="w-48 h-8 rounded-lg mb-4" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* プロフィール編集セクション */}
        <Card>
          <CardHeader>
            <Skeleton className="w-1/2 h-6 rounded-lg" />
          </CardHeader>
          <CardBody className="gap-4">
            <Skeleton className="w-full h-10 rounded-lg" />
            <Skeleton className="w-full h-10 rounded-lg" />
            <Skeleton className="w-full h-10 rounded-lg" />
            <Skeleton className="w-24 h-10 rounded-lg" />
          </CardBody>
        </Card>

        {/* パスワード変更セクション */}
        <Card>
          <CardHeader>
            <Skeleton className="w-1/2 h-6 rounded-lg" />
          </CardHeader>
          <CardBody className="gap-4">
            <Skeleton className="w-full h-10 rounded-lg" />
            <Skeleton className="w-full h-10 rounded-lg" />
            <Skeleton className="w-full h-10 rounded-lg" />
            <Skeleton className="w-24 h-10 rounded-lg" />
          </CardBody>
        </Card>
      </div>

      {/* Todo統計 */}
      <Card className="mt-6">
        <CardHeader>
          <Skeleton className="w-1/3 h-6 rounded-lg" />
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Skeleton className="w-full h-16 rounded-lg" />
            <Skeleton className="w-full h-16 rounded-lg" />
            <Skeleton className="w-full h-16 rounded-lg" />
            <Skeleton className="w-full h-16 rounded-lg" />
          </div>
        </CardBody>
      </Card>

      {/* Todo一覧 */}
      <Card className="mt-6">
        <CardHeader>
          <Skeleton className="w-1/3 h-6 rounded-lg" />
        </CardHeader>
        <CardBody className="gap-3">
          {todoSkeletonIds.map((id) => (
            <Skeleton key={id} className="w-full h-12 rounded-lg" />
          ))}
        </CardBody>
      </Card>
    </div>
  );
}

'use client';
// サスペンスを活用したローディングUIを表示
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Link,
  Skeleton,
} from '@heroui/react';

export default function Loading() {
  return (
    <div className="bg-gray-50 min-h-screen" aria-busy="true">
      <header className="h-15 p-5 flex justify-between items-center bg-blue-500 text-white">
        <h1 className="text-xl font-bold">Todo詳細</h1>
        <div className="flex gap-2">
          <Link
            className="bg-blue-600 text-white hover:bg-blue-700 px-3 py-1 rounded transition-colors"
            href="/users/me"
          >
            プロフィール
          </Link>
          <Link
            href="/todos"
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition-colors"
          >
            Todo一覧
          </Link>
        </div>
      </header>

      <Skeleton className="max-w-[600px] mx-auto mt-5 rounded-lg">
        <Card className="max-w-[600px] mx-auto mt-5 relative bg-blue-100 p-3">
          <CardHeader className="pt-0">
            <Skeleton className="h-6 w-24 rounded">
              <h1 className="text-xl font-bold text-gray-600">Todo詳細</h1>
            </Skeleton>
          </CardHeader>
          <CardBody className="bg-white rounded-lg">
            <div className="w-full max-w-2xl mx-auto">
              <div className="space-y-3">
                <div>
                  <span className="font-medium">タイトル:</span>
                  <Skeleton className="inline-block w-48 h-4 rounded ml-2">
                    <span>サンプルタイトル</span>
                  </Skeleton>
                </div>
                <div>
                  <span className="font-medium">説明:</span>
                  <Skeleton className="inline-block w-64 h-4 rounded ml-2">
                    <span>サンプル説明文</span>
                  </Skeleton>
                </div>
                <div>
                  <span className="font-medium">ステータス:</span>{' '}
                  <Skeleton className="inline-block w-16 h-6 rounded ml-2">
                    <Chip color="success">完了</Chip>
                  </Skeleton>
                </div>
                <div>
                  <span className="font-medium">作成者:</span>{' '}
                  <Skeleton className="inline-block w-24 h-4 rounded ml-2">
                    <span>ユーザー名</span>
                  </Skeleton>
                </div>
                <div>
                  <span className="font-medium">作成日:</span>{' '}
                  <Skeleton className="inline-block w-28 h-4 rounded ml-2">
                    <span>2024/01/01</span>
                  </Skeleton>
                </div>
                <div>
                  <span className="font-medium">更新日:</span>{' '}
                  <Skeleton className="inline-block w-28 h-4 rounded ml-2">
                    <span>2024/01/01</span>
                  </Skeleton>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Skeleton className="rounded">
                  <Button color="primary" className="px-4 py-2" isDisabled>
                    編集
                  </Button>
                </Skeleton>
                <Skeleton className="rounded">
                  <Button color="danger" className="px-4 py-2" isDisabled>
                    削除
                  </Button>
                </Skeleton>
              </div>
            </div>
          </CardBody>
        </Card>
      </Skeleton>

      <span className="sr-only">Todo詳細を読み込んでいます</span>
    </div>
  );
}

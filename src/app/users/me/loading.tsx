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
        <h1 className="text-xl font-bold">プロフィール</h1>
        <div className="flex gap-2">
          <Link
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition-colors"
            href="/todos"
          >
            Todo一覧
          </Link>
        </div>
      </header>

      <Skeleton className="max-w-[600px] mx-auto mt-5 rounded-lg">
        <Card className="max-w-[600px] mx-auto mt-5 relative bg-blue-100 p-3">
          <CardHeader className="pt-0">
            <Skeleton className="h-6 w-48 rounded">
              <h2 className="text-xl font-bold text-gray-600">ユーザープロフィール</h2>
            </Skeleton>
          </CardHeader>
          <CardBody className="bg-white rounded-lg">
            <div className="h-fit w-full mb-2 text-md font-bold text-gray-800">
              <p className="text-xs">ユーザー名</p>
              <Skeleton className="h-6 w-32 rounded mt-1">
                <p className="text-lg">admin</p>
              </Skeleton>
            </div>
            <div className="h-fit w-full mb-2 text-md font-bold text-gray-800">
              <p className="text-xs">名前</p>
              <Skeleton className="h-6 w-40 rounded mt-1">
                <p className="text-lg">山田 太郎</p>
              </Skeleton>
            </div>
            <div className="flex gap-4 mb-4">
              <div className="w-fit text-center">
                <span className="block text-gray-700 font-semibold text-xs mb-1">
                  役割
                </span>
                <Skeleton className="rounded">
                  <Chip className="bg-red-100 text-red-800">管理者</Chip>
                </Skeleton>
              </div>
              <div className="w-fit text-center">
                <span className="block text-gray-700 font-semibold text-xs mb-1">
                  作成日
                </span>
                <Skeleton className="h-5 w-24 rounded">
                  <p className="text-gray-600 font-bold">2024/01/01</p>
                </Skeleton>
              </div>
              <div className="w-fit text-center">
                <span className="block text-gray-700 font-semibold text-xs mb-1">
                  更新日
                </span>
                <Skeleton className="h-5 w-24 rounded">
                  <p className="text-gray-600 font-bold">2024/01/01</p>
                </Skeleton>
              </div>
            </div>
            <div className="flex gap-2">
              <Skeleton className="rounded">
                <Button color="primary" className="py-2 px-4" isDisabled>
                  プロフィール編集
                </Button>
              </Skeleton>
              <Skeleton className="rounded">
                <Button color="secondary" className="py-2 px-4" isDisabled>
                  パスワード変更
                </Button>
              </Skeleton>
            </div>
          </CardBody>
        </Card>
      </Skeleton>

      <span className="sr-only">プロフィールを読み込んでいます</span>
    </div>
  );
}

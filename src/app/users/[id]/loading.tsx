'use client';
// ユーザー詳細ページ専用ローディングスケルトン（UserDetailの見た目を忠実に再現・アバター画像なし）
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Chip,
  Link,
  Skeleton,
} from '@heroui/react';

export default function Loading() {
  // 固定のダミーID配列
  const skeletonIds = ['a', 'b', 'c'];

  return (
    <div className="bg-gray-50 min-h-screen" aria-busy="true">
      <header className="h-15 p-5 flex justify-between items-center bg-blue-500 text-white">
        <h1 className="text-xl font-bold">ユーザー詳細</h1>
        <span className="text-sm"></span>
        <div className="flex gap-2">
          <Link
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition-colors"
            href="/users/me"
          >
            プロフィール
          </Link>
          <Link
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition-colors"
            href="/todos"
          >
            Todo一覧
          </Link>
          <Link
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition-colors"
            href="/users"
          >
            一覧へ戻る
          </Link>
        </div>
      </header>

      {/* ユーザー情報カードのスケルトン */}
      <Skeleton className="max-w-[600px] mx-auto mt-5 rounded-lg">
        <Card className="max-w-[600px] mx-auto mt-5 relative bg-blue-100 p-3">
          <CardHeader className="pt-0">
            <Skeleton className="h-6 w-32 rounded">
              <h1 className="text-gray-700 font-bold text-lg">ユーザー情報</h1>
            </Skeleton>
          </CardHeader>
          <CardBody className="bg-white rounded-lg">
            {/* ユーザー名 */}
            <div className="h-fit w-full mb-2 text-md font-bold text-gray-800">
              <p className="text-xs">ユーザー名</p>
              <Skeleton className="h-6 w-32 rounded mt-1">
                <p className="text-lg">-</p>
              </Skeleton>
            </div>
            {/* 名前 */}
            <div className="h-fit w-full mb-2 text-md font-bold text-gray-800">
              <p className="text-xs">名前</p>
              <Skeleton className="h-6 w-40 rounded mt-1">
                <p className="text-lg">- -</p>
              </Skeleton>
            </div>
            {/* 統計情報 */}
            <div className="flex gap-4 mb-4">
              <div className="w-fit text-center">
                <span className="block text-gray-700 font-semibold text-xs mb-1">
                  役割
                </span>
                <Skeleton className="rounded-lg">
                  <Chip className="bg-red-100 text-red-800">管理者</Chip>
                </Skeleton>
              </div>
              <div className="w-fit text-center">
                <span className="block text-gray-700 font-semibold text-xs mb-1">
                  作成日
                </span>
                <Skeleton className="h-5 w-20 rounded">
                  <p className="text-gray-600 font-bold">2024/01/01</p>
                </Skeleton>
              </div>
              <div className="w-fit text-center">
                <span className="block text-gray-700 font-semibold text-xs mb-1">
                  更新日
                </span>
                <Skeleton className="h-5 w-20 rounded">
                  <p className="text-gray-600 font-bold">2024/01/01</p>
                </Skeleton>
              </div>
            </div>
            {/* アクションボタン */}
            <div className="flex gap-2">
              <Skeleton className="rounded">
                <Button color="primary" isDisabled>
                  編集
                </Button>
              </Skeleton>
              <Skeleton className="rounded">
                <Button color="danger" isDisabled>
                  アカウント削除
                </Button>
              </Skeleton>
            </div>
          </CardBody>
        </Card>
      </Skeleton>

      {/* Todo統計カードのスケルトン */}
      <Skeleton className="max-w-[600px] mx-auto mt-5 rounded-lg">
        <Card className="max-w-[600px] mx-auto mt-5 relative bg-blue-100 p-3">
          <CardHeader className="pt-0">
            <Skeleton className="h-6 w-24 rounded">
              <h1 className="text-gray-700 font-bold text-lg">Todo統計</h1>
            </Skeleton>
          </CardHeader>
          <CardBody className="bg-white rounded-lg">
            <div className="flex gap-6 mb-4">
              <Skeleton className="h-4 w-16 rounded">
                <span className="text-gray-700">合計: 5件</span>
              </Skeleton>
              <Skeleton className="h-4 w-16 rounded">
                <span className="text-gray-700">完了: 3件</span>
              </Skeleton>
              <Skeleton className="h-4 w-20 rounded">
                <span className="text-gray-700">進捗率: 60%</span>
              </Skeleton>
            </div>
            {/* タスク一覧 */}
            <div>
              <Skeleton className="h-5 w-24 rounded mb-2">
                <h3 className="text-md font-semibold mb-2">タスク一覧</h3>
              </Skeleton>
              <div>
                {skeletonIds.map((id) => (
                  <Skeleton key={id} className="rounded-lg mb-5">
                    <Card className="max-w-full mx-auto mb-5 p-2 z-0 relative">
                      <CardHeader className="box-shadow rounded-lg justify-between items-center bg-blue-500 text-white p-2">
                        <h3 className="text-lg font-bold ml-1">サンプルタスク</h3>
                      </CardHeader>
                      <CardBody className="min-h-[50px]">
                        <p>タスクの説明がここに表示されます</p>
                      </CardBody>
                      <CardFooter className="text-sm text-gray-500 my-2 gap-2 flex justify-between items-end py-0">
                        <div>
                          <p>作成日: 2024/01/01</p>
                          <p>更新日: 2024/01/01</p>
                        </div>
                      </CardFooter>
                    </Card>
                  </Skeleton>
                ))}
              </div>
            </div>
          </CardBody>
        </Card>
      </Skeleton>

      <span className="sr-only">ユーザー詳細を読み込んでいます</span>
    </div>
  );
}

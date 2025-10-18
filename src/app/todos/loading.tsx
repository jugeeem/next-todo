'use client';
// サスペンスを活用したローディングUIを表示
import { Card, CardBody, CardFooter, CardHeader, Link, Skeleton } from '@heroui/react';

export default function Loading() {
  // 固定のダミーID配列
  const skeletonIds = ['a', 'b', 'c', 'd'];

  return (
    <div className="bg-gray-50 min-h-screen" aria-busy="true">
      <header className="h-15 p-5 flex justify-between items-center bg-blue-500 text-white">
        <h1 className="text-xl font-bold">Todoアプリ</h1>
        <h2>Hello! ユーザー名!</h2>
        <div className="flex gap-2">
          <Link
            className="bg-blue-600 text-white hover:bg-blue-700 px-3 py-1 rounded transition-colors"
            href="#"
          >
            プロフィール
          </Link>
          <button
            type="button"
            className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded transition-colors"
            disabled
          >
            ログアウト
          </button>
        </div>
      </header>

      <main className="p-4 flex flex-col items-center">
        <Card shadow="sm" className="w-fit p-5 text-center">
          <h2 className="text-xl font-bold">Todo一覧</h2>
          <Skeleton className="h-7 w-10 rounded mx-auto">
            <h2 className="text-xl font-bold">0件</h2>
          </Skeleton>
        </Card>

        <Skeleton className="font-bold py-1 px-4 my-4 rounded-full sticky top-5 z-1 border-2 border-white">
          <button
            type="button"
            className="bg-blue-500 text-white hover:bg-blue-600 px-3 py-1 rounded-full transition-colors"
            disabled
          >
            ＋タスクを作成
          </button>
        </Skeleton>

        <div className="w-full max-w-2xl mx-auto">
          {skeletonIds.map((id) => (
            <Skeleton key={id} className="rounded-lg mb-5">
              <Card className="max-w-[600px] mx-auto mb-5 p-2 z-0 relative">
                <CardHeader className="box-shadow rounded-lg justify-between items-center bg-blue-500 text-white p-2">
                  <h3 className="text-lg font-bold ml-1">タスクタイトル</h3>
                </CardHeader>
                <CardBody className="min-h-[50px]">
                  <p>タスクの説明がここに表示されます</p>
                </CardBody>
                <CardFooter className="text-sm text-gray-500 my-2 gap-2 flex justify-between items-end py-0">
                  <div>
                    <p>作成日: 2024/01/01</p>
                    <p>更新日: 2024/01/01</p>
                  </div>
                  <Link
                    className="bg-blue-600 font-bold text-white py-1 px-5 rounded-full"
                    href="#"
                  >
                    詳細
                  </Link>
                </CardFooter>
              </Card>
            </Skeleton>
          ))}
        </div>
      </main>

      <span className="sr-only">Todo一覧を読み込んでいます</span>
    </div>
  );
}

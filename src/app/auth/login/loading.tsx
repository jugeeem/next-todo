'use client';
// サスペンスを活用したローディングUIを表示
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Link,
  Skeleton,
} from '@heroui/react';

export default function Loading() {
  return (
    <div className="bg-gray-50 h-screen">
      <header className="h-15 p-5 flex justify-between items-center bg-blue-500 text-white">
        <h1 className="text-xl font-bold">Todoアプリ</h1>
      </header>
      <div className="flex items-center justify-center mt-20">
        <Card className="w-96 p-4 bg-white text-center relative">
          <CardHeader className="w-fit mx-auto">
            <div className="text-2xl font-bold">Welcome!</div>
          </CardHeader>
          <CardBody>
            <div className="mx-7">
              {/* ユーザー名入力スケルトン */}
              <div className="mb-4">
                <Skeleton className="rounded-lg">
                  <Input type="text" label="ユーザ名" isDisabled />
                </Skeleton>
              </div>
              {/* パスワード入力スケルトン */}
              <div className="mb-4">
                <Skeleton className="rounded-lg">
                  <Input type="password" label="パスワード" isDisabled />
                </Skeleton>
              </div>
              {/* ログインボタンスケルトン */}
              <div className="mb-4">
                <Skeleton className="w-full rounded-lg">
                  <Button
                    type="submit"
                    color="primary"
                    className="w-full py-1 px-4"
                    isDisabled
                  >
                    ログイン
                  </Button>
                </Skeleton>
              </div>
            </div>
          </CardBody>
          {/* 新規登録リンクスケルトン */}
          <div>
            <Skeleton className="w-24 h-8 rounded-lg mx-auto">
              <Link className="bg-blue-500 text-white py-1 px-4 rounded-lg" href="#">
                新規登録
              </Link>
            </Skeleton>
          </div>
        </Card>
      </div>
    </div>
  );
}

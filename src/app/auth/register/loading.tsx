'use client';
// サスペンスを活用したローディングUIを表示
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Link,
  Select,
  SelectItem,
  Skeleton,
} from '@heroui/react';

export default function Loading() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <header className="h-15 p-5 flex justify-between items-center bg-blue-500 text-white">
        <h1 className="text-xl font-bold">ユーザー登録</h1>
        <Link
          href="/auth/login"
          className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded transition-colors text-white"
          isDisabled
        >
          戻る
        </Link>
      </header>

      <Card className="max-w-[500px] mx-auto mt-10 p-3">
        <CardHeader>
          <h1 className="text-2xl font-bold">ユーザー登録</h1>
        </CardHeader>
        <CardBody>
          <form aria-busy="true" aria-label="ユーザー登録フォーム">
            {/* ユーザー名 */}
            <div className="mb-4">
              <Skeleton className="rounded-lg">
                <Input label="ユーザ名" placeholder="ユーザー名を入力" isDisabled />
              </Skeleton>
            </div>

            {/* 名・姓 */}
            <div className="mb-4 md:flex md:gap-2">
              <div className="w-full mb-4">
                <Skeleton className="rounded-lg">
                  <Input label="名(任意)" placeholder="名を入力" isDisabled />
                </Skeleton>
              </div>
              <div className="w-full">
                <Skeleton className="rounded-lg">
                  <Input label="性(任意)" placeholder="性を入力" isDisabled />
                </Skeleton>
              </div>
            </div>

            {/* 名のよみ・姓のよみ */}
            <div className="mb-4 md:flex md:gap-2">
              <div className="w-full mb-4">
                <Skeleton className="rounded-lg">
                  <Input
                    label="名のよみ仮名(任意)"
                    placeholder="名のよみ仮名を入力"
                    isDisabled
                  />
                </Skeleton>
              </div>
              <div className="w-full">
                <Skeleton className="rounded-lg">
                  <Input
                    label="性のよみ仮名(任意)"
                    placeholder="性のよみ仮名を入力"
                    isDisabled
                  />
                </Skeleton>
              </div>
            </div>

            {/* 権限 */}
            <div className="mb-4">
              <Skeleton className="rounded-lg">
                <Select aria-label="ユーザーロール選択" isDisabled>
                  <SelectItem key="1">管理者</SelectItem>
                  <SelectItem key="2">マネージャー</SelectItem>
                  <SelectItem key="4">ユーザー</SelectItem>
                  <SelectItem key="8">ゲスト</SelectItem>
                </Select>
              </Skeleton>
            </div>

            {/* パスワード */}
            <div className="mb-4">
              <div className="relative">
                <Skeleton className="rounded-lg">
                  <Input
                    type="password"
                    label="パスワード"
                    placeholder="パスワードを入力"
                    className="my-5"
                    isDisabled
                  />
                </Skeleton>
                <Skeleton className="absolute right-2 top-2 w-8 h-8 rounded">
                  <Button className="text-gray-500" isDisabled>
                    〇
                  </Button>
                </Skeleton>
              </div>
            </div>

            {/* パスワード確認 */}
            <div className="mb-4">
              <div className="relative">
                <Skeleton className="rounded-lg">
                  <Input
                    type="password"
                    label="確認用パスワード"
                    placeholder="パスワードを再入力"
                    className="my-5"
                    isDisabled
                  />
                </Skeleton>
                <Skeleton className="absolute right-2 top-2 w-8 h-8 rounded">
                  <Button className="text-gray-500" isDisabled>
                    〇
                  </Button>
                </Skeleton>
              </div>
            </div>

            {/* 登録ボタン */}
            <Skeleton className="w-full rounded-lg">
              <Button type="submit" color="primary" className="w-full py-2" isDisabled>
                登録
              </Button>
            </Skeleton>
          </form>
        </CardBody>
      </Card>

      <div className="text-center my-4">
        <Skeleton className="w-64 h-6 rounded mx-auto">
          <Link href="/auth/login" className="text-blue-500 hover:underline">
            既にアカウントをお持ちの方はこちら
          </Link>
        </Skeleton>
      </div>
    </div>
  );
}

'use client';
// サスペンスを活用したローディングUIを表示
import {
  Button,
  Card,
  CardBody,
  Chip,
  Input,
  Link,
  Select,
  SelectItem,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react';

export default function Loading() {
  // 固定のダミーID配列
  const skeletonIds = ['a', 'b', 'c'];

  return (
    <div className="bg-gray-50 min-h-screen" aria-busy="true">
      <header className="h-15 p-5 flex justify-between items-center bg-blue-500 text-white">
        <h1 className="text-xl font-bold">ユーザーリスト</h1>
        <h2>Hello!</h2>
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
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition-colors"
            isDisabled
          >
            ログアウト
          </Button>
        </div>
      </header>

      <main className="p-4">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end">
            <div className="flex-1 w-full">
              <label
                htmlFor="searchInput"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                ユーザー検索
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <Input
                  type="text"
                  placeholder="ユーザー名、名前、フリガナで検索"
                  id="searchInput"
                  className="w-full pl-10 pr-4 py-2.5"
                  isDisabled
                />
              </div>
            </div>

            <div className="w-full lg:w-48">
              <label
                htmlFor="roleFilter"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                役割フィルター
              </label>
              <Select id="role" name="role" aria-label="役割を選択" isDisabled>
                <SelectItem key={0}>すべての役割</SelectItem>
                <SelectItem key={1}>管理者</SelectItem>
                <SelectItem key={2}>マネージャー</SelectItem>
                <SelectItem key={4}>ユーザー</SelectItem>
                <SelectItem key={8}>ゲスト</SelectItem>
              </Select>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5">
              <div className="text-sm text-blue-700">
                <span className="font-medium">表示中:</span>
                <span className="ml-1 font-bold">0</span>
                <span className="text-gray-600 ml-1">/ 0</span>
              </div>
            </div>
          </div>
        </div>

        {/* ユーザーテーブルのスケルトン */}
        <Skeleton className="rounded-lg">
          <Card className="w-full shadow-md">
            <CardBody className="p-0">
              <Table aria-label="ユーザーリスト" className="min-w-full" removeWrapper>
                <TableHeader>
                  <TableColumn className="bg-gray-50 text-left font-semibold text-gray-700 px-4 py-3">
                    ユーザー名
                  </TableColumn>
                  <TableColumn className="bg-gray-50 text-left font-semibold text-gray-700 px-4 py-3">
                    名前
                  </TableColumn>
                  <TableColumn className="bg-gray-50 text-center font-semibold text-gray-700 px-4 py-3">
                    役割
                  </TableColumn>
                  <TableColumn className="bg-gray-50 text-center font-semibold text-gray-700 px-4 py-3">
                    作成日
                  </TableColumn>
                  <TableColumn className="bg-gray-50 text-center font-semibold text-gray-700 px-4 py-3">
                    更新日
                  </TableColumn>
                  <TableColumn className="bg-gray-50 text-center font-semibold text-gray-700 px-4 py-3">
                    操作
                  </TableColumn>
                </TableHeader>
                <TableBody emptyContent="ユーザーが見つかりません">
                  {skeletonIds.map((id) => (
                    <TableRow key={id} className="hover:bg-gray-50 transition-colors">
                      <TableCell className="px-4 py-3">
                        <div className="text-lg font-semibold">admin</div>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span>山田</span>
                          <span>太郎</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-center">
                        <Chip className="bg-red-100 text-red-800">管理者</Chip>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-center">
                        <div className="text-sm text-gray-600">2024/01/01</div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-center">
                        <div className="text-sm text-gray-600">2024/01/01</div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-center">
                        <Button
                          color="primary"
                          size="sm"
                          className="px-4 py-2"
                          isDisabled
                        >
                          詳細
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardBody>
          </Card>
        </Skeleton>

        {/* ページネーションのスケルトン */}
        <Skeleton className="rounded-lg mt-8">
          <div className="flex justify-center items-center mt-8 space-x-4">
            <button
              type="button"
              className="flex items-center px-4 py-2 rounded-lg font-medium bg-gray-200 text-gray-400 cursor-not-allowed"
              disabled
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              前のページ
            </button>

            <div className="flex items-center space-x-4 bg-white px-4 py-2 rounded-lg shadow-sm border">
              <span className="text-sm text-gray-600">ページ</span>
              <span className="font-bold text-blue-600 text-lg">1</span>
              <span className="text-gray-400">/</span>
              <span className="font-semibold text-gray-700">1</span>
            </div>

            <button
              type="button"
              className="flex items-center px-4 py-2 rounded-lg font-medium bg-gray-200 text-gray-400 cursor-not-allowed"
              disabled
            >
              次のページ
              <svg
                className="w-4 h-4 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </Skeleton>
      </main>

      <span className="sr-only">ユーザーリストを読み込んでいます</span>
    </div>
  );
}

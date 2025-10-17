'use client';

import { Card, CardBody, CardHeader, Link } from '@heroui/react';

export default function ForbiddenPage() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <header className="flex justify-between items-center p-4 bg-blue-500 text-white">
        <h1 className="text-xl font-bold">ユーザー一覧</h1>
      </header>

      <main className="p-6 flex justify-center">
        <Card className="w-full max-w-2xl mt-6 shadow-lg">
          <CardHeader className="pb-2 pt-6 px-6 flex flex-col items-center">
            <h2 className="text-2xl font-bold text-red-500 mb-4">403 - Forbidden</h2>
          </CardHeader>
          <CardBody className="px-6 pb-6 flex flex-col items-center">
            <p className="mb-6 text-gray-700 text-center">アクセス権限がありません。</p>
            <Link
              className="bg-blue-600 text-white hover:bg-blue-700 px-3 py-1 rounded transition-colors"
              href="/todos"
            >
              ホームに戻る
            </Link>
          </CardBody>
        </Card>
      </main>
    </div>
  );
}

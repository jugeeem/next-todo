'use client';

import { Button, Card, CardBody, CardHeader } from '@heroui/react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { generatePageMetadata } from '@/lib/metadata';

export const metadata: Metadata = generatePageMetadata({
  title: 'User Not Found',
  url: 'users/not-found',
});

export default function NotFound() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <header className="flex justify-between items-center p-4 bg-blue-500 text-white">
        <h1 className="text-xl font-bold">User詳細</h1>
        <span className="text-sm">ユーザーが見つかりません</span>
        <Button
          as={Link}
          href="/users"
          color="primary"
          variant="solid"
          className="bg-blue-600 hover:bg-blue-700 px-3 py-1"
        >
          一覧へ戻る
        </Button>
      </header>

      <main className="p-6 flex justify-center">
        <Card className="w-full max-w-2xl mt-6 shadow-lg">
          <CardHeader className="pb-2 pt-6 px-6 flex flex-col items-center">
            <h2 className="text-2xl font-bold text-red-500 mb-4">404 - Not Found</h2>
          </CardHeader>
          <CardBody className="px-6 pb-6 flex flex-col items-center">
            <p className="mb-6 text-gray-700 text-center">
              指定されたユーザーが見つかりませんでした。
            </p>
            <Button
              as={Link}
              href="/"
              color="primary"
              size="lg"
              className="bg-blue-500 hover:bg-blue-600"
            >
              ホームに戻る
            </Button>
          </CardBody>
        </Card>
      </main>
    </div>
  );
}

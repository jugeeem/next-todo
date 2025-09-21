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
        <Link
          href="/users"
          className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded transition-colors"
        >
          一覧へ戻る
        </Link>
      </header>
      <main className="p-6 w-full max-w-2xl bg-white rounded-lg shadow-md mt-6 mx-auto flex flex-col items-center">
        <h2 className="text-2xl font-bold text-red-500 mb-4">404 - Not Found</h2>
        <p className="mb-4 text-gray-700">指定されたユーザーが見つかりませんでした。</p>
        <Link
          href="/"
          className="bg-blue-500 text-white py-2 px-6 rounded-full hover:bg-blue-600 transition-colors"
        >
          ホームに戻る
        </Link>
      </main>
    </div>
  );
}

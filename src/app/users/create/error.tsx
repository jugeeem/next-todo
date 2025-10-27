'use client';

import { Button, Card, CardBody, CardFooter, CardHeader } from '@heroui/react';
import Link from 'next/link';

export default function CreateUserError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="flex flex-col items-start gap-1">
          <h2 className="text-2xl font-bold text-danger">エラーが発生しました</h2>
          {error.digest && (
            <p className="text-small text-default-500">エラーID: {error.digest}</p>
          )}
        </CardHeader>
        <CardBody>
          <p className="text-default-700 mb-4">
            ユーザー作成ページの読み込み中にエラーが発生しました。
          </p>
          <div className="bg-danger-50 border-l-4 border-danger p-3 rounded">
            <p className="text-small text-danger-800">
              {error.message || 'ページの読み込み中にエラーが発生しました。'}
            </p>
          </div>
        </CardBody>
        <CardFooter className="flex flex-col gap-2">
          <Button color="primary" onPress={reset} className="w-full">
            再試行
          </Button>
          <Button
            as={Link}
            href="/users"
            color="default"
            variant="flat"
            className="w-full"
          >
            ユーザー一覧に戻る
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

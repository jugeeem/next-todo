'use client';

import { Button, Card, CardBody, CardFooter, CardHeader } from '@heroui/react';
import { useEffect } from 'react';

export default function ProfileError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // エラーログをコンソールに出力（本番環境では外部ログサービスに送信）
    console.error('Profile page error:', error);
  }, [error]);

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
          <p className="text-default-700 mb-2">
            プロフィール情報の読み込み中にエラーが発生しました。
          </p>
          <div className="bg-danger-50 border-l-4 border-danger p-3 rounded">
            <p className="text-small text-danger-800">
              {error.message || 'プロフィール情報の読み込み中にエラーが発生しました。'}
            </p>
          </div>
        </CardBody>
        <CardFooter className="gap-2">
          <Button
            color="default"
            variant="flat"
            onPress={() => {
              window.location.href = '/todos';
            }}
            className="flex-1"
          >
            Todo一覧に戻る
          </Button>
          <Button color="primary" onPress={reset} className="flex-1">
            再試行
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

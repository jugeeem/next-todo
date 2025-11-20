'use client';

import { Button, Card, CardBody, CardFooter, CardHeader } from '@heroui/react';
import { useEffect } from 'react';

/**
 * ユーザー一覧ページのエラー表示コンポーネント
 *
 * @param error 発生したエラーオブジェクト
 * @param reset リセット関数
 * @returns エラー表示用のReactコンポーネント
 */
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('ユーザー一覧ページエラー:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="flex flex-col items-start gap-1">
          <h2 className="text-2xl font-bold text-danger">
            ユーザー一覧の読み込みエラー
          </h2>
          {error.digest && (
            <p className="text-small text-default-500">エラーID: {error.digest}</p>
          )}
        </CardHeader>
        <CardBody>
          <p className="text-default-700 mb-2">
            ユーザーの一覧を取得できませんでした。
          </p>
          <div className="bg-danger-50 border-l-4 border-danger p-3 rounded">
            <p className="text-small text-danger-800">{error.message}</p>
          </div>
        </CardBody>
        <CardFooter className="gap-2">
          <Button
            color="default"
            variant="flat"
            onPress={() => {
              window.location.href = '/';
            }}
            className="flex-1"
          >
            ホームに戻る
          </Button>
          <Button color="primary" onPress={reset} className="flex-1">
            再試行
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

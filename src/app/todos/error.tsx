'use client';

import { Card, CardHeader, CardBody, CardFooter, Button } from '@heroui/react';
import { useEffect } from 'react';

/**
 * Todo一覧ページのエラー表示コンポーネント。
 * エラー内容をユーザーに分かりやすく伝え、再試行やホームへの遷移を促します。
 *
 * @param error - 発生したエラーオブジェクト。
 * @param reset - エラーからのリセット関数。
 * @return エラー表示用のReactコンポーネント。
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // エラーログをコンソールに出力（本番環境では外部ログサービスに送信）
    console.error('Todo一覧ページエラー:', error);
  }, [error]);

  return (
    <div className='min-h-screen flex items-center justify-center p-4'>
      <Card className='max-w-md w-full'>
        <CardHeader className='flex flex-col items-start gap-1'>
          <h2 className='text-2xl font-bold text-danger'>
            Todo一覧の読み込みエラー
          </h2>
          {error.digest && (
            <p className='text-small text-default-500'>
              エラーID: {error.digest}
            </p>
          )}
        </CardHeader>
        <CardBody>
          <p className='text-default-700 mb-2'>
            Todoの一覧を取得できませんでした。
          </p>
          <div className='bg-danger-50 border-l-4 border-danger p-3 rounded'>
            <p className='text-small text-danger-800'>{error.message}</p>
          </div>
        </CardBody>
        <CardFooter className='gap-2'>
          <Button color='primary' onPress={reset} className='flex-1'>
            再試行
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

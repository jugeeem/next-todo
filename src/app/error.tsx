'use client';

import { Card, CardHeader, CardBody, CardFooter, Button } from '@heroui/react';
import { useEffect } from 'react';

/**
 * エラー表示コンポーネント
 * @param error エラーオブジェクト
 * @param reset リセット関数
 * @returns JSX.Element
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // グローバルエラーログ
    console.error('アプリケーションエラー:', error);
  }, [error]);

  return (
    <div className='min-h-screen flex items-center justify-center p-4'>
      <Card className='max-w-md w-full'>
        <CardHeader className='flex flex-col items-start gap-1'>
          <h2 className='text-2xl font-bold text-danger'>
            アプリケーションエラー
          </h2>
          {error.digest && (
            <p className='text-small text-default-500'>
              エラーID: {error.digest}
            </p>
          )}
        </CardHeader>
        <CardBody>
          <p className='text-default-700 mb-2'>
            予期しないエラーが発生しました。
          </p>
          <div className='bg-danger-50 border-l-4 border-danger p-3 rounded'>
            <p className='text-small text-danger-800'>{error.message}</p>
          </div>
          <p className='text-small text-default-500 mt-3'>
            問題が解決しない場合は、ブラウザをリフレッシュしてください。
          </p>
        </CardBody>
        <CardFooter className='gap-2'>
          <Button
            color='default'
            variant='flat'
            onPress={() => (window.location.href = '/')}
            className='flex-1'
          >
            ホームに戻る
          </Button>
          <Button color='primary' onPress={reset} className='flex-1'>
            再試行
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

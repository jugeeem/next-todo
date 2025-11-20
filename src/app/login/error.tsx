'use client';

import { Card, CardHeader, CardBody, CardFooter, Button } from '@heroui/react';
import Link from 'next/link';

/**
 * ログインページのエラー表示コンポーネント
 * @param error - 発生したエラーオブジェクト
 * @param reset - エラー状態をリセットする関数
 * @returns JSX.Element - エラー表示UI
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className='min-h-screen flex items-center justify-center p-4'>
      <Card className='max-w-md w-full'>
        <CardHeader className='flex flex-col items-start gap-1'>
          <h2 className='text-2xl font-bold text-danger'>
            ログインページのエラー
          </h2>
          {error.digest && (
            <p className='text-small text-default-500'>
              エラーID: {error.digest}
            </p>
          )}
        </CardHeader>
        <CardBody>
          <p className='text-default-700 mb-2'>
            ログインページの読み込みに失敗しました。
          </p>
          <div className='bg-danger-50 border-l-4 border-danger p-3 rounded'>
            <p className='text-small text-danger-800'>{error.message}</p>
          </div>
        </CardBody>
        <CardFooter className='gap-2'>
          <Button color='primary' onPress={reset} className='flex-1'>
            再試行
          </Button>
          <Button
            as={Link}
            href='/register'
            color='default'
            variant='flat'
            className='flex-1'
          >
            登録ページへ
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

'use client';
import { Card, CardBody, Skeleton } from '@heroui/react';

/**
 * ユーザー作成ページの読み込み中表示コンポーネント
 *
 * @return 読み込み中表示用のReactコンポーネント
 */
export default function Loading() {
  return (
    <div className='container mx-auto p-4 max-w-2xl'>
      <Card>
        <CardBody className='gap-4'>
          <Skeleton className='w-48 h-8 rounded-lg mb-4' />
          {/* フォームフィールドのスケルトン（5件） */}
          {[...Array(5)].map((_, index) => (
            <div key={index} className='space-y-2'>
              <Skeleton className='w-32 h-4 rounded-lg' />
              <Skeleton className='w-full h-10 rounded-lg' />
            </div>
          ))}
          {/* ボタンのスケルトン */}
          <div className='flex gap-2 mt-4'>
            <Skeleton className='flex-1 h-10 rounded-lg' />
            <Skeleton className='flex-1 h-10 rounded-lg' />
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

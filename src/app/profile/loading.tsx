'use client';

import { Card, CardBody, Skeleton } from '@heroui/react';

/**
 * プロフィールページの読み込み中表示コンポーネント
 *
 * @returns JSX.Element - ローディングUI
 */
export default function Loading() {
  return (
    <div className='container mx-auto p-4 max-w-4xl space-y-6'>
      {/* プロフィール情報カード */}
      <Card>
        <CardBody className='gap-4'>
          <Skeleton className='w-48 h-8 rounded-lg' />
          <div className='space-y-3'>
            <Skeleton className='w-full h-6 rounded-lg' />
            <Skeleton className='w-3/4 h-6 rounded-lg' />
          </div>
          <Skeleton className='w-32 h-10 rounded-lg' />
        </CardBody>
      </Card>

      {/* 統計情報カード */}
      <Card>
        <CardBody className='gap-3'>
          <Skeleton className='w-32 h-6 rounded-lg' />
          <div className='grid grid-cols-2 gap-4'>
            <Skeleton className='w-full h-16 rounded-lg' />
            <Skeleton className='w-full h-16 rounded-lg' />
          </div>
        </CardBody>
      </Card>

      {/* Todoリストカード */}
      <Card>
        <CardBody>
          <Skeleton className='w-32 h-6 rounded-lg mb-4' />
          <div className='space-y-3'>
            {[...Array(3)].map((_, index) => (
              <Skeleton key={index} className='w-full h-16 rounded-lg' />
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

'use client';
import { Card, CardBody, Skeleton } from '@heroui/react';

export default function Loading() {
  return (
    <div className='container mx-auto p-4 max-w-6xl'>
      {/* ヘッダー・新規作成ボタンのスケルトン */}
      <div className='mb-6'>
        <Skeleton className='w-48 h-8 rounded-lg mb-4' />
        <Skeleton className='w-full h-12 rounded-lg' />
      </div>

      {/* フィルター・検索エリアのスケルトン */}
      <Card className='mb-6'>
        <CardBody>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <Skeleton className='w-full h-10 rounded-lg' />
            <Skeleton className='w-full h-10 rounded-lg' />
            <Skeleton className='w-full h-10 rounded-lg' />
          </div>
        </CardBody>
      </Card>

      {/* Todoカードのスケルトン（5件表示） */}
      <div className='space-y-4'>
        {[...Array(5)].map((_, index) => (
          <Card key={index}>
            <CardBody className='gap-3'>
              <Skeleton className='w-3/4 h-6 rounded-lg' />
              <Skeleton className='w-full h-4 rounded-lg' />
              <Skeleton className='w-2/3 h-4 rounded-lg' />
              <div className='flex gap-2 mt-2'>
                <Skeleton className='w-20 h-8 rounded-lg' />
                <Skeleton className='w-20 h-8 rounded-lg' />
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* ページネーションのスケルトン */}
      <div className='mt-6 flex justify-center gap-2'>
        <Skeleton className='w-24 h-10 rounded-lg' />
        <Skeleton className='w-32 h-10 rounded-lg' />
        <Skeleton className='w-24 h-10 rounded-lg' />
      </div>
    </div>
  );
}

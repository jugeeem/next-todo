'use client';
import { Card, CardBody, Skeleton } from '@heroui/react';

export default function Loading() {
  return (
    <div className='container mx-auto p-4 max-w-6xl'>
      {/* ヘッダーと新規作成ボタン */}
      <div className='mb-6 flex justify-between items-center'>
        <Skeleton className='w-48 h-8 rounded-lg' />
        <Skeleton className='w-32 h-10 rounded-lg' />
      </div>

      {/* 検索・フィルタースケルトン */}
      <Card className='mb-6'>
        <CardBody>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <Skeleton className='w-full h-10 rounded-lg' />
            <Skeleton className='w-full h-10 rounded-lg' />
            <Skeleton className='w-full h-10 rounded-lg' />
          </div>
        </CardBody>
      </Card>

      {/* ユーザーカードスケルトン（6件、3列グリッド） */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
        {[...Array(6)].map((_, index) => (
          <Card key={index}>
            <CardBody className='gap-3'>
              <Skeleton className='w-full h-6 rounded-lg' />
              <Skeleton className='w-3/4 h-4 rounded-lg' />
              <Skeleton className='w-1/2 h-4 rounded-lg' />
              <div className='flex gap-2 mt-2'>
                <Skeleton className='flex-1 h-10 rounded-lg' />
                <Skeleton className='flex-1 h-10 rounded-lg' />
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* ページネーションスケルトン */}
      <div className='mt-6 flex justify-center gap-2'>
        <Skeleton className='w-24 h-10 rounded-lg' />
        <Skeleton className='w-32 h-10 rounded-lg' />
        <Skeleton className='w-24 h-10 rounded-lg' />
      </div>
    </div>
  );
}

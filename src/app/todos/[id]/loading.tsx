'use client';
import { Spinner } from '@heroui/react';

/**
 * Todo詳細ページの読み込み中表示コンポーネント。
 *
 * @returns {JSX.Element} ローディングスピナーを表示する要素。
 */
export default function Loading() {
  return (
    <div className='min-h-screen flex flex-col items-center justify-center gap-4'>
      <Spinner size='lg' color='primary' label='Todo詳細を読み込み中...' />
    </div>
  );
}

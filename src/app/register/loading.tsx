'use client';
import { Spinner } from '@heroui/react';

/**
 * 登録ページの読み込み中表示コンポーネント
 *
 * @returns JSX.Element - ローディングUI
 */
export default function Loading() {
  return (
    <div className="flex justify-center items-center p-8">
      <Spinner color="primary" />
    </div>
  );
}

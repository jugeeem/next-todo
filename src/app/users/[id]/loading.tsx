'use client';

import { Spinner } from '@heroui/react';

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <Spinner size="lg" color="primary" label="ユーザー詳細を読み込み中..." />
    </div>
  );
}

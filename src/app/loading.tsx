'use client';

import { Card, CardBody, Spinner } from '@heroui/react';

/**
 * 読み込み中表示コンポーネント
 *
 * @returns JSX.Element
 */
export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardBody className="flex flex-col items-center justify-center py-12 gap-4">
          <Spinner size="lg" color="primary" />
          <div className="text-center">
            <p className="text-default-700 font-medium">
              アプリケーションを読み込み中...
            </p>
            <p className="text-small text-default-500 mt-1">しばらくお待ちください</p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

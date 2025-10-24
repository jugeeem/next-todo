'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { getAuthState } from '@/lib/auth-client';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // 認証状態をチェック
    const { isAuthenticated } = getAuthState();

    if (isAuthenticated) {
      // 認証済みの場合は /todos にリダイレクト
      router.replace('/todos');
    } else {
      // 未認証の場合は /login にリダイレクト
      router.replace('/login');
    }
  }, [router]);

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">認証状態を確認中...</p>
      </div>
    </main>
  );
}

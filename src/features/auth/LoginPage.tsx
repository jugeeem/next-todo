'use client';

import { LoginForm } from './components/LoginForm';

/**
 * ログインページコンポーネント
 */
export function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">ログイン</h1>
        <LoginForm />
      </div>
    </div>
  );
}

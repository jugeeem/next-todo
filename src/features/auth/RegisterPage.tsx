'use client';

import { RegisterForm } from './components/RegisterForm';

/**
 * 新規登録ページコンポーネント
 */
export function RegisterPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">新規登録</h1>
        <RegisterForm />
      </div>
    </div>
  );
}

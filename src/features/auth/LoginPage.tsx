'use client';

import { LoginForm } from './components/LoginForm';

/**
 * ログインページコンポーネント
 * @returns {JSX.Element} ログインページのJSX要素
 */
export default function LoginPage() {
  /**
   * フォーム送信用のハンドラ
   * @param {React.FormEvent} e フォームイベント
   * @return {Promise<void>} 非同期処理完了を表すPromise
   */
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      {/* カードを中央に配置するためのコンテナ */}
      <div className="max-w-md w-full">
        <h1 className="text-3xl font-bold text-gray-900 text-center mb-8">ログイン</h1>
        <LoginForm />
      </div>
    </div>
  );
}

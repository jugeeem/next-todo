'use client';

import { useRouter } from 'next/navigation';
import { RegisterForm } from './components/RegisterForm';

/**
 * ユーザー新規登録ページコンポーネント
 * @returns {JSX.Element} ユーザー新規登録ページのJSX要素
 */
export default function RegisterPage() {
  // ページ遷移用のフック
  const router = useRouter();

  /**
   * 登録成功時のハンドラー
   * 登録成功後にログインページへリダイレクトします。
   */
  const handleSuccess = () => {
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      {/* コンテナ */}
      <div className="w-full max-w-4xl mx-auto px-4 py-8">
        {/* カードを中央に配置するためのコンテナ */}
        <div className="max-w-md mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 text-center mb-8">
            新規登録
          </h1>
          {/* 登録フォームコンポーネント */}
          <RegisterForm onSuccess={handleSuccess} />
        </div>
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { z } from 'zod';

/**
 * ユーザー新規登録ページコンポーネント
 * @returns {JSX.Element} ユーザー新規登録ページのJSX要素
 */
export default function RegisterPage() {
  // ステートの管理
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // ページ遷移用のフック
  const router = useRouter();

  /**
   * フォーム送信用ハンドラー
   * @param {React.FormEvent} e フォームイベント
   * @return {Promise<void>} 非同期処理完了を表すPromise
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // バリデーションスキーマの設定
    /**
     * Zodスキーマ定義
     * @type {z.ZodObject} schema バリデーションスキーマ
     */
    const schema = z.object({
      username: z
        .string()
        .min(1, 'ユーザー名は1文字以上で入力してください。')
        .max(50, 'ユーザー名は50文字以下で入力してください。'),
      password: z.string().min(6, 'パスワードは6文字以上で入力してください。'),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
    });
    /**
     * 入力バリデーションの実行
     * @param {object} input 入力データ
     * @returns {boolean} バリデーション結果
     */
    const validationInput = schema.safeParse({
      username,
      password,
      firstName,
      lastName,
    });
    // バリデーション失敗時の処理 エラーメッセージを設定して処理を中断する。
    if (!validationInput.success) {
      setError(validationInput.error.errors[0].message);
      setIsLoading(false);
      return;
    }
    // fetch APIを使用して登録リクエストを送信する
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        // JSON形式でデータを送信
        headers: {
          'Content-Type': 'application/json',
        },
        // 送信データの設定
        body: JSON.stringify({
          username: username.trim(),
          password: password,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        }),
      });
      // レスポンスのエラーチェック
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '登録に失敗しました');
      }
      // 登録成功後、ログインページへリダイレクト
      router.push('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      // ローディング終了
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      {/* コンテナ */}
      <div className="w-full max-w-4xl mx-auto px-4 py-8">
        {/* カードを中央に配置するためのコンテナ */}
        <div className="max-w-md mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 text-center mb-6">
            新規登録
          </h1>

          {/* カード */}
          <div className="bg-white shadow-md rounded-2xl p-6">
            {/* 登録フォーム */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* ユーザー名入力 */}
              <div className="relative">
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-3 py-2 pt-6 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 peer"
                  placeholder="ユーザー名を入力"
                />
                <label
                  htmlFor="username"
                  className="absolute left-3 top-2 text-xs font-medium text-gray-700 peer-disabled:text-gray-500"
                >
                  ユーザー名
                  <span className="text-red-600 text-xs ml-0.5">*</span>
                </label>
              </div>

              {/* パスワード入力 */}
              <div className="relative">
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-3 py-2 pt-6 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 peer"
                  placeholder="パスワードを入力"
                />
                <label
                  htmlFor="password"
                  className="absolute left-3 top-2 text-xs font-medium text-gray-700 peer-disabled:text-gray-500"
                >
                  パスワード
                  <span className="text-red-600 text-xs ml-0.5">*</span>
                </label>
              </div>

              {/* 名前入力 グリッドレイアウトを使用して2列に並べる*/}
              <div className="grid grid-cols-2 gap-3">
                {/* 性の入力 */}
                <div className="relative">
                  <input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={isLoading}
                    className="w-full px-3 py-2 pt-6 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 peer"
                    placeholder="姓（任意）"
                  />
                  <label
                    htmlFor="lastName"
                    className="absolute left-3 top-2 text-xs font-medium text-gray-700 peer-disabled:text-gray-500"
                  >
                    姓
                  </label>
                </div>

                {/* 名の入力 */}
                <div className="relative">
                  <input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={isLoading}
                    className="w-full px-3 py-2 pt-6 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 peer"
                    placeholder="名（任意）"
                  />
                  <label
                    htmlFor="firstName"
                    className="absolute left-3 top-2 text-xs font-medium text-gray-700 peer-disabled:text-gray-500"
                  >
                    名
                  </label>
                </div>
              </div>

              {/* エラーメッセージ表示 */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {/* 登録ボタン */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 transition-colors"
              >
                {isLoading ? '登録中...' : '登録'}
              </button>
            </form>

            {/* ログインリンク */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                すでにアカウントをお持ちの場合は
                <Link href="/login" className="text-blue-600 hover:underline ml-1">
                  ログイン
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { Button, Card, Input } from '@heroui/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { z } from 'zod';

/**
 * ログインページコンポーネント
 * @returns {JSX.Element} ログインページのJSX要素
 */
export default function LoginPage() {
  // ページ遷移用のルーター
  const router = useRouter();
  // stateの定義
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  // サーバーエラー用のstate
  const [error, setError] = useState<string>('');

  // フィールドごとのエラー状態を管理 STEP3 ADD START
  const [usernameError, setUsernameError] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');
  // STEP3 ADD END

  // ローディング状態のstate
  const [isLoading, setIsLoading] = useState<boolean>(false);
  /**
   * フォーム送信用のハンドラ
   * @param {React.FormEvent} e フォームイベント
   * @return {Promise<void>} 非同期処理完了を表すPromise
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    // フィールドごとのエラーを送信時にクリア STEP3 MOD START
    setUsernameError('');
    setPasswordError('');
    // STEP3 MOD END

    // バリデーションスキーマの設定
    /**
     * Zodスキーマ定義
     * @type {z.ZodObject} schema バリデーションスキーマ
     */

    const schema = z.object({
      username: z
        .string()
        .min(1, 'ユーザー名は必須です。')
        .max(50, 'ユーザー名は50文字以下で入力してください。'),
      password: z.string().min(6, 'パスワードは6文字以上で入力してください。'),
    });
    /**
     * 入力バリデーションの実行
     * @param {object} input 入力データ
     * @returns {boolean} バリデーション結果
     */
    const validationInput = schema.safeParse({
      username,
      password,
    });
    // バリデーション失敗時の処理 エラーメッセージを設定して処理を中断する。
    // フィールドごとのエラー状態を設定する。 STEP3 MOD START
    if (!validationInput.success) {
      // エラーメッセージを一覧で取得
      const errors = validationInput.error.errors;

      // err.path[0]でエラー対象のフィールド名を特定して、対応するエラーstateを更新
      errors.forEach((err) => {
        if (err.path[0] === 'username') setUsernameError(err.message);
        if (err.path[0] === 'password') {
          setPasswordError(err.message);
        }
      });
      setIsLoading(false);
      return;
    }
    // STEP3 MOD END

    // fetch APIを使用してログインリクエストを送信する
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        // JSON形式でデータを送信
        headers: {
          'Content-Type': 'application/json',
        },
        // 送信データの設定
        body: JSON.stringify({
          username: username.trim(),
          password: password,
        }),
      });
      // レスポンスのエラーチェック
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'ログインに失敗しました');
      }

      // ログイン成功後、TODOリストページへリダイレクト。ログイン後はログインページに戻らないようにreplaceを使用
      router.replace('/todos');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました。');
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
          <h1 className="text-3xl font-bold text-gray-900 text-center mb-8">
            ログイン
          </h1>
          {/* カード */}
          {/* div → Card STEP3 MOD START */}
          <Card className="p-8">
            {/* ログインフォーム */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/*ユーザー名の入力 */}
              {/* input→Input STEP3 MOD START */}
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setUsernameError(''); // エラーメッセージをクリア
                }}
                disabled={isLoading}
                placeholder="ユーザー名を入力"
                label="ユーザー名"
                isRequired
                validationBehavior="aria"
                isInvalid={!!usernameError}
                errorMessage={usernameError}
              />
              {/*パスワードの入力 */}
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError(''); // エラーメッセージをクリア
                }}
                disabled={isLoading}
                placeholder="パスワードを入力"
                label="パスワード"
                isRequired
                // ブラウザ標準のバリデーション表示を無効化
                validationBehavior="aria"
                isInvalid={!!passwordError}
                errorMessage={passwordError}
              />
              {/* input→Input STEP3 MOD END */}

              {/*ログイン時エラーメッセージの表示 */}
              {error && (
                <div className="p-3 bg-danger-50 border border-danger-200 rounded-md">
                  <p className="text-danger text-sm">{error}</p>
                </div>
              )}
              {/* ログインボタン */}
              <Button
                type="submit"
                color="primary"
                isLoading={isLoading}
                className="w-full px-4 py-2"
              >
                ログイン
              </Button>
            </form>
            {/* 新規登録リンク */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                アカウントをお持ちでない場合は
                <Link href="/register" className="text-blue-600 hover:underline ml-1">
                  新規登録
                </Link>
              </p>
            </div>
          </Card>
          {/* div → Card STEP3 MOD END */}
        </div>
      </div>
    </div>
  );
}

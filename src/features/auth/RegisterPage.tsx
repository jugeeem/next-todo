'use client';

import { Button, Card, Input } from '@heroui/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { z } from 'zod';

/**
 * ユーザー新規登録ページコンポーネント
 * @returns {JSX.Element} ユーザー新規登録ページのJSX要素
 */
export default function RegisterPage() {
  // ページ遷移用のフック
  const router = useRouter();

  // ステートの管理
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [error, setError] = useState<string>('');

  // フィールドごとのエラー状態を管理 STEP3 ADD START
  const [usernameError, setUsernameError] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');
  // STEP3 ADD END

  const [isLoading, setIsLoading] = useState<boolean>(false);

  /**
   * フォーム送信用ハンドラー
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

    // フィールドごとのエラー状態を設定する。 STEP3 MOD START
    if (!validationInput.success) {
      // エラーメッセージを一覧で取得
      const errors = validationInput.error.errors;

      // err.path[0]でエラー対象のフィールド名を特定して、対応するエラーstateを更新
      errors.forEach((err) => {
        err.path[0] === 'username' && setUsernameError(err.message);
        err.path[0] === 'password' && setPasswordError(err.message);
      });
      setIsLoading(false);
      return;
    }
    // STEP3 MOD END

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
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
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
            新規登録
          </h1>

          {/* カード */}
          {/* div → Card STEP3 MOD START */}
          <Card className="p-8">
            {/* 登録フォーム */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* ユーザー名入力 */}
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

              {/* パスワード入力 */}
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
                validationBehavior="aria"
                isInvalid={!!passwordError}
                errorMessage={passwordError}
              />

              {/* 名前入力 グリッドレイアウトを使用して2列に並べる*/}
              <div className="grid grid-cols-2 gap-3">
                {/* 性の入力 */}
                <Input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={isLoading}
                  placeholder="姓（任意）"
                  label="姓"
                />

                {/* 名の入力 */}
                <Input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={isLoading}
                  placeholder="名（任意）"
                  label="名"
                />
              </div>
              {/* input→Input STEP3 MOD END */}

              {/* エラーメッセージ表示 */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {/* 登録ボタン */}
              {/* button → Button STEP3 MOD START */}
              <Button
                type="submit"
                color="primary"
                isLoading={isLoading}
                className="w-full px-4 py-2"
              >
                {isLoading ? '登録中' : '登録'}
              </Button>
              {/* button → Button STEP3 MOD END */}
            </form>

            {/* ログインリンク */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 flex items-center justify-center gap-1">
                すでにアカウントをお持ちの場合は
                {/* button → Button STEP3 MOD START */}
                <Button
                  as={Link}
                  href="/login"
                  variant="light"
                  color="primary"
                  size="md"
                  className="h-auto p-0 min-w-0 data-[hover=true]:bg-transparent font-medium"
                >
                  ログイン
                </Button>
                {/* button → Button STEP3 MOD END  */}
              </p>
            </div>
          </Card>
          {/* div → Card STEP3 MOD END */}
        </div>
      </div>
    </div>
  );
}

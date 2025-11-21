'use client';
import { Button, Card, Input } from '@heroui/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { z } from 'zod';

/**
 * ログインフォームのバリデーションスキーマ
 *
 * @type {z.ZodObject} LoginFormSchema
 * @property {z.ZodString} username - ユーザー名のバリデーションルール
 * @property {z.ZodString} password - パスワードのバリデーションルール
 */
const LoginFormSchema = z.object({
  username: z
    .string()
    .min(1, 'ユーザー名を入力してください。')
    .max(50, 'ユーザー名は50文字以内で入力してください。'),
  password: z.string().min(6, 'パスワードは6文字以上で入力してください。'),
});

/**
 * ログインフォームコンポーネント。
 * フォームの状態管理と送信処理を行います。
 *
 * @returns {JSX.Element} ログインフォームのJSX要素
 */
export function LoginForm() {
  // ページ遷移用のルーター
  const router = useRouter();
  // ユーザー名のstate
  const [username, setUsername] = useState('');
  // パスワードのstate
  const [password, setPassword] = useState('');
  // サーバーエラー用のstate
  const [error, setError] = useState('');
  // ユーザーネームのエラー用のstate
  const [usernameError, setUsernameError] = useState('');
  // パスワードのエラー用のstate
  const [passwordError, setPasswordError] = useState('');
  // ローディング状態のstate
  const [isLoading, setIsLoading] = useState(false);

  /**
   * フォーム送信用のハンドラ。
   * フォーム送信イベントを送信します。
   *
   * @param {React.FormEvent} e フォームイベント
   *
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUsernameError('');
    setPasswordError('');
    setError('');
    setIsLoading(true);

    /**
     * 入力バリデーションの実行
     * @param {object} input 入力データ
     * @returns {boolean} バリデーション結果
     */
    const validationInput = LoginFormSchema.safeParse({
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
        if (err.path[0] === 'password') setPasswordError(err.message);
      });
      setIsLoading(false);
      return;
    }
    // ログイン処理
    try {
      // フォームデータを送信
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      // レスポンスチェック。
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'ログインに失敗しました。');
      }
      // ログイン成功時はTODOページへリダイレクト
      router.push('/todos');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'ログイン中にエラーが発生しました。',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
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
        <p className="text-sm text-gray-600 flex items-center justify-center gap-1">
          アカウントをお持ちでない場合は
          <Button
            as={Link}
            href="/register"
            variant="light"
            color="primary"
            size="md"
            className="h-auto p-0 min-w-0 data-[hover=true]:bg-transparent font-medium"
          >
            新規登録
          </Button>
        </p>
      </div>
    </Card>
  );
}

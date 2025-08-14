'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { setClientCookie } from '@/lib/cookie';

export default function LoginIndex() {
  const [form, setForm] = useState<LoginForm>({
    username: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // LoginForm の型宣言
  interface LoginForm {
    username: string; // ユーザー名（必須、1文字以上）
    password: string; // パスワード（必須、1文字以上）
  }

  // LoginResponse の型宣言
  interface LoginResponse {
    success: boolean; // 成功フラグ
    data: {
      user: {
        id: string; // ユーザーID
        username: string; // ユーザー名
        firstName: string; // 名前
        firstNameRuby: string; // 名前のふりがな
        lastName: string; // 姓
        lastNameRuby: string; // 姓のふりがな
        role: number; // 権限（例：管理者、一般ユーザー）
        createdAt: string; // ユーザーが作成された日時のタイムスタンプ。
        createdBy: string; // このユーザーを作成したユーザーの識別子。
        updatedAt: string; // ユーザーが最後に更新された日時のタイムスタンプ。
        updatedBy: string; // このユーザーを最後に更新したユーザーの識別子。
        deleted: boolean; // ユーザーアカウントが削除済みとしてマークされているかどうかを示します。
      };
      token: string; // 認証トークン
    };
    message: string; // レスポンスメッセージ
  }

  // フォーム送信処理
  const handleSubmit = async () => {
    // ローディング状態に変更
    setIsLoading(true);
    // エラーメッセージをリセット
    setError(null);

    // ユーザー名とパスワードが入力されているかチェック
    if (!form.username || !form.password) {
      setError('ユーザー名とパスワードを入力してください');
      setIsLoading(false);
      return;
    }

    // APIリクエストの準備
    // LoginForm の型に合わせてリクエストデータを作成
    // ユーザー名とパスワードを含むリクエスト
    const request: LoginForm = {
      username: form.username,
      password: form.password,
    };

    // APIにPOSTリクエストを送信
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      // レスポンスをJSON形式で取得
      const responseData: LoginResponse = await response.json();

      // レスポンスの成功フラグとメッセージをチェック
      // 成功した場合はトークンとユーザー情報をクッキーに
      if (response.ok && responseData.success) {
        setClientCookie('token', responseData.data.token); // クッキーにトークンを保存
        setClientCookie('user', JSON.stringify(responseData.data.user)); // ユーザー情報をクッキーに保存

        // ログイン成功後、Todo一覧ページにリダイレクト
        router.push('/todos');
      } else {
        setError(
          // エラー時に表示するメッセージ
          responseData.message || 'ユーザー名またはパスワードが正しくありません',
        );
      }
    } catch {
      // 例外が発生した場合
      setError('エラーが発生しました');
    } finally {
      // ローディング状態を解除
      // ここでエラーが発生してもローディング状態を解除
      setIsLoading(false);
    }
  };

  // 入力フィールドの変更を処理する関数
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // 入力フィールドの名前と値を取得
    const { name, value } = event.target;
    // フォームの状態を更新
    setForm((prevForm) => ({
      // 前のフォームの状態を保持しつつ、変更されたフィールドのみ更新
      ...prevForm,
      [name]: value,
    }));
  };

  return (
    <div className="bg-gray-50 h-screen">
      <header className="flex justify-between items-center p-4 bg-blue-500 text-white">
        <h1>Todoアプリ</h1>
      </header>
      <div className="flex items-center justify-center mt-20">
        <div className="w-96 p-4 bg-white rounded shadow-md text-center relative">
          <h1 className="text-2xl font-bold mb-4">Welcome!</h1>
          <div className="mx-7 mb-10">
            <div className="mb-4">
              <input
                type="text"
                placeholder="ユーザ名を入力"
                value={form.username}
                onChange={handleInputChange}
                name="username"
                className="w-full border py-2 px-4 rounded-lg border-gray-400 focus:border-blue-500 focus:ring-blue-500 focus:ring-1"
              />
            </div>
            <div className="mb-4">
              <input
                type="password"
                placeholder="パスワードを入力"
                value={form.password}
                onChange={handleInputChange}
                name="password"
                className="w-full border py-2 px-4 rounded-lg border-gray-400 focus:border-blue-500 focus:ring-blue-500 focus:ring-1"
              />
            </div>
            <div className="mb-4">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className="w-full bg-blue-500 text-white py-1 px-4 rounded-full hover:bg-blue-600 transition-colors"
              >
                {isLoading ? 'Loading...' : 'Login'}
              </button>
            </div>
          </div>
          {error && (
            <p className="text-red-500 absolute bottom-15 inset-x-0">{error}</p>
          )}
          <div>
            <button
              type="button"
              onClick={() => router.push('/auth/register')}
              className="bg-blue-500 text-white py-1 px-4 rounded-full hover:bg-blue-600 transition-colors"
            >
              新規登録
            </button>
          </div>
        </div>
      </div>

      {/* ローディングオーバーレイ */}
      {isLoading && (
        <div className="fixed inset-0 flex items-center justify-center bg-white/50">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-300 border-t-blue-500"></div>
        </div>
      )}
    </div>
  );
}

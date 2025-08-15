'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function RegisterIndex() {
  const [form, setForm] = useState<RegisterForm>({
    username: '',
    firstName: '',
    firstNameRuby: '',
    lastName: '',
    lastNameRuby: '',
    password: '',
    confirmPassword: '',
    role: 4, // デフォルトを「ユーザー」に設定
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const router = useRouter();

  interface RegisterForm {
    username: string; // ユーザー名（必須、1文字以上）
    firstName: string; // 名前（必須、1文字以上）
    firstNameRuby: string; // 名前のふりがな（必須、1文字以上）
    lastName: string; // 姓（必須、1文字以上）
    lastNameRuby: string; // 姓のふりがな（必須、1文字以上）
    password: string; // パスワード（必須、1文字以上）
    confirmPassword: string; // パスワード確認用（必須、1文字以上）
    role: number; // 権限（例：管理者、一般ユーザー）
  }

  interface RegisterResponse {
    success: boolean; // 成功フラグ
    data?: {
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

  const USER_ROLES = {
    管理者: 1, // 管理者
    マネージャー: 2, // マネージャー
    ユーザー: 4, // ユーザー
    ゲスト: 8, // ゲスト
  };

  //ユーザ登録処理
  const handleSubmit = async () => {
    // ローディング状態に変更
    setIsLoading(true);
    // エラーメッセージをリセット
    setError(null);

    // フォームの必須項目チェック
    if (!form.username || !form.password || !form.confirmPassword) {
      setError('ユーザー名とパスワードは必須です');
      setIsLoading(false);
      return;
    }
    // パスワードと確認用パスワードが一致するかチェック
    if (form.password !== form.confirmPassword) {
      setError('パスワードが一致しません');
      setIsLoading(false);
      return;
    }

    // APIリクエストの準備
    // RegisterForm の型に合わせてリクエストデータを作成
    const request = {
      username: form.username,
      firstName: form.firstName || undefined,
      firstNameRuby: form.firstNameRuby || undefined,
      lastName: form.lastName || undefined,
      lastNameRuby: form.lastNameRuby || undefined,
      password: form.password,
      role: form.role,
    };

    // APIにPOSTリクエストを送信
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      // レスポンスをJSON形式で取得
      const responseData: RegisterResponse = await response.json();

      // レスポンスの成功フラグとメッセージをチェック
      if (response.ok && responseData.success) {
        // 登録成功後、ログインページにリダイレクト
        router.push('/auth/login');
      } else {
        // エラー時に表示するメッセージ
        setError(responseData.message || '登録に失敗しました');
      }
    } catch {
      // 例外が発生した場合
      setError('エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  // 入力フィールドの変更を処理する関数
  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = event.target;
    setForm((prevForm) => ({
      ...prevForm,
      [name]: type === 'number' || name === 'role' ? parseInt(value, 10) : value,
    }));
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <header className="flex justify-between items-center p-4 bg-blue-500 text-white">
        <h1>ユーザー登録</h1>
        <button
          type="button"
          onClick={() => router.push('/auth/login')}
          className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded transition-colors"
        >
          戻る
        </button>
      </header>
      <div className="flex items-center justify-center mt-20">
        <div className="w-96 p-4 bg-white rounded shadow-md text-center">
          <h1 className="text-2xl font-bold mb-4">ユーザー情報登録</h1>
          <div className="mx-7">
            <div className="relative mb-7">
              <div className="mb-4">
                <label htmlFor="username" className="block mb-2">
                  ユーザ名
                </label>
                <input
                  type="text"
                  placeholder="ユーザ名を入力してください"
                  value={form.username}
                  onChange={handleInputChange}
                  name="username"
                  required
                  className="w-full border py-2 px-4 rounded-lg border-red-400 border-2 focus:border-blue-500 focus:ring-blue-500 focus:ring-1 mb-4"
                />
              </div>
              <p className="block mb-2">名前</p>
              <div className="mb-4 md:flex md:gap-2">
                <input
                  type="text"
                  placeholder="名を入力(任意)"
                  value={form.firstName || ''}
                  onChange={handleInputChange}
                  name="firstName"
                  className="w-full border py-2 px-4 rounded-lg border-gray-400 focus:border-blue-500 focus:ring-blue-500 focus:ring-1 mb-4"
                />
                <input
                  type="text"
                  placeholder="性を入力(任意)"
                  value={form.lastName || ''}
                  onChange={handleInputChange}
                  name="lastName"
                  className="w-full border py-2 px-4 rounded-lg border-gray-400 focus:border-blue-500 focus:ring-blue-500 focus:ring-1 mb-4"
                />
              </div>
              <p className="block mb-2">よみ仮名</p>
              <div className="mb-4 md:flex md:gap-2">
                <input
                  type="text"
                  placeholder="名のよみ仮名(任意)"
                  value={form.firstNameRuby || ''}
                  onChange={handleInputChange}
                  name="firstNameRuby"
                  className="w-full border py-2 px-4 rounded-lg border-gray-400 focus:border-blue-500 focus:ring-blue-500 focus:ring-1 mb-4"
                />
                <input
                  type="text"
                  placeholder="性のよみ仮名(任意)"
                  value={form.lastNameRuby || ''}
                  onChange={handleInputChange}
                  name="lastNameRuby"
                  className="w-full border py-2 px-4 rounded-lg border-gray-400 focus:border-blue-500 focus:ring-blue-500 focus:ring-1 mb-4"
                />
              </div>
              <label htmlFor="role" className="block mb-2">
                権限を選択してください
              </label>
              <select
                name="role"
                value={form.role}
                onChange={handleInputChange}
                className="w-full border py-2 px-4 rounded-lg border-gray-400 focus:border-blue-500 focus:ring-blue-500 focus:ring-1 mb-4"
              >
                {Object.entries(USER_ROLES).map(([roleName, roleValue]) => (
                  <option key={roleValue} value={roleValue}>
                    {roleName}
                  </option>
                ))}
              </select>
              <p className="block mb-2">パスワードを入力してください</p>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="パスワードを入力してください"
                  value={form.password}
                  onChange={handleInputChange}
                  name="password"
                  required
                  className="w-full border py-2 px-4 rounded-lg border-red-400 border-2 focus:border-blue-500 focus:ring-blue-500 focus:ring-1 mb-4"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-500 hover:text-blue-500 focus:outline-none"
                >
                  {showPassword ? (
                    // 目を開いたアイコン（パスワード表示中）
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  ) : (
                    // 目を閉じたアイコン（パスワード非表示中）
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M6 12c2 2 4 2 6 2s4 0 6-2"
                      />
                    </svg>
                  )}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="パスワードを再入力してください"
                  value={form.confirmPassword}
                  onChange={handleInputChange}
                  name="confirmPassword"
                  onBlur={() => {
                    if (form.password !== form.confirmPassword) {
                      setError('パスワードが一致しません');
                    } else {
                      setError(null); // パスワードが一致した場合はエラーをクリア
                    }
                  }}
                  required
                  className="w-full border py-2 px-4 rounded-lg border-red-400 border-2 focus:border-blue-500 focus:ring-blue-500 focus:ring-1 mb-4"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-gray-500 hover:text-blue-500 focus:outline-none"
                >
                  {showConfirmPassword ? (
                    // 目を開いたアイコン（パスワード表示中）
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  ) : (
                    // 目を閉じたアイコン（パスワード非表示中）
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M6 12c2 2 4 2 6 2s4 0 6-2"
                      />
                    </svg>
                  )}
                </button>
              </div>
              {error && (
                <p className="text-red-500 absolute -bottom-4 inset-x-0">{error}</p>
              )}
            </div>
            <button
              type="button"
              onClick={handleSubmit}
              className="w-full bg-blue-500 text-white py-1 px-4 rounded-full hover:bg-blue-600 transition-colors"
            >
              送信
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

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { z } from 'zod';

/**
 * ロール番号とラベルの対応表。
 * ユーザー作成フォームのロール選択で使用します。
 */
const roleLabels: Record<number, string> = {
  1: 'ADMIN',
  2: 'MANAGER',
  3: 'USER',
  4: 'GUEST',
};

/**
 * ユーザー作成ページのコンポーネント。
 * フォームを表示し、ユーザーの作成を行います。(ADMINおよびMANAGER権限のみ)
 *
 * @returns {JSX.Element} ユーザー作成ページのコンポーネント
 */
export default function CreateUserPage() {
  // ステートの管理
  // ユーザー名
  const [username, setUsername] = useState<string>('');
  // パスワード
  const [password, setPassword] = useState<string>('');
  // 確認用パスワード
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  // 名前
  const [firstName, setFirstName] = useState<string>('');
  // 姓
  const [lastName, setLastName] = useState<string>('');
  // 権限情報
  const [role, setRole] = useState<number>(4);
  // 作成中フラグ
  const [isCreating, setIsCreating] = useState<boolean>(false);
  // エラーメッセージ
  const [error, setError] = useState<string>('');
  // 現在のユーザー権限情報
  const [currentUserRole, setCurrentUserRole] = useState<number>(4);

  // ページ遷移用のルーター
  const router = useRouter();

  useEffect(() => {
    /**
     * 権限チェック。
     * ページ遷移時に現在のユーザー権限を確認し、権限が不足している場合は、ログインページにリダイレクトします。
     *
     * @returns {Promise<void>}
     * @throws {Error} ユーザー情報の取得に失敗した場合にスローされます。
     */
    const checkUserRole = async () => {
      try {
        // 現在のユーザー情報を取得
        const response = await fetch('/api/users/me');

        // 認証エラー(401)の場合はログインページへリダイレクト
        if (response.status === 401) {
          router.replace('/login');
          return;
        }

        // レスポンスのエラーチェック
        if (!response.ok) {
          throw new Error('ユーザー情報の取得に失敗しました。');
        }

        // 権限情報の取得
        const data = await response.json();
        const currentUserRole = data.data.role;

        // 権限チェック。 ADMIN(1)およびMANAGER(2)以外はログインページへリダイレクト
        if (currentUserRole >= 3) {
          router.replace('/login');
          return;
        }

        // 権限情報をステートに設定
        setCurrentUserRole(currentUserRole);
      } catch (err) {
        // エラー発生時はコンソールにエラーを表示し、ログインページへリダイレクト
        console.error('権限チェックエラー:', err);
        setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
        router.replace('/login');
      }
    };
    // 権限チェックの実行
    checkUserRole();
  }, [router]);

  /**
   * 権限制約。
   * ADMIN: すべての権限で作成可能。
   * MANAGER: ADMIN以外で作成可能。
   *
   * @returns {Array<{value: number; label: string}>} 作成可能なロールの配列
   */
  // 配列の中身をオブジェクトに変換します。
  const canCreateRole = (currentUserRole === 1 ? [1, 2, 3, 4] : [2, 3, 4]).map(
    (roleValue) => ({
      value: roleValue,
      label: roleLabels[roleValue],
    }),
  );

  /**
   * バリデーションスキーマ。
   * ユーザー作成フォームの各フィールドに対するバリデーションルールを定義します。
   *
   * @returns {z.ZodObject} バリデーションスキーマ
   */
  const validationSchema = z.object({
    username: z
      .string()
      .trim()
      .min(1, 'ユーザー名は1文字以上で入力してください。')
      .max(50, 'ユーザー名は50文字以下で入力してください。'),
    password: z.string().min(6, 'パスワードは6文字以上で入力してください。'),
    confirmPassword: z
      .string()
      .min(6, '確認用パスワードは6文字以上で入力してください。'),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
  });

  /**
   * フォーム送信ハンドラー。
   * ユーザー作成フォームの送信時に呼び出され、入力データのバリデーションとユーザー作成APIの呼び出しを行います。
   *
   * @param {React.FormEvent} e フォーム送信イベント
   * @returns {Promise<void>}
   * @throws {Error} ユーザー作成に失敗した場合にスローされます。
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // 作成中フラグを設定
    setIsCreating(true);
    setError('');

    /**
     * バリデーションの実行。
     * 入力データがバリデーションスキーマに準拠しているかを確認します。
     *
     * @returns {z.SafeParseReturnType<any, any>} バリデーション結果
     */
    const validationInput = validationSchema.safeParse({
      username,
      password,
      confirmPassword,
      firstName,
      lastName,
    });
    // バリデーションエラー時の処理
    if (!validationInput.success) {
      setError(validationInput.error.errors[0].message);
      setIsCreating(false);
      return;
    }
    // パスワードと確認用パスワードの一致チェック
    if (password !== confirmPassword) {
      setError('パスワードと確認用パスワードが一致しません');
      setIsCreating(false);
      return;
    }
    try {
      // ユーザー作成APIの呼び出し
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // リクエストボディの設定
        body: JSON.stringify({
          username: username.trim(),
          password,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          role,
        }),
      });
      // レスポンスのエラーチェック
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'ユーザーの作成に失敗しました');
      }

      // 作成成功後、ユーザー一覧ページへリダイレクト。
      router.push('/users');
    } catch (err) {
      // エラー発生時の処理
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    } finally {
      setIsCreating(false);
    }
  };

  /**
   * ログアウトハンドラー。
   * ユーザーがログアウトする際に呼び出され、セッションを終了します。
   *
   * @returns {Promise<void>}
   * @throws {Error} ログアウトに失敗した場合にスローされます。
   */
  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
      router.replace('/login');
    } catch (err) {
      // エラー発生時はコンソールにエラーを表示
      console.error('ログアウトに失敗しました:', err);
    }
  };

  // 権限チェック中の画面表示
  if (!currentUserRole || currentUserRole >= 3) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">権限を確認中...</div>
      </div>
    );
  }
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* ヘッダーナビゲーション */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* 見出し */}
            <Link href="/todos" className="hover:opacity-80 transition-opacity">
              <h1 className="text-3xl font-bold text-gray-900">Todoアプリ</h1>
            </Link>
            {/* ナビゲーションリンク */}
            <nav className="flex items-center gap-6">
              <Link
                href="/todos"
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
              >
                Todo一覧
              </Link>
              <Link
                href="/profile"
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
              >
                プロフィール
              </Link>
              {currentUserRole <= 2 && (
                <Link
                  href="/users"
                  className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                >
                  ユーザー管理
                </Link>
              )}
            </nav>

            {/* ログアウトボタン */}
            <button
              type="button"
              onClick={logout}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 font-medium transition-colors cursor-pointer"
            >
              ログアウト
            </button>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-10 w-full">
        {/* エラーメッセージ */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* ページタイトル */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">ユーザー作成</h2>
          </div>
        </div>

        {/* ユーザー作成フォーム */}
        <div className="bg-white shadow-md rounded-lg p-8">
          <h3 className="text-2xl font-semibold text-gray-900 mb-6">
            ユーザー情報入力
          </h3>

          {/* 入力フォーム */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* ユーザー入力 */}
            <div className="relative">
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isCreating}
                placeholder="username"
                required
                className="w-full px-3 py-2 pt-6 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white disabled:cursor-not-allowed peer transition-colors"
              />
              <label
                htmlFor="username"
                className="absolute left-3 top-2 text-xs text-gray-500 peer-disabled:text-gray-400"
              >
                ユーザー名 <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-500 mt-1">1～50文字で入力してください</p>
            </div>

            {/* パスワード入力 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isCreating}
                  placeholder="6文字以上"
                  required
                  className="w-full px-3 py-2 pt-6 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white disabled:bg-gray-100 disabled:cursor-not-allowed peer transition-colors"
                />
                <label
                  htmlFor="password"
                  className="absolute left-3 top-2 text-xs text-gray-500 peer-disabled:text-gray-400"
                >
                  パスワード <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-500 mt-1">最小6文字</p>
              </div>

              {/* 確認用パスワード */}
              <div className="relative">
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isCreating}
                  required
                  placeholder="パスワードを再入力"
                  className="w-full px-3 py-2 pt-6 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white disabled:bg-gray-100 disabled:cursor-not-allowed peer transition-colors"
                />
                <label
                  htmlFor="confirmPassword"
                  className="absolute left-3 top-2 text-xs text-gray-500 peer-disabled:text-gray-400"
                >
                  パスワード確認 <span className="text-red-500">*</span>
                </label>
              </div>
            </div>

            {/* 名前入力 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 姓 */}
              <div className="relative">
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={isCreating}
                  placeholder="姓"
                  className="w-full px-3 py-2 pt-6 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white disabled:bg-gray-100 disabled:cursor-not-allowed peer transition-colors"
                />
                <label
                  htmlFor="lastName"
                  className="absolute left-3 top-2 text-xs text-gray-500 peer-disabled:text-gray-400"
                >
                  姓
                </label>
              </div>

              {/* 名 */}
              <div className="relative">
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={isCreating}
                  placeholder="名"
                  className="w-full px-3 py-2 pt-6 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white disabled:bg-gray-100 disabled:cursor-not-allowed peer transition-colors"
                />
                <label
                  htmlFor="firstName"
                  className="absolute left-3 top-2 text-xs text-gray-500 peer-disabled:text-gray-400"
                >
                  名
                </label>
              </div>
            </div>

            {/* 権限選択 */}
            <div className="relative">
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(Number(e.target.value))}
                disabled={isCreating}
                className="w-full px-3 py-2 pt-6 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white disabled:bg-gray-100 disabled:cursor-not-allowed peer transition-colors"
              >
                {canCreateRole.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
              <label
                htmlFor="role"
                className="absolute left-3 top-2 text-xs text-gray-500 peer-disabled:text-gray-400"
              >
                ロール <span className="text-red-500">*</span>
              </label>
            </div>

            {/* 送信ボタン */}
            <div className="flex justify-end items-center gap-4 pt-6 border-t border-gray-200">
              <Link
                href="/users"
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors font-medium text-center cursor-pointer"
              >
                キャンセル
              </Link>
              <button
                type="submit"
                disabled={isCreating}
                className="px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors cursor-pointer"
              >
                {isCreating ? '作成中...' : 'ユーザーを作成'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

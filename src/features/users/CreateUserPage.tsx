'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { UserCreateForm } from './components/UserCreateForm';

/**
 * ユーザー作成ページのコンポーネント。
 *
 *
 * @returns {JSX.Element} ユーザー作成ページのコンポーネント
 */
export default function CreateUserPage() {
  // ページ遷移用のルーター
  const router = useRouter();

  // ステートの管理
  // 現在のユーザー権限情報
  const [currentUserRole, setCurrentUserRole] = useState<number | null>(null);
  // エラーメッセージ
  const [error, setError] = useState<string>('');

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
   * ユーザー作成成功時のハンドラー。
   * ユーザー作成が成功した際に呼び出され、ユーザー一覧ページへリダイレクトします。
   */
  const handleUserCreateSuccess = () => {
    router.push('/users');
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
        {/* ユーザー作成フォームコンポーネント */}
        <UserCreateForm
          currentUserRole={currentUserRole}
          onSuccess={handleUserCreateSuccess}
        />
      </main>
    </div>
  );
}

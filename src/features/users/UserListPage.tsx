'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { logout } from '@/lib/api';

// インターフェースの定義

/**
 * ユーザー情報のインターフェース。
 * ユーザー情報を表すためのインターフェースです。
 *
 * @interface User
 * @property {string} id - ユーザーID
 * @property {string} username - ユーザー名
 * @property {string} [firstName] - 名 (任意)
 * @property {string} [lastName] - 姓 (任意)
 * @property {number} role - ユーザー権限情報
 * @property {string} createdAt - 作成日時 (ISO8601形式)
 * @property {string} updatedAt - 更新日時 (ISO8601形式)
 *
 */
interface User {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  role: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * ページネーション情報のインターフェース。
 * APIから取得されるページネーション関連の情報を表すためのインターフェースです。
 *
 * @interface PaginationInfo
 * @property {number} currentPage - 現在のページ番号
 * @property {number} totalPages - 総ページ数
 * @property {number} totalItems - 総アイテム数
 * @property {number} itemsPerPage - 1ページ当たりのアイテム数
 */
interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

/**
 * Propsのインターフェース。
 * UserListPageコンポーネントに渡されるpropsの型を定義します。
 */
interface Props {
  currentUserId: string;
  currentUserRole: number;
}

/**
 * ロール番号とラベルの対応表。
 * ユーザーロール番号を対応するラベルに変換するためのオブジェクトです。
 *
 */
const roleLabels: Record<number, string> = {
  1: 'ADMIN',
  2: 'MANAGER',
  3: 'USER',
  4: 'GUEST',
};

/**
 * ロールごとのスタイルクラス。
 * ユーザー権限表示の際に、権限ごとに異なるスタイルを適用するためのオブジェクトです。
 * @returns {Record<number, string>} 権限ごとのスタイルクラスを返します。
 */
const roleStyles: Record<number, string> = {
  1: 'px-2 py-1 text-xs font-semibold rounded bg-red-100 text-red-800',
  2: 'px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800',
  3: 'px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-800',
  4: 'px-2 py-1 text-xs font-semibold rounded bg-gray-100 text-gray-800',
};
/**
 * ユーザー一覧ページコンポーネント。
 * ADMINおよびMANAGER専用のユーザー管理画面を表示するコンポーネントです。
 * @returns
 */
export default function UserListPage({ currentUserId, currentUserRole }: Props) {
  // ステートの管理

  // ユーザー一覧データ
  const [users, setUsers] = useState<User[]>([]);
  // 現在のページ番号
  const [page, setPage] = useState<number>(1);
  // ページネーション情報
  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo | null>(null);
  // ページの権限フィルター
  const [roleFilter, setRoleFilter] = useState<number | 'all'>('all');
  // ソート項目
  const [sortBy, setSortBy] = useState<
    'createdAt' | 'username' | 'firstName' | 'lastName' | 'role'
  >('createdAt');
  // ソート順序
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  // 検索キーワード(ユーザー名、名前で検索)
  const [searchQuery, setSearchQuery] = useState<string>('');
  // データ取得中フラグ
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // エラーメッセージ
  const [error, setError] = useState<string>('');

  /**
   * ユーザー一覧データを取得する非同期関数。
   * ユーザーの検索条件に基づいて、APIからユーザー一覧データを取得し、ステートに設定します。
   * useCallbackを使用して、依存配列内の値が変更された場合のみインスタンスが再生成されるようにします。
   * @return {Promise<void>}
   * @throws {Error} ユーザー一覧の取得に失敗した場合にエラーをスローします。
   */
  const fetchUsers = useCallback(async () => {
    // ローディング状態を設定し、エラーメッセージをクリア。
    setIsLoading(true);
    setError('');

    try {
      // クエリパラメータを構築
      const queryParams = new URLSearchParams({
        page: page.toString(),
        perPage: '20',
        sortBy,
        sortOrder,
      });

      // searchQueryが空でなければクエリパラメータに追加する。
      if (searchQuery.trim()) {
        queryParams.append('username', searchQuery.trim());
      }

      // roleFilterがallでなければクエリパラメータに追加する。
      if (roleFilter !== 'all') {
        queryParams.append('role', roleFilter.toString());
      }

      // 構築したクエリパラメータを使用してAPIエンドポイントを呼び出す
      const response = await fetch(`/api/users?${queryParams.toString()}`);

      // レスポンスのエラーチェック
      if (!response.ok) {
        throw new Error('ユーザー一覧の取得に失敗しました');
      }

      // レスポンスのデータをオブジェクトに変換
      const data = await response.json();

      // APIレスポンスは入れ子構造のため、ユーザーのデータを抽出して変数に格納
      const responseData = data.data;
      // ユーザー一覧データをステートに設定
      setUsers(responseData.data || []);
      // ページネーション情報をステートに設定
      setPaginationInfo({
        currentPage: responseData.pagination.currentPage,
        totalPages: responseData.pagination.totalPages,
        totalItems: responseData.pagination.totalUsers,
        itemsPerPage: responseData.pagination.perPage,
      });
    } catch (err) {
      // エラー発生時の処理
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    } finally {
      // ローディングの終了
      setIsLoading(false);
    }
  }, [page, roleFilter, sortBy, sortOrder, searchQuery]);

  // useEffectを使用して検索条件が変更されたときのデータの再取得処理を行います。
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  /**
   * ユーザー削除用の非同期関数。
   * 指定されたユーザーIDのアカウントを削除します。（ADMIN専用機能）
   * @param {string} userId - 削除するユーザーのID
   * @return {Promise<void>}
   * @throws {Error} ユーザー削除に失敗した場合にエラーをスローします。
   */
  const deleteUser = async (userId: string) => {
    // 削除確認ダイアログを表示
    if (!confirm('このユーザーを削除してもよろしいですか？')) {
      // ユーザーがキャンセルした場合は処理を中断
      return;
    }

    try {
      // DELETEリクエストを送信してユーザーを削除
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      // レスポンスのエラーチェック
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'ユーザーの削除に失敗しました');
      }

      // 削除終了後、ユーザー一覧を再取得して表示を更新。
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    }
  };

  /**
   * ログアウト処理の非同期関数。
   * 現在のユーザーをログアウトし、ログインページにリダイレクトします。
   *
   * @return {Promise<void>}
   * @throws {Error} ログアウトに失敗した場合にエラーをスローします。
   */
  const handleLogout = async () => {
    // ログアウトAPIを呼び出し
    await logout();
  };

  /**
   * ユーザーのフルネームを取得する関数。
   * ユーザーの姓と名を結合してフルネームを生成します。(なければ"name is not set"を返します)
   * @param {User} user - ユーザーオブジェクト
   * @return {string} ユーザーのフルネームまたはデフォルトメッセージ
   */
  const getFullName = (user: User): string => {
    if (user.firstName || user.lastName) {
      return `${user.lastName || ''} ${user.firstName || ''}`.trim();
    }
    return 'name is not set';
  };

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

            {/* ナビゲーションメニュー */}
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
              {/* ADMINまたはMANAGER権限のユーザーのみ表示 */}
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
              onClick={handleLogout}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 font-medium transition-colors cursor-pointer"
            >
              ログアウト
            </button>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-10 w-full">
        {/* エラーメッセージ表示 */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* ページタイトルと新規作成ボタン */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">ユーザー管理</h2>
          </div>
          {/* 新規ユーザー作成ボタン */}
          <Link
            href="/users/create"
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium whitespace-nowrap flex items-center gap-2 shadow-md hover:shadow-lg"
          >
            新規ユーザー作成
          </Link>
        </div>

        {/* 検索条件のコントロール */}
        <div className="bg-white shadow-md rounded-lg p-8 mb-8">
          <div className="mb-6">
            {/* 検索ボックス */}
            <div className="relative">
              <input
                id="search"
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1); // 検索条件が変わったらページ番号を1にリセット
                }}
                placeholder="ユーザー名で検索"
                className="w-full px-3 py-2 pt-6 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors peer"
              />
              <label
                htmlFor="search"
                className="absolute left-3 top-2 text-xs font-medium text-gray-500"
              >
                ユーザー検索
              </label>
            </div>
          </div>

          {/* ロールフィルター、ソートのコントロール */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="relative">
              <select
                id="roleFilter"
                value={roleFilter}
                onChange={(e) => {
                  // valueが文字列と数値の両方を取るので、パターンによって処理を分ける
                  const value =
                    e.target.value === 'all' ? 'all' : Number(e.target.value);
                  setRoleFilter(value);
                  setPage(1); // フィルター条件が変わったらページ番号を1にリセット
                }}
                className="w-full px-3 py-2 pt-6 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
              >
                <option value="all">すべて</option>
                <option value="1">ADMIN</option>
                <option value="2">MANAGER</option>
                <option value="3">USER</option>
                <option value="4">GUEST</option>
              </select>
              <label
                htmlFor="roleFilter"
                className="absolute left-3 top-2 text-xs font-medium text-gray-500 mb-2"
              >
                ロールフィルター
              </label>
            </div>

            {/* ソート項目 */}
            <div className="relative">
              <select
                id="sortBy"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="w-full px-3 py-2 pt-6 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
              >
                <option value="createdAt">作成日時</option>
                <option value="username">ユーザー名</option>
                <option value="firstName">名前</option>
                <option value="lastName">姓</option>
                <option value="role">ロール</option>
              </select>
              <label
                htmlFor="sortBy"
                className="absolute left-3 top-2 text-xs font-medium text-gray-500 mb-2"
              >
                並び順
              </label>
            </div>

            {/* ソート順序 */}
            <div className="relative">
              <select
                id="sortOrder"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                className="w-full px-3 py-2 pt-6 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
              >
                <option value="desc">降順</option>
                <option value="asc">昇順</option>
              </select>
              <label
                htmlFor="sortOrder"
                className="absolute left-3 top-2 text-xs font-medium text-gray-500"
              >
                順序
              </label>
            </div>
          </div>
        </div>

        {/* ユーザー一覧表示 */}
        <div className="bg-white shadow-md rounded-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">ユーザー一覧</h2>

            {/* ページネーション情報 */}
            {paginationInfo && (
              <p>
                全{paginationInfo.totalItems}件中{' '}
                {(paginationInfo.currentPage - 1) * paginationInfo.itemsPerPage + 1}～
                {Math.min(
                  paginationInfo.currentPage * paginationInfo.itemsPerPage,
                  paginationInfo.totalItems,
                )}
                件を表示
              </p>
            )}
          </div>

          {/* ローディング表示 */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-gray-500">読み込み中...</div>
            </div>
          ) : users.length === 0 ? ( // ユーザーが存在しない場合の表示
            <div className="text-center py-12 text-gray-500 text-lg">
              ユーザーが見つかりませんでした
            </div>
          ) : (
            // ユーザーリストをページネーションで表示。
            <div className="space-y-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    {/* ユーザー情報 */}
                    <div className="flex-1">
                      {/* ユーザー名 */}
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/users/${user.id}`}
                          className="font-medium text-lg text-gray-900 hover:text-blue-600 transition-colors"
                        >
                          {user.username}
                        </Link>
                        {/* ロールバッジ */}
                        <span className={roleStyles[user.role]}>
                          {roleLabels[user.role]}
                        </span>
                      </div>

                      {/* フルネーム */}
                      <p className="text-sm text-gray-600 mt-1">{getFullName(user)}</p>
                    </div>
                  </div>
                  {/* 詳細ボタン */}
                  <Link
                    href={`/users/${user.id}`}
                    className="px-4 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors font-medium"
                  >
                    詳細
                  </Link>
                  {/* ADMIN権限のユーザーのみ削除ボタンを表示（自分のアカウントは削除できないようにする） */}
                  {currentUserRole === 1 && user.id !== currentUserId && (
                    <button
                      type="button"
                      onClick={() => deleteUser(user.id)}
                      className="px-4 py-2 ml-3 text-sm bg-red-500 text-white rounded-md font-medium  hover:bg-red-600 transition-colors cursor-pointer"
                    >
                      削除
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ページネーションコントロールボタン */}
          {paginationInfo && paginationInfo.totalPages > 1 && (
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
              {/* 前のページボタン */}
              <button
                type="button"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-default transition-colors cursor-pointer"
              >
                前のページ
              </button>

              {/* 現在のページ情報 */}
              <span className="text-sm text-gray-600">
                ページ {paginationInfo.currentPage} / {paginationInfo.totalPages}
              </span>

              {/* 次のページボタン */}
              <button
                type="button"
                onClick={() => setPage(page + 1)}
                disabled={page === paginationInfo.totalPages}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-default transition-colors cursor-pointer"
              >
                次のページ
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { z } from 'zod';

// インターフェースの定義

/**
 * ページネーション情報
 * ページネーション情報の型インターフェースです。
 * @interface PaginationInfo
 * @property {number} currentPage - 現在のページ番号
 * @property {number} totalPages - 総ページ数
 * @property {number} totalItems - 総アイテム数
 * @property {number} itemsPerPage - 1ページあたりのアイテム数
 */
interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}
/** TODOアイテム
 * TODOアイテムの型インターフェースです。
 * @interface Todo
 * @property {number} id - TODO ID
 * @property {string} title - TODOタイトル
 * @property {string} [descriptions] - TODO説明（任意）
 * @property {boolean} completed - 完了状態
 * @property {number} userId - ユーザーID
 * @property {string} createdAt - 作成日時（ISO8601形式）
 * @property {string} updatedAt - 更新日時（ISO8601形式）
 */

interface Todo {
  id: number;
  title: string;
  descriptions: string | null;
  completed: boolean;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

// バリデーションスキーマの定義
/**
 * Todo作成用のバリデーションスキーマ
 * タイトルは1文字以上32文字以内、説明は128文字以内であることを検証します。
 * @constant {z.ZodObject} createTodoSchema - Todo作成用のZodスキーマ
 * @property {z.ZodString} title - タイトルのバリデーションルール
 * @property {z.ZodString} [descriptions] - 説明のバリデーションルール（任意）
 */
const createTodoSchema = z.object({
  title: z
    .string()
    .min(1, 'タイトルは必須です')
    .max(32, 'タイトルは32文字以内で入力してください'),
  descriptions: z.string().max(128, '説明は128文字以内で入力してください').optional(),
});

/**
 * Todo一覧表示画面のコンポーネント。
 *
 * @returns {JSX.Element} - Todo一覧表示画面のJSX要素
 */
export default function TodoListPage() {
  // ステートの管理

  // Todo一覧データ
  const [todos, setTodos] = useState<Todo[]>([]);
  // 現在のページ番号
  const [page, setPage] = useState<number>(1);
  // ページネーション情報
  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo | null>(null);
  // フィルターとソートの状態管理
  const [completedFilter, setCompletedFilter] = useState<
    'all' | 'completed' | 'incomplete'
  >('all');
  // ソート条件
  const [sortBy, setSortBy] = useState<'createdAt' | 'updatedAt' | 'title'>(
    'createdAt',
  );
  // ソート順の状態
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  // 新規Todoのタイトル
  const [newTodoTitle, setNewTodoTitle] = useState<string>('');
  // 新規Todoの説明
  const [newTodoDescription, setNewTodoDescription] = useState<string>('');
  // ローディング状態
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // Todo作成中の状態
  const [isCreating, setIsCreating] = useState<boolean>(false);
  // エラーメッセージ
  const [error, setError] = useState<string>('');
  // ユーザー権限の状態
  const [currentUserRole, setCurrentUserRole] = useState<number>(4);

  // ページ遷移用のフック
  const router = useRouter();

  // スクロール位置保持用のref
  const scrollPositionRef = useRef<number>(0);

  // 現在のユーザー情報を取得して、権限レベルを設定する。
  useEffect(() => {
    /**
     * ロール設定用の非同期関数。
     * 現在のユーザー情報を取得して、権限レベルを設定します。
     * @returns {Promise<void>} 非同期処理完了を表すPromise
     */
    const fetchUserInfo = async () => {
      try {
        const response = await fetch('/api/users/me');

        // 認証エラーの場合はログインページへリダイレクト
        if (response.status === 401) {
          router.push('/login');
          return;
        }

        // 認証OKの場合の処理
        if (response.ok) {
          const data = await response.json();
          // 現在ログイン中のユーザー情報を参照して権限レベルをステートに設定する。
          setCurrentUserRole(data.data.role);
        }
      } catch (err) {
        console.error('ユーザー情報の取得に失敗しました:', err);
      }
    };

    fetchUserInfo();
  }, [router]);

  // Todo一覧データを取得する。
  /**
   * Todo一覧データ取得用の非同期関数。
   * フィルター、ソート、ページネーションに基づいてTodo一覧データを取得します。
   * @returns {Promise<void>} 非同期処理完了を表すPromise
   */
  // fetchTodosは他の関数からも呼び出したいため、useCallbackでメモ化しています。
  const fetchTodos = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      // クエリパラメータを構築
      const queryParams = new URLSearchParams({
        page: page.toString(),
        perPage: '20',
        completedFilter,
        sortBy,
        sortOrder,
      });

      // APIエンドポイントにリクエストを送信
      const response = await fetch(`/api/todos?${queryParams}`);

      // エラーが発生した場合の処理
      if (!response.ok) {
        throw new Error('Todo一覧の取得に失敗しました');
      }
      // JSONデータをオブジェクトに変換する。
      const data = await response.json();

      // Todo一覧データとページネーション情報をステートに設定する。
      const responseData = data.data;
      // Todo一覧データをステートに設定する。
      setTodos(responseData.data || []);

      // ページネーション情報を設定する。
      setPaginationInfo({
        currentPage: responseData.page,
        totalPages: responseData.totalPages,
        totalItems: responseData.total,
        itemsPerPage: responseData.perPage,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  }, [page, completedFilter, sortBy, sortOrder]);

  // コンポーネント初回レンダリング時にTodo一覧データを取得する。
  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  /**
   * todo作成用の非同期関数。
   * フォーム送信時に呼び出され、新規Todoを登録します。
   * @param {React.FormEvent} e フォームイベント
   * @returns {Promise<void>} 非同期処理完了を表すPromise
   */
  const createTodo = async (e: React.FormEvent) => {
    e.preventDefault();

    /**
     * 入力バリデーションの実行
     */
    const validationInput = createTodoSchema.safeParse({
      title: newTodoTitle,
      descriptions: newTodoDescription,
    });
    // バリデーション失敗時の処理 エラーメッセージを設定して処理を中断する。
    if (!validationInput.success) {
      setError(validationInput.error.errors[0].message);
      return;
    }

    // Todo作成処理開始
    setIsCreating(true);
    setError('');

    try {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newTodoTitle.trim(),
          descriptions: newTodoDescription.trim() || undefined,
        }),
      });

      // レスポンスのエラーチェック
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Todoの作成に失敗しました');
      }

      // 成功したらフォームをリセットして、Todo一覧を再取得する。
      setNewTodoTitle('');
      setNewTodoDescription('');
      // Todo一覧を再取得する。
      await fetchTodos();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setIsCreating(false);
    }
  };

  /**
   * Todo完了状態切替を行う非同期関数。
   * Todo完了状態の切替を行い、Todo一覧を再取得します。
   * @param {Todo} todo - 対象のTodo
   */
  const toggleCompleteTodo = async (todo: Todo) => {
    // スクロール位置を保存
    scrollPositionRef.current = window.scrollY;

    try {
      const response = await fetch(`/api/todos/${todo.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: todo.title,
          descriptions: todo.descriptions ?? undefined, // 値がない場合はundefinedを設定する。
          completed: !todo.completed,
        }),
      });

      // レスポンスのエラーチェック
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Todoの更新に失敗しました');
      }

      // 一覧を再取得する。
      await fetchTodos();
      // スクロール位置を復元する。
      setTimeout(() => {
        window.scrollTo(0, scrollPositionRef.current);
      }, 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    }
  };
  /**
   * Todo削除用の非同期関数。
   * 指定したTodoの削除処理を行い、Todo一覧を再取得します。
   * @param {number} todoId - 削除対象のTodo ID
   * @returns {Promise<void>} 非同期処理完了を表すPromise
   */
  const deleteTodo = async (todoId: number) => {
    // 削除確認
    if (!confirm('このTodoを削除してもよろしいですか？')) return;
    try {
      const response = await fetch(`/api/todos/${todoId}`, {
        method: 'DELETE',
      });

      // レスポンスのエラーチェック
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Todoの削除に失敗しました');
      }

      // 一覧を再取得する。
      await fetchTodos();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    }
  };
  /**
   * ログアウト用の非同期関数。
   * アカウントのログアウト処理を行い、ログインページへリダイレクトします。
   * @returns {Promise<void>} 非同期処理完了を表すPromise
   */
  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
      // ログインページへリダイレクト
      router.push('/login');
    } catch (err) {
      console.error('ログアウトに失敗しました:', err);
    }
  };

  /**
   * テキストエリアの自動リサイズ関数
   * 入力内容に応じてテキストエリアの高さを自動調整します。
   * @param {HTMLTextAreaElement} textarea - 対象のテキストエリア要素
   */
  const autoResizeTextarea = (element: HTMLTextAreaElement) => {
    // 高さのスタイルをリセット
    element.style.height = 'auto';
    // スクロール高さに基づいて高さを設定
    element.style.height = `${element.scrollHeight}px`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* ヘッダーナビゲーション */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/todos" className="hover:opacity-80 transition-opacity">
              <h1 className="text-3xl font-bold text-gray-900">Todoアプリ</h1>
            </Link>

            <nav className="flex items-center gap-6">
              <Link
                href="/todos"
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
              >
                Todo一覧
              </Link>
              <Link
                href="profile"
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
              >
                プロフィール
              </Link>
              {/* ADMIN・MANAGERの場合のみ表示 */}
              {currentUserRole <= 2 && (
                <Link
                  href="/users"
                  className="text-gray-700 hover:text-blue-500 font-medium transition-colors"
                >
                  ユーザー管理
                </Link>
              )}
            </nav>

            <button
              type="button"
              onClick={logout}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 fontmedium transition-colors"
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

        {/* Todo作成フォーム */}
        <div className="bg-white shadow-md rounded-lg p-8 mb-10">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            新しいTodoを作成
          </h2>

          <form onSubmit={createTodo} className="space-y-6">
            {/* タイトル入力欄 */}
            <div className="relative">
              <input
                id="title"
                type="text"
                value={newTodoTitle}
                onChange={(e) => setNewTodoTitle(e.target.value)}
                disabled={isCreating}
                maxLength={32}
                placeholder="Todoのタイトル（32文字以内）"
                className="w-full px-3 py-2 pt-6 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white disabled:bg-gray-100 disabled:cursor-not-allowed peer transition-colors"
              />
              <label
                htmlFor="title"
                className="absolute left-3 top-2 text-xs font-medium text-gray-500 peer-disabled:text-gray-400"
              >
                タイトル<span className="text-red-500 text-xs ml-0.5">*</span>
              </label>
            </div>

            <div className="relative">
              <textarea
                id="description"
                value={newTodoDescription}
                onChange={(e) => {
                  setNewTodoDescription(e.target.value);
                  autoResizeTextarea(e.target);
                }}
                disabled={isCreating}
                maxLength={128}
                rows={1}
                placeholder="Todoの説明（128文字以内）"
                className="w-full px-3 py-2 pt-6 pb-2 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white disabled:bg-gray-100 disabled:cursor-not-allowed peer transition-colors resize-none min-h-[100px]"
              />
              <label
                htmlFor="description"
                className="absolute left-3 top-2 text-xs font-medium text-gray-500 peer-disabled:text-gray-400"
              >
                説明
              </label>
            </div>

            {/* Todo作成ボタン */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isCreating}
                className="px-8 py-2.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isCreating ? '作成中...' : '作成'}
              </button>
            </div>
          </form>
        </div>

        {/* フィルター・ソートコントロール */}
        <div className="bg-white shadow-md rounded-lg p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 表示フィルター */}
            <div>
              <label
                htmlFor="filter"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                表示フィルター
              </label>
              <select
                id="filter"
                value={completedFilter}
                onChange={(e) => {
                  setCompletedFilter(
                    e.target.value as 'all' | 'completed' | 'incomplete',
                  );
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus: ring-blue-500"
              >
                <option value="all">すべて</option>
                <option value="completed">完了済み</option>
                <option value="incomplete">未完了</option>
              </select>
            </div>

            {/* ソート項目 */}
            <div>
              <label
                htmlFor="sortBy"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                並び順
              </label>
              <select
                id="sortBy"
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as 'createdAt' | 'updatedAt' | 'title')
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="createdAt">作成日時</option>
                <option value="updatedAt">更新日時</option>
                <option value="title">タイトル</option>
              </select>
            </div>

            {/* ソート順序 */}
            <div>
              <label
                htmlFor="sortOrder"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                順序
              </label>
              <select
                id="sortOrder"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="desc">降順</option>
                <option value="asc">昇順</option>
              </select>
            </div>
          </div>
        </div>

        {/* Todo一覧表示 */}
        <div className="bg-white shadow-md rounded-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Todo一覧</h2>

            {/* ページネーション情報 */}
            {paginationInfo && (
              <p className="text-sm text-gray-600">
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
          ) : todos.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-lg">
              Todoがありません
            </div>
          ) : (
            <div className="space-y-4">
              {todos.map((todo) => (
                <div
                  key={todo.id}
                  className="flex items-center justify-between p-5 bg-gray-50 rouded-lg border border-gray-200 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-start gap-4 flex-1">
                    {/* 完了チェックボックス */}
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      onChange={() => toggleCompleteTodo(todo)}
                      className="mt-1 w-5 h-5 text-blue-500 rouded-md border-gray-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                    />

                    <div className="flex-1">
                      {/* タイトル */}
                      <Link
                        href={`/todos/${todo.id}`}
                        className="hover:text-blue-600 transition-colors"
                      >
                        <h3
                          className={`font-medium text-lg ${
                            todo.completed
                              ? 'line-through text-gray-500'
                              : 'text-gray-900'
                          }`}
                        >
                          {todo.title}
                        </h3>
                      </Link>

                      {/* 説明 */}
                      {todo.descriptions && (
                        <p className="text-sm text-gray-600 mt-2">
                          {todo.descriptions}
                        </p>
                      )}

                      {/* 作成・更新日時 */}
                      <p className="text-xs text-gray-400 mt-3">
                        作成: {new Date(todo.createdAt).toLocaleString('ja-JP')}
                      </p>
                    </div>
                  </div>

                  {/* アクションボタン */}
                  <div className="flex items-center gap-3 ml-4">
                    {/* 編集ボタン */}
                    <Link
                      href={`/todos/${todo.id}`}
                      className="px-4 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors font-medium"
                    >
                      詳細
                    </Link>

                    {/* 削除ボタン */}
                    <button
                      type="submit"
                      onClick={() => deleteTodo(todo.id)}
                      className="px-4 py-2 text-sm bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors font-medium cursor-pointer"
                    >
                      削除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ページネーションコントロール */}
          {paginationInfo && paginationInfo.totalPages > 1 && (
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
              <button
                type="submit"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 cursor-pointer disabled:opacity-50 disabled:cursor-default transition-colors font-medium"
              >
                前のページ
              </button>
              <span className="text-sm text-gray-600">
                ページ {paginationInfo.currentPage} / {paginationInfo.totalPages}
              </span>
              <button
                type="submit"
                onClick={() => setPage(page + 1)}
                disabled={page === paginationInfo.totalPages}
                className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 cursor-pointer disabled:opacity-50 disabled:cursor-default transition-colors font-medium"
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

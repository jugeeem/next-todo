'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { z } from 'zod';

// インターフェースの定義

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

/**
 * Todo更新用のバリデーションスキーマ。
 * タイトルは1文字以上32文字以内、説明は128文字以内であることを検証します。
 */
const updateTodoSchema = z.object({
  title: z
    .string()
    .min(1, 'タイトルは必須です')
    .max(32, 'タイトルは32文字以内で入力してください'),
  descriptions: z.string().max(128, '説明は128文字以内で入力してください').optional(),
});

/**
 * Todo詳細/編集ページのコンポーネント。
 *
 * @returns {JSX.Element} - Todo詳細/編集ページのJSX要素
 */
export default function TodoDetailPage() {
  // ステートの定義

  // TODOアイテムの状態
  const [todo, setTodo] = useState<Todo | null>(null);
  // タイトルフォームの入力状態
  const [title, setTitle] = useState<string>('');
  // 説明フォームの入力状態
  const [descriptions, setDescriptions] = useState<string>('');
  // 編集中かどうかの状態
  const [isEditing, setIsEditing] = useState<boolean>(false);
  // ローディング状態
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // エラーメッセージの状態
  const [error, setError] = useState<string>('');
  // 現在のユーザーの権限情報
  const [currentUserRole, setCurrentUserRole] = useState<number>(4);

  // ルーターとパラメータの取得
  const router = useRouter();
  const params = useParams();
  const todoId = params.id;

  /**
   * 初回レンダリング時の処理。
   * ユーザー情報とTODO詳細の取得を行います。
   */
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError('');
      try {
        // ユーザー情報とTODO詳細の取得を平行して実行
        const [userResponse, todoResponse] = await Promise.all([
          fetch('/api/users/me'),
          fetch(`/api/todos/${todoId}`),
        ]);

        if (!userResponse.ok) {
          const errorData = await userResponse.json();
          throw new Error(errorData.error || 'ユーザー情報の取得に失敗しました');
        }

        // 権限情報の設定
        if (userResponse.ok) {
          const data = await userResponse.json();
          setCurrentUserRole(data.data.role);
        }

        if (!todoResponse.ok) {
          const errorData = await todoResponse.json();
          throw new Error(errorData.error || 'Todoの取得に失敗しました');
        }

        // Todo詳細の取得
        const todoData = await todoResponse.json();
        setTodo(todoData.data);
        setTitle(todoData.data.title);
        setDescriptions(todoData.data.descriptions || '');
      } catch (err) {
        setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
      } finally {
        setIsLoading(false);
      }
    };
    // データの取得を実行
    fetchData();
  }, [todoId]);

  /**
   * TODOの更新処理。
   * フォームの入力値をAPIに送信してTODOを更新します
   * @param {React.FormEvent} e - フォームの送信イベント
   * @returns {Promise<void>}
   */
  const updateTodo = async (e: React.FormEvent) => {
    e.preventDefault();

    // 入力値のバリデーション
    const validation = updateTodoSchema.safeParse({
      title: title,
      descriptions: descriptions,
    });

    // バリデーションエラー時の処理
    if (!validation.success) {
      setError(validation.error.errors[0].message);
      return;
    }

    // 更新処理の開始
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/todos/${todoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          descriptions: descriptions.trim() ?? undefined, // 値がない場合はundefinedを設定する
          completed: todo?.completed || false,
        }),
      });

      // レスポンスのエラーチェック
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Todoの更新に失敗しました');
      }

      // 更新成功時の処理
      const updatedTodo = await response.json();
      setTodo(updatedTodo.data);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * TODOの削除処理
   * 確認ダイアログを表示し、OKの場合にAPIに削除リクエストを送信します。
   * @returns {Promise<void>}
   */
  const deleteTodo = async () => {
    if (!confirm('このTodoを削除してもよろしいですか？')) return;

    // 削除処理の開始
    try {
      const response = await fetch(`/api/todos/${todoId}`, {
        method: 'DELETE',
      });
      // レスポンスのエラーチェック
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Todoの削除に失敗しました');
      }

      // 削除成功後は一覧ページにリダイレクト
      router.push('/todos');
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    }
  };

  /**
   * ログアウト用の非同期関数。
   * アカウントのログアウトを行い、ログインページにリダイレクトします。
   * @returns {Promise<void>}
   */
  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
      // ログインページにリダイレクト
      router.push('/login');
    } catch (err) {
      console.error('ログアウトに失敗しました:', err);
    }
  };

  /**
   * 編集キャンセル時の処理。
   * TODOの内容を元に戻して、編集モードを終了します。
   *
   */
  const cancelEdit = () => {
    if (todo) {
      setTitle(todo.title);
      setDescriptions(todo.descriptions || '');
    }
    setIsEditing(false);
    setError('');
  };

  /**
   * テキストエリアの自動リサイズ関数
   * 入力内容に応じてテキストエリアの高さを自動調整します。
   * @param {<HTMLTextAreaElement>} textarea - 対象のテキストエリア要素
   */
  const autoResizeTextarea = (element: HTMLTextAreaElement) => {
    // 高さのスタイルをリセット
    element.style.height = 'auto';
    // スクロール高さに基づいて高さを設定
    element.style.height = `${element.scrollHeight}px`;
  };

  // ロード中表示
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-gray-500 text-lg">読み込み中...</div>
        </div>
      </div>
    );
  }

  // Todoのnullチェック
  if (!todo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-4">Todoが見つかりません</p>
          <Link href="/todos" className="text-blue-500 hover:text-blue-600 font-medium">
            ← Todo一覧に戻る
          </Link>
        </div>
      </div>
    );
  }

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
        {/* 戻るリンク */}
        <div className="mb-6">
          <Link
            href="/todos"
            className="text-blue-500 hover:text-blue-600 font-medium transition-colors"
          >
            ← Todo一覧に戻る
          </Link>
        </div>

        {/* エラーメッセージ表示 */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Todo詳細/編集フォーム */}
        <div className="bg-white shadow-md rounded-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">
              {isEditing ? 'Todo編集' : 'Todo詳細'}
            </h2>

            {/* 完了状態 */}
            <span
              className={`px-3 py-1 text-sm font-semibold rounded ${
                todo.completed
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {todo.completed ? '完了' : '未完了'}
            </span>
          </div>

          {isEditing ? (
            // 編集中表示画面
            <form onSubmit={updateTodo} className="space-y-6">
              {/* タイトル入力欄 */}
              <div className="relative">
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isLoading}
                  maxLength={32}
                  placeholder="Todoのタイトル（32文字以内）"
                  className="w-full px-3 py-2 pt-6 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white disabled:bg-gray-100 disabled:cursor-not-allowed peer transition-colors"
                />
                <label
                  htmlFor="title"
                  className="absolute left-3 top-2 text-xs text-gray-500 peer-disabled:text-gray-400"
                >
                  タイトル<span>*</span>
                </label>
              </div>

              {/* 説明入力欄 */}
              <div className="relative">
                <textarea
                  id="descriptions"
                  value={descriptions}
                  onChange={(e) => {
                    setDescriptions(e.target.value);
                    autoResizeTextarea(e.target);
                  }}
                  disabled={isLoading}
                  maxLength={128}
                  rows={1}
                  placeholder="Todoの説明（128文字以内）"
                  className="w-full px-3 py-2 pt-6 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white disabled:bg-gray-100 disabled:bg-gray-100 disabled:cursor-not-allowed peer transition-colors resize-none min-h-[100px]"
                />
                <label
                  htmlFor="descriptions"
                  className="absolute left-3 top-2 text-xs font-medium text-gray-500 peer-disabled:text-gray-400"
                >
                  説明
                </label>
              </div>

              {/* ボタン */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={cancelEdit}
                  disabled={isLoading}
                  className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-8 py-2.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {isLoading ? '保存中...' : '保存'}
                </button>
              </div>
            </form>
          ) : (
            /* Todo詳細フォーム表示 */
            // TODOタイトル
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">タイトル</h3>
                <p className="text-lg text-gray-900">{todo.title}</p>
              </div>
              {/* TODO説明 */}
              {todo.descriptions && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">説明</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {todo.descriptions}
                  </p>
                </div>
              )}

              {/* 日時情報 */}
              <div className="pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">作成日時: </span>
                    <span className="text-gray-700">
                      {new Date(todo.createdAt).toLocaleString('ja-JP')}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">更新日時: </span>
                    <span className="text-gray-700">
                      {new Date(todo.updatedAt).toLocaleString('ja-JP')}
                    </span>
                  </div>
                </div>
              </div>

              {/* ボタン */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={deleteTodo}
                  className="px-6 py-2.5 bg-red-500 text-white rounded-md hover:bg-red-600 font-medium transition-colors cursor-pointer"
                >
                  削除
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(true);
                  }}
                  className="px-6 py-2.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors font-medium cursor-pointer"
                >
                  編集
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

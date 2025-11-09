'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

// インターフェースの定義
/**
 * ユーザー情報のインターフェース。
 * APIから取得するユーザー情報の型を定義します。
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
 * Todo情報のインターフェース。
 * APIから取得するTodo情報の型を定義します。
 *
 * @interface Todo
 * @property {string} id - Todo ID
 * @property {string} title - Todoタイトル
 * @property {string} descriptions - Todo説明
 * @property {boolean} completed - 完了フラグ
 * @property {string} userId - 登録ユーザーID
 * @property {string} createdAt - 作成日時 (ISO8601形式)
 * @property {string} updatedAt - 更新日時 (ISO8601形式)
 */
interface Todo {
  id: string;
  title: string;
  descriptions: string | null;
  completed: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * UserDetailPageコンポーネントのプロパティインターフェース。
 * 動的ルーティングで渡されるパラメータの型を定義します。
 *
 * @interface UserDetailPageProps
 * @property {Promise<{ id: string }>} params - URLパラメータとして渡されるユーザーIDを含むオブジェクトのPromise
 */
interface UserDetailPageProps {
  params: Promise<{ id: string }>;
}
/**
 * 権限情報とラベルの対応表
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
 *
 */
const roleStyles: Record<number, string> = {
  1: 'px-2 py-1 text-xs font-semibold rounded bg-red-100 text-red-800',
  2: 'px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800',
  3: 'px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-800',
  4: 'px-2 py-1 text-xs font-semibold rounded bg-gray-100 text-gray-800',
};

/**
 * ユーザー詳細ページのページコンポーネント。
 * ユーザーの詳細情報と、そのユーザーに関連するTodoリストを表示します(ADMIN・MANAGERのみ閲覧可能)
 *
 * @param props - params.id
 */
export default function UserDetailPage({ params }: UserDetailPageProps) {
  // ステートの定義
  // URLパラメータから取得したユーザーID paramsがPromise型のため、useStateで管理する。
  const [userId, setUserId] = useState<string>('');
  // 表示中のユーザー情報
  const [user, setUser] = useState<User | null>(null);
  // 名前の情報
  const [firstName, setFirstName] = useState<string>('');
  // 姓の情報
  const [lastName, setLastName] = useState<string>('');
  // ユーザー権限
  const [role, setRole] = useState<number>(4);
  // ユーザーに関連するTodoリスト
  const [todos, setTodos] = useState<Todo[]>([]);
  // Todoの表示件数
  const [displayTodoCount, setDisplayTodoCount] = useState<number>(10); // 初期表示件数10件
  // 情報編集モードのフラグ
  const [isEditing, setIsEditing] = useState<boolean>(false);
  // ローディング状態のフラグ
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // 保存中状態のフラグ
  const [isSaving, setIsSaving] = useState<boolean>(false);
  // エラーメッセージ
  const [error, setError] = useState<string>('');
  // 成功メッセージ
  const [successMessage, setSuccessMessage] = useState<string>('');
  // 現在のユーザーのロール
  const [currentUserRole, setCurrentUserRole] = useState<number>(4);
  // 現在のユーザーのID
  const [currentUserId, setCurrentUserId] = useState<string>('');

  // ページ遷移情報
  const router = useRouter();

  /**
   * URLパラメータの取得。
   * paramsがPromise型を返すため、useEffectで取得し、userIdステートに設定します。
   */
  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setUserId(resolvedParams.id);
    };
    // paramsが変更されたときに実行
    getParams();
  }, [params]);

  /**
   * 権限チェック処理。
   * 初回レンダリング時、現在のユーザーの権限をチェックし、ADMINまたはMANAGERでない場合はユーザー一覧ページへリダイレクトします。
   */
  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const response = await fetch('/api/users/me');

        // 401エラーの場合、ログインページにリダイレクト。
        if (response.status === 401) {
          router.push('/login');
          return;
        }

        // エラーレスポンスの場合は、例外をスロー
        if (!response.ok) {
          throw new Error('ユーザー情報の取得に失敗しました');
        }
        // 認証成功時の処理
        // レスポンスデータの取得
        const data = await response.json();
        // 現在のユーザーの権限情報を取得
        const userRole = data.data.role;

        // ADMINまたはMANGER権限の場合のみアクセス可能。アクセス権がない場合はユーザー一覧ページへリダイレクト。
        if (userRole >= 3) {
          router.push('/todos');
          return;
        }

        // ステートに現在のユーザーの権限とIDを設定
        setCurrentUserRole(userRole);
        setCurrentUserId(data.data.id);
      } catch (err) {
        // エラーが発生した場合は、コンソールにエラーメッセージを出力し、ログインページにリダイレクト
        console.error('権限チェックエラー: ', err);
        setError(
          err instanceof Error ? err.message : '不明なエラーが発生しました'
        );
        router.push('/login');
      }
    };

    // 実行
    checkUserRole();
  }, [router]);

  /**
   * ユーザー詳細情報の取得処理。
   * userIdが設定されたときに実行され、指定されたユーザーIDの詳細情報をAPIから取得します。
   * この処理は、Todo一覧の取得処理と一緒に実行されます。
   * @return {Promise<void>}
   * @throws {Error} ユーザー情報の取得に失敗した場合にスローされるエラー
   */
  const fetchUser = useCallback(async () => {
    // userIdが未設定の場合は処理を中断
    if (!userId) return;
    // ローディング状態の設定とエラーメッセージのクリア
    setIsLoading(true);
    setError('');

    // 処理の開始
    try {
      const response = await fetch(`/api/users/${userId}`);
      // 401エラーの場合、ログインページにリダイレクト。
      if (response.status === 401) {
        router.push('/login');
        return;
      }
      // エラーレスポンスの場合は、例外をスロー
      if (!response.ok) {
        throw new Error('ユーザー情報の取得に失敗しました');
      }

      // レスポンスデータをオブジェクトに変換し、ステートに設定する。
      const data = await response.json();
      const userData = data.data;

      setUser(userData);
      setFirstName(userData.firstName || '');
      setLastName(userData.lastName || '');
      setRole(userData.role);
    } catch (err) {
      // エラーが発生した場合はエラーメッセージをステートに設定する
      setError(
        err instanceof Error ? err.message : '不明なエラーが発生しました'
      );
    } finally {
      setIsLoading(false);
    }
  }, [userId, router]);

  /**
   * ユーザーのTodo一覧の取得処理。
   * この処理は、ユーザー詳細情報の取得処理と一緒に実行されます。
   * @return {Promise<void>}
   * @throws {Error} Todo一覧の取得に失敗した場合にスローされるエラー
   */
  const fetchUserTodos = useCallback(async () => {
    // userIdが未設定の場合は処理を中断
    if (!userId) return;
    // MANAGERの場合は、自分以外のユーザーのTodoは取得しない。
    if (currentUserRole === 2 && currentUserId !== userId) {
      setTodos([]);
      return;
    }
    // ローディング情報の設定。
    setIsLoading(true);

    // 処理の開始
    try {
      const response = await fetch(`/api/users/${userId}/todos`);

      // レスポンスのエラーチェック
      if (!response.ok) {
        throw new Error('Todo一覧の取得に失敗しました');
      }

      // レスポンスデータの取得とステートへの設定
      const data = await response.json();

      setTodos(data.data || []);
    } catch (err) {
      // エラーが発生した場合はコンソールにエラーメッセージを出力
      console.error('Todo取得エラー: ', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId, currentUserRole, currentUserId]);

  /**
   * ユーザー詳細情報とTodo一覧の同時取得。
   * userIdが設定されたときに、ユーザー詳細情報とTodo一覧を同時に取得します。
   */
  useEffect(() => {
    if (userId && currentUserId) {
      // 権限チェック完了後にデータを取得
      fetchUser();
      fetchUserTodos();
    }
  }, [userId, currentUserId, fetchUser, fetchUserTodos]);

  /**
   * ユーザー情報の更新処理。
   * ユーザー情報の編集が完了したときに実行され、APIに更新リクエストを送信します。
   * @return {Promise<void>}
   * @throws {Error} ユーザー情報の更新に失敗した場合にスローされるエラー
   */
  const handleSave = async () => {
    // ユーザー情報が未設定の場合は処理を中断する。
    if (!user) return;

    // 保存中状態の設定とエラーメッセージ・成功メッセージのクリア
    setIsSaving(true);
    setError('');
    setSuccessMessage('');

    // 処理の開始
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName,
          lastName,
          role,
        }),
      });

      // エラーレスポンスの場合は、例外をスロー
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'ユーザー情報の更新に失敗しました');
      }

      // 成功後の処理
      setSuccessMessage('ユーザー情報を更新しました');
      setIsEditing(false);

      // 最新データを再取得
      await fetchUser();

      // 3秒後にメッセージをクリア
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : '不明なエラーが発生しました'
      );
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * ユーザー削除処理。
   * ユーザー削除ボタンがクリックされたときに実行され、APIに削除リクエストを送信します。
   *
   * @return {Promise<void>}
   * @throws {Error} ユーザー削除に失敗した場合にスローされるエラー
   */
  const deleteUser = async () => {
    // ユーザー情報が未設定の場合は処理を中断する。
    if (!user) return;

    /// 確認ダイアログの表示
    if (!confirm('本当にこのユーザーを削除しますか？')) return;

    // 処理の開始
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      // エラーレスポンスの場合は、例外をスロー
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'ユーザーの削除に失敗しました');
      }
      // 削除成功後は、ユーザー一覧ページにリダイレクト
      router.push('/users');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : '不明なエラーが発生しました'
      );
    }
  };

  /**
   * ログアウト処理。
   * ログアウトボタンがクリックされたときに実行され、APIにログアウトリクエストを送信します。
   *
   * @return {Promise<void>}
   * @throws {Error} ログアウトに失敗した場合にスローされるエラー
   */
  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
      router.push('/login');
    } catch (err) {
      // エラーが発生した場合はコンソールにエラーメッセージを出力
      console.error('ログアウトに失敗しました: ', err);
    }
  };

  /**
   * フルネーム表示用の関数。
   * firstNameとlastNameを結合してフルネームを生成します。
   *
   * @param {User} userData - ユーザー情報オブジェクト
   * @return {string} フルネームまたは「name is not set」
   */
  const getFullName = (userData: User): string => {
    if (userData.firstName || userData.lastName) {
      return `${userData.lastName || ''} ${userData.firstName || ''}`.trim();
    }
    return 'name is not set';
  };

  // 表示するTodoリストを取得
  const displayTodos = todos.slice(0, displayTodoCount);

  /**
   * もっと見るボタンのクリックハンドラ。
   * 表示するTodoの件数を増やします。
   */
  const loadMoreTodos = () => {
    setDisplayTodoCount((prevState) => prevState + 10);
  };

  // 権限チェック中のローディング表示
  // ネストが深くなるとコードが読みにくいので早期リターンで対応します。
  if (!currentUserId) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-gray-500'>権限を確認中...</div>
      </div>
    );
  }

  // データ読み込み中
  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-gray-500'>読み込み中...</div>
      </div>
    );
  }

  // ユーザー情報が取得できなかった場合
  if (!user) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-red-500'>ユーザー情報が見つかりません。</div>
      </div>
    );
  }
  // メインレンダリング
  return (
    <div className='min-h-screen flex flex-col bg-gray-50'>
      {/* ヘッダーナビゲーション */}
      <header className='bg-white shadow-sm border-b border-gray-200'>
        <div className='max-w-7xl mx-auto px-6 py-4'>
          <div className='flex items-center justify-between'>
            <Link href='/todos' className='hover:opacity-80 transition-opacity'>
              <h1 className='text-3xl font-bold text-gray-900'>Todoアプリ</h1>
            </Link>

            <nav className='flex items-center gap-6'>
              <Link
                href='/todos'
                className='text-gray-700 hover:text-blue-600 font-medium transition-colors'
              >
                Todo一覧
              </Link>
              <Link
                href='/profile'
                className='text-gray-700 hover:text-blue-600 font-medium transition-colors'
              >
                プロフィール
              </Link>
              {currentUserRole <= 2 && (
                <Link
                  href='/users'
                  className='text-gray-700 hover:text-blue-600 font-medium transition-colors'
                >
                  ユーザー管理
                </Link>
              )}
            </nav>

            <button
              type='button'
              onClick={logout}
              className='px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transiton-colors font-medium cursor-pointer'
            >
              ログアウト
            </button>
          </div>
        </div>
      </header>

      <main className='flex-1 max-w-7xl mx-auto px-6 py-10 w-full'>
        {/* メインコンテンツ */}
        {/* エラーメッセージ */}
        {error && (
          <div className='mb-8 p-4 border border-red-200 rounded-lg bg-red-50'>
            <p className='text-red-700 text-sm'>{error}</p>
          </div>
        )}
        {/* 成功メッセージ */}
        {successMessage && (
          <div className='mb-8 p-4 bg-green-50 border border-green-200 rounded-lg'>
            <p className='text-green-700 text-sm'>{successMessage}</p>
          </div>
        )}

        {/* ページタイトルとユーザー情報の表示・編集部分 */}
        <div className='flex items-center justify-between mb-6'>
          <div>
            <h2 className='text-3xl font-bold text-gray-900'>ユーザー管理</h2>
          </div>
          <div className='flex items-center gap-3'>
            {/* 戻るボタン */}
            <Link
              href='/users'
              className='px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 font-medium transition-colors'
            >
              ユーザー一覧に戻る
            </Link>
          </div>
        </div>

        {/* ユーザー情報カード */}
        <div className='bg-white shadow-md rounded-lg p-8 mb-8'>
          <div className='flex items-center justify-between mb-6'>
            <h3 className='text-2xl font-semibold text-gray-900'>
              ユーザー情報
            </h3>
            {/* 編集ボタン(ADMINのみ) */}
            {currentUserRole === 1 && !isEditing && (
              <button
                type='button'
                onClick={() => setIsEditing(true)}
                className='px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors font-medium cursor-pointer'
              >
                編集
              </button>
            )}
            {/* 保存・キャンセルボタン */}
            {isEditing && (
              <div className='flex items-center gap-3'>
                <button
                  type='button'
                  onClick={handleSave}
                  disabled={isSaving}
                  className='px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 transition-colors font-medium cursor-pointer'
                >
                  {isSaving ? '保存中...' : '保存'}
                </button>
                <button
                  type='button'
                  onClick={() => {
                    setIsEditing(false);
                    setFirstName(user.firstName || '');
                    setLastName(user.lastName || '');
                    setRole(user.role);
                  }}
                  disabled={isSaving}
                  className='px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 transition-colors font-medium cursor-pointer'
                >
                  キャンセル
                </button>
              </div>
            )}
          </div>

          {/* ユーザー情報表示 */}

          {/* 編集モードでない場合 */}
          {!isEditing ? (
            <div className='space-y-4'>
              {/* ユーザー名 */}
              <div>
                <label
                  htmlFor='username-display'
                  className='block text-sm font-medium text-gray-500 mb-1'
                >
                  ユーザー名
                </label>
                <p id='username-display' className='text-lg text-gray-900'>
                  {user.username}
                </p>
              </div>
              {/* 名前・権限*/}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {/* 名前 */}
                <div>
                  <label
                    htmlFor='fullname-display'
                    className='block text-sm font-medium text-gray-500'
                  >
                    名前
                  </label>
                  <p id='fullname-display' className='text-lg text-gray-900'>
                    {getFullName(user)}
                  </p>
                </div>
                {/* 権限 */}
                <div>
                  <label
                    htmlFor='role-display'
                    className='block text-sm font-medium text-gray-500 mb-1'
                  >
                    ロール
                  </label>
                  <span id='role-display' className={roleStyles[user.role]}>
                    {roleLabels[user.role]}
                  </span>
                </div>
              </div>

              {/* 作成日時・更新日時 */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {/* 作成日時 */}
                <div>
                  <label
                    htmlFor='create-at-display'
                    className='block text-sm font-medium text-gray-500 mb-1'
                  >
                    作成日時
                  </label>
                  <p id='create-at-display' className='text-gray-700'>
                    {new Date(user.createdAt).toLocaleString('ja-JP')}
                  </p>
                </div>
                {/* 更新日時 */}
                <div>
                  <label
                    htmlFor='update-at-display'
                    className='block text-sm font-medium text-gray-500 mb-1'
                  >
                    更新日時
                  </label>
                  <p id='update-at-display' className='text-gray-700'>
                    {new Date(user.updatedAt).toLocaleString('ja-JP')}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            // 編集モード
            <div className='space-y-6'>
              {/* 名前編集 */}

              {/* ユーザー名 */}
              <div>
                <label
                  htmlFor='username-readonly'
                  className='block text-sm font-medium text-gray-500 mb-1'
                >
                  ユーザー名（変更不可）
                </label>
                <p id='username-readonly' className='text-lg text-gray-400'>
                  {user.username}
                </p>
              </div>

              {/* 姓 */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='relative'>
                  <input
                    id='lastName'
                    type='text'
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={isSaving}
                    className='w-full px-3 py-2 pt-6 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white disabled:bg-gray-100 disabled:cursor-not-allowed peer transition-colors'
                  />
                  <label
                    htmlFor='lastName'
                    className='absolute left-3 top-2 text-xs text-gray-500 peer-disabled:text-gray-400'
                  >
                    姓
                  </label>
                </div>

                {/* 名 */}
                <div className='relative'>
                  <input
                    id='firstName'
                    type='text'
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={isSaving}
                    className='w-full px-3 py-2 pt-6 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white disabled:bg-gray-100 disabled:cursor-not-allowed peer transition-colors'
                  />
                  <label
                    htmlFor='firstName'
                    className='absolute left-3 top-2 text-xs text-gray-500 peer-disabled:text-gray-400'
                  >
                    名
                  </label>
                </div>
              </div>

              {/* 権限編集 */}
              <div className='relative'>
                <select
                  id='role'
                  value={role}
                  onChange={(e) => setRole(Number(e.target.value))}
                  disabled={isSaving}
                  className='w-full px-3 py-2 pt-6 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white disabled:bg-gray-100 disabled:cursor-not-allowed peer transition-colors'
                >
                  <option value={1}>ADMIN</option>
                  <option value={2}>MANAGER</option>
                  <option value={3}>USER</option>
                  <option value={4}>GUEST</option>
                </select>
                <label
                  htmlFor='role'
                  className='absolute left-3 top-2 text-xs text-gray-500 peer-disabled:text-gray-400'
                >
                  ロール
                </label>
              </div>
            </div>
          )}

          {/* 削除ボタン（ADMINのみ、自分以外） */}
          {currentUserRole === 1 && currentUserId !== user.id && (
            <div className='mt-8 pt-6 border-t border-gray-200'>
              <button
                type='button'
                onClick={deleteUser}
                className='px-6 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors font-medium cursor-pointer'
              >
                このユーザーを削除
              </button>
            </div>
          )}
        </div>

        {/* Todoリスト表示 */}
        <div className='bg-white shadow-md rounded-lg p-8'>
          <div className='flex items-center justify-between mb-6'>
            <h3 className='text-2xl font-semibold text-gray-900 mb-6'>
              最近のTodo
            </h3>
            {todos.length > 0 && <span>全{todos.length}件</span>}
          </div>

          {/* MANAGER権限でほかのユーザーの詳細ページを参照している場合 */}
          {currentUserRole === 2 && currentUserId !== userId ? (
            <div className='text-center py-12'>
              <p className='text-gray-500 text-sm'>
                他のユーザーのTodoは閲覧できません
              </p>
              <p className='text-gray-400 text-xs mt-2'>
                MANAGER権限では自分のTodoのみ閲覧可能です
              </p>
            </div>
          ) : isLoading ? ( // ローディング中
            <div className='flex items-center justify-center py-12'>
              <div className='text-gray-500'>読み込み中...</div>
            </div>
          ) : todos.length === 0 ? ( // Todoがない場合
            <div className='text-center py-12 text-gray-500'>
              Todoがありません
            </div>
          ) : (
            // Todoリスト表示
            <div className='space-y-3'>
              {displayTodos.map((todo) => (
                <div
                  key={todo.id}
                  className='flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200'
                >
                  {/* Todoタイトル */}
                  <div className='flex items-center gap-3 flex-1'>
                    <input
                      type='checkbox'
                      checked={todo.completed}
                      readOnly
                      className='w-5 h-5 text-blue-600 rounded cursor-default'
                    />
                    <div className='flex-1'>
                      <p
                        className={`font-medium ${
                          todo.completed
                            ? 'line-through text-gray-400'
                            : 'text-gray-900'
                        }`}
                      >
                        {todo.title}
                      </p>

                      {/* Todo説明 */}
                      {todo.descriptions && (
                        <p className='text-sm text-gray-500 mt-1'>
                          {todo.descriptions}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {/* もっと見るボタン */}
              {displayTodoCount < todos.length && (
                <div className='flex items-center justify-center mt-6 pt-4 border-t border-gray-200'>
                  <button
                    type='button'
                    onClick={loadMoreTodos}
                    className='px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors font-medium cursor-pointer'
                  >
                    もっと見る
                  </button>
                </div>
              )}

              {/* 全件表示完了メッセージ */}
              {displayTodoCount >= todos.length && todos.length > 10 && (
                <div className='text-center mt-6 pt-4 border-t border-gray-200'>
                  <p className='text-sm text-gray-500'>
                    すべてのTodoが表示されています
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

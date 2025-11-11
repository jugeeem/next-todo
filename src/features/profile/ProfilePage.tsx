'use client';

import Link from 'next/link';
import { useState } from 'react';
import { z } from 'zod';
import { logout } from '@/lib/api';

// インターフェースの定義

/**
 * ユーザー情報のインターフェース。
 * ユーザー情報を表すためのインターフェースです。
 *
 * @interface User
 * @property {string} id - ユーザーID
 * @property {string} username - ユーザー名
 * @property {string | null} firstName - ユーザーの名前
 * @property {string | null} lastName - ユーザーの苗字
 * @property {number} role - ユーザー権限
 */
interface User {
  id: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  role: number;
}

/**
 * Todo統計情報のインターフェース。
 * Todoの統計情報を表すためのインターフェースです。
 *
 * @interface TodoStats
 * @property {number} totalTodos - 総Todo数
 * @property {number} completedTodos - 完了したTodo数
 * @property {number} pendingTodos - 未完了のTodo数
 * @property {number} completionRate - 完了率（パーセンテージ）
 */
interface TodoStats {
  totalTodos: number;
  completedTodos: number;
  pendingTodos: number;
  completionRate: number;
}

/**
 * Todoアイテムのインターフェース。
 * Todoアイテムを表すためのインターフェースです。
 *
 * @interface Todo
 * @property {string} id - TodoID
 * @property {string} title - Todoのタイトル
 * @property {string | null} description - Todoの説明（任意）
 * @property {boolean} completed - 完了状態
 * @property {string} userId - ユーザーID
 * @property {string} createdAt - 作成日時（ISO8601形式）
 * @property {string} updatedAt - 更新日時（ISO8601形式）
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

// STEP2: server_component(2025-11) ADD START
/**
 * Propsのインターフェース。
 * プロフィールページコンポーネントに渡されるプロパティを定義します。
 *
 * @interface ProfilePageProps
 * @property {User} userInfo - ユーザー情報
 * @property {TodoStats} todoStats - Todo統計情報
 * @property {Todo[]} userTodos - ユーザーのTodo一覧
 */
interface Props {
  userInfo: User;
  todoStats: TodoStats;
  userTodos: Todo[];
}
// STEP2: server_component(2025-11) ADD END

// バリデーションスキーマの定義

/**
 * プロフィール更新用のバリデーションスキーマ。
 * 姓、名は50文字以内。
 */
const profileUpdateSchema = z.object({
  firstName: z.string().max(50, '名は50文字以内で入力してください').optional(),
  lastName: z.string().max(50, '姓は50文字以内で入力してください').optional(),
});

/**
 *　パスワード変更用のバリデーションスキーマ。
 *  姓、名は50文字以内。
 */
const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, '現在のパスワードは必須です'),
  newPassword: z
    .string()
    .min(6, '新しいパスワードは6文字以上で入力してください')
    .max(100, '新しいパスワードは100文字以内で入力してください'),
  confirmPassword: z.string().min(1, 'パスワード確認は必須です'),
});

/**
 * プロフィールページのコンポーネント。
 * ユーザー情報の表示・編集、Todoリストの統計、パスワードの変更機能を提供します。
 *
 * @param {Props} props - プロフィールページのプロパティ。
 * @return {JSX.Element} プロフィールページのJSX要素。
 */
// STEP2: server_component(2025-11) MOD START
// サーバーコンポーネントとして動作するようにPropsを受け取るように変更。
export default function ProfilePage({ userInfo, todoStats, userTodos }: Props) {
  // ステートの定義
  // ユーザー情報
  const [user, setUser] = useState<User>(userInfo);
  // ユーザーの名前
  const [firstName, setFirstName] = useState<string>(userInfo.firstName || '');
  // ユーザーの苗字
  const [lastName, setLastName] = useState<string>(userInfo.lastName || '');
  // 現在のパスワード
  const [currentPassword, setCurrentPassword] = useState<string>('');
  // 新しいパスワード
  const [newPassword, setNewPassword] = useState<string>('');
  // 確認用パスワード
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  // プロフィール編集フラグ
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  // パスワード変更フラグ
  const [isChangingPassword, setIsChangingPassword] = useState<boolean>(false);
  // プロフィール保存中フラグ
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);
  // パスワード保存中フラグ
  const [isSavingPassword, setIsSavingPassword] = useState<boolean>(false);
  // プロフィール編集時のエラーメッセージ
  const [error, setError] = useState<string>('');
  // パスワード変更用エラーメッセージ
  const [passwordError, setPasswordError] = useState<string>(''); // パスワード変更用エラー
  // 編集成功用のメッセージ (レイアウトの関係上同じ成功メッセージだとパスワード変更時の成功メッセージが見にくかったので、ステートを分割しました。)
  // const [successMessage, setSuccessMessage] = useState<string>('');
  const [profileSuccessMessage, setProfileSuccessMessage] = useState<string>('');
  const [passwordSuccessMessage, setPasswordSuccessMessage] = useState<string>('');

  /**
   * プロフィール更新用の非同期関数。
   * ユーザーの苗字と名前を更新します。
   *
   * @param {React.FormEvent} e - フォームイベント
   * @return {Promise<void>} - 非同期処理の完了を示すPromise
   * @throws {Error} - プロフィールの更新に失敗した場合
   */
  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    // 表示されるメッセージ情報の初期化
    setError('');
    setProfileSuccessMessage('');

    // バリデーションチェック
    const validation = profileUpdateSchema.safeParse({
      firstName,
      lastName,
    });

    // バリデーションエラー時の処理
    if (!validation.success) {
      setError(validation.error.errors[0].message);
      return;
    }

    // 処理の開始
    setIsSavingProfile(true);
    try {
      const response = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        }),
      });

      // 更新失敗時のエラーハンドリング
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'プロフィールの更新に失敗しました');
      }

      // 成功メッセージの設定
      const data = await response.json();
      setUser(data.data);
      // 姓 名のステートを更新する
      setFirstName(data.data.firstName || '');
      setLastName(data.data.lastName || '');
      setProfileSuccessMessage('プロフィールが更新されました');
      setIsEditingProfile(false);

      // 3秒後に成功メッセージをクリア
      setTimeout(() => {
        setProfileSuccessMessage('');
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    } finally {
      setIsSavingProfile(false);
    }
  };

  /**
   * パスワード変更用の非同期関数
   * ユーザーのパスワードを変更します。
   *
   * @param {React.FormEvent} e - フォームイベント
   * @return {Promise<void>} - 非同期処理の完了を示すPromise
   * @throws {Error} - パスワードの変更に失敗した場合
   */
  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    // 表示されるメッセージ情報の初期化
    setPasswordError('');
    setPasswordSuccessMessage('');

    // バリデーションチェック
    const validation = passwordChangeSchema.safeParse({
      currentPassword,
      newPassword,
      confirmPassword,
    });
    if (!validation.success) {
      setPasswordError(validation.error.errors[0].message);
      return;
    }

    // 新しいパスワードと確認用パスワードの一致チェック
    if (newPassword !== confirmPassword) {
      setPasswordError('新しいパスワードと確認用パスワードが一致しません。');
      return;
    }
    // 処理の開始
    setIsSavingPassword(true);
    try {
      const response = await fetch('/api/users/me/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      // 更新失敗時のエラーハンドリング
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'パスワードの変更に失敗しました');
      }
      // 成功後の処理
      // フォームのリセット
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsChangingPassword(false);

      // 成功メッセージの設定
      setPasswordSuccessMessage('パスワードを変更しました');
      // 3秒後に成功メッセージをクリア
      setTimeout(() => {
        setPasswordSuccessMessage('');
      }, 3000);
    } catch (err) {
      setPasswordError(
        err instanceof Error ? err.message : '不明なエラーが発生しました',
      );
    } finally {
      setIsSavingPassword(false);
    }
  };

  /**
   * ログアウト用の非同期関数。
   * ユーザーをログアウトし、ログインページにリダイレクトします。
   *
   * @return {Promise<void>} - 非同期処理の完了を示すPromise
   */
  const handleLogout = async () => {
    await logout();
  };

  /**
   * プロフィール編集のキャンセル処理。
   * 入力内容をクリアして、編集モードを終了します。
   */
  const cancelEditProfile = () => {
    // 元のユーザー情報に戻す。ユーザー名がnullの場合は空文字をセットする。
    setFirstName(user.firstName || '');
    setLastName(user.lastName || '');
    // 編集モードの終了とエラーメッセージのクリア
    setIsEditingProfile(false);
    setError('');
  };

  /**
   * パスワード変更のキャンセル処理。
   * 入力内容をクリアして、編集モードを終了します。
   *
   */
  const cancelPasswordChange = () => {
    // 入力内容のクリア、エラーメッセージのクリア、編集モードの終了。
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setIsChangingPassword(false);
  };

  // STEP2: server_component(2025-11) MOD END
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
              {/* ADMIN・MANAGERの場合のみ表示 */}
              {user.role <= 2 && (
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
        {/* 成功メッセージ */}
        {profileSuccessMessage && (
          <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700 text-sm">{profileSuccessMessage}</p>
          </div>
        )}
        {/* エラーメッセージ */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
        {/* プロフィール情報 */}
        <div className="bg-white shadow-md rounded-lg p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">プロフィール情報</h2>

            {/* 編集ボタン */}
            {!isEditingProfile && (
              <button
                type="button"
                onClick={() => setIsEditingProfile(true)}
                className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors font-medium cursor-pointer"
              >
                編集
              </button>
            )}
          </div>

          {isEditingProfile ? (
            // プロフィール編集フォーム
            <form onSubmit={updateProfile} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 姓 */}
                <div className="relative">
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={isSavingProfile}
                    placeholder="姓"
                    className="w-full px-3 py-2 pt-6 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white disabled:bg-gray-100 disabled:cursor-notallowed peer transition-colors"
                  />
                  <label
                    htmlFor="lastName"
                    className="absolute left-3 top-2 text-xs font-medium text-gray-500 peer-disabled:text-gray-400"
                  >
                    姓
                  </label>
                </div>

                {/* 名 */}
                <div className="relative">
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={isSavingProfile}
                    placeholder="名"
                    className="w-full px-3 py-2 pt-6 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white disabled:bg-gray-100 disabled:cursor-not-allowed peer transition-colors"
                  />
                  <label
                    htmlFor="firstName"
                    className="absolute left-3 top-2 text-xs font-medium text-gray-500 peer-disabled:text-gray-400"
                  >
                    名
                  </label>
                </div>
              </div>

              {/* ボタン */}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={cancelEditProfile}
                  disabled={isSavingProfile}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium cursor-pointer"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium cursor-pointer"
                >
                  {isSavingProfile ? '保存中...' : '保存'}
                </button>
              </div>
            </form>
          ) : (
            // プロフィール表示
            <div className="space-y-4">
              {/* ユーザー名 */}
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">ユーザー名</p>
                <p>{user.username}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 姓 */}
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">姓</p>
                  <p className="text-lg text-gray-900">{user.lastName || '未設定'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">名</p>
                  <p className="text-lg text-gray-900">{user.firstName || '未設定'}</p>
                </div>
              </div>
            </div>
          )}
        </div>
        {/* Todo統計情報 */}
        {todoStats && (
          <div className="bg-white shadow-md rounded-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Todo統計</h2>
            {/* 総Todo数 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <p className="text-sm font-medium text-blue-600 mb-1">総Todo数</p>
                <p className="text-3xl font-bold text-blue-900">
                  {todoStats.totalTodos}
                </p>
              </div>
              {/* 完了済みTodo数 */}
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <p className="text-sm font-medium text-green-600 mb-1">完了済み</p>
                <p className="text-3xl font-bold text-green-900">
                  {todoStats.completedTodos}
                </p>
              </div>
              {/* 未完了Todo数 */}
              <div className="bg-yellow-50 rounded-lg p-4 text-center">
                <p className="text-sm font-medium text-yellow-600 mb-1">未完了</p>
                <p className="text-3xl font-bold text-yellow-900">
                  {todoStats.pendingTodos}
                </p>
              </div>
              {/* 完了率 */}
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <p className="text-sm font-medium text-purple-600 mb-1">完了率</p>
                <p className="text-3xl font-bold text-purple-900">
                  {todoStats.completionRate.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        )}
        {/* 自分のTodo一覧表示 */}
        <div className="bg-white shadow-md rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">最近のTodo</h2>
          {userTodos.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Todoがありません</p>
          ) : (
            <div className="space-y-3">
              {userTodos.slice(0, 20).map((todo) => (
                <Link
                  key={todo.id}
                  href={`/todos/${todo.id}`}
                  className="block p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      readOnly
                      className="w-5 h-5 text-blue-500 rounded-md border-gray-300"
                    />
                    <div className="flex-1">
                      <h3
                        className={`font-medium ${
                          todo.completed
                            ? 'line-through text-gray-500'
                            : 'text-gray-900'
                        }`}
                      >
                        {todo.title}
                      </h3>
                      {todo.descriptions && (
                        <p className="text-sm text-gray-600 mt-1">
                          {todo.descriptions}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
          {userTodos.length > 5 && (
            <div>
              <Link
                href="/todos"
                className="text-blue-500 hover:text-blue-600 font-medium transition-colors"
              >
                すべてのTodoを見る →
              </Link>
            </div>
          )}
        </div>
        {/* パスワード変更 */}
        <div className="bg-white shadow-md rounded-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">パスワード変更</h2>
            {!isChangingPassword && (
              <button
                type="button"
                onClick={() => setIsChangingPassword(true)}
                className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors font-medium cursor-pointer"
              >
                変更
              </button>
            )}
          </div>

          {/* パスワード変更の成功メッセージ */}
          {passwordSuccessMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 text-sm">{passwordSuccessMessage}</p>
            </div>
          )}

          {/* パスワード変更用のエラーメッセージ */}
          {passwordError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{passwordError}</p>
            </div>
          )}
          {/* パスワード変更フォーム */}
          {isChangingPassword ? (
            // パスワード変更フォーム
            <form onSubmit={changePassword} className="space-y-6">
              {/* 現在のパスワード */}
              <div className="relative">
                <input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={isSavingPassword}
                  placeholder="現在のパスワード"
                  className="w-full px-3 py-2 pt-6 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white disabled:bg-gray-100 disabled:cursor-not-allowed peer transition-colors"
                />
                <label
                  htmlFor="currentPassword"
                  className="absolute left-3 top-2 text-xs font-medium text-gray-500 peer-disabled:text-gray-400"
                >
                  現在のパスワード
                  <span className="text-red-500 text-xs ml-0.5">*</span>
                </label>
              </div>

              {/* 新しいパスワード */}
              <div className="relative">
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isSavingPassword}
                  minLength={6}
                  placeholder="新しいパスワード（6文字以上）"
                  className="w-full px-3 py-2 pt-6 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white disabled:bg-gray-100 disabled:cursor-not-allowed peer transition-colors"
                />
                <label
                  htmlFor="newPassword"
                  className="absolute left-3 top-2 text-xs font-medium text-gray-500 peer-disabled:text-gray-400"
                >
                  新しいパスワード
                  <span className="text-red-500 text-xs ml-0.5">*</span>
                </label>
              </div>

              {/* 確認用パスワード */}
              <div className="relative">
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isSavingPassword}
                  minLength={6}
                  placeholder="新しいパスワードを再入力"
                  className="w-full px-3 py-2 pt-6 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white disabled:bg-gray-100 disabled:cursor-not-allowed peer transition-colors"
                />
                <label
                  htmlFor="confirmPassword"
                  className="absolute left-3 top-2 text-xs font-medium text-gray-500 peer-disabled:text-gray-400"
                >
                  新しいパスワード（確認）
                  <span className="text-red-500 text-xs ml-0.5">*</span>
                </label>
              </div>

              {/* ボタン */}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={cancelPasswordChange}
                  disabled={isSavingPassword}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium cursor-pointer"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={isSavingPassword}
                  className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium cursor-pointer"
                >
                  {isSavingPassword ? '変更中...' : '変更'}
                </button>
              </div>
            </form>
          ) : (
            // 通常表示
            <p className="text-gray-600">
              パスワードを変更する場合は変更ボタンをクリックしてください。
            </p>
          )}
        </div>
      </main>
    </div>
  );
}

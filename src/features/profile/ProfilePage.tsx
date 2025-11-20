'use client';

import { Button, Card, CardBody, CardFooter, CardHeader, Input } from '@heroui/react';
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

  // バリデーションエラーメッセージ表示用にステートを分割 STEP3 MOD START
  const [firstNameError, setFirstNameError] = useState<string>('');
  const [lastNameError, setLastNameError] = useState<string>('');
  // STEP3 MOD END

  // 現在のパスワード、新しいパスワード、確認用パスワードのエラーメッセージにステートを分割 STEP3 MOD START
  // 現在のパスワードのエラーメッセージ
  const [currentPasswordError, setCurrentPasswordError] = useState<string>('');
  // 新しいパスワードのエラーメッセージ
  const [newPasswordError, setnewPasswordError] = useState<string>('');
  // 確認用パスワードのエラーメッセージ
  const [confirmPasswordError, setConfirmPasswordError] = useState<string>('');
  // パスワード全体のエラーメッセージ
  const [passwordError, setPasswordError] = useState<string>('');
  // STEP3 MOD END

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
    // 姓 名のエラーメッセージをクリア STEP3 ADD START
    setFirstNameError('');
    setLastNameError('');
    // STEP3 ADD END
    setProfileSuccessMessage('');

    // バリデーションチェック
    const validation = profileUpdateSchema.safeParse({
      firstName,
      lastName,
    });

    // バリデーションエラー時の処理
    // フィールドごとのエラー状態を設定する。 STEP3 MOD START
    if (!validation.success) {
      // エラーメッセージを一覧で取得
      const errors = validation.error.errors;
      // err.path[0]でエラー対象のフィールド名を特定して、対応するエラーstateを更新
      errors.forEach((err) => {
        if (err.path[0] === 'firstName') setFirstNameError(err.message);
        if (err.path[0] === 'lastName') setLastNameError(err.message);
      });
      return;
    }
    // STEP3 MOD END

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

      // エラーメッセージのクリア STEP3 ADD START
      setError('');
      setFirstNameError('');
      setLastNameError('');
      // STEP3 ADD END

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
    setPasswordSuccessMessage('');
    // フィールドごとのエラーをクリア STEP3 MOD START
    setCurrentPasswordError('');
    setnewPasswordError('');
    // STEP3 MOD END

    // バリデーションチェック
    const validation = passwordChangeSchema.safeParse({
      currentPassword,
      newPassword,
      confirmPassword,
    });

    // バリデーションエラー時の処理
    // フィールドごとのエラー状態を設定する。 STEP3 MOD START
    if (!validation.success) {
      // エラーメッセージを一覧で取得
      const errors = validation.error.errors;
      // err.path[0]でエラー対象のフィールド名を特定して、対応するエラーstateを更新
      errors.forEach((err) => {
        if (err.path[0] === 'currentPassword') {
          setCurrentPasswordError(err.message);
        }
        if (err.path[0] === 'newPassword') {
          setnewPasswordError(err.message);
        }
        if (err.path[0] === 'confirmPassword') {
          setConfirmPasswordError(err.message);
        }
      });
      return;
    }
    // STEP3 MOD END

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

      // エラーメッセージのクリア STEP3 ADD START
      setPasswordError('');
      setCurrentPasswordError('');
      setnewPasswordError('');
      setConfirmPasswordError('');
      // STEP3 ADD END

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
    // フィールドごとのエラーをクリア STEP3 ADD START
    setFirstNameError('');
    setLastNameError('');
    // STEP3 ADD END
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
    // フィールドごとのエラーをクリア STEP3 ADD START
    setCurrentPasswordError('');
    setnewPasswordError('');
    setConfirmPasswordError('');
    // STEP3 ADD END
    setIsChangingPassword(false);
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
            {/* button → Button STEP3 MOD START */}
            <Button
              type="button"
              onPress={handleLogout}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 font-medium transition-colors cursor-pointer"
            >
              ログアウト
            </Button>
            {/* STEP3 MOD END */}
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
        {/* div → Card STEP3 MOD START */}
        <Card className="p-6 mb-8">
          <CardHeader className="justify-between mb-4">
            <h2 className="text-2xl font-semibold text-gray-900">プロフィール情報</h2>

            {/* 編集ボタン */}
            {!isEditingProfile && (
              // button → Button STEP3 MOD START
              <Button
                type="button"
                onPress={() => setIsEditingProfile(true)}
                color="primary"
                className="font-medium"
              >
                編集
              </Button>
              // STEP3 MOD END
            )}
          </CardHeader>

          {isEditingProfile ? (
            // プロフィール編集フォーム
            <form onSubmit={updateProfile} className="space-y-6">
              <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 姓 */}
                {/* input → Input STEP3 MOD START */}
                <Input
                  id="lastName"
                  type="text"
                  value={lastName}
                  maxLength={50}
                  onChange={(e) => {
                    setLastName(e.target.value);
                    setError(''); // 全体のエラーメッセージをクリア
                    setLastNameError(''); // エラーメッセージをクリア
                  }}
                  placeholder="姓(任意)"
                  label="姓"
                  isInvalid={!!lastNameError}
                  errorMessage={lastNameError}
                />

                {/* 名 */}
                <Input
                  id="firstName"
                  type="text"
                  value={firstName}
                  maxLength={50}
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    setError(''); // 全体のエラーメッセージをクリア
                    setFirstNameError(''); // エラーメッセージをクリア
                  }}
                  placeholder="名(任意)"
                  label="名"
                  isInvalid={!!firstNameError}
                  errorMessage={firstNameError}
                />
              </CardBody>
              {/* input → Input STEP3 MOD END */}

              {/* ボタン */}
              <CardFooter className="gap-3 justify-end">
                {/* button → Button STEP3 MOD START */}
                <Button
                  type="button"
                  onPress={cancelEditProfile}
                  className="font-medium"
                >
                  キャンセル
                </Button>
                <Button
                  type="submit"
                  isLoading={isSavingProfile}
                  color="primary"
                  className="font-medium"
                >
                  {isSavingProfile ? '保存中...' : '保存'}
                </Button>
                {/* STEP3 MOD END */}
              </CardFooter>
            </form>
          ) : (
            // プロフィール表示
            <CardBody className="space-y-4">
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
            </CardBody>
          )}
        </Card>
        {/* STEP3 MOD END */}
        {/* Todo統計情報 */}
        {/* div → Card STEP3 MOD START */}
        {todoStats && (
          <Card className="shadow-md rounded-lg p-8 mb-8">
            <CardHeader>
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Todo統計</h2>
            </CardHeader>
            {/* 総Todo数 */}
            <CardBody className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
            </CardBody>
          </Card>
          // div → Card STEP3 MOD END
        )}
        {/* 自分のTodo一覧表示 */}
        {/* div → Card STEP3 MOD START */}
        <Card className="p-8 mb-8">
          <CardHeader>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">最近のTodo</h2>
          </CardHeader>
          {userTodos.length === 0 ? (
            <CardBody>
              <p className="text-center text-gray-500 py-8">Todoがありません</p>
            </CardBody>
          ) : (
            <CardBody className="space-y-4">
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
            </CardBody>
          )}
          {userTodos.length > 5 && (
            <CardFooter className="text-right">
              <Link
                href="/todos"
                className="text-blue-500 hover:text-blue-600 font-medium transition-colors"
              >
                すべてのTodoを見る →
              </Link>
            </CardFooter>
          )}
        </Card>
        {/* STEP3 MOD END */}
        {/* パスワード変更 */}
        {/* div → Card STEP3 MOD START */}
        <Card className="p-6">
          <CardHeader className="justify-between mb-4">
            <h2 className="text-2xl font-semibold text-gray-900">パスワード変更</h2>
            {!isChangingPassword && (
              // button → Button STEP3 MOD START
              <Button
                type="button"
                onPress={() => setIsChangingPassword(true)}
                color="primary"
                className="font-medium"
              >
                変更
              </Button>
              // STEP3 MOD END
            )}
          </CardHeader>

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
            <form onSubmit={changePassword}>
              {/* 現在のパスワード */}
              {/* input → Input STEP3 MOD START */}
              {/* CardBody STEP3 ADD START */}
              <CardBody className="space-y-6">
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    setCurrentPasswordError(''); // フィールドエラーをクリア
                    setPasswordError(''); // 全体エラーをクリア
                  }}
                  placeholder="現在のパスワード"
                  label="現在のパスワード"
                  isRequired
                  validationBehavior="aria"
                  isInvalid={!!currentPasswordError}
                  errorMessage={currentPasswordError}
                />
                {/* 新しいパスワード */}
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setnewPasswordError(''); // フィールドエラーをクリア
                    setPasswordError(''); // 全体エラーをクリア
                  }}
                  placeholder="新しいパスワード(6文字以上)"
                  isRequired
                  validationBehavior="aria"
                  label="新しいパスワード"
                  isInvalid={!!newPasswordError}
                  errorMessage={newPasswordError}
                />

                {/* 確認用パスワード */}
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setConfirmPasswordError(''); // フィールドエラーをクリア
                    setPasswordError(''); // 全体エラーをクリア
                  }}
                  placeholder="新しいパスワードを再入力"
                  isRequired
                  validationBehavior="aria"
                  label="新しいパスワード(確認)"
                  isInvalid={!!confirmPasswordError}
                  errorMessage={confirmPasswordError}
                />
                {/* input → Input STEP3 MOD END */}
              </CardBody>
              {/* STEP3 ADD END */}

              {/* ボタン */}
              {/* div → CardFooter STEP3 MOD START */}
              <CardFooter className="justify-end gap-3">
                {/* button → Button STEP3 MOD START */}
                <Button
                  type="button"
                  onPress={cancelPasswordChange}
                  disabled={isSavingPassword}
                  className="font-medium"
                >
                  キャンセル
                </Button>
                <Button
                  type="submit"
                  isLoading={isSavingPassword}
                  color="primary"
                  className="font-medium"
                >
                  {isSavingPassword ? '変更中' : '変更'}
                </Button>
                {/* STEP3 MOD END */}
              </CardFooter>
            </form>
          ) : (
            // 通常表示
            <p className="text-gray-600">
              パスワードを変更する場合は変更ボタンをクリックしてください。
            </p>
          )}
        </Card>
        {/* STEP3 MOD END */}
      </main>
    </div>
  );
}

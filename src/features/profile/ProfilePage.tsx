'use client';

import { useState } from 'react';
import { EditProfileInfo } from './components/EditProfileInfo';
import { PasswordChangeForm } from './components/PasswordChangeForm';
import { ShowProfileInfo } from './components/ShowProfileInfo';
import { TodoStatsDisplay } from './components/TodoStatsDisplay';
import type { Todo, TodoStats, User } from './components/types';
import { UserTodoList } from './components/UserTodoList';

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
  // 成功メッセージ
  const [successMessage, setSuccessMessage] = useState<string>('');
  // プロフィール編集モードの状態
  const [isEditing, setIsEditing] = useState<boolean>(false);

  /**
   * プロフィール更新用のコールバック。
   * ユーザーの苗字と名前を更新します。
   *
   * @param {User} updatedUser - 更新されたユーザー情報
   */
  const handleProfileUpdate = (updatedUser: User) => {
    setUser(updatedUser);
    setIsEditing(false);
    setSuccessMessage('プロフィール情報が更新されました。');

    // 成功メッセージを3秒後にクリア
    setTimeout(() => {
      setSuccessMessage('');
    }, 3000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* メインコンテンツ */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-10 w-full">
        {/* 成功メッセージ */}
        {successMessage && (
          <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700 text-sm">{successMessage}</p>
          </div>
        )}

        {/* プロフィール情報 */}

        {/* 編集モード */}
        {isEditing ? (
          <EditProfileInfo
            user={user}
            onSuccess={handleProfileUpdate}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          // 表示モード
          <ShowProfileInfo user={user} onEdit={() => setIsEditing(true)} />
        )}

        {/* Todo統計表示 */}
        <TodoStatsDisplay stats={todoStats} />

        {/* ユーザーのTodo一覧 */}
        <UserTodoList todos={userTodos} maxDisplay={20} />

        {/* パスワード変更 */}
        <PasswordChangeForm />
      </main>
    </div>
  );
}

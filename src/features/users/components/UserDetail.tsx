'use client';

import { useRouter } from 'next/navigation';
import { startTransition, useOptimistic, useState } from 'react';

export default function UserDetail({
  user,
  todos,
}: {
  user: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    role: number;
    createdAt: string;
    updatedAt: string;
  };
  todos: {
    id: string;
    title: string;
    descriptions?: string | undefined;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    completed: boolean;
  }[];
}) {
  const [initialUser, setInitialUser] = useState<User>(user);
  const [isEditingOpen, setIsEditingOpen] = useState(false);
  const [isEditSending, setIsEditSending] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleteChecked, setIsDeleteChecked] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [userOptimistic, addUserOptimistic] = useOptimistic(
    initialUser,
    (currentUser: User, newUser: Partial<User>) => {
      return { ...currentUser, ...newUser };
    },
  );

  // 編集フォーム用state
  const [editForm, setEditForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    role: user?.role || 4,
  });
  const [editError, setEditError] = useState<{
    firstNameError?: string | null;
    lastNameError?: string | null;
    generalError?: string | null;
  }>({});

  type User = {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    role: number;
    createdAt: string;
    updatedAt: string;
  };

  // 役割名取得関数
  const getUserRoleName = (role: number) => {
    switch (role) {
      case 1:
        return '管理者';
      case 2:
        return 'マネージャー';
      case 4:
        return 'ユーザー';
      case 8:
        return 'ゲスト';
      default:
        return '不明';
    }
  };

  // アカウント削除処理
  const handleAccountDelete = async () => {
    if (!isDeleteChecked) {
      alert('確認しましたにチェックを入れてください。');
      return;
    }
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (response.ok) {
        // ユーザー一覧ページへリダイレクト
        router.push('/users');
      }
    } catch (error) {
      setDeleteError((error as Error).message);
    }
    setIsDeleting(false);
  };

  // 日付フォーマット関数
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  const router = useRouter();

  // 編集フォームのリアルタイムバリデーション
  const validateEditForm = (target?: { name: string; value: string }) => {
    const newError = { ...editError };
    let valid = true;

    // 名
    const firstNameValue =
      target?.name === 'firstName' ? target.value : editForm.firstName;
    if (firstNameValue.length > 20) {
      newError.firstNameError = '名は20文字以内で入力してください';
      valid = false;
    } else {
      newError.firstNameError = null;
    }

    // 姓
    const lastNameValue =
      target?.name === 'lastName' ? target.value : editForm.lastName;
    if (lastNameValue.length > 20) {
      newError.lastNameError = '姓は20文字以内で入力してください';
      valid = false;
    } else {
      newError.lastNameError = null;
    }

    setEditError(newError);
    return valid;
  };

  const handleEditInput = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setEditForm({ ...editForm, [name]: value });
    validateEditForm({ name, value }); // リアルタイムバリデーション
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEditForm()) return;
    setIsEditSending(true);

    startTransition(async () => {
      addUserOptimistic({
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        role: editForm.role,
      });
      try {
        const response = await fetch(`/api/users/${user.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editForm),
          credentials: 'include',
        });
        const result = await response.json();
        if (response.ok) {
          setIsEditingOpen(false);
          // 必要ならページリロードやユーザー情報再取得
          setInitialUser((prev) => ({ ...prev, ...editForm }));
        } else {
          setEditError((prev) => ({
            ...prev,
            generalError: result.message || '更新に失敗しました',
          }));
        }
      } catch {
        setEditError((prev) => ({
          ...prev,
          generalError: '通信エラーが発生しました',
        }));
      } finally {
        setIsEditSending(false);
      }
    });
  };

  // 進捗率計算
  const totalTodos = todos.length;
  const completedTodos = todos.filter((t) => t.completed).length;
  const progressRate =
    totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0;

  return (
    <div className="bg-gray-50 min-h-screen" aria-busy="true">
      <header className="flex justify-between items-center p-4 bg-blue-500 text-white">
        <h1 className="text-xl font-bold">ユーザー詳細</h1>
        <span className="text-sm"></span>
        <button
          type="button"
          className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded transition-colors"
          onClick={() => router.push('/users')}
        >
          一覧へ戻る
        </button>
      </header>

      {/* Content Sections */}
      <main className="w-[80%] min-w-[320px] max-w-2xl mt-6 mx-auto flex flex-col gap-6">
        <section className="w-full max-w-2xl mx-auto flex flex-col items-center bg-white rounded-lg shadow-md p-6">
          {/* Name */}
          <div className="h-fit w-full mb-2 text-md font-bold text-gray-800 text-center">
            <p>ユーザー名 {userOptimistic?.username ?? '（ユーザー名なし）'}</p>
          </div>
          <div className="h-fit w-full mb-2 text-md font-bold text-gray-800 text-center">
            <p>
              名前{' '}
              {`${userOptimistic?.lastName ?? '-'} ${userOptimistic?.firstName ?? '-'}`}
            </p>
          </div>
          {/* Stats */}
          <div className="flex gap-4 mb-4 w-full justify-center">
            <div className="h-4 w-16 text-center">
              <span className="block text-gray-700 font-semibold">役割</span>
              <span
                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  userOptimistic?.role === 1
                    ? 'bg-red-100 text-red-800'
                    : userOptimistic?.role === 2
                      ? 'bg-yellow-100 text-yellow-800'
                      : userOptimistic?.role === 4
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                }`}
              >
                {getUserRoleName(userOptimistic?.role)}
              </span>
            </div>
            <div className="h-4 w-16 text-center">
              <span className="block text-gray-700 font-semibold">作成日</span>
              <span className="block text-gray-600 text-xs">
                {userOptimistic?.createdAt ? formatDate(userOptimistic.createdAt) : '―'}
              </span>
            </div>
            <div className="h-4 w-16 text-center">
              <span className="block text-gray-700 font-semibold">更新日</span>
              <span className="block text-gray-600 text-xs">
                {userOptimistic?.updatedAt ? formatDate(userOptimistic.updatedAt) : '―'}
              </span>
            </div>
          </div>
        </section>
        {/* Action Area */}
        <div className="w-full max-w-2xl flex gap-4 justify-center">
          <button
            type="button"
            className="h-10 w-28 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
            onClick={() => setIsEditingOpen(!isEditingOpen)}
          >
            編集
          </button>
          <button
            type="button"
            className="h-10 w-28 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            onClick={() => setIsDeleteConfirmOpen(!isDeleteConfirmOpen)}
          >
            アカウント削除
          </button>
        </div>
        {/* Todo Statistics */}
        <div className="bg-white rounded-lg shadow p-4 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2">
            <div className="text-gray-700 font-bold text-lg">Todo統計</div>
            <div className="flex gap-6">
              <span className="text-gray-700">
                合計: <span className="font-bold">{totalTodos}</span>件
              </span>
              <span className="text-gray-700">
                完了: <span className="font-bold">{completedTodos}</span>件
              </span>
              <span className="text-gray-700">
                進捗率: <span className="font-bold">{progressRate}%</span>
              </span>
            </div>
          </div>
          {/* タスク一覧 */}
          <div>
            <h3 className="text-md font-semibold mb-2">タスク一覧</h3>
            {todos.length === 0 ? (
              <div className="text-gray-500 text-center py-4">タスクがありません</div>
            ) : (
              <div className="grid gap-4">
                {todos.map((todo) => (
                  <div
                    key={todo.id}
                    className={`bg-white rounded-lg shadow-md overflow-hidden border ${todo.completed ? 'border-green-400' : 'border-gray-200'}`}
                  >
                    <div
                      className={`flex justify-between items-center px-4 py-2 ${todo.completed ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'}`}
                    >
                      <h4 className="text-lg font-bold">{todo.title}</h4>
                      <span className="text-xs px-2 py-1 rounded-full bg-white text-green-600 font-semibold">
                        {todo.completed ? '完了' : '未完了'}
                      </span>
                    </div>
                    <div className="items-center px-4 py-2">
                      <span className="text-xs mr-2">
                        {formatDate(todo.descriptions ? todo.descriptions : '')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* プロフィール編集モーダル */}
      {isEditingOpen && (
        <div className="fixed inset-0 bg-white/50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-96">
            <h2 className="text-lg font-bold mb-4">プロフィール編集</h2>
            <form onSubmit={handleEditSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2" htmlFor="lastName">
                  姓
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={editForm.lastName}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="姓"
                  onChange={handleEditInput}
                />
                {editError.lastNameError && (
                  <p className="text-red-500">{editError.lastNameError}</p>
                )}
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2" htmlFor="firstName">
                  名
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={editForm.firstName}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="名"
                  onChange={handleEditInput}
                />
                {editError.firstNameError && (
                  <p className="text-red-500">{editError.firstNameError}</p>
                )}
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2" htmlFor="role">
                  役割
                </label>
                <select
                  id="role"
                  name="role"
                  value={editForm.role}
                  className="w-full px-3 py-2 border rounded"
                  onChange={handleEditInput}
                >
                  <option value={1}>管理者</option>
                  <option value={2}>マネージャー</option>
                  <option value={4}>ユーザー</option>
                  <option value={8}>ゲスト</option>
                </select>
              </div>
              {editError.generalError && (
                <p className="text-red-500">{editError.generalError}</p>
              )}
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setIsEditingOpen(false)}
                  className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded transition-colors"
                  disabled={isEditSending}
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded transition-colors"
                  disabled={isEditSending}
                >
                  {isEditSending ? '保存中...' : '保存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* アカウント削除確認モーダル */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 bg-white/50 flex justify-center items-center z-50">
          <div className="w-96 bg-white p-6 rounded-lg shadow-xl mx-4">
            <div className="flex flex-col items-center">
              <h2 className="text-lg font-bold mb-4 text-red-600">
                アカウント削除の確認
              </h2>
              <p className="text-center mb-6 text-gray-700">
                作成したTodoもすべて削除されます。
                <br />
                この操作は取り消すことができません。
              </p>
              <p>確認しました</p>
              <input
                type="checkbox"
                checked={isDeleteChecked}
                onChange={(e) => setIsDeleteChecked(e.target.checked)}
                id="confirmDelete"
                className="mb-4"
              />
              {deleteError && <p className="text-red-500 mb-2">{deleteError}</p>}

              <div className="flex justify-center gap-4 w-full">
                <button
                  type="button"
                  onClick={() => setIsDeleteConfirmOpen(false)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  onClick={handleAccountDelete}
                  disabled={isDeleting}
                  className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white py-2 px-4 rounded transition-colors"
                >
                  削除
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

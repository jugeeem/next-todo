'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { getClientCookie } from '@/lib/cookie';

export default function UserDetail({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [userTodos, setUserTodos] = useState<Todo[]>([]);
  const [form, setForm] = useState<UserForm>({
    firstName: '',
    lastName: '',
    role: 4, // デフォルトを「ユーザー」に設定
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isDeleteChecked, setIsDeleteChecked] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();

  interface User {
    id: string; // ユーザーID
    username: string; // ユーザー名
    firstName: string; // 名前
    lastName: string; // 姓
    role: number; // 権限（例：管理者、一般ユーザー）
    createdAt: string; // ユーザーが作成された日時のタイムスタンプ。
    updatedAt: string; // ユーザーが最後に更新された日時のタイムスタンプ。
  }

  interface Todo {
    id: number;
    title: string;
    descriptions: string;
    userId: number;
    createdAt: string;
    updatedAt: string;
  }

  interface UserDetailResponse {
    success: boolean; // 成功フラグ
    data: User; // ユーザーデータ
    message: string; // レスポンスメッセージ
  }

  interface UserTodosResponse {
    success: boolean; // 成功フラグ
    data: Todo[]; // ユーザーのTodoリスト
    message: string; // レスポンスメッセージ
  }

  interface UpdateUserResponse {
    success: boolean; // 成功フラグ
    data: User; // 更新されたユーザーデータ
    message: string; // レスポンスメッセージ
  }

  interface UserForm {
    firstName: string; // 名前
    lastName: string; // 姓
    role: number; // 権限（例：管理者、一般ユーザー）
  }

  // ユーザー詳細を取得する関数
  const fetchUserDetail = useCallback(async (userId: string) => {
    // ローディング状態を設定
    setIsLoading(true);
    // エラーメッセージをリセット
    setError(null);
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // レスポンスをJSON形式でパース
      const responseData: UserDetailResponse = await response.json();

      // レスポンスが成功であればユーザーデータを設定
      if (response.ok && responseData.success) {
        setUser(responseData.data);
      }
    } catch {
      setError('ユーザー情報の取得に失敗しました');
    } finally {
      // ローディング状態を解除
      setIsLoading(false);
    }
  }, []);

  // ユーザーのTodoリストを取得する関数
  // ユーザーIDを引数に取り、Todoリストを取得する
  const fetchUserTodos = useCallback(async (userId: string) => {
    // ローディング状態を設定
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/users/${userId}/todos`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // レスポンスをJSON形式でパース
      const responseData: UserTodosResponse = await response.json();

      // レスポンスが成功であればTodoリストを設定
      if (response.ok && responseData.success) {
        // Todoリストの取得に成功した場合の処理
        setUserTodos(responseData.data);
      }
    } catch {
      setError('ユーザーのTodoリストの取得に失敗しました');
    } finally {
      // ローディング状態を解除
      setIsLoading(false);
    }
  }, []);

  // 初期データの取得
  useEffect(() => {
    const token = getClientCookie('token');
    const currentUser = getClientCookie('user');

    // トークンとユーザー情報が存在する場合は、ユーザー情報を設定
    if (currentUser && token) {
      setCurrentUser(JSON.parse(currentUser));
    } else {
      router.push('/auth/login'); // ログインページへリダイレクト
      return;
    }

    // ユーザー詳細とTodoリストを取得
    fetchUserDetail(userId);
    fetchUserTodos(userId);
  }, [userId, router, fetchUserDetail, fetchUserTodos]);

  // ユーザー情報のフォームを初期化
  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      });
    }
  }, [user]);

  // ユーザー情報の更新処理
  const handleUpdate = async () => {
    setIsSubmitting(true);
    setError(null);

    const token = getClientCookie('token');
    if (!token) {
      setError('認証トークンがありません。ログインしてください。');
      setIsSubmitting(false);
      router.push('/auth/login'); // ログインページへリダイレクト
      return;
    }

    // フォームの入力値が空でないかチェック
    if (!form.firstName || !form.lastName) {
      setError('名前と姓は必須です');
      setIsSubmitting(false);
      return;
    }

    // ユーザー情報の更新リクエストを送信
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data: UpdateUserResponse = await response.json();

      if (response.ok && data.success) {
        setUser(data.data);
        setIsEditOpen(false);
      } else {
        setError(data.message || 'ユーザー情報の更新に失敗しました');
      }
    } catch {
      setError('ネットワークエラーが発生しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 入力フォームの変更をハンドルする関数
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prevForm) => ({
      ...prevForm,
      [name]: value,
    }));
  };

  // ユーザー情報を編集できるかどうかを判定する関数
  const canEditUser = () => {
    if (!currentUser) return false;
    // 管理者または自分自身のユーザーIDと一致する場合に編集可能
    return currentUser.role === 1 || currentUser.id === userId;
  };

  // ユーザーの役割名を取得する関数
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

  // 日付をフォーマットする関数
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // アカウント削除の確認ダイアログを開く関数
  const handleAccountDelete = async () => {
    setIsDeleting(true);
    setError(null);

    const token = getClientCookie('token');
    if (!token) {
      setError('認証トークンがありません。ログインしてください。');
      setIsDeleting(false);
      router.push('/auth/login'); // ログインページへリダイレクト
      return;
    }

    // アカウント削除の確認チェックが入っているか確認
    if (!isDeleteChecked) {
      setError('アカウント削除の確認にチェックを入れてください');
      setIsDeleting(false);
      return;
    }

    try {
      const response = await fetch(`/api/users/${user?.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const responseData = await response.json();
      if (response.ok && responseData.success) {
        setSuccessMessage('アカウントが削除されました。');
        setTimeout(() => {
          router.push('/users');
        }, 2000);
      } else {
        setError(responseData.message || 'アカウントの削除に失敗しました');
      }
    } catch {
      setError('アカウントの削除中にエラーが発生しました');
    } finally {
      setIsDeleting(false);
      setIsDeleteConfirmOpen(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* ヘッダー - 他のファイルと統一 */}
      <header className="flex justify-between items-center p-4 bg-blue-500 text-white">
        <button
          type="button"
          onClick={() => router.push('/users')}
          className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded transition-colors"
        >
          戻る
        </button>
        <h1 className="text-xl font-bold">ユーザー詳細</h1>
        {canEditUser() && (
          <button
            type="button"
            onClick={() => setIsEditOpen(!isEditOpen)}
            className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded transition-colors"
          >
            編集
          </button>
        )}
      </header>

      <main className="p-4 flex flex-col items-center">
        <h1 className="text-2xl font-bold mb-4">ユーザー詳細</h1>

        {/* ローディングオーバーレイ */}
        {isLoading && (
          <div className="fixed inset-0 flex items-center justify-center bg-white/50">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-300 border-t-blue-500"></div>
            {isDeleting && (
              <span className="ml-4 text-gray-700">アカウント削除中...</span>
            )}
          </div>
        )}

        {/* ユーザー詳細表示 */}
        {user && !isLoading && (
          <div className="w-full max-w-2xl mx-auto space-y-6">
            {/* ユーザー情報カード */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">
                {user.firstName} {user.lastName}
              </h2>
              <div className="space-y-3">
                <p>
                  <span className="font-medium">ユーザー名:</span> {user.username}
                </p>
                <p>
                  <span className="font-medium">名前:</span> {user.firstName}{' '}
                  {user.lastName}
                </p>
                <p>
                  <span className="font-medium">権限:</span>
                  <span
                    className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.role === 1
                        ? 'bg-red-100 text-red-800'
                        : user.role === 2
                          ? 'bg-yellow-100 text-yellow-800'
                          : user.role === 4
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {getUserRoleName(user.role)}
                  </span>
                </p>
                <p>
                  <span className="font-medium">作成日:</span>{' '}
                  {formatDate(user.createdAt)}
                </p>
                <p>
                  <span className="font-medium">更新日:</span>{' '}
                  {formatDate(user.updatedAt)}
                </p>
              </div>
              {canEditUser() && (
                <div className="flex gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => setIsEditOpen(!isEditOpen)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
                  >
                    編集
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsDeleteConfirmOpen(!isDeleteConfirmOpen)}
                    className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded transition-colors"
                  >
                    アカウント削除
                  </button>
                </div>
              )}
            </div>

            {/* Todoリストカード */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-blue-500 text-white p-4">
                <h3 className="text-lg font-bold">Todo一覧 ({userTodos.length}件)</h3>
              </div>
              {userTodos.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {userTodos.map((todo) => (
                    <div
                      key={todo.id}
                      className="p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">
                            {todo.title}
                          </h4>
                          <p className="text-gray-600 text-sm mb-2">
                            {todo.descriptions}
                          </p>
                          <div className="flex gap-4 text-xs text-gray-500">
                            <span>作成: {formatDate(todo.createdAt)}</span>
                            <span>更新: {formatDate(todo.updatedAt)}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => router.push(`/todos/${todo.id}`)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded text-sm transition-colors"
                        >
                          詳細
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <p className="text-gray-600">まだTodoがありません</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* データなしの状態 */}
        {!user && !isLoading && !error && (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-600">ユーザー情報がありません</p>
          </div>
        )}
      </main>

      {/* 編集モーダル */}
      {isEditOpen && canEditUser() && (
        <div className="fixed inset-0 bg-white/50 flex justify-center items-center z-50">
          <div className="w-96 bg-white p-6 rounded-lg shadow-lg">
            <div className="flex flex-col relative">
              <h2 className="text-lg font-bold mb-4">ユーザー情報の編集</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium mb-1">
                    名前:
                  </label>
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={handleInputChange}
                    name="firstName"
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium mb-1">
                    姓:
                  </label>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={handleInputChange}
                    name="lastName"
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="role" className="block text-sm font-medium mb-1">
                    役割:
                  </label>
                  <select
                    value={form.role}
                    onChange={handleInputChange}
                    name="role"
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="1">管理者</option>
                    <option value="2">マネージャー</option>
                    <option value="4">ユーザー</option>
                    <option value="8">ゲスト</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 justify-end mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditOpen(false);
                    setError(null);
                  }}
                  className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  onClick={handleUpdate}
                  disabled={isSubmitting}
                  className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white py-2 px-4 rounded transition-colors"
                >
                  {isSubmitting ? '更新中...' : '更新'}
                </button>
              </div>
            </div>
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

      <div className="fixed right-4 z-[9999] bottom-4 max-w-sm">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg animate-in slide-in-from-right-full duration-300">
            <div className="flex items-start justify-between">
              <span className="text-sm font-medium">{error}</span>
              <button
                type="button"
                onClick={() => setError(null)}
                className="ml-2 text-red-600 hover:text-red-800 flex-shrink-0"
              >
                ✕
              </button>
            </div>
          </div>
        )}
        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg shadow-lg animate-in slide-in-from-right-full duration-300">
            <div className="flex items-start justify-between">
              <span className="text-sm font-medium">{successMessage}</span>
              <button
                type="button"
                onClick={() => setSuccessMessage(null)}
                className="ml-2 text-green-600 hover:text-green-800 flex-shrink-0"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

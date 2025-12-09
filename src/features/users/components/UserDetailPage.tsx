'use client';

import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Chip,
  Input,
  Link,
  Select,
  SelectItem,
} from '@heroui/react';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import type { PaginationInfo } from '@/types/pagenationInfo';
import type { Todo } from '@/types/todo';
import type { User } from '@/types/user';

export default function UserDetailPage() {
  // ダイナミックルーティングのパラメータ取得
  const params = useParams();
  const userId = params.id as string;
  const router = useRouter();

  // 状態管理
  const [user, setUser] = useState<User | null>(null);
  const [userTodos, setUserTodos] = useState<Todo[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<number>(4);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 編集機能の状態
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editForm, setEditForm] = useState<{
    username: string;
    firstName: string;
    lastName: string;
    role: number;
  }>({
    username: '',
    firstName: '',
    lastName: '',
    role: 4,
  });

  // モーダルとページネーション
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo | null>(null);

  // ユーザー詳細情報を取得
  const fetchUserDetail = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setUser(data.data);
        // 編集フォームの初期値を設定
        setEditForm({
          username: data.data.username || '',
          firstName: data.data.firstName || '',
          lastName: data.data.lastName || '',
          role: data.data.role || 4,
        });
      } else {
        setError(data.message || 'ユーザーの取得に失敗しました');
      }
    } catch (error) {
      console.error('Failed to fetch user detail:', error);
      setError('ネットワークエラーが発生しました');

      // 認証エラーの場合はログインページにリダイレクト
      if (error instanceof Error && error.message.includes('401')) {
        router.push('/login');
      }
    } finally {
      setIsLoading(false);
    }
  }, [userId, router]);

  // ユーザーのTodo一覧を取得
  const fetchUserTodos = useCallback(async () => {
    if (!userId) return;

    try {
      const queryParams = new URLSearchParams({
        page: paginationInfo?.currentPage.toString() || '1',
      });

      const response = await fetch(
        `/api/users/${userId}/todos?${queryParams.toString()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        },
      );

      if (response.ok) {
        const data = await response.json();

        console.log('User Todos Data:', data);

        if (data.success) {
          setUserTodos(data.data || []);
          setPaginationInfo({
            currentPage: data.data.page,
            totalPages: data.data.totalPages,
            totalItems: data.data.total,
            itemsPerPage: data.data.perPage,
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch user todos:', error);
    }
  }, [userId, paginationInfo?.currentPage]);

  // 編集フォームのバリデーション
  const validateEditForm = () => {
    if (!editForm.username) {
      setError('ユーザー名は必須項目です');
      return false;
    }
    setError(null);
    return true;
  };

  // ユーザー情報の更新
  const handleUpdateUser = async () => {
    const { username, firstName, lastName, role } = editForm;

    if (!validateEditForm()) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, firstName, lastName, role }),
        credentials: 'include',
      });

      const data = await response.json();

      console.log('Update User Response:', data);

      if (response.ok && data.success) {
        setUser(data.data);
        setIsEditing(false);
      } else {
        setError(data.message || 'ユーザー情報の更新に失敗しました');
      }
    } catch {
      setError('ネットワークエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  // ユーザー削除
  const handleDeleteUser = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        // ユーザー削除成功後、ユーザーリストページにリダイレクト
        router.push('/users');
      } else {
        const data = await response.json();
        setError(data.message || 'ユーザーの削除に失敗しました');
      }
    } catch {
      setError('ネットワークエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  // ログアウト処理
  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        router.push('/login');
      } else {
        console.error('Logout failed');
      }
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  // 現在のユーザー情報を取得
  const checkPermission = useCallback(async () => {
    try {
      const response = await fetch('/api/users/me');
      if (response.ok) {
        const data = await response.json();

        if (data.data.role >= 3) {
          router.push('/todos');
          return;
        }

        setCurrentUserRole(data.data.role);
        setCurrentUserId(data.data.id);
      }
    } catch (err) {
      console.error('Failed to fetch current user:', err);
    }
  }, [router]);

  // 編集のキャンセル
  const cancelEdit = () => {
    setIsEditing(false);
    if (user) {
      setEditForm({
        username: user.username || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        role: user.role || 4,
      });
    }
  };

  // 初期化
  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  useEffect(() => {
    if (userId) {
      fetchUserDetail();
      fetchUserTodos();
    }
  }, [userId, fetchUserDetail, fetchUserTodos]);

  // ページ変更時にTodoを再取得
  useEffect(() => {
    if (paginationInfo?.currentPage) {
      fetchUserTodos();
    }
  }, [paginationInfo?.currentPage, fetchUserTodos]);

  // 役割名を取得するヘルパー関数
  const getRoleName = (role: number) => {
    switch (role) {
      case 1:
        return '管理者';
      case 2:
        return 'マネージャー';
      case 3:
        return '一般ユーザー';
      case 4:
        return 'ゲスト';
      default:
        return '不明';
    }
  };

  // 役割の色を取得するヘルパー関数
  const getRoleColor = (role: number) => {
    switch (role) {
      case 1:
        return 'danger';
      case 2:
        return 'warning';
      case 3:
        return 'success';
      case 4:
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <header className="h-15 p-5 flex justify-between items-center bg-blue-500 text-white">
        <h1 className="text-xl font-bold">Todoアプリ</h1>
        <div className="flex gap-2">
          <Link
            className="bg-blue-600 text-white hover:bg-blue-700 px-3 py-1 rounded transition-colors"
            href="/todos"
          >
            Todo一覧
          </Link>
          <Link
            className="bg-blue-600 text-white hover:bg-blue-700 px-3 py-1 rounded transition-colors"
            href="/profile"
          >
            プロフィール
          </Link>
          {currentUserRole <= 2 && (
            <Link
              className="bg-blue-600 text-white hover:bg-blue-700 px-3 py-1 rounded transition-colors"
              href="/users"
            >
              ユーザーリスト
            </Link>
          )}
          <Button
            className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded transition-colors text-white"
            onPress={handleLogout}
          >
            ログアウト
          </Button>
        </div>
      </header>

      <main className="p-4 flex flex-col items-center">
        <div className="w-[600px] mx-auto">
          {/* ローディング状態 */}
          {isLoading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="mt-2 text-gray-600">読み込み中...</p>
            </div>
          )}

          {/* ユーザー詳細表示 */}
          {user && !isLoading && (
            <>
              <Card className="w-full bg-blue-100 p-4 mb-6">
                <CardHeader className="pt-0 px-0 flex justify-between items-center">
                  <h1 className="text-xl font-bold text-blue-900">
                    ユーザー詳細{isEditing && ' (編集モード)'}
                  </h1>
                  {currentUserRole === 1 && (
                    <div className="flex gap-2">
                      {isEditing ? (
                        <>
                          <Button
                            color="primary"
                            size="sm"
                            onPress={handleUpdateUser}
                            isDisabled={isLoading}
                          >
                            保存
                          </Button>
                          <Button
                            color="danger"
                            variant="bordered"
                            size="sm"
                            onPress={cancelEdit}
                          >
                            キャンセル
                          </Button>
                        </>
                      ) : (
                        currentUserRole === 1 &&
                        !isEditing && (
                          <>
                            <Button
                              color="primary"
                              size="sm"
                              onPress={() => setIsEditing(true)}
                            >
                              編集
                            </Button>
                            {currentUserId !== userId && (
                              <Button
                                color="danger"
                                variant="bordered"
                                size="sm"
                                onPress={() => setShowDeleteModal(true)}
                              >
                                削除
                              </Button>
                            )}
                          </>
                        )
                      )}
                    </div>
                  )}
                </CardHeader>

                <CardBody className="bg-white rounded-lg p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* ユーザー名 */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-700 mb-2">
                        ユーザー名
                      </h3>
                      {isEditing && currentUserRole === 1 ? (
                        <Input
                          type="text"
                          label="ユーザー名"
                          value={editForm.username}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              username: e.target.value,
                            })
                          }
                          placeholder="ユーザー名を入力"
                          variant="bordered"
                          aria-label="ユーザー名を編集する"
                          required
                        />
                      ) : (
                        <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                          {user.username}
                        </p>
                      )}
                    </div>

                    {/* 姓 */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-700 mb-2">姓</h3>
                      {isEditing && currentUserRole === 1 ? (
                        <Input
                          type="text"
                          label="姓"
                          value={editForm.lastName}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              lastName: e.target.value,
                            })
                          }
                          placeholder="姓を入力"
                          variant="bordered"
                          aria-label="姓を編集する"
                        />
                      ) : (
                        <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                          {user.lastName || '-'}
                        </p>
                      )}
                    </div>

                    {/* 名 */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-700 mb-2">名</h3>
                      {isEditing && currentUserRole === 1 ? (
                        <Input
                          type="text"
                          label="名"
                          value={editForm.firstName}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              firstName: e.target.value,
                            })
                          }
                          placeholder="名を入力"
                          variant="bordered"
                          aria-label="名を編集する"
                        />
                      ) : (
                        <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                          {user.firstName || '-'}
                        </p>
                      )}
                    </div>

                    {/* ロール */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-700 mb-2">ロール</h3>
                      {isEditing && currentUserRole === 1 ? (
                        <Select
                          label="ロール"
                          placeholder="ロールを選択"
                          selectedKeys={[editForm.role.toString()]}
                          onSelectionChange={(keys) => {
                            const selected = Array.from(keys)[0] as string;
                            setEditForm({
                              ...editForm,
                              role: parseInt(selected),
                            });
                          }}
                          variant="bordered"
                          aria-label="ユーザーのロールを選択する"
                        >
                          <SelectItem key="1">管理者</SelectItem>
                          <SelectItem key="2">マネージャー</SelectItem>
                          <SelectItem key="3">一般ユーザー</SelectItem>
                          <SelectItem key="4">ゲスト</SelectItem>
                        </Select>
                      ) : (
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <Chip
                            color={getRoleColor(user.role)}
                            variant="flat"
                            size="lg"
                          >
                            {getRoleName(user.role)}
                          </Chip>
                        </div>
                      )}
                    </div>

                    {/* ユーザーID */}
                    <div className="md:col-span-2">
                      <h3 className="text-lg font-medium text-gray-700 mb-2">
                        ユーザーID
                      </h3>
                      <p className="text-gray-900 bg-gray-50 p-3 rounded-lg font-mono text-sm">
                        {user.id}
                      </p>
                    </div>

                    {/* 日時情報 */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-700 mb-2">
                        作成日時
                      </h3>
                      <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleString('ja-JP')
                          : '-'}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium text-gray-700 mb-2">
                        更新日時
                      </h3>
                      <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                        {user.updatedAt
                          ? new Date(user.updatedAt).toLocaleString('ja-JP')
                          : '-'}
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* ユーザーのTodo一覧 */}
              <Card className="w-full mb-4">
                <CardHeader className="box-shadow rounded-lg justify-between items-center bg-green-500 text-white p-4">
                  <h2 className="text-lg font-bold">{user.username} さんのTodo一覧</h2>
                  <p className="text-sm">
                    {paginationInfo?.totalItems || userTodos.length}件
                  </p>
                </CardHeader>
                <CardBody className="p-4">
                  {userTodos.length > 0 ? (
                    <div className="space-y-4">
                      {userTodos.map((todo) => (
                        <Card
                          key={todo.id}
                          className="w-full bg-white shadow-sm hover:shadow-md transition-shadow"
                        >
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-start w-full">
                              <h4 className="text-md font-semibold text-gray-900">
                                {todo.title}
                              </h4>
                              <Chip
                                color={todo.completed ? 'success' : 'danger'}
                                variant="flat"
                                size="sm"
                              >
                                {todo.completed ? '完了' : '未完了'}
                              </Chip>
                            </div>
                          </CardHeader>
                          <CardBody className="pt-0">
                            <p className="text-gray-600 text-sm mb-2">
                              {todo.descriptions || '説明なし'}
                            </p>
                            <p className="text-xs text-gray-400">
                              作成日:{' '}
                              {new Date(todo.createdAt).toLocaleDateString('ja-JP')}
                            </p>
                          </CardBody>
                          <CardFooter className="pt-0 pb-3">
                            <Link
                              href={`/todos/${todo.id}`}
                              className="text-blue-600 hover:underline text-sm"
                            >
                              詳細表示
                            </Link>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Todoがありません</p>
                    </div>
                  )}
                </CardBody>
              </Card>

              {/* Todoのページネーション */}
              {paginationInfo && paginationInfo.totalPages > 1 && (
                <Card className="w-full mt-6 p-4">
                  <div className="flex justify-center items-center space-x-2">
                    {/* 前へボタン */}
                    <Button
                      isDisabled={paginationInfo?.currentPage === 1}
                      onPress={() =>
                        setPaginationInfo((prev) =>
                          prev ? { ...prev, currentPage: prev.currentPage - 1 } : null,
                        )
                      }
                      className="px-3 py-1"
                      variant="bordered"
                    >
                      前へ
                    </Button>

                    {/* ページ番号 */}
                    {Array.from(
                      { length: paginationInfo?.totalPages || 1 },
                      (_, i) => i + 1,
                    )
                      .filter((pageNum) => {
                        const start = Math.max(
                          1,
                          (paginationInfo?.currentPage || 1) - 2,
                        );
                        const end = Math.min(
                          paginationInfo?.totalPages || 1,
                          (paginationInfo?.currentPage || 1) + 2,
                        );
                        return pageNum >= start && pageNum <= end;
                      })
                      .map((pageNum) => (
                        <Button
                          key={pageNum}
                          isDisabled={isLoading}
                          onPress={() =>
                            setPaginationInfo((prev) =>
                              prev ? { ...prev, currentPage: pageNum } : null,
                            )
                          }
                          className={`px-3 py-1 min-w-[40px] ${
                            (paginationInfo?.currentPage || 1) === pageNum
                              ? 'bg-blue-500 text-white'
                              : 'bg-white text-blue-500 border border-blue-500 hover:bg-blue-50'
                          }`}
                        >
                          {pageNum}
                        </Button>
                      ))}

                    {/* 次へボタン */}
                    <Button
                      isDisabled={
                        paginationInfo?.currentPage === paginationInfo?.totalPages
                      }
                      onPress={() =>
                        setPaginationInfo((prev) =>
                          prev ? { ...prev, currentPage: prev.currentPage + 1 } : null,
                        )
                      }
                      className="px-3 py-1"
                      variant="bordered"
                    >
                      次へ
                    </Button>
                  </div>
                </Card>
              )}
            </>
          )}

          {/* ユーザーが見つからない場合 */}
          {!user && !isLoading && !error && (
            <Card className="w-full p-8 text-center">
              <p className="text-gray-500 text-lg mb-2">ユーザーが見つかりません</p>
              <p className="text-gray-400 text-sm mb-4">
                指定されたIDのユーザーが存在しないか、アクセス権限がありません。
              </p>
              <Link href="/users" className="text-blue-600 hover:underline">
                ユーザー一覧に戻る
              </Link>
            </Card>
          )}
        </div>

        {error && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 border border-red-500 bg-red-300 text-white px-6 py-3 rounded-lg shadow-lg z-50 max-w-sm">
            <div className="flex items-center justify-between">
              <span className="text-red-800">{error}</span>
              <Button
                color="danger"
                onPress={() => setError(null)}
                className="ml-4 text-white"
              >
                ×
              </Button>
            </div>
          </div>
        )}

        {/* ユーザー削除確認モーダル */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-10">
            <div className="bg-white rounded-lg p-6 w-96">
              <h2 className="text-xl font-bold mb-4">ユーザー削除確認</h2>
              <p className="mb-6">
                「{user?.username}」さんを削除しますか？
                <br />
                <span className="text-red-600 text-sm">※この操作は取り消せません</span>
              </p>
              <div className="flex justify-end gap-2">
                <Button
                  color="danger"
                  onPress={() => {
                    handleDeleteUser();
                    setShowDeleteModal(false);
                  }}
                  isDisabled={isLoading}
                >
                  削除
                </Button>
                <Button
                  color="primary"
                  variant="light"
                  onPress={() => setShowDeleteModal(false)}
                >
                  キャンセル
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

'use client';

import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Input,
  Link,
  Select,
  SelectItem,
  Textarea,
} from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import type { PaginationInfo } from '@/types/pagenationInfo';
import type { Todo } from '@/types/todo';

export default function TodoListPage() {
  // Todo一覧の状態管理
  const [todos, setTodos] = useState<Todo[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<number>(4);
  //
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingTodoId, setDeletingTodoId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    descriptions: '',
  });

  // インライン編集用の状態
  const [inlineEditingId, setInlineEditingId] = useState<string | null>(null);
  const [inlineForm, setInlineForm] = useState<{
    [key: string]: { title: string; descriptions: string };
  }>({});
  const router = useRouter();
  // ページネーション関連の状態
  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo | null>(null);

  // フィルタ・ソート関連の状態
  const [completedFilter, setCompletedFilter] = useState<
    'all' | 'completed' | 'incomplete'
  >('all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'updatedAt' | 'title'>(
    'createdAt',
  );
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = (formData: { title: string; descriptions?: string }) => {
    if (!formData.title || formData.title.trim() === '') {
      setError('タイトルは必須項目です');
      return false;
    }
    if (formData.title.length > 32) {
      setError('タイトルは32文字以内で入力してください');
      return false;
    }
    if (formData.descriptions && formData.descriptions.length > 128) {
      setError('説明は128文字以内で入力してください');
      return false;
    }
    setError(null);
    return true;
  };

  const handleCreateTodo = async (formData: {
    title: string;
    descriptions?: string;
  }) => {
    if (!validateForm(formData)) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setShowCreateModal(false);
        resetForm();
        fetchTodos();
      } else {
        setError(data.message || 'Todoの作成に失敗しました');
      }
    } catch (error) {
      console.error('Create todo error:', error);
      setError('ネットワークエラーが発生しました。Todoの作成に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ title: '', descriptions: '' });
  };

  // インライン編集関連の関数
  const startInlineEdit = (todo: Todo) => {
    setInlineEditingId(todo.id);
    setInlineForm({
      ...inlineForm,
      [todo.id]: {
        title: todo.title,
        descriptions: todo.descriptions || '',
      },
    });
  };

  const cancelInlineEdit = () => {
    setInlineEditingId(null);
    setInlineForm({});
    setError(null);
  };

  const handleInlineInputChange = (
    todoId: string,
    field: 'title' | 'descriptions',
    value: string,
  ) => {
    setInlineForm((prev) => ({
      ...prev,
      [todoId]: {
        ...prev[todoId],
        [field]: value,
      },
    }));
  };

  const saveInlineEdit = async (todoId: string) => {
    const formData = inlineForm[todoId];
    if (!formData) return;

    if (!validateForm(formData)) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/todos/${todoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // ローカル状態を更新
        setTodos((prev) =>
          prev.map((todo) => (todo.id === todoId ? { ...todo, ...formData } : todo)),
        );
        setInlineEditingId(null);
        setInlineForm((prev) => {
          const newForm = { ...prev };
          delete newForm[todoId];
          return newForm;
        });
      } else {
        setError(data.message || 'Todoの更新に失敗しました');
      }
    } catch (error) {
      console.error('Save inline edit error:', error);
      setError('ネットワークエラーが発生しました。Todoの更新に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTodo = async (todoId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const resoponse = await fetch(`/api/todos/${todoId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const data = await resoponse.json();

      if (resoponse.ok && data.success) {
        // 削除成功時にローカル状態を更新
        setTodos((prevTodos) => prevTodos.filter((todo) => todo.id !== todoId));
        setPaginationInfo((prev) =>
          prev ? { ...prev, totalItems: prev.totalItems - 1 } : null,
        );
      } else {
        setError(data.message || 'Todoの削除に失敗しました');
      }
    } catch (error) {
      console.error('Delete todo error:', error);
      setError('ネットワークエラーが発生しました。Todoの削除に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
      setError('ログアウトに失敗しました。ページを更新して再度お試しください。');
      return;
    }
    router.push('/login');
  };

  const fetchTodos = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams({
        page: paginationInfo?.currentPage.toString() || '1',
        completedFilter,
        sortBy,
        sortOrder,
      });

      const res = await fetch(`/api/todos?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();

      if (data.success) {
        // APIレスポンス: { success: true, data: { data: [...], total, page, perPage, totalPages } }
        const responseData = data.data;
        setTodos(responseData.data || []);
        setPaginationInfo({
          currentPage: responseData.page,
          totalPages: responseData.totalPages,
          totalItems: responseData.total,
          itemsPerPage: responseData.perPage,
        });
        // setTotalItems(responseData.total);
        // setTotalPages(responseData.totalPages);
      } else {
        setError(data.message || 'Todoの取得に失敗しました');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('ネットワークエラーが発生しました');

      // 認証エラーの場合はログインページにリダイレクト
      if (err instanceof Error && err.message.includes('401')) {
        router.push('/login');
      }
    } finally {
      setIsLoading(false);
    }
  }, [paginationInfo?.currentPage, completedFilter, sortBy, sortOrder, router]);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await fetch('/api/users/me');
        if (response.ok) {
          const data = await response.json();
          setCurrentUserRole(data.data.role);
        }
      } catch (err) {
        console.error('Failed to fetch user info:', err);
        setError('ユーザー情報の取得に失敗しました。');
      }
    };

    fetchUserInfo();
  }, []);

  // ページ・フィルタ・ソートが変更されたらデータを再取得
  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

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
        <Card shadow="sm" className="w-fit p-5 text-center mb-4">
          <h2 className="text-xl font-bold">Todo一覧</h2>
          <p className="text-sm text-gray-600">{paginationInfo?.totalItems || 0}件</p>
        </Card>
        <Button
          color="primary"
          className="font-bold py-1 px-4 my-4 rounded-full sticky top-5 z-1 border-2 border-white"
          onPress={() => {
            resetForm();
            setShowCreateModal(true);
          }}
        >
          <span className="text-xl align-middle">+</span>タスクを作成
        </Button>

        {/* フィルター・ソートUI */}
        <Card className="w-full max-w-4xl mb-4 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 完了状態フィルター */}
            <div>
              <Select
                label="完了状態"
                placeholder="完了状態を選択"
                selectedKeys={[completedFilter]}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  setCompletedFilter(selected as 'all' | 'completed' | 'incomplete');
                  setPaginationInfo((prev) =>
                    prev ? { ...prev, currentPage: 1 } : null,
                  ); // フィルター変更時は1ページ目に戻る
                }}
                variant="bordered"
                size="sm"
                aria-label="Todo完了状態でフィルターする"
              >
                <SelectItem key="all">すべて</SelectItem>
                <SelectItem key="incomplete">未完了</SelectItem>
                <SelectItem key="completed">完了済み</SelectItem>
              </Select>
            </div>

            {/* ソート項目 */}
            <div>
              <Select
                label="ソート項目"
                placeholder="ソート項目を選択"
                selectedKeys={[sortBy]}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  setSortBy(selected as 'createdAt' | 'updatedAt' | 'title');
                }}
                variant="bordered"
                size="sm"
                aria-label="Todoのソート項目を選択する"
              >
                <SelectItem key="createdAt">作成日</SelectItem>
                <SelectItem key="updatedAt">更新日</SelectItem>
                <SelectItem key="title">タイトル</SelectItem>
              </Select>
            </div>

            {/* ソート順序 */}
            <div>
              <Select
                label="並び順"
                placeholder="並び順を選択"
                selectedKeys={[sortOrder]}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  setSortOrder(selected as 'asc' | 'desc');
                }}
                variant="bordered"
                size="sm"
                aria-label="Todoの並び順を選択する"
              >
                <SelectItem key="desc">降順（新しい順）</SelectItem>
                <SelectItem key="asc">昇順（古い順）</SelectItem>
              </Select>
            </div>
          </div>
        </Card>

        {/* ローディング状態 */}
        {isLoading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-gray-600">読み込み中...</p>
          </div>
        )}

        <div className="w-full max-w-4xl mx-auto">
          {todos.map((todo) => (
            <Card key={todo.id} className="max-w-[600px] mx-auto mb-5 p-2 z-0 relative">
              <CardHeader className="box-shadow rounded-lg justify-between items-center bg-blue-500 text-white p-2">
                {inlineEditingId === todo.id ? (
                  <div className="flex-1 mr-2">
                    <Input
                      value={inlineForm[todo.id]?.title || ''}
                      onChange={(e) =>
                        handleInlineInputChange(todo.id, 'title', e.target.value)
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          saveInlineEdit(todo.id);
                        } else if (e.key === 'Escape') {
                          e.preventDefault();
                          cancelInlineEdit();
                        }
                      }}
                      placeholder="タイトルを入力 - Enterで保存、Escでキャンセル"
                      className="text-lg"
                      autoFocus
                      required
                    />
                  </div>
                ) : (
                  <h3 className="text-lg font-bold ml-1">{todo.title}</h3>
                )}
              </CardHeader>
              <CardBody className="min-h-[50px]">
                {inlineEditingId === todo.id ? (
                  <Textarea
                    value={inlineForm[todo.id]?.descriptions || ''}
                    onChange={(e) =>
                      handleInlineInputChange(todo.id, 'descriptions', e.target.value)
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.ctrlKey) {
                        e.preventDefault();
                        saveInlineEdit(todo.id);
                      } else if (e.key === 'Escape') {
                        e.preventDefault();
                        cancelInlineEdit();
                      }
                    }}
                    placeholder="説明を入力 (任意) - Ctrl+Enterで保存、Escでキャンセル"
                    className="w-full"
                    size="sm"
                  />
                ) : !todo.descriptions ? (
                  <p className="text-gray-400">説明がありません</p>
                ) : (
                  <p>{todo.descriptions}</p>
                )}
              </CardBody>
              <CardFooter className="text-sm my-2 flex justify-between items-center py-0">
                {inlineEditingId === todo.id ? (
                  <div className="flex gap-2 ml-auto">
                    <Button
                      color="primary"
                      size="sm"
                      radius="full"
                      onPress={() => saveInlineEdit(todo.id)}
                      isLoading={isLoading}
                    >
                      保存
                    </Button>
                    <Button
                      color="danger"
                      variant="bordered"
                      size="sm"
                      radius="full"
                      onPress={cancelInlineEdit}
                    >
                      キャンセル
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2 ml-auto">
                    <Link
                      className="bg-blue-600 font-bold text-white py-1 px-5 rounded-full"
                      href={`/todos/${todo.id}`}
                      size="sm"
                    >
                      詳細
                    </Link>
                    <Button
                      color="warning"
                      variant="bordered"
                      radius="full"
                      onPress={() => startInlineEdit(todo)}
                      size="sm"
                    >
                      編集
                    </Button>
                    <Button
                      color="danger"
                      variant="bordered"
                      radius="full"
                      onPress={() => {
                        setDeletingTodoId(todo.id);
                        setShowDeleteModal(true);
                      }}
                      size="sm"
                    >
                      削除
                    </Button>
                  </div>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
        {todos.length < 1 && !isLoading && (
          <div className="w-full bg-white rounded-lg shadow-md p-8 my-4 text-center">
            <p className="text-gray-500 text-lg">Todoがありません</p>
            <p className="text-gray-400 text-sm mt-2">
              新しいタスクを作成してみましょう。
            </p>
          </div>
        )}

        {/* ページネーション */}
        {paginationInfo && paginationInfo.totalPages > 1 && (
          <Card className="w-full mt-6 p-4">
            <div className="flex justify-center items-center space-x-2">
              {/* 前へボタン */}
              <Button
                isDisabled={paginationInfo?.currentPage === 1 || isLoading}
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
              {Array.from({ length: paginationInfo?.totalPages || 1 }, (_, i) => i + 1)
                .filter((pageNum) => {
                  // 現在のページを中心に前後2ページを表示
                  const start = Math.max(1, (paginationInfo?.currentPage || 1) - 2);
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
                  paginationInfo?.currentPage === paginationInfo?.totalPages ||
                  isLoading
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

            {/* ページ情報 */}
            <p className="text-center text-sm text-gray-600 mt-2">
              {paginationInfo?.currentPage} / {paginationInfo?.totalPages} ページ (合計{' '}
              {paginationInfo?.totalItems} 件)
            </p>
          </Card>
        )}
      </main>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-10">
          <Card shadow="none" className="w-96 p-4">
            <CardHeader>
              <h2 className="text-xl font-bold">新規Todoの作成</h2>
            </CardHeader>
            <CardBody>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleCreateTodo(form);
                }}
              >
                <Input
                  label="タイトル"
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleInputChange}
                  placeholder="Todoのタイトルを入力"
                  className="mb-4"
                  required
                />
                <div className="mb-4">
                  <Textarea
                    label="説明"
                    name="descriptions"
                    value={form.descriptions}
                    onChange={handleInputChange}
                    placeholder="Todoの説明を入力 (任意)"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    color="danger"
                    variant="light"
                    onPress={() => {
                      setShowCreateModal(false);
                      resetForm();
                      setError(null);
                    }}
                  >
                    キャンセル
                  </Button>
                  <Button type="submit" color="primary" isLoading={isLoading}>
                    作成
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Todo削除時確認モーダル表示 */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-10">
          <div className="bg-white rounded-lg p-6 w-96">
            <h2 className="text-xl font-bold mb-4">Todo削除確認</h2>
            <p className="mb-6">
              「
              {deletingTodoId
                ? todos.find((todo) => todo.id === deletingTodoId)?.title
                : ''}
              」を削除しますか？
            </p>
            <div className="flex justify-end gap-2">
              <Button
                color="danger"
                radius="full"
                onPress={async () => {
                  if (deletingTodoId) {
                    await handleDeleteTodo(deletingTodoId);
                    setShowDeleteModal(false);
                    setDeletingTodoId(null);
                  }
                }}
              >
                削除
              </Button>
              <Button
                color="primary"
                variant="light"
                radius="full"
                onPress={() => {
                  setShowDeleteModal(false);
                  setDeletingTodoId(null);
                  setError(null);
                }}
              >
                キャンセル
              </Button>
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
}

'use client';

import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Checkbox,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Select,
  SelectItem,
  Textarea,
  useDisclosure,
} from '@heroui/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type FormEvent, useCallback, useEffect, useState } from 'react';

interface Todo {
  id: string;
  title: string;
  descriptions?: string;
  completed: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

interface TodoListResponse {
  success: boolean;
  data: {
    data: Todo[];
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
}

interface TodoListPageProps {
  initialData?: TodoListResponse;
  currentUserRole?: number;
}

export function TodoListPage({
  initialData,
  currentUserRole: initialUserRole,
}: TodoListPageProps) {
  const router = useRouter();
  const [todos, setTodos] = useState<Todo[]>(initialData?.data?.data || []);
  const [page, setPage] = useState<number>(initialData?.data?.page || 1);
  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo | null>(
    initialData
      ? {
          currentPage: initialData.data.page,
          totalPages: initialData.data.totalPages,
          totalItems: initialData.data.total,
          itemsPerPage: initialData.data.perPage,
        }
      : null,
  );
  const [completedFilter, setCompletedFilter] = useState<
    'all' | 'completed' | 'incomplete'
  >('all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'updatedAt' | 'title'>(
    'createdAt',
  );
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [newTodoTitle, setNewTodoTitle] = useState<string>('');
  const [newTodoDescription, setNewTodoDescription] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [currentUserRole, setCurrentUserRole] = useState<number>(initialUserRole || 4);
  const [todoToDelete, setTodoToDelete] = useState<string | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Todo一覧を取得
  const fetchTodos = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        perPage: '20',
        completedFilter,
        sortBy,
        sortOrder,
      });

      const response = await fetch(`/api/todos?${params}`);

      if (response.status === 401) {
        router.push('/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Todoの取得に失敗しました');
      }

      const data = await response.json();
      // APIレスポンス構造: { success: true, data: { data: [...], total, page, perPage, totalPages } }
      const responseData = data.data;
      setTodos(responseData.data || []);
      setPaginationInfo({
        currentPage: responseData.page,
        totalPages: responseData.totalPages,
        totalItems: responseData.total,
        itemsPerPage: responseData.perPage,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Todoの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [page, completedFilter, sortBy, sortOrder, router]);

  // ユーザー情報を取得してロールを設定（初期値がない場合のみ）
  useEffect(() => {
    if (initialUserRole !== undefined) {
      // サーバーから渡された場合はスキップ
      return;
    }

    const fetchUserInfo = async () => {
      try {
        const response = await fetch('/api/users/me');
        if (response.ok) {
          const data = await response.json();
          setCurrentUserRole(data.data.role);
        }
      } catch (err) {
        console.error('Failed to fetch user info:', err);
      }
    };

    fetchUserInfo();
  }, [initialUserRole]);

  // ページ読み込み時・フィルター変更時にTodoを取得
  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  // Todo作成
  const handleCreateTodo = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!newTodoTitle.trim()) {
      setError('タイトルは必須です');
      return;
    }

    if (newTodoTitle.length > 32) {
      setError('タイトルは32文字以内で入力してください');
      return;
    }

    if (newTodoDescription && newTodoDescription.length > 128) {
      setError('説明は128文字以内で入力してください');
      return;
    }

    setIsCreating(true);

    try {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newTodoTitle,
          descriptions: newTodoDescription || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Todoの作成に失敗しました');
      }

      // フォームをリセット
      setNewTodoTitle('');
      setNewTodoDescription('');

      // 一覧を再取得
      await fetchTodos();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Todoの作成に失敗しました');
    } finally {
      setIsCreating(false);
    }
  };

  // Todo削除
  const handleDeleteTodo = async (id: string) => {
    setTodoToDelete(id);
    onOpen();
  };

  const confirmDeleteTodo = async () => {
    if (!todoToDelete) return;

    try {
      const response = await fetch(`/api/todos/${todoToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Todoの削除に失敗しました');
      }

      // 一覧を再取得
      await fetchTodos();
      onClose();
      setTodoToDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Todoの削除に失敗しました');
      onClose();
      setTodoToDelete(null);
    }
  };

  // Todo完了状態の切り替え
  const handleToggleComplete = async (todo: Todo) => {
    try {
      const response = await fetch(`/api/todos/${todo.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: todo.title,
          descriptions: todo.descriptions,
          completed: !todo.completed,
        }),
      });

      if (!response.ok) {
        throw new Error('Todoの更新に失敗しました');
      }

      // 一覧を再取得
      await fetchTodos();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Todoの更新に失敗しました');
    }
  };

  // ログアウト
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
      router.push('/login');
    } catch (err) {
      console.error('Logout error:', err);
      router.push('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* ヘッダー */}
      <Navbar>
        <NavbarBrand>
          <p className="font-bold text-inherit">Todo アプリ</p>
        </NavbarBrand>
        <NavbarContent className="hidden sm:flex gap-4" justify="center">
          <NavbarItem>
            <Link href="/todos" className="text-foreground">
              Todo一覧
            </Link>
          </NavbarItem>
          <NavbarItem>
            <Link href="/profile" className="text-foreground">
              プロフィール
            </Link>
          </NavbarItem>
          {currentUserRole <= 2 && (
            <NavbarItem>
              <Link href="/users" className="text-foreground">
                ユーザー管理
              </Link>
            </NavbarItem>
          )}
        </NavbarContent>
        <NavbarContent justify="end">
          <NavbarItem>
            <Button color="default" variant="flat" onPress={handleLogout}>
              ログアウト
            </Button>
          </NavbarItem>
        </NavbarContent>
      </Navbar>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Todo作成フォーム */}
        <Card className="mb-8">
          <CardHeader>
            <h2 className="text-xl font-bold text-gray-900">新しいTodoを作成</h2>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleCreateTodo} className="space-y-4">
              <Input
                type="text"
                label="タイトル"
                placeholder="Todoのタイトル（32文字以内）"
                value={newTodoTitle}
                onChange={(e) => setNewTodoTitle(e.target.value)}
                isDisabled={isCreating}
                isRequired
              />

              <Textarea
                label="説明"
                placeholder="Todoの説明（128文字以内）"
                value={newTodoDescription}
                onChange={(e) => setNewTodoDescription(e.target.value)}
                minRows={3}
                isDisabled={isCreating}
              />

              <Button type="submit" color="primary" isLoading={isCreating}>
                作成
              </Button>
            </form>
          </CardBody>
        </Card>

        {/* フィルター・ソート */}
        <Card className="mb-8">
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 完了状態フィルター */}
              <Select
                label="表示フィルター"
                selectedKeys={[completedFilter]}
                onChange={(e) => {
                  setCompletedFilter(
                    e.target.value as 'all' | 'completed' | 'incomplete',
                  );
                  setPage(1);
                }}
              >
                <SelectItem key="all">すべて</SelectItem>
                <SelectItem key="completed">完了済み</SelectItem>
                <SelectItem key="incomplete">未完了</SelectItem>
              </Select>

              {/* ソート項目 */}
              <Select
                label="並び順"
                selectedKeys={[sortBy]}
                onChange={(e) =>
                  setSortBy(e.target.value as 'createdAt' | 'updatedAt' | 'title')
                }
              >
                <SelectItem key="createdAt">作成日時</SelectItem>
                <SelectItem key="updatedAt">更新日時</SelectItem>
                <SelectItem key="title">タイトル</SelectItem>
              </Select>

              {/* ソート順 */}
              <Select
                label="順序"
                selectedKeys={[sortOrder]}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              >
                <SelectItem key="asc">昇順</SelectItem>
                <SelectItem key="desc">降順</SelectItem>
              </Select>
            </div>
          </CardBody>
        </Card>

        {/* エラー表示 */}
        {error && (
          <div className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-md p-3 mb-4">
            {error}
          </div>
        )}

        {/* ローディング表示 */}
        {isLoading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
            <p className="mt-2 text-gray-600">読み込み中...</p>
          </div>
        )}

        {/* Todo一覧 */}
        {!isLoading && (
          <>
            <Card className="mb-8">
              <CardHeader>
                <h2 className="text-xl font-bold text-gray-900">
                  Todo一覧
                  {paginationInfo && (
                    <span className="text-sm font-normal text-gray-600 ml-2">
                      （全{paginationInfo.totalItems}件）
                    </span>
                  )}
                </h2>
              </CardHeader>
              <CardBody>
                {todos.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Todoがありません</p>
                ) : (
                  <div className="space-y-2">
                    {todos.map((todo) => (
                      <div
                        key={todo.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <Checkbox
                            isSelected={todo.completed}
                            onValueChange={() => handleToggleComplete(todo)}
                          />
                          <div className="flex-1">
                            <Link href={`/todos/${todo.id}`} className="block">
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
                              <p className="text-xs text-gray-500 mt-1">
                                作成: {new Date(todo.createdAt).toLocaleString('ja-JP')}
                              </p>
                            </Link>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            as={Link}
                            href={`/todos/${todo.id}`}
                            color="primary"
                            size="sm"
                          >
                            詳細
                          </Button>
                          <Button
                            color="danger"
                            size="sm"
                            onPress={() => handleDeleteTodo(todo.id)}
                          >
                            削除
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>

            {/* ページネーション */}
            {paginationInfo && paginationInfo.totalPages > 1 && (
              <Card>
                <CardBody>
                  <div className="flex items-center justify-between">
                    <Button
                      color="default"
                      variant="flat"
                      onPress={() => setPage(page - 1)}
                      isDisabled={page <= 1}
                    >
                      前のページ
                    </Button>

                    <span className="text-gray-700">
                      ページ {page} / {paginationInfo.totalPages}
                    </span>

                    <Button
                      color="default"
                      variant="flat"
                      onPress={() => setPage(page + 1)}
                      isDisabled={page >= paginationInfo.totalPages}
                    >
                      次のページ
                    </Button>
                  </div>
                </CardBody>
              </Card>
            )}
          </>
        )}

        {/* 削除確認モーダル */}
        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalContent>
            <ModalHeader>確認</ModalHeader>
            <ModalBody>
              <p>このTodoを削除してもよろしいですか?</p>
            </ModalBody>
            <ModalFooter>
              <Button color="default" variant="light" onPress={onClose}>
                キャンセル
              </Button>
              <Button color="danger" onPress={confirmDeleteTodo}>
                削除
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </main>
    </div>
  );
}

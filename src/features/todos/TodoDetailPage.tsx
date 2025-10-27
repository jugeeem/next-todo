'use client';

import {
  Button,
  Card,
  CardBody,
  CardHeader,
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
  Textarea,
  useDisclosure,
} from '@heroui/react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
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

interface TodoDetailPageProps {
  initialTodo?: Todo;
}

export function TodoDetailPage({ initialTodo }: TodoDetailPageProps) {
  const router = useRouter();
  const params = useParams();
  const todoId = params?.id as string;

  const [todo, setTodo] = useState<Todo | null>(initialTodo || null);
  const [title, setTitle] = useState<string>(initialTodo?.title || '');
  const [descriptions, setDescriptions] = useState<string>(
    initialTodo?.descriptions || '',
  );
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [currentUserRole, setCurrentUserRole] = useState<number>(4); // デフォルトはUSER
  const { isOpen, onOpen, onClose } = useDisclosure();

  // 現在のユーザー情報を取得
  const fetchCurrentUser = useCallback(async () => {
    try {
      const response = await fetch('/api/users/me');
      if (response.ok) {
        const data = await response.json();
        setCurrentUserRole(data.data.role);
      }
    } catch (err) {
      console.error('Failed to fetch current user:', err);
    }
  }, []);

  // Todo詳細を取得
  const fetchTodoDetail = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/todos/${todoId}`);

      if (response.status === 401) {
        router.push('/login');
        return;
      }

      if (response.status === 404) {
        setError('Todoが見つかりません');
        return;
      }

      if (!response.ok) {
        throw new Error('Todoの取得に失敗しました');
      }

      const data = await response.json();
      const todoData = data.data;
      setTodo(todoData);
      setTitle(todoData.title);
      setDescriptions(todoData.descriptions || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Todoの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [router, todoId]);

  // 初回読み込み時にTodo詳細を取得（初期データがない場合のみ）
  useEffect(() => {
    if (!initialTodo && todoId) {
      fetchTodoDetail();
    }
    // 現在のユーザー情報を取得
    fetchCurrentUser();
  }, [todoId, fetchTodoDetail, initialTodo, fetchCurrentUser]);

  // Todo更新
  const handleUpdateTodo = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('タイトルは必須です');
      return;
    }

    if (title.length > 32) {
      setError('タイトルは32文字以内で入力してください');
      return;
    }

    if (descriptions && descriptions.length > 128) {
      setError('説明は128文字以内で入力してください');
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(`/api/todos/${todoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          descriptions: descriptions || undefined,
          completed: todo?.completed || false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Todoの更新に失敗しました');
      }

      // 更新成功後、編集モードを解除して最新データを取得
      setIsEditing(false);
      await fetchTodoDetail();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Todoの更新に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  // Todo削除
  const handleDeleteTodo = async () => {
    onOpen();
  };

  const confirmDeleteTodo = async () => {
    try {
      const response = await fetch(`/api/todos/${todoId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Todoの削除に失敗しました');
      }

      // 削除成功後、一覧ページに戻る
      router.push('/todos');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Todoの削除に失敗しました');
      onClose();
    }
  };

  // 編集キャンセル
  const handleCancelEdit = () => {
    if (todo) {
      setTitle(todo.title);
      setDescriptions(todo.descriptions || '');
    }
    setIsEditing(false);
    setError('');
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

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

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* エラー表示 */}
        {error && (
          <div className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-md p-3 mb-4">
            {error}
          </div>
        )}

        {!todo && !isLoading && (
          <Card className="text-center">
            <CardBody className="py-8">
              <p className="text-gray-600 mb-4">Todoが見つかりません</p>
              <Button as={Link} href="/todos" color="primary">
                一覧に戻る
              </Button>
            </CardBody>
          </Card>
        )}

        {todo && (
          <Card>
            <CardHeader className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Todo詳細</h2>
              <div className="flex items-center gap-2">
                {!isEditing && (
                  <>
                    <Button color="primary" onPress={() => setIsEditing(true)}>
                      編集
                    </Button>
                    <Button color="danger" onPress={handleDeleteTodo}>
                      削除
                    </Button>
                  </>
                )}
              </div>
            </CardHeader>
            <CardBody>
              {isEditing ? (
                <form onSubmit={handleUpdateTodo} className="space-y-6">
                  <Input
                    type="text"
                    label="タイトル"
                    placeholder="Todoのタイトル（32文字以内）"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    isDisabled={isSaving}
                    isRequired
                  />

                  <Textarea
                    label="説明"
                    placeholder="Todoの説明（128文字以内）"
                    value={descriptions}
                    onChange={(e) => setDescriptions(e.target.value)}
                    minRows={5}
                    isDisabled={isSaving}
                  />

                  <div className="flex items-center gap-4">
                    <Button type="submit" color="primary" isLoading={isSaving}>
                      保存
                    </Button>
                    <Button
                      color="default"
                      variant="flat"
                      onPress={handleCancelEdit}
                      isDisabled={isSaving}
                    >
                      キャンセル
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">タイトル</h3>
                    <p className="text-lg text-gray-900">{todo.title}</p>
                  </div>

                  {todo.descriptions && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">説明</h3>
                      <p className="text-gray-900 whitespace-pre-wrap">
                        {todo.descriptions}
                      </p>
                    </div>
                  )}

                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">
                      ステータス
                    </h3>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        todo.completed
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {todo.completed ? '完了' : '未完了'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-1">
                        作成日時
                      </h3>
                      <p className="text-gray-900">
                        {new Date(todo.createdAt).toLocaleString('ja-JP')}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-1">
                        更新日時
                      </h3>
                      <p className="text-gray-900">
                        {new Date(todo.updatedAt).toLocaleString('ja-JP')}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-8 pt-6 border-t border-gray-200">
                <Button as={Link} href="/todos" color="default" variant="flat">
                  ← 一覧に戻る
                </Button>
              </div>
            </CardBody>
          </Card>
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

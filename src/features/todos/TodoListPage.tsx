'use client';

import {
  Button,
  Card,
  CardBody,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { TodoCreateForm } from './components/TodoCreateForm';
import { TodoFilter } from './components/TodoFilter';
import { TodoList } from './components/TodoList';
import { TodoPagination } from './components/TodoPagination';
import { TodoSort } from './components/TodoSort';
import type { PaginationInfo, Todo } from './components/types';

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

interface Props {
  initialData?: TodoListResponse;
}

/**
 * Todo一覧ページコンポーネント
 */
export function TodoListPage({ initialData }: Props) {
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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
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

  // ページ読み込み時・フィルター変更時にTodoを取得
  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  // Todo作成
  const handleCreateTodo = async (title: string, descriptions?: string) => {
    const response = await fetch('/api/todos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        descriptions,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Todoの作成に失敗しました');
    }

    // 一覧を再取得
    await fetchTodos();
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

      await fetchTodos();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Todoの更新に失敗しました');
    }
  };

  // フィルター変更時はページを1にリセット
  const handleFilterChange = (value: 'all' | 'completed' | 'incomplete') => {
    setCompletedFilter(value);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Todo 一覧</h1>

        {/* Todo作成フォーム */}
        <TodoCreateForm onCreateTodo={handleCreateTodo} />

        {/* フィルター・ソート */}
        <Card className="mb-8">
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <TodoFilter value={completedFilter} onChange={handleFilterChange} />
              <TodoSort
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSortByChange={setSortBy}
                onSortOrderChange={setSortOrder}
              />
            </div>
          </CardBody>
        </Card>

        {/* エラー表示 */}
        {error && (
          <div className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-md p-3 mb-4">
            {error}
          </div>
        )}

        {/* Todo一覧 */}
        <TodoList
          todos={todos}
          paginationInfo={paginationInfo}
          onDelete={handleDeleteTodo}
          onToggleComplete={handleToggleComplete}
          isLoading={isLoading}
        />

        {/* ページネーション */}
        {paginationInfo && (
          <TodoPagination
            paginationInfo={paginationInfo}
            page={page}
            onPageChange={setPage}
          />
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

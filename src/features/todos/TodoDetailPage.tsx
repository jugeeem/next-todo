'use client';

import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from '@heroui/react';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { TodoDisplay } from './components/TodoDisplay';
import { TodoEditForm } from './components/TodoEditForm';
import type { Todo } from './components/types';

interface TodoDetailPageProps {
  initialTodo?: Todo;
}

/**
 * Todo詳細ページコンポーネント
 */
export function TodoDetailPage({ initialTodo }: TodoDetailPageProps) {
  const router = useRouter();
  const params = useParams();
  const todoId = params?.id as string;

  const [todo, setTodo] = useState<Todo | null>(initialTodo || null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const { isOpen, onOpen, onClose } = useDisclosure();

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
  }, [todoId, fetchTodoDetail, initialTodo]);

  // Todo更新
  const handleSaveTodo = async (updatedTodo: Partial<Todo>) => {
    const response = await fetch(`/api/todos/${todoId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: updatedTodo.title,
        descriptions: updatedTodo.descriptions,
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
    setIsEditing(false);
    setError('');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* エラー表示 */}
        {error && (
          <div className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-md p-3 mb-4">
            {error}
          </div>
        )}

        {!todo && !isLoading && (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">Todoが見つかりません</p>
            <Button onPress={() => router.push('/todos')} color="primary">
              一覧に戻る
            </Button>
          </div>
        )}

        {todo &&
          (isEditing ? (
            <TodoEditForm
              todo={todo}
              onSave={handleSaveTodo}
              onCancel={handleCancelEdit}
            />
          ) : (
            <TodoDisplay
              todo={todo}
              onEdit={() => setIsEditing(true)}
              onDelete={handleDeleteTodo}
            />
          ))}

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

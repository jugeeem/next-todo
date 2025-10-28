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
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { deleteTodo, getTodoDetail } from '@/lib/api';
import { TodoDisplay } from './components/TodoDisplay';
import { TodoEditForm } from './components/TodoEditForm';

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
  const params = useParams();
  const todoId = params?.id as string;

  const [todo, setTodo] = useState<Todo | null>(initialTodo || null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // 削除確認モーダルの状態管理
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();

  // Todo詳細を取得
  const fetchTodoDetail = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const result = await getTodoDetail(todoId);

      if (!result.success) {
        setError(result.error || 'Todoの取得に失敗しました');
        return;
      }

      const todoData = result.data;
      setTodo(todoData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Todoの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [todoId]);

  // 初回読み込み時にTodo詳細を取得（初期データがない場合のみ）
  useEffect(() => {
    if (!initialTodo && todoId) {
      fetchTodoDetail();
    }
  }, [todoId, fetchTodoDetail, initialTodo]);

  // Todo更新成功後のハンドラー
  const handleUpdateSuccess = async () => {
    setIsEditing(false);
    await fetchTodoDetail();
  };

  // 編集キャンセル
  const handleCancelEdit = () => {
    setIsEditing(false);
    setError('');
  };

  // Todo削除
  const handleDeleteTodo = async () => {
    onDeleteClose();

    try {
      const result = await deleteTodo(todoId);

      if (!result.success) {
        setError(result.error || 'Todoの削除に失敗しました');
        return;
      }

      // 削除成功後、一覧ページに戻る
      window.location.href = '/todos';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Todoの削除に失敗しました');
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
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* エラー表示 */}
        {error && (
          <div className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-md p-3 mb-4">
            {error}
          </div>
        )}

        {!todo && !isLoading && (
          <div className="bg-white shadow-md rounded-lg p-8 text-center">
            <p className="text-gray-600 mb-4">Todoが見つかりません</p>
            <Link
              href="/todos"
              className="inline-block px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              一覧に戻る
            </Link>
          </div>
        )}

        {todo && (
          <div className="bg-white shadow-md rounded-lg p-8">
            {isEditing ? (
              <TodoEditForm
                todo={todo}
                onSuccess={handleUpdateSuccess}
                onCancel={handleCancelEdit}
              />
            ) : (
              <TodoDisplay
                todo={todo}
                onEdit={() => setIsEditing(true)}
                onDelete={onDeleteOpen}
              />
            )}
          </div>
        )}

        {/* 削除確認モーダル */}
        <Modal isOpen={isDeleteOpen} onClose={onDeleteClose}>
          <ModalContent>
            <ModalHeader>確認</ModalHeader>
            <ModalBody>
              <p>このTodoを削除してもよろしいですか?</p>
            </ModalBody>
            <ModalFooter>
              <Button color="default" variant="light" onPress={onDeleteClose}>
                キャンセル
              </Button>
              <Button color="danger" onPress={handleDeleteTodo}>
                削除
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </main>
    </div>
  );
}

'use client';

import {
  Button,
  Checkbox,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from '@heroui/react';
import Link from 'next/link';
import { useState } from 'react';
import { deleteTodo, updateTodo } from '@/lib/api';
import type { Todo } from './types';

interface TodoItemProps {
  todo: Todo;
  onUpdate?: () => void;
}

/**
 * Todoアイテムコンポーネント
 */
export function TodoItem({ todo, onUpdate }: TodoItemProps) {
  // 削除確認モーダルの状態管理
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();
  // エラーモーダルの状態管理
  const {
    isOpen: isErrorOpen,
    onOpen: onErrorOpen,
    onClose: onErrorClose,
  } = useDisclosure();
  // エラーメッセージの状態管理
  const [errorMessage, setErrorMessage] = useState('');

  // Todo削除ハンドラー
  const handleDelete = async () => {
    onDeleteClose();

    try {
      const result = await deleteTodo(todo.id);

      if (!result.success) {
        throw new Error(result.error || 'Todoの削除に失敗しました');
      }

      // 成功コールバック
      if (onUpdate) {
        onUpdate();
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Todoの削除に失敗しました');
      onErrorOpen();
    }
  };

  // Todo完了切り替えハンドラー
  const handleToggleComplete = async () => {
    try {
      const result = await updateTodo(todo.id, {
        title: todo.title,
        descriptions: todo.descriptions,
        completed: !todo.completed,
      });

      if (!result.success) {
        throw new Error(result.error || 'Todoの更新に失敗しました');
      }

      // 成功コールバック
      if (onUpdate) {
        onUpdate();
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Todoの更新に失敗しました');
      onErrorOpen();
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div className="flex items-center gap-4 flex-1">
        <Checkbox isSelected={todo.completed} onValueChange={handleToggleComplete} />
        <div className="flex-1">
          <Link href={`/todos/${todo.id}`} className="block">
            <h3
              className={`font-medium ${
                todo.completed ? 'line-through text-gray-500' : 'text-gray-900'
              }`}
            >
              {todo.title}
            </h3>
            {todo.descriptions && (
              <p className="text-sm text-gray-600 mt-1">{todo.descriptions}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              作成: {new Date(todo.createdAt).toLocaleString('ja-JP')}
            </p>
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button as={Link} href={`/todos/${todo.id}`} color="primary" size="sm">
          詳細
        </Button>
        <Button color="danger" size="sm" onPress={onDeleteOpen}>
          削除
        </Button>
      </div>

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
            <Button color="danger" onPress={handleDelete}>
              削除
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* エラーモーダル */}
      <Modal isOpen={isErrorOpen} onClose={onErrorClose}>
        <ModalContent>
          <ModalHeader>エラー</ModalHeader>
          <ModalBody>
            <p>{errorMessage}</p>
          </ModalBody>
          <ModalFooter>
            <Button color="primary" onPress={onErrorClose}>
              閉じる
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}

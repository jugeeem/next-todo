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
import { useEffect, useState } from 'react';
import { deleteTodo, getTodoDetail, updateTodo } from '@/lib/api';
import { TodoDisplay } from './components/TodoDisplay';
import { TodoEditForm } from './components/TodoEditForm';
import type { Todo } from './components/types';

// インターフェースの定義

/**
 * Propインターフェース。
 * Propとして渡されるデータの型を定義します。
 */
interface Props {
  selectedTodo?: Todo;
  currentUserRole?: number;
}

/**
 * Todo詳細/編集ページのコンポーネント。
 *
 * @returns {JSX.Element} - Todo詳細/編集ページのJSX要素
 */
export default function TodoDetailPage({
  selectedTodo,
  currentUserRole: initialUserRole,
}: Props) {
  // ステートの定義

  // TODOアイテムの状態
  const [todo, setTodo] = useState<Todo | null>(selectedTodo || null);
  // 編集中かどうかの状態
  const [isEditing, setIsEditing] = useState<boolean>(false);
  // ローディング状態
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // サーバーエラーメッセージの状態
  const [error, setError] = useState<string>('');

  // 削除確認モーダルの状態管理
  const { isOpen, onOpen, onClose } = useDisclosure();
  const params = useParams();
  const todoId = params.id as string;

  /**
   * 初回レンダリング時の処理。
   * ユーザー情報とTODO詳細の取得を行います。
   */
  useEffect(() => {
    // 初期データが既に存在する場合は処理をスキップ
    if (selectedTodo && initialUserRole !== undefined) return;
    /**
     * データ取得用の非同期関数。
     * ユーザー情報とTODO詳細をAPIから取得してステートに設定します。
     *
     */
    const fetchData = async () => {
      // ローディング開始
      setIsLoading(true);
      setError('');
      try {
        // サーバーアクションを使用してTodo詳細を取得
        const result = await getTodoDetail(todoId);

        // エラーチェック
        if (!result.success) {
          throw new Error(result.error || 'Todoの取得に失敗しました');
        }

        // 取得したTODOをステートに設定
        setTodo(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
      } finally {
        // ローディング終了
        setIsLoading(false);
      }
    };
    // データの取得を実行
    fetchData();
  }, [todoId, selectedTodo, initialUserRole]);

  /**
   * TODOの更新処理。
   * フォームの入力値をAPIに送信してTODOを更新します
   * @param {FormEvent} e - フォームの送信イベント
   * @returns {Promise<void>}
   */
  const handleUpdateTodo = async (title: string, descriptions: string) => {
    // エラー状態の初期化
    setError('');

    // TODOが存在しない場合は処理を中断
    if (!todo) {
      setError('Todoが見つかりませんでした');
      return;
    }

    // 更新処理の開始
    setIsLoading(true);
    setError('');
    try {
      // サーバーアクションを使用してTodo更新を実行
      const response = await updateTodo(todo.id, {
        title,
        descriptions,
        completed: todo.completed || false,
      });
      // レスポンスのエラーチェック
      if (!response.success) {
        // エラー発生時はエラーメッセージを設定して終了
        throw new Error(response.error || 'Todoの更新に失敗しました');
      }

      // 更新成功時はステートを更新して編集モードを終了
      const updatedTodo = {
        ...todo,
        title,
        descriptions,
      };
      setTodo(updatedTodo);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    } finally {
      // ローディング終了
      setIsLoading(false);
    }
  };

  /**
   * TODOの削除処理
   * モーダルで確認後、APIに削除リクエストを送信します。
   * @returns {Promise<void>}
   */
  // モーダル表示で確認後削除処理に変更 STEP3 MOD START
  const handleDeleteTodo = async () => {
    // モーダルを閉じる
    onClose();

    // 削除処理の開始
    setIsLoading(true);
    try {
      // サーバーアクションを使用してTodo削除を実行
      const result = await deleteTodo(todoId);

      // レスポンスのエラーチェック
      if (!result.success) {
        throw new Error(result.error || 'Todoの削除に失敗しました');
      }
      // 削除成功時はTodo一覧ページにリダイレクト
      window.location.href = '/todos';
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    } finally {
      // 削除処理の終了
      setIsLoading(false);
    }
  };

  // ロード中表示
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-gray-500 text-lg">読み込み中...</div>
        </div>
      </div>
    );
  }

  // Todoのnullチェック
  if (!todo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-4">Todoが見つかりません</p>
          <Link href="/todos" className="text-blue-500 hover:text-blue-600 font-medium">
            ← Todo一覧に戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      {/* メインコンテンツ */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-10 w-full">
        {/* 戻るリンク */}
        <div className="mb-6">
          <Link
            href="/todos"
            className="text-blue-500 hover:text-blue-600 font-medium transition-colors"
          >
            ← Todo一覧に戻る
          </Link>
        </div>

        {/* エラーメッセージ表示 */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Todo詳細/編集フォーム */}
        {isEditing ? (
          <TodoEditForm
            todo={todo}
            onUpdate={handleUpdateTodo}
            onCancel={() => setIsEditing(false)}
            isUpdating={isLoading}
          />
        ) : (
          <div>
            <TodoDisplay
              todo={todo}
              onEdit={() => setIsEditing(true)}
              onDelete={onOpen}
            />
          </div>
        )}

        {/* 削除確認モーダルの追加 */}
        <Modal isOpen={isOpen} onClose={onClose} isDismissable={false}>
          <ModalContent>
            <ModalHeader className="flex flex-col gap-1">削除確認</ModalHeader>
            <ModalBody>
              <p className="text-gray-700">このTodoを削除してもよろしいですか？</p>
              <p className="text-sm text-gray-500 mt-2">
                この操作は取り消すことができません。
              </p>
            </ModalBody>
            <ModalFooter>
              <Button onPress={onClose}>キャンセル</Button>
              <Button color="danger" onPress={handleDeleteTodo} isLoading={isLoading}>
                {isLoading ? '削除中' : '削除する'}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </main>
    </div>
  );
}

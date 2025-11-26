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
import { useCallback, useEffect, useRef, useState } from 'react';
import { createTodo, deleteTodo, getTodoList, updateTodo } from '@/lib/api';
import { TodoCreateForm } from './components/TodoCreateForm';
import { TodoFilter } from './components/TodoFilter';
import { TodoList } from './components/TodoList';
import { TodoPagination } from './components/TodoPagination';
import type {
  CompletedFilter,
  PaginationInfo,
  SortBy,
  SortOrder,
  Todo,
} from './components/types';

// インターフェースの定義

/**
 * Todo一覧取得レスポンス
 * Todo一覧取得APIのレスポンス型インターフェースです。
 * @interface TodoListResponse
 * @property {boolean} success - 処理成功フラグ
 * @property {object} data - レスポンスデータ
 * @property {Todo[]} data.data - Todo一覧データ
 * @property {number} data.total - 総Todo数
 * @property {number} data.page - 現在のページ番号
 * @property {number} data.perPage - 1ページあたりのTodo数
 * @property {number} data.totalPages - 総ページ数
 */
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

/**
 * Propsの定義。
 * TodoListPageコンポーネントに渡されるpropsの型インターフェースです。
 * @interface Props
 * @property {TodoListResponse} [initialData] - 初期表示用のTodo一覧データ
 * @property {number} [currentUserRole] - 現在のユーザーの権限レベル
 */
interface Props {
  initialData?: TodoListResponse;
  currentUserRole?: number;
}

/**
 * Todo一覧表示画面のコンポーネント。
 *
 * @returns {JSX.Element} - Todo一覧表示画面のJSX要素
 */
export default function TodoListPage({
  initialData,
}: // currentUserRole: initialUserRole,
Props) {
  // ステートの管理
  // Todo一覧データ
  const [todos, setTodos] = useState<Todo[]>(initialData?.data?.data || []);
  // 現在のページ番号
  const [page, setPage] = useState<number>(initialData?.data?.page || 1);
  // ページネーション情報
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

  // フィルターとソートの状態管理
  const [completedFilter, setCompletedFilter] = useState<
    'all' | 'completed' | 'incomplete'
  >('all');
  // ソート条件
  const [sortBy, setSortBy] = useState<'createdAt' | 'updatedAt' | 'title'>(
    'createdAt',
  );
  // ソート順の状態
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  // ローディング状態
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // Todo作成中の状態
  const [isCreating, setIsCreating] = useState<boolean>(false);
  // エラーメッセージ
  const [error, setError] = useState<string>('');
  // ユーザー権限の状態

  // 削除確認モーダルの状態管理 STEP3
  const { isOpen, onOpen, onClose } = useDisclosure();
  // delete対象のTodoを特定するためのstate
  const [todoToDelete, setTodoToDelete] = useState<number | null>(null);

  // スクロール位置保持用のref
  const scrollPositionRef = useRef<number>(0);

  /**
   * Todo一覧データ取得用の非同期関数。(サーバーアクションを使用)
   * フィルター、ソート、ページネーションに基づいてTodo一覧データを取得します。
   *
   * @returns {Promise<void>} 非同期処理完了を表すPromise
   */
  const fetchTodos = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      // サーバーアクションの呼び出し
      const result = await getTodoList({
        page,
        perPage: 20,
        completedFilter,
        sortBy,
        sortOrder,
      });

      // 取得失敗時の処理
      if (!result.success) {
        throw new Error(result.error || 'Todo一覧の取得に失敗しました');
      }

      // Todo一覧データとページネーション情報をステートに設定する。
      const responseData = result.data;
      // Todo一覧データをステートに設定する。
      setTodos(responseData.data || []);
      setPaginationInfo({
        currentPage: responseData.page,
        totalPages: responseData.totalPages,
        totalItems: responseData.total,
        itemsPerPage: responseData.perPage,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  }, [page, completedFilter, sortBy, sortOrder]);

  /**
   * todo作成用の非同期関数。(サーバーアクションを使用)
   * フォーム送信時に呼び出され、新規Todoを作成します。
   * @param {React.FormEvent} e フォームイベント
   * @returns {Promise<void>} 非同期処理完了を表すPromise
   */
  const handleCreateTodo = async (title: string, description: string) => {
    setError('');

    // Todo作成処理開始
    setIsCreating(true);

    try {
      // サーバーアクションの呼び出し
      const result = await createTodo({
        title,
        descriptions: description || undefined, // 空文字の場合はundefinedとして扱う
      });
      // 作成失敗時の処理
      if (!result.success) {
        throw new Error(result.error || 'Todoの作成に失敗しました');
      }
      // 作成成功時は一覧を再取得する。
      await fetchTodos();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Todoの作成に失敗しました');
    } finally {
      setIsCreating(false);
    }
  };

  /**
   * Todo完了状態切替を行う非同期関数。
   * Todo完了状態の切替を行い、Todo一覧を再取得します。
   * @param {Todo} todo - 対象のTodo
   */
  const toggleCompleteTodo = async (todo: Todo) => {
    // スクロール位置を保存
    scrollPositionRef.current = window.scrollY;

    try {
      // 完了状態切替のサーバーアクションを呼び出す
      const result = await updateTodo(todo.id, {
        title: todo.title,
        descriptions: todo.descriptions || undefined,
        completed: !todo.completed,
      });

      // 更新失敗時の処理
      if (!result.success) {
        throw new Error(result.error || 'Todoの更新に失敗しました');
      }

      // 更新成功時は一覧を再取得し、スクロール位置を復元する。
      await fetchTodos();
      setTimeout(() => {
        window.scrollTo(0, scrollPositionRef.current);
      }, 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    }
  };

  // Todo削除モーダルを開く関数を追加し、どのTodoを削除するのかを特定するために、削除対象のTodo IDをstateに保持する。 STEP3
  /**
   * Todo削除確認モーダルを開く。
   * @param {number} todoId - 削除対象のTodo ID
   */
  const openDeleteModal = (todoId: number) => {
    // 削除対象のTodo IDをstateに設定し、モーダルを開く
    setTodoToDelete(todoId);
    onOpen();
  };

  /**
   * Todo削除用の非同期関数。（サーバーアクションを使用）
   * 指定したTodoの削除処理を行い、Todo一覧を再取得します。
   * @returns {Promise<void>} 非同期処理完了を表すPromise
   */
  // モーダル表示で確認後削除処理に変更 STEP3
  const handleDeleteTodo = async () => {
    if (!todoToDelete) return;

    // モーダルを閉じる
    onClose();

    setIsLoading(true);
    try {
      // サーバーアクションの呼び出し
      const result = await deleteTodo(todoToDelete.toString());

      // 削除失敗時の処理
      if (!result.success) {
        throw new Error(result.error || 'Todoの削除に失敗しました');
      }

      // 削除成功時は一覧を再取得する。
      await fetchTodos();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Todoの削除に失敗しました');
    } finally {
      setIsLoading(false);
      setTodoToDelete(null);
    }
  };

  // フィルター変更時の処理
  useEffect(() => {
    // 初期データが存在する場合は、フィルター変更時に再取得する
    if (initialData) {
      fetchTodos();
    }
  }, [initialData, fetchTodos]);

  /**
   * フィルター変更時のハンドラ関数。
   * フィルターが変更されたときに呼び出され、状態を更新します。
   *
   * @param {CompletedFilter} filter - 新しいフィルター値
   */
  const handleFilterChange = (filter: CompletedFilter) => {
    // フィルター状態を更新し、ページ番号を1にリセットする
    setCompletedFilter(filter);
    setPage(1);
  };

  /**
   * ソート項目変更時のハンドラ関数。
   * ソート項目が変更されたときに呼び出され、状態を更新します。
   *
   * @param {SortBy} newSortBy - 新しいソート項目
   */
  const handleSortByChange = (newSortBy: SortBy) => {
    setSortBy(newSortBy);
  };

  /**
   * ソート順序変更時のハンドラ関数。
   * ソート順序が変更されたときに呼び出され、状態を更新します。
   *
   * @param {SortOrder} newSortOrder - 新しいソート順序
   */
  const handleSortOrderChange = (newSortOrder: SortOrder) => {
    setSortOrder(newSortOrder);
  };
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      {/* メインコンテンツ */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-10 w-full">
        {/* エラーメッセージ */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Todo作成フォーム */}
        <TodoCreateForm onSubmit={handleCreateTodo} isCreating={isCreating} />

        {/* フィルター・ソートコントロール */}
        <Card className="mb-8 p-4">
          <CardBody>
            <TodoFilter
              completedFilter={completedFilter}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onFilterChange={handleFilterChange}
              onSortByChange={handleSortByChange}
              onSortOrderChange={handleSortOrderChange}
            />
          </CardBody>
        </Card>

        {/* Todo一覧表示 */}
        <Card>
          <CardBody>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">Todo一覧</h2>

              {/* ページネーション情報 */}
              {paginationInfo && (
                <p className="text-sm text-gray-600">
                  全{paginationInfo.totalItems}件中{' '}
                  {(paginationInfo.currentPage - 1) * paginationInfo.itemsPerPage + 1}〜
                  {Math.min(
                    paginationInfo.currentPage * paginationInfo.itemsPerPage,
                    paginationInfo.totalItems,
                  )}
                  件を表示
                </p>
              )}
            </div>
            <TodoList
              todos={todos}
              isLoading={isLoading}
              onToggleComplete={toggleCompleteTodo}
              onDelete={openDeleteModal}
            />

            {/* ページネーションコントロール */}
            {paginationInfo && (
              <TodoPagination
                paginationInfo={paginationInfo}
                currentPage={page}
                onPageChange={setPage}
              />
            )}
          </CardBody>
        </Card>

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

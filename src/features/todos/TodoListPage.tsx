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
  Select,
  SelectItem,
  Textarea,
  useDisclosure,
} from '@heroui/react';
import Link from 'next/link';
import {
  type FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { z } from 'zod';
import {
  createTodo,
  deleteTodo,
  getTodoList,
  logout,
  updateTodo,
} from '@/lib/api';

// インターフェースの定義

/**
 * ページネーション情報
 * ページネーション情報の型インターフェースです。
 * @interface PaginationInfo
 * @property {number} currentPage - 現在のページ番号
 * @property {number} totalPages - 総ページ数
 * @property {number} totalItems - 総アイテム数
 * @property {number} itemsPerPage - 1ページあたりのアイテム数
 */
interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}
/** TODOアイテム
 * TODOアイテムの型インターフェースです。
 * @interface Todo
 * @property {number} id - TODO ID
 * @property {string} title - TODOタイトル
 * @property {string | null} [descriptions] - TODO説明（任意）
 * @property {boolean} completed - 完了状態
 * @property {number} userId - ユーザーID
 * @property {string} createdAt - 作成日時（ISO8601形式）
 * @property {string} updatedAt - 更新日時（ISO8601形式）
 */

interface Todo {
  id: number;
  title: string;
  descriptions: string | null;
  completed: boolean;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

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

// バリデーションスキーマの定義
/**
 * Todo作成用のバリデーションスキーマ
 * タイトルは1文字以上32文字以内、説明は128文字以内であることを検証します。
 * @constant {z.ZodObject} createTodoSchema - Todo作成用のZodスキーマ
 * @property {z.ZodString} title - タイトルのバリデーションルール
 * @property {z.ZodString} [descriptions] - 説明のバリデーションルール（任意）
 */
const createTodoSchema = z.object({
  title: z
    .string()
    .min(1, 'タイトルは必須です')
    .max(32, 'タイトルは32文字以内で入力してください'),
  descriptions: z
    .string()
    .max(128, '説明は128文字以内で入力してください')
    .optional(),
});

/**
 * Todo一覧表示画面のコンポーネント。
 *
 * @returns {JSX.Element} - Todo一覧表示画面のJSX要素
 */
export default function TodoListPage({
  initialData,
  currentUserRole: initialUserRole,
}: Props) {
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
      : null
  );
  const [currentUserRole, setCurrentUserRole] = useState<number>(
    initialUserRole || 4
  );

  // フィルターとソートの状態管理
  const [completedFilter, setCompletedFilter] = useState<
    'all' | 'completed' | 'incomplete'
  >('all');
  // ソート条件
  const [sortBy, setSortBy] = useState<'createdAt' | 'updatedAt' | 'title'>(
    'createdAt'
  );
  // ソート順の状態
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  // 新規Todoのタイトル
  const [newTodoTitle, setNewTodoTitle] = useState<string>('');
  // 新規Todoの説明
  const [newTodoDescription, setNewTodoDescription] = useState<string>('');
  // ローディング状態
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // Todo作成中の状態
  const [isCreating, setIsCreating] = useState<boolean>(false);

  // タイトル用のエラーメッセージと説明欄用のエラーメッセージを分割 STEP3 ADD START
  const [titleError, setTitleError] = useState<string>('');
  const [descriptionError, setDescriptionError] = useState<string>('');
  // STEP3 ADD END
  // エラーメッセージ
  const [error, setError] = useState<string>('');
  // ユーザー権限の状態

  // 削除確認モーダルの状態管理 STEP3 ADD START
  const { isOpen, onOpen, onClose } = useDisclosure();
  // delete対象のTodoを特定するためのstate
  const [todoToDelete, setTodoToDelete] = useState<number | null>(null);
  // STEP3 ADD END

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
  const handleCreateTodo = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    // フィールドごとのエラーを送信時にクリア STEP3 MOD START
    setTitleError('');
    setDescriptionError('');
    // STEP3 MOD END

    /**
     * 入力バリデーションの実行
     */
    const validationInput = createTodoSchema.safeParse({
      title: newTodoTitle,
      descriptions: newTodoDescription,
    });
    // バリデーション失敗時の処理 エラーメッセージを設定して処理を中断する。
    // フィールドごとのエラー状態を設定する。 STEP3 MOD START
    if (!validationInput.success) {
      // エラーメッセージを一覧で取得
      const errors = validationInput.error.errors;

      // err.path[0]でエラー対象のフィールド名を特定して、対応するエラーstateを更新
      errors.forEach((err) => {
        if (err.path[0] === 'title') setTitleError(err.message);
        if (err.path[0] === 'descriptions') setDescriptionError(err.message);
      });
      return;
    }
    // STEP3 MOD END

    // Todo作成処理開始
    setIsCreating(true);

    try {
      // サーバーアクションの呼び出し
      const result = await createTodo({
        title: newTodoTitle.trim(),
        descriptions: newTodoDescription.trim() || undefined,
      });
      // 作成失敗時の処理
      if (!result.success) {
        throw new Error(result.error || 'Todoの作成に失敗しました');
      }

      // 作成成功時は入力欄をクリアして一覧を再取得する。
      setNewTodoTitle('');
      setNewTodoDescription('');
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

  // Todo削除モーダルを開く関数を追加し、どのTodoを削除するのかを特定するために、削除対象のTodo IDをstateに保持する。 STEP3 ADD START
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
  // モーダル表示で確認後削除処理に変更 STEP3 MOD START
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
  // STEP3 MOD END
  /**
   * ログアウト用の非同期関数。（サーバーアクションを使用）
   * サーバーアクション内でリダイレクト処理が実行されます。
   * @returns {Promise<void>} 非同期処理完了を表すPromise
   */
  const handleLogout = async () => {
    await logout();
  };

  // フィルター変更時の処理
  useEffect(() => {
    // 初期データが存在する場合は、フィルター変更時に再取得する
    if (initialData) {
      fetchTodos();
    }
  }, [initialData, fetchTodos]);

  return (
    <div className='min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100'>
      {/* ヘッダーナビゲーション */}
      <header className='bg-white shadow-sm border-b border-gray-200'>
        <div className='max-w-7xl mx-auto px-6 py-4'>
          <div className='flex items-center justify-between'>
            <Link href='/todos' className='hover:opacity-80 transition-opacity'>
              <h1 className='text-3xl font-bold text-gray-900'>Todoアプリ</h1>
            </Link>

            <nav className='flex items-center gap-6'>
              <Link
                href='/todos'
                className='text-gray-700 hover:text-blue-600 font-medium transition-colors'
              >
                Todo一覧
              </Link>
              <Link
                href='profile'
                className='text-gray-700 hover:text-blue-600 font-medium transition-colors'
              >
                プロフィール
              </Link>
              {/* ADMIN・MANAGERの場合のみ表示 */}
              {currentUserRole <= 2 && (
                <Link
                  href='/users'
                  className='text-gray-700 hover:text-blue-500 font-medium transition-colors'
                >
                  ユーザー管理
                </Link>
              )}
            </nav>

            <Button
              type='button'
              onPress={handleLogout}
              className='px-6 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300 font-medium transition-colors cursor-pointer'
            >
              ログアウト
            </Button>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className='flex-1 max-w-7xl mx-auto px-6 py-10 w-full'>
        {/* エラーメッセージ */}
        {error && (
          <div className='mb-8 p-4 bg-red-50 border border-red-200 rounded-lg'>
            <p className='text-red-700 text-sm'>{error}</p>
          </div>
        )}

        {/* Todo作成フォーム */}
        {/* Cardを追加 STEP3 ADD START */}
        <Card className='mb-10'>
          <CardHeader>
            <h2 className='text-2xl font-semibold text-gray-900'>
              新しいTodoを作成
            </h2>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleCreateTodo} className='space-y-6'>
              {/* タイトル入力欄 */}
              {/* input → Input STEP3 MOD START */}
              <Input
                id='title'
                type='text'
                value={newTodoTitle}
                onChange={(e) => {
                  setNewTodoTitle(e.target.value);
                  setTitleError(''); // エラーメッセージをクリア
                }}
                maxLength={32}
                placeholder='Todoのタイトル（32文字以内）'
                label='タイトル'
                isRequired
                validationBehavior='aria'
                isInvalid={!!titleError}
                errorMessage={titleError}
              />
              {/* input → Input STEP3 MOD END */}

              {/* 説明入力欄 */}
              {/* textarea -> Textarea STEP3 MOD START */}
              <Textarea
                id='description'
                label='説明'
                placeholder='Todoの説明（128文字以内）'
                value={newTodoDescription}
                onChange={(e) => {
                  setNewTodoDescription(e.target.value);
                  setDescriptionError(''); // エラーメッセージをクリア
                }}
                maxLength={128}
                isInvalid={!!descriptionError}
                errorMessage={descriptionError}
              />
              {/* textarea -> Textarea STEP3 MOD END */}

              {/* Todo作成ボタン */}
              <div className='flex justify-end'>
                {/* button → Button STEP3 MOD START */}
                <Button
                  type='submit'
                  color='primary'
                  isLoading={isCreating}
                  className='px-8 py-2.5 font-medium'
                >
                  {isCreating ? '作成中' : '作成'}
                </Button>
                {/* button → Button STEP3 MOD END */}
              </div>
            </form>
          </CardBody>
        </Card>

        {/* フィルター・ソートコントロール */}
        <Card className='mb-8 p-4'>
          <CardBody>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
              {/* 表示フィルター */}
              {/* select → Select STEP3 MOD START */}
              <Select
                id='filter'
                label='表示フィルター'
                selectedKeys={new Set([completedFilter])}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as
                    | 'all'
                    | 'completed'
                    | 'incomplete';
                  setCompletedFilter(selected);
                  setPage(1);
                }}
              >
                <SelectItem key='all'>すべて</SelectItem>
                <SelectItem key='completed'>完了済み</SelectItem>
                <SelectItem key='incomplete'>未完了</SelectItem>
              </Select>

              {/* ソート項目 */}
              <Select
                id='sortBy'
                label='並び順'
                selectedKeys={new Set([sortBy])}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as
                    | 'createdAt'
                    | 'updatedAt'
                    | 'title';
                  setSortBy(selected);
                }}
              >
                <SelectItem key='createdAt'>作成日時</SelectItem>
                <SelectItem key='updatedAt'>更新日時</SelectItem>
                <SelectItem key='title'>タイトル</SelectItem>
              </Select>

              {/* ソート順序 */}
              <Select
                id='sortOrder'
                label='順序'
                selectedKeys={new Set([sortOrder])}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as 'asc' | 'desc';
                  setSortOrder(selected);
                }}
              >
                <SelectItem key='desc'>降順</SelectItem>
                <SelectItem key='asc'>昇順</SelectItem>
              </Select>
              {/* select → Select STEP3 MOD END */}
            </div>
          </CardBody>
        </Card>

        {/* Todo一覧表示 */}
        <Card>
          <CardBody>
            <div className='flex items-center justify-between mb-6'>
              <h2 className='text-2xl font-semibold text-gray-900'>Todo一覧</h2>

              {/* ページネーション情報 */}
              {paginationInfo && (
                <p className='text-sm text-gray-600'>
                  全{paginationInfo.totalItems}件中{' '}
                  {(paginationInfo.currentPage - 1) *
                    paginationInfo.itemsPerPage +
                    1}
                  ～
                  {Math.min(
                    paginationInfo.currentPage * paginationInfo.itemsPerPage,
                    paginationInfo.totalItems
                  )}
                  件を表示
                </p>
              )}
            </div>

            {/* ローディング表示 */}
            {isLoading ? (
              <div className='flex items-center justify-center py-16'>
                <div className='text-gray-500'>読み込み中...</div>
              </div>
            ) : todos.length === 0 ? (
              <div className='text-center py-12 text-gray-500 text-lg'>
                Todoがありません
              </div>
            ) : (
              <div className='space-y-4'>
                {todos.map((todo) => (
                  <Card
                    key={todo.id}
                    className='bg-gray-50 hover:bg-gray-100 hover:border-primary transition-all'
                  >
                    <CardBody className='flex flex-row items-center justify-between'>
                      <div className='flex items-start gap-4 flex-1'>
                        {/* 完了チェックボックス */}
                        {/* Checkboxに変更 STEP3 MOD START */}
                        <Checkbox
                          isSelected={todo.completed}
                          onValueChange={() => toggleCompleteTodo(todo)}
                          className='mt-1 h-5'
                        />
                        {/* STEP3 MOD END */}

                        <div className='flex-1'>
                          {/* タイトル */}
                          <Link
                            href={`/todos/${todo.id}`}
                            className='hover:text-blue-600 transition-colors'
                          >
                            <h3
                              className={`font-medium text-lg ${
                                todo.completed
                                  ? 'line-through text-gray-500'
                                  : 'text-gray-900'
                              }`}
                            >
                              {todo.title}
                            </h3>
                          </Link>

                          {/* 説明 */}
                          {todo.descriptions && (
                            <p className='text-sm text-gray-600 mt-2'>
                              {todo.descriptions}
                            </p>
                          )}

                          {/* 作成・更新日時 */}
                          <p className='text-xs text-gray-400 mt-3'>
                            作成:{' '}
                            {new Date(todo.createdAt).toLocaleString('ja-JP')}
                          </p>
                        </div>
                      </div>

                      {/* アクションボタン */}
                      <div className='flex items-center gap-3 ml-4'>
                        {/* 詳細ボタン */}
                        {/* Buttonに変更 STEP3 MOD START */}
                        <Button
                          type='button'
                          color='primary'
                          as={Link}
                          href={`/todos/${todo.id}`}
                          className='font-medium'
                        >
                          詳細
                        </Button>
                        {/* STEP3 MOD END */}

                        {/* 削除ボタン */}
                        {/* モーダルを開くように変更 STEP3 MOD START */}
                        <Button
                          type='button'
                          color='danger'
                          onPress={() => openDeleteModal(todo.id)}
                          className='font-medium'
                        >
                          削除
                        </Button>
                        {/* STEP3 MOD END */}
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            )}

            {/* ページネーションコントロール */}
            {paginationInfo && paginationInfo.totalPages > 1 && (
              <div className='flex items-center justify-between mt-8 pt-6 border-t border-gray-200'>
                {/* button → Button STEP3 MOD START */}
                <Button
                  type='button'
                  onPress={() => setPage(page - 1)}
                  isDisabled={page === 1}
                  variant={page === 1 ? 'flat' : 'solid'}
                  className='px-6 py-2.5'
                >
                  前のページ
                </Button>
                <span className='text-sm text-gray-600 font-medium'>
                  ページ {paginationInfo.currentPage} /{' '}
                  {paginationInfo.totalPages}
                </span>
                <Button
                  type='button'
                  onPress={() => setPage(page + 1)}
                  isDisabled={page === paginationInfo.totalPages}
                  variant={
                    page === paginationInfo.totalPages ? 'flat' : 'solid'
                  }
                  className='px-6 py-2.5'
                >
                  次のページ
                </Button>
                {/* button → Button STEP3 MOD END */}
              </div>
            )}
          </CardBody>
        </Card>

        {/* 削除確認モーダルの追加 STEP3 ADD START */}
        <Modal isOpen={isOpen} onClose={onClose} isDismissable={false}>
          <ModalContent>
            <ModalHeader className='flex flex-col gap-1'>削除確認</ModalHeader>
            <ModalBody>
              <p className='text-gray-700'>
                このTodoを削除してもよろしいですか？
              </p>
              <p className='text-sm text-gray-500 mt-2'>
                この操作は取り消すことができません。
              </p>
            </ModalBody>
            <ModalFooter>
              <Button onPress={onClose}>キャンセル</Button>
              <Button
                color='danger'
                onPress={handleDeleteTodo}
                isLoading={isLoading}
              >
                {isLoading ? '削除中' : '削除する'}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
        {/* STEP3 ADD END */}
      </main>
    </div>
  );
}

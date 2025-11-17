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
  Textarea,
  useDisclosure,
} from '@heroui/react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { type FormEvent, useEffect, useState } from 'react';
import { z } from 'zod';
import { deleteTodo, getTodoDetail, logout, updateTodo } from '@/lib/api';

// インターフェースの定義

/** TODOアイテム
 * TODOアイテムの型インターフェースです。
 * @interface Todo
 * @property {number} id - TODO ID
 * @property {string} title - TODOタイトル
 * @property {string} [descriptions] - TODO説明（任意）
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
 * Propインターフェース。
 * Propとして渡されるデータの型を定義します。
 */
interface Props {
  selectedTodo?: Todo;
  currentUserRole?: number;
}

/**
 * Todo更新用のバリデーションスキーマ。
 * タイトルは1文字以上32文字以内、説明は128文字以内であることを検証します。
 */
const updateTodoSchema = z.object({
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
  // タイトルフォームの入力状態
  const [title, setTitle] = useState<string>(selectedTodo?.title || '');
  // 説明フォームの入力状態
  const [descriptions, setDescriptions] = useState<string>(
    selectedTodo?.descriptions || ''
  );
  // 編集中かどうかの状態
  const [isEditing, setIsEditing] = useState<boolean>(false);
  // ローディング状態
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // サーバーエラーメッセージの状態
  const [error, setError] = useState<string>('');
  // エラーメッセージを分離させるためバリデーションエラーの状態を追加。 STEP3 ADD START
  const [titleError, setTitleError] = useState<string>('');
  const [descriptionsError, setDescriptionsError] = useState<string>('');
  // STEP3 ADD END
  // 現在のユーザーの権限情報
  const [currentUserRole] = useState<number>(initialUserRole || 4);

  // モーダルの追加処理 STEP3 ADD START
  // 削除確認モーダルの状態管理
  const { isOpen, onOpen, onClose } = useDisclosure();
  // STEP3 ADD END
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
        setTitle(result.data.title);
        setDescriptions(result.data.descriptions || '');
      } catch (err) {
        setError(
          err instanceof Error ? err.message : '不明なエラーが発生しました'
        );
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
  const handleUpdateTodo = async (e: FormEvent) => {
    e.preventDefault();

    // エラー状態の初期化 STEP3 ADD START
    setError('');
    setTitleError('');
    setDescriptionsError('');
    // STEP3 ADD END

    // TODOが存在しない場合は処理を中断
    if (!todo) {
      setError('Todoが見つかりませんでした');
      return;
    }

    // 入力値のバリデーション
    const validation = updateTodoSchema.safeParse({
      title: title,
      descriptions: descriptions,
    });

    // バリデーションエラー発生箇所を特定してエラーメッセージを設定。 STEP3 MOD START
    // バリデーションエラー時の処理
    if (!validation.success) {
      // エラーメッセージを一覧で取得
      const errors = validation.error.errors;
      // err.path[0]でエラー対象のフィールド名を特定して、対応するエラーstateを更新
      errors.forEach((err) => {
        if (err.path[0] === 'title') setTitleError(err.message);
        if (err.path[0] === 'descriptions') setDescriptionsError(err.message);
      });
      return;
    }
    // STEP3 MOD END

    // 更新処理の開始
    setIsLoading(true);
    setError('');
    try {
      // サーバーアクションを使用してTodo更新を実行
      const response = await updateTodo(todo.id, {
        title: title.trim(),
        descriptions: descriptions.trim(),
        completed: todo?.completed || false,
      });
      // レスポンスのエラーチェック
      if (!response.success) {
        // エラー発生時はエラーメッセージを設定して終了
        throw new Error(response.error || 'Todoの更新に失敗しました');
      }

      // 更新成功時はステートを更新して編集モードを終了
      const updatedTodo = {
        ...todo,
        title: title.trim(),
        descriptions: descriptions.trim(),
      };
      setTodo(updatedTodo);
      setIsEditing(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : '不明なエラーが発生しました'
      );
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
      setError(
        err instanceof Error ? err.message : '不明なエラーが発生しました'
      );
    } finally {
      // 削除処理の終了
      setIsLoading(false);
    }
  };
  // STEP3 MOD END

  /**
   * ログアウト用の非同期関数。
   * アカウントのログアウトを行い、ログインページにリダイレクトします。
   * @returns {Promise<void>}
   */
  const handleLogout = async () => {
    await logout(); // サーバーアクションを使用してログアウトを実行
  };

  /**
   * 編集キャンセル時の処理。
   * TODOの内容を元に戻して、編集モードを終了します。
   *
   */
  const cancelEdit = () => {
    if (todo) {
      setTitle(todo.title);
      setDescriptions(todo.descriptions || '');
    }
    setIsEditing(false);
    setError('');
    // エラー状態の初期化 STEP3 ADD START
    setTitleError('');
    setDescriptionsError('');
    // STEP3 ADD END
  };

  // ロード中表示
  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <div className='text-gray-500 text-lg'>読み込み中...</div>
        </div>
      </div>
    );
  }

  // Todoのnullチェック
  if (!todo) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <p className='text-red-500 text-lg mb-4'>Todoが見つかりません</p>
          <Link
            href='/todos'
            className='text-blue-500 hover:text-blue-600 font-medium'
          >
            ← Todo一覧に戻る
          </Link>
        </div>
      </div>
    );
  }

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
                href='/profile'
                className='text-gray-700 hover:text-blue-600 font-medium transition-colors'
              >
                プロフィール
              </Link>
              {currentUserRole <= 2 && (
                <Link
                  href='/users'
                  className='text-gray-700 hover:text-blue-600 font-medium transition-colors'
                >
                  ユーザー管理
                </Link>
              )}
            </nav>
            {/* button → Button STEP3 MOD START */}
            <Button
              type='button'
              onPress={handleLogout}
              className='px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 font-medium transition-colors cursor-pointer'
            >
              ログアウト
            </Button>
            {/* button → Button STEP3 MOD END */}
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className='flex-1 max-w-7xl mx-auto px-6 py-10 w-full'>
        {/* 戻るリンク */}
        <div className='mb-6'>
          <Link
            href='/todos'
            className='text-blue-500 hover:text-blue-600 font-medium transition-colors'
          >
            ← Todo一覧に戻る
          </Link>
        </div>

        {/* エラーメッセージ表示 */}
        {error && (
          <div className='mb-8 p-4 bg-red-50 border border-red-200 rounded-lg'>
            <p className='text-red-700 text-sm'>{error}</p>
          </div>
        )}

        {/* Todo詳細/編集フォーム */}
        <Card>
          <CardHeader className='flex items-center justify-between'>
            <h2 className='text-2xl font-semibold text-gray-900'>
              {isEditing ? 'Todo編集' : 'Todo詳細'}
            </h2>

            {/* 完了状態 */}
            <span
              className={`px-3 py-1 text-sm font-semibold rounded ${
                todo.completed
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {todo.completed ? '完了' : '未完了'}
            </span>
          </CardHeader>

          <CardBody>
            {isEditing ? (
              // 編集中表示画面
              <form onSubmit={handleUpdateTodo} className='space-y-6'>
                {/* タイトル入力欄 */}
                {/* input → Input STEP3 MOD START */}
                <Input
                  id='title'
                  type='text'
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setTitleError('');
                  }}
                  maxLength={32}
                  placeholder='Todoのタイトル（32文字以内）'
                  label='タイトル'
                  isRequired
                  // ブラウザ標準のバリデーション表示を無効化
                  validationBehavior='aria'
                  isInvalid={!!titleError}
                  errorMessage={titleError}
                />
                {/* input → Input STEP3 MOD END */}
                {/* 説明入力欄 */}
                {/* textarea → Textarea STEP3 MOD START */}
                <Textarea
                  id='descriptions'
                  label='説明'
                  placeholder='Todoの説明（128文字以内）'
                  value={descriptions}
                  onChange={(e) => {
                    setDescriptions(e.target.value);
                    setDescriptionsError('');
                  }}
                  maxLength={128}
                  isInvalid={!!descriptionsError}
                  errorMessage={descriptionsError}
                />
                {/* textarea → Textarea STEP3 MOD END */}
                {/* ボタン */}
                <div className='flex justify-end gap-3 pt-4'>
                  {/* button → Button STEP3 MOD START */}
                  <Button
                    type='button'
                    onPress={cancelEdit}
                    className='font-medium'
                  >
                    キャンセル
                  </Button>
                  <Button
                    type='submit'
                    isLoading={isLoading}
                    color='primary'
                    className='font-medium'
                  >
                    {isLoading ? '保存中' : '保存'}
                  </Button>
                  {/* button → Button STEP3 MOD END */}
                </div>
              </form>
            ) : (
              /* Todo詳細フォーム表示 */
              // TODOタイトル
              <div className='space-y-6'>
                <div>
                  <h3 className='text-sm font-medium text-gray-500 mb-2'>
                    タイトル
                  </h3>
                  <p className='text-lg text-gray-900'>{todo.title}</p>
                </div>
                {/* TODO説明 */}
                {todo.descriptions && (
                  <div>
                    <h3 className='text-sm font-medium text-gray-500 mb-2'>
                      説明
                    </h3>
                    <p className='text-gray-700 whitespace-pre-wrap'>
                      {todo.descriptions}
                    </p>
                  </div>
                )}

                {/* 日時情報 */}
                <div className='pt-4 border-t border-gray-200'>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
                    <div>
                      <span className='text-gray-500'>作成日時: </span>
                      <span className='text-gray-700'>
                        {new Date(todo.createdAt).toLocaleString('ja-JP')}
                      </span>
                    </div>
                    <div>
                      <span className='text-gray-500'>更新日時: </span>
                      <span className='text-gray-700'>
                        {new Date(todo.updatedAt).toLocaleString('ja-JP')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ボタン */}
                <div className='flex justify-end gap-3 pt-4'>
                  {/* button → Button STEP3 MOD START */}
                  <Button
                    type='button'
                    onPress={onOpen} // モーダルを開く。 STEP3 MOD
                    color='danger'
                    className='font-medium'
                  >
                    削除
                  </Button>
                  <Button
                    type='button'
                    color='primary'
                    onPress={() => {
                      setIsEditing(true);
                    }}
                    className='font-medium'
                  >
                    編集
                  </Button>
                  {/* button → Button STEP3 MOD END */}
                </div>
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
      </main>
    </div>
  );
}

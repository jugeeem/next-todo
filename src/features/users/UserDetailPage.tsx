'use client';

import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Input,
  Link,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  useDisclosure,
} from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { deleteUser as deleteUserAction, logout, updateUser } from '@/lib/api';

// インターフェースの定義
/**
 * ユーザー情報のインターフェース。
 * APIから取得するユーザー情報の型を定義します。
 *
 * @interface User
 * @property {string} id - ユーザーID
 * @property {string} username - ユーザー名
 * @property {string} [firstName] - 名 (任意)
 * @property {string} [lastName] - 姓 (任意)
 * @property {number} role - ユーザー権限情報
 * @property {string} createdAt - 作成日時 (ISO8601形式)
 * @property {string} updatedAt - 更新日時 (ISO8601形式)
 *
 */
interface User {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  role: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Todo情報のインターフェース。
 * APIから取得するTodo情報の型を定義します。
 *
 * @interface Todo
 * @property {string} id - Todo ID
 * @property {string} title - Todoタイトル
 * @property {string} descriptions - Todo説明
 * @property {boolean} completed - 完了フラグ
 * @property {string} userId - 登録ユーザーID
 * @property {string} createdAt - 作成日時 (ISO8601形式)
 * @property {string} updatedAt - 更新日時 (ISO8601形式)
 */
interface Todo {
  id: string;
  title: string;
  descriptions: string | null;
  completed: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * UserDetailPageコンポーネントのプロパティインターフェース。
 * 動的ルーティングで渡されるパラメータの型を定義します。
 *
 * @interface UserDetailPageProps
 * @property {Promise<{ id: string }>} params - URLパラメータとして渡されるユーザーIDを含むオブジェクトのPromise
 */
interface UserDetailPageProps {
  initialUser: User;
  initialTodos: Todo[];
  currentUserRole: number;
  currentUserId: string;
}

/**
 * 権限情報とラベルの対応表
 *
 */
const roleLabels: Record<number, string> = {
  1: 'ADMIN',
  2: 'MANAGER',
  3: 'USER',
  4: 'GUEST',
};

/**
 * ロールごとのスタイルクラス。
 * ユーザー権限表示の際に、権限ごとに異なるスタイルを適用するためのオブジェクトです。
 *
 */
const roleStyles: Record<number, string> = {
  1: 'px-2 py-1 text-xs font-semibold rounded bg-red-100 text-red-800',
  2: 'px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800',
  3: 'px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-800',
  4: 'px-2 py-1 text-xs font-semibold rounded bg-gray-100 text-gray-800',
};

/**
 * ユーザー詳細ページのページコンポーネント。
 * ユーザーの詳細情報と、そのユーザーに関連するTodoリストを表示します(ADMIN・MANAGERのみ閲覧可能)
 *
 * @param props - params.id
 */
export default function UserDetailPage({
  initialUser,
  initialTodos,
  currentUserRole,
  currentUserId,
}: UserDetailPageProps) {
  // ページ遷移情報
  const router = useRouter();

  // ステートの定義
  // 表示中のユーザー情報
  const [user, setUser] = useState<User>(initialUser);
  // ユーザーに関連するTodoリスト
  const [todos] = useState<Todo[]>(initialTodos);
  // Todoの表示件数
  const [displayTodoCount, setDisplayTodoCount] = useState<number>(10); // 初期表示件数10件
  // 名前の情報
  const [firstName, setFirstName] = useState<string>(
    initialUser.firstName || ''
  );
  // 姓の情報
  const [lastName, setLastName] = useState<string>(initialUser.lastName || '');
  // ユーザー権限
  const [role, setRole] = useState<number>(initialUser.role);
  // 情報編集モードのフラグ
  const [isEditing, setIsEditing] = useState<boolean>(false);
  // 保存中状態のフラグ
  const [isSaving, setIsSaving] = useState<boolean>(false);
  // エラーメッセージ
  const [error, setError] = useState<string>('');
  // 成功メッセージ
  const [successMessage, setSuccessMessage] = useState<string>('');

  // モーダルの追加処理 STEP3 ADD START
  // 削除確認モーダルの状態管理
  const { isOpen, onOpen, onClose } = useDisclosure();
  // STEP3 ADD END

  /**
   * ユーザー情報の更新処理。
   * ユーザー情報の編集が完了したときに実行され、APIに更新リクエストを送信します。
   * @return {Promise<void>}
   * @throws {Error} ユーザー情報の更新に失敗した場合にスローされるエラー
   */
  const handleSave = async () => {
    // 保存中状態の設定とエラーメッセージ・成功メッセージのクリア
    setIsSaving(true);
    setError('');
    setSuccessMessage('');

    // 処理の開始
    try {
      // APIに更新リクエストを送信
      const result = await updateUser(user.id, {
        firstName,
        lastName,
        role,
      });

      // エラーレスポンスの場合は、例外をスロー
      if (!result.success) {
        throw new Error(result.error || 'ユーザー情報の更新に失敗しました');
      }

      // 更新成功後、表示中のユーザー情報を更新
      setUser(result.data);
      setSuccessMessage('ユーザー情報を更新しました');
      setIsEditing(false);

      // 成功メッセージを3秒後にクリア
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : '不明なエラーが発生しました'
      );
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * ユーザー削除処理。
   * ユーザー削除ボタンがクリックされたときに実行され、APIに削除リクエストを送信します。
   *
   * @return {Promise<void>}
   * @throws {Error} ユーザー削除に失敗した場合にスローされるエラー
   */
  // モーダル表示で確認後削除処理に変更 STEP3 MOD START
  const deleteUser = async () => {
    // モーダルを閉じる
    onClose();

    // 処理の開始
    try {
      // APIに削除リクエストを送信
      const result = await deleteUserAction(user.id);

      // エラーレスポンスの場合は、例外をスロー
      if (!result.success) {
        throw new Error(result.error || 'ユーザーの削除に失敗しました');
      }
      // 削除成功後は、ユーザー一覧ページにリダイレクト
      router.push('/users');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : '不明なエラーが発生しました'
      );
    }
  };
  // STEP3 MOD END

  /**
   * ログアウト処理。
   * ログアウトボタンがクリックされたときに実行され、APIにログアウトリクエストを送信します。
   *
   * @return {Promise<void>}
   * @throws {Error} ログアウトに失敗した場合にスローされるエラー
   */
  const handleLogout = async () => {
    await logout();
  };

  /**
   * フルネーム表示用の関数。
   * firstNameとlastNameを結合してフルネームを生成します。
   *
   * @param {User} userData - ユーザー情報オブジェクト
   * @return {string} フルネームまたは「name is not set」
   */
  const getFullName = (userData: User): string => {
    if (userData.firstName || userData.lastName) {
      return `${userData.lastName || ''} ${userData.firstName || ''}`.trim();
    }
    return 'name is not set';
  };

  // 表示するTodoリストを取得
  const displayTodos = todos.slice(0, displayTodoCount);

  /**
   * もっと見るボタンのクリックハンドラ。
   * 表示するTodoの件数を増やします。
   */
  const loadMoreTodos = () => {
    setDisplayTodoCount((prevState) => prevState + 10);
  };

  return (
    <div className='min-h-screen flex flex-col bg-gray-50'>
      <main className='flex-1 max-w-7xl mx-auto px-6 py-10 w-full'>
        {/* メインコンテンツ */}
        {/* エラーメッセージ */}
        {error && (
          <div className='mb-8 p-4 border border-red-200 rounded-lg bg-red-50'>
            <p className='text-red-700 text-sm'>{error}</p>
          </div>
        )}
        {/* 成功メッセージ */}
        {successMessage && (
          <div className='mb-8 p-4 bg-green-50 border border-green-200 rounded-lg'>
            <p className='text-green-700 text-sm'>{successMessage}</p>
          </div>
        )}

        {/* ページタイトルとユーザー情報の表示・編集部分 */}
        <div className='flex items-center justify-between mb-6'>
          <div>
            <h2 className='text-3xl font-bold text-gray-900'>ユーザー管理</h2>
          </div>
          <div className='flex items-center gap-3'>
            {/* 戻るボタン */}
            {/* Buttonに変更 STEP3 MOD START */}
            <Button
              type='button'
              as={Link}
              href='/users'
              className='font-medium'
            >
              ユーザー一覧に戻る
            </Button>
            {/* STEP3 MOD END */}
          </div>
        </div>

        {/* ユーザー情報カード */}
        <Card className='p-8 mb-8'>
          <CardHeader className='flex items-center justify-between mb-6'>
            <h3 className='text-2xl font-semibold text-gray-900'>
              ユーザー情報
            </h3>
            {/* 編集ボタン(ADMINのみ) */}
            {currentUserRole === 1 && !isEditing && (
              // button → Button STEP3 MOD START
              <Button
                type='button'
                onPress={() => setIsEditing(true)}
                color='primary'
                className='font-medium'
              >
                編集
              </Button>
              // STEP3 MOD END
            )}
            {/* 保存・キャンセルボタン */}
            {isEditing && (
              <div className='flex items-center gap-3'>
                {/* button → Button STEP3 MOD START */}
                <Button
                  type='button'
                  onPress={handleSave}
                  color='primary'
                  isLoading={isSaving}
                  className='font-medium'
                >
                  {isSaving ? '保存中' : '保存'}
                </Button>
                <Button
                  type='button'
                  onPress={() => {
                    setIsEditing(false);
                    setFirstName(user.firstName || '');
                    setLastName(user.lastName || '');
                    setRole(user.role);
                  }}
                  className='font-medium'
                >
                  キャンセル
                </Button>
                {/* STEP3 MOD END */}
              </div>
            )}
          </CardHeader>

          {/* ユーザー情報表示 */}

          {/* 編集モードでない場合 */}
          {!isEditing ? (
            <CardBody className='space-y-4'>
              {/* ユーザー名 */}
              <div>
                <label
                  htmlFor='username-display'
                  className='block text-sm font-medium text-gray-500 mb-1'
                >
                  ユーザー名
                </label>
                <p id='username-display' className='text-lg text-gray-900'>
                  {user.username}
                </p>
              </div>
              {/* 名前・権限*/}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {/* 名前 */}
                <div>
                  <label
                    htmlFor='fullname-display'
                    className='block text-sm font-medium text-gray-500'
                  >
                    名前
                  </label>
                  <p id='fullname-display' className='text-lg text-gray-900'>
                    {getFullName(user)}
                  </p>
                </div>
                {/* 権限 */}
                <div>
                  <label
                    htmlFor='role-display'
                    className='block text-sm font-medium text-gray-500 mb-1'
                  >
                    ロール
                  </label>
                  <span id='role-display' className={roleStyles[user.role]}>
                    {roleLabels[user.role]}
                  </span>
                </div>
              </div>

              {/* 作成日時・更新日時 */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {/* 作成日時 */}
                <div>
                  <label
                    htmlFor='create-at-display'
                    className='block text-sm font-medium text-gray-500 mb-1'
                  >
                    作成日時
                  </label>
                  <p id='create-at-display' className='text-gray-700'>
                    {new Date(user.createdAt).toLocaleString('ja-JP')}
                  </p>
                </div>
                {/* 更新日時 */}
                <div>
                  <label
                    htmlFor='update-at-display'
                    className='block text-sm font-medium text-gray-500 mb-1'
                  >
                    更新日時
                  </label>
                  <p id='update-at-display' className='text-gray-700'>
                    {new Date(user.updatedAt).toLocaleString('ja-JP')}
                  </p>
                </div>
              </div>
            </CardBody>
          ) : (
            // 編集モード
            <CardBody className='space-y-6'>
              {/* 名前編集 */}

              {/* ユーザー名 */}
              <div>
                {/* Inputに変更 STEP3 MOD START */}
                <Input
                  id='username'
                  type='text'
                  isDisabled
                  isReadOnly
                  label='ユーザー名'
                  defaultValue={user.username}
                />
                {/* STEP3 MOD END */}
              </div>

              {/* 姓 */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  {/* input → Input STEP3 MOD START */}
                  <Input
                    id='lastName'
                    label='姓'
                    type='text'
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder='姓'
                  />
                  {/* STEP3 MOD END */}
                </div>

                {/* 名 */}
                <div>
                  {/* input → Input STEP3 MOD START */}
                  <Input
                    id='firstName'
                    label='名'
                    type='text'
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder='名'
                  />
                  {/* STEP3 MOD END */}
                </div>
              </div>

              {/* 権限編集 */}
              <div>
                {/* select → Select STEP3 MOD START */}
                <Select
                  id='role'
                  label='ロール'
                  selectedKeys={[String(role)]}
                  onSelectionChange={(keys) => {
                    const selectedRole = Array.from(keys)[0];
                    setRole(Number(selectedRole));
                  }}
                  isRequired
                  validationBehavior='aria'
                  placeholder='ロールを選択してください'
                >
                  <SelectItem key={1}>ADMIN</SelectItem>
                  <SelectItem key={2}>MANAGER</SelectItem>
                  <SelectItem key={3}>USER</SelectItem>
                  <SelectItem key={4}>GUEST</SelectItem>
                </Select>
                {/* STEP3 MOD END */}
              </div>
            </CardBody>
          )}

          {/* 削除ボタン（ADMINのみ、自分以外） */}
          {currentUserRole === 1 && currentUserId !== user.id && (
            <CardFooter className='mt-6'>
              {/* button → Button STEP3 MOD START */}
              <Button
                type='button'
                onPress={onOpen} // モーダルを開く
                color='danger'
                className='font-medium'
              >
                このユーザーを削除
              </Button>
              {/* STEP3 MOD END */}
            </CardFooter>
          )}
        </Card>

        {/* Todoリスト表示 */}
        <Card className='p-8'>
          <CardHeader className='justify-between'>
            <h3 className='text-2xl font-semibold text-gray-900 mb-6'>
              最近のTodo
            </h3>
            {todos.length > 0 && <span>全{todos.length}件</span>}
          </CardHeader>

          {/* MANAGER権限でほかのユーザーの詳細ページを参照している場合 */}
          {currentUserRole === 2 && currentUserId !== user.id ? (
            <CardBody className='text-center py-12'>
              <p className='text-gray-500 text-sm'>
                他のユーザーのTodoは閲覧できません
              </p>
              <p className='text-gray-400 text-xs mt-2'>
                MANAGER権限では自分のTodoのみ閲覧可能です
              </p>
            </CardBody>
          ) : todos.length === 0 ? ( // Todoがない場合
            <CardBody className='text-center py-12'>
              <p className='text-gray-500'>Todoがありません</p>
            </CardBody>
          ) : (
            // Todoリスト表示
            <CardBody className='space-y-4'>
              {displayTodos.map((todo) => (
                <div
                  key={todo.id}
                  className='flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200'
                >
                  {/* Todoタイトル */}
                  <div className='flex items-center gap-3 flex-1'>
                    <input
                      type='checkbox'
                      checked={todo.completed}
                      readOnly
                      className='w-5 h-5 text-blue-600 rounded cursor-default'
                    />
                    <div className='flex-1'>
                      <p
                        className={`font-medium ${
                          todo.completed
                            ? 'line-through text-gray-400'
                            : 'text-gray-900'
                        }`}
                      >
                        {todo.title}
                      </p>

                      {/* Todo説明 */}
                      {todo.descriptions && (
                        <p className='text-sm text-gray-500 mt-1'>
                          {todo.descriptions}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {/* もっと見るボタン */}
              {displayTodoCount < todos.length && (
                <CardFooter className='justify-center mt-4'>
                  <Button
                    type='button'
                    onPress={loadMoreTodos}
                    color='primary'
                    className='font-medium'
                  >
                    もっと見る
                  </Button>
                </CardFooter>
              )}

              {/* 全件表示完了メッセージ */}
              {displayTodoCount >= todos.length && todos.length > 10 && (
                <CardFooter className='justify-center mt-4'>
                  <p className='text-sm text-gray-500'>
                    すべてのTodoが表示されています
                  </p>
                </CardFooter>
              )}
            </CardBody>
          )}
        </Card>

        {/* 削除確認モーダルの追加 STEP3 ADD START */}
        <Modal isOpen={isOpen} onClose={onClose} isDismissable={false}>
          <ModalContent>
            <ModalHeader>削除確認</ModalHeader>
            <ModalBody>
              <p>このユーザーを削除してもよろしいですか？</p>
              <p>この操作は取り消すことができません。</p>
            </ModalBody>
            <ModalFooter>
              <Button onPress={onClose}>キャンセル</Button>
              <Button color='danger' onPress={deleteUser}>
                削除する
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
        {/* STEP3 ADD END */}
      </main>
    </div>
  );
}

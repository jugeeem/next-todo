'use client';

import {
  Button,
  Link,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { deleteUser as deleteUserAction, updateUser } from '@/lib/api';
import type { Todo, User } from './components/types';
import { UserInfoDisplay } from './components/UserInfoDisplay';
import { UserInfoEditForm } from './components/UserInfoEditForm';
import { UserTodoList } from './components/UserTodoList';

/**
 * UserDetailPageのPropsタイプ定義
 *
 * @interface UserDetailPageProps - UserDetailPageコンポーネントのプロパティタイプ定義
 * @property {User} initialUser - 初期表示するユーザー情報
 * @property {Todo[]} initialTodos - 初期表示するTodoリスト
 * @property {number} currentUserRole - 現在のログインユーザーの権限情報
 * @property {string} currentUserId - 現在のログインユーザーのID
 */
interface UserDetailPageProps {
  initialUser: User;
  initialTodos: Todo[];
  currentUserRole: number;
  currentUserId: string;
}

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
  // 情報編集モードのフラグ
  const [isEditing, setIsEditing] = useState<boolean>(false);
  // 保存中状態のフラグ
  const [isSaving, setIsSaving] = useState<boolean>(false);
  // エラーメッセージ
  const [error, setError] = useState<string>('');
  // 成功メッセージ
  const [successMessage, setSuccessMessage] = useState<string>('');
  // 削除確認モーダルの状態管理
  const { isOpen, onOpen, onClose } = useDisclosure();

  /**
   * 編集モードに切り替えるハンドラー。
   *
   * @return {void}
   */
  const handleEdit = () => {
    setIsEditing(true);
    setError('');
    setSuccessMessage('');
  };

  /**
   * 編集キャンセルハンドラー。
   *
   * @return {void}
   */
  const handleCancel = () => {
    setIsEditing(false);
    setError('');
  };

  /**
   * ユーザー情報の更新処理ハンドラー。
   */
  const handleSave = async (firstName: string, lastName: string, role: number) => {
    // 保存中状態に設定しエラー・成功メッセージをクリア
    setIsSaving(true);
    setError('');
    setSuccessMessage('');

    try {
      const result = await updateUser(user.id, {
        firstName,
        lastName,
        role,
      });

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
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * ユーザー削除処理ハンドラー。
   * 削除確認モーダルの「削除する」ボタン押下時に呼び出されます。
   *
   * @return {Promise<void>} - 削除処理の完了を示すPromise
   */
  /**
   * ユーザー削除処理
   */
  const handleDeleteUser = async () => {
    onClose();

    try {
      const result = await deleteUserAction(user.id);

      if (!result.success) {
        throw new Error(result.error || 'ユーザーの削除に失敗しました');
      }

      // 削除成功後は、ユーザー一覧ページにリダイレクト
      router.push('/users');
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <main className="flex-1 max-w-7xl mx-auto px-6 py-10 w-full">
        {/* エラーメッセージ */}
        {error && (
          <div className="mb-8 p-4 border border-red-200 rounded-lg bg-red-50">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
        {/* 成功メッセージ */}
        {successMessage && (
          <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700 text-sm">{successMessage}</p>
          </div>
        )}

        {/* ページタイトルとユーザー情報の表示・編集部分 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">ユーザー管理</h2>
          </div>
          <div className="flex items-center gap-3">
            {/* 戻るボタン */}
            <Button type="button" as={Link} href="/users" className="font-medium">
              ユーザー一覧に戻る
            </Button>
          </div>
        </div>

        {!isEditing ? (
          <UserInfoDisplay
            user={user}
            currentUserRole={currentUserRole}
            currentUserId={currentUserId}
            onEdit={handleEdit}
            onDelete={onOpen}
          />
        ) : (
          <UserInfoEditForm
            user={user}
            currentUserRole={currentUserRole}
            isSaving={isSaving}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        )}

        {/* Todoリスト表示 */}
        <UserTodoList
          todos={todos}
          currentUserRole={currentUserRole}
          currentUserId={currentUserId}
          targetUserId={user.id}
        />

        <Modal isOpen={isOpen} onClose={onClose} isDismissable={false}>
          <ModalContent>
            <ModalHeader>削除確認</ModalHeader>
            <ModalBody>
              <p>このユーザーを削除してもよろしいですか？</p>
              <p>この操作は取り消すことができません。</p>
            </ModalBody>
            <ModalFooter>
              <Button onPress={onClose}>キャンセル</Button>
              <Button color="danger" onPress={handleDeleteUser}>
                削除する
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </main>
    </div>
  );
}

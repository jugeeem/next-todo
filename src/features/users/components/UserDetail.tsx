'use client';

import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Checkbox,
  Chip,
  Input,
  Link,
  Select,
  SelectItem,
} from '@heroui/react';
import { useRouter } from 'next/navigation';
import { startTransition, useMemo, useOptimistic, useState } from 'react';

type User = {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  role: number;
  createdAt: Date;
  updatedAt: Date;
};

type Todo = {
  id: string;
  title: string;
  descriptions?: string | undefined;
  completed: boolean;
  userId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
};

export default function UserDetail({
  user,
  todos,
}: {
  user: User;
  todos: Array<Todo>;
}) {
  const [initialUser, setInitialUser] = useState<User>(user);
  const [isEditingOpen, setIsEditingOpen] = useState(false);
  const [isEditSending, setIsEditSending] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleteChecked, setIsDeleteChecked] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [userOptimistic, addUserOptimistic] = useOptimistic(
    initialUser,
    (currentUser: User, newUser: Partial<User>) => {
      return { ...currentUser, ...newUser };
    },
  );
  const router = useRouter();

  // 編集フォーム用state
  const [editForm, setEditForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    role: user?.role || 4,
  });
  const [editError, setEditError] = useState<{
    firstNameError?: string | null;
    lastNameError?: string | null;
    generalError?: string | null;
  }>({});

  type User = {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    role: number;
    createdAt: Date;
    updatedAt: Date;
  };

  // 役割名取得関数
  const getUserRoleName = (role: number) => {
    switch (role) {
      case 1:
        return '管理者';
      case 2:
        return 'マネージャー';
      case 4:
        return 'ユーザー';
      case 8:
        return 'ゲスト';
      default:
        return '不明';
    }
  };

  // アカウント削除処理
  const handleAccountDelete = async () => {
    if (!isDeleteChecked) {
      setDeleteError('チェックを入れてください');
      return;
    }
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (response.ok) {
        // ユーザー一覧ページへリダイレクト
        router.push('/users');
      }
    } catch (error) {
      setDeleteError((error as Error).message);
    }
    setIsDeleting(false);
  };

  // 日付フォーマット関数
  const formatDate = useMemo(() => {
    return (dateString: Date) => {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    };
  }, []);

  // 編集フォームのリアルタイムバリデーション
  const validateEditForm = (target?: { name: string; value: string }) => {
    const newError = { ...editError };
    let valid = true;

    // 名
    const firstNameValue =
      target?.name === 'firstName' ? target.value : editForm.firstName;
    if (firstNameValue.length > 20) {
      newError.firstNameError = '名は20文字以内で入力してください';
      valid = false;
    } else {
      newError.firstNameError = null;
    }

    // 姓
    const lastNameValue =
      target?.name === 'lastName' ? target.value : editForm.lastName;
    if (lastNameValue.length > 20) {
      newError.lastNameError = '姓は20文字以内で入力してください';
      valid = false;
    } else {
      newError.lastNameError = null;
    }

    setEditError(newError);
    return valid;
  };

  const handleEditInput = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setEditForm({ ...editForm, [name]: value });
    validateEditForm({ name, value }); // リアルタイムバリデーション
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEditForm()) return;
    setIsEditSending(true);

    startTransition(async () => {
      addUserOptimistic({
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        role: editForm.role,
      });
      try {
        const response = await fetch(`/api/users/${user.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editForm),
          credentials: 'include',
        });
        const result = await response.json();
        if (response.ok) {
          setIsEditingOpen(false);
          // 必要ならページリロードやユーザー情報再取得
          setInitialUser((prev) => ({ ...prev, ...editForm }));
        } else {
          setEditError((prev) => ({
            ...prev,
            generalError: result.message || '更新に失敗しました',
          }));
        }
      } catch {
        setEditError((prev) => ({
          ...prev,
          generalError: '通信エラーが発生しました',
        }));
      } finally {
        setIsEditSending(false);
      }
    });
  };

  // 進捗率計算
  const totalTodos = todos.length;
  const completedTodos = todos.filter((t) => t.completed).length;
  const progressRate =
    totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0;

  return (
    <div className="bg-gray-50 min-h-screen" aria-busy="true">
      <header className="h-15 p-5 flex justify-between items-center bg-blue-500 text-white">
        <h1 className="text-xl font-bold">ユーザー詳細</h1>
        <span className="text-sm"></span>
        <div className="flex gap-2">
          <Link
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition-colors"
            href="/users/me"
          >
            プロフィール
          </Link>
          <Link
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition-colors"
            href="/todos"
          >
            Todo一覧
          </Link>
          <Link
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition-colors"
            href="/users"
          >
            一覧へ戻る
          </Link>
        </div>
      </header>

      {/* Content Sections */}
      <Card className="max-w-[600px] mx-auto mt-5 relative bg-blue-100 p-3">
        <CardHeader className="pt-0">
          <h1 className="text-gray-700 font-bold text-lg">ユーザー情報</h1>
        </CardHeader>
        <CardBody className="bg-white rounded-lg">
          {/* Name */}
          <div className="h-fit w-full mb-2 text-md font-bold text-gray-800">
            <p className="text-xs">ユーザー名</p>
            <p className="text-lg">
              {userOptimistic?.username ?? '（ユーザー名なし）'}
            </p>
          </div>
          <div className="h-fit w-full mb-2 text-md font-bold text-gray-800">
            <p className="text-xs">名前</p>
            <p className="text-lg">
              {`${userOptimistic?.lastName ?? '-'} ${userOptimistic?.firstName ?? '-'}`}
            </p>
          </div>
          {/* Stats */}
          <div className="flex gap-4 mb-4">
            <div className="w-fit text-center">
              <span className="block text-gray-700 font-semibold text-xs mb-1">
                役割
              </span>
              <Chip
                className={`${
                  userOptimistic?.role === 1
                    ? 'bg-red-100 text-red-800'
                    : userOptimistic?.role === 2
                      ? 'bg-yellow-100 text-yellow-800'
                      : userOptimistic?.role === 4
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                }`}
              >
                {getUserRoleName(userOptimistic?.role)}
              </Chip>
            </div>
            <div className="w-fit text-center">
              <span className="block text-gray-700 font-semibold text-xs mb-1">
                作成日
              </span>
              <p className="text-gray-600 font-bold">
                {userOptimistic?.createdAt ? formatDate(userOptimistic.createdAt) : '―'}
              </p>
            </div>
            <div className="w-fit text-center">
              <span className="block text-gray-700 font-semibold text-xs mb-1">
                更新日
              </span>
              <p className="text-gray-600 font-bold">
                {userOptimistic?.updatedAt ? formatDate(userOptimistic.updatedAt) : '―'}
              </p>
            </div>
          </div>
          {/* Action Area */}
          <div className="flex gap-2">
            <Button
              color="primary"
              onPress={() => setIsEditingOpen(!isEditingOpen)}
              aria-label="userEdit"
            >
              編集
            </Button>
            <Button
              color="danger"
              onPress={() => setIsDeleteConfirmOpen(!isDeleteConfirmOpen)}
              aria-label="userDelete"
            >
              アカウント削除
            </Button>
          </div>
        </CardBody>
      </Card>
      {/* Todo Statistics */}
      <Card className="max-w-[600px] mx-auto mt-5 relative bg-blue-100 p-3">
        <CardHeader className="pt-0">
          <h1 className="text-gray-700 font-bold text-lg">Todo統計</h1>
        </CardHeader>
        <CardBody className="bg-white rounded-lg">
          <div className="flex gap-6">
            <span className="text-gray-700">
              合計: <span className="font-bold">{totalTodos}</span>件
            </span>
            <span className="text-gray-700">
              完了: <span className="font-bold">{completedTodos}</span>件
            </span>
            <span className="text-gray-700">
              進捗率: <span className="font-bold">{progressRate}%</span>
            </span>
          </div>
          {/* タスク一覧 */}
          <div>
            <h3 className="text-md font-semibold mb-2">タスク一覧</h3>
            {todos.length === 0 ? (
              <div className="text-gray-500 text-center py-4">タスクがありません</div>
            ) : (
              <div>
                {todos.map((todo) => (
                  <Card
                    key={todo.id}
                    className="max-w-full mx-auto mb-5 p-2 z-0 relative"
                  >
                    <CardHeader className="box-shadow rounded-lg justify-between items-center bg-blue-500 text-white p-2">
                      <h3 className="text-lg font-bold ml-1">{todo.title}</h3>
                    </CardHeader>
                    <CardBody className="min-h-[50px]">
                      {!todo.descriptions ? (
                        <p className="text-gray-400">説明がありません</p>
                      ) : (
                        <p>{todo.descriptions}</p>
                      )}
                    </CardBody>
                    <CardFooter className="text-sm text-gray-500 my-2 gap-2 flex justify-between items-end py-0">
                      <div>
                        <p>作成日: {formatDate(todo.createdAt)}</p>
                        <p>更新日: {formatDate(todo.updatedAt)}</p>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* プロフィール編集モーダル */}
      {isEditingOpen && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <Card shadow="none" className="w-80 p-3">
            <CardHeader>
              <h2 className="text-lg font-bold">プロフィール編集</h2>
            </CardHeader>
            <CardBody>
              <form onSubmit={handleEditSubmit}>
                <div className="mb-4">
                  <Input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={editForm.lastName}
                    label="姓"
                    placeholder="姓"
                    onChange={handleEditInput}
                  />
                  {editError.lastNameError && (
                    <p className="text-red-500">{editError.lastNameError}</p>
                  )}
                </div>
                <div className="mb-4">
                  <Input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={editForm.firstName}
                    label="名"
                    placeholder="名"
                    onChange={handleEditInput}
                  />
                  {editError.firstNameError && (
                    <p className="text-red-500">{editError.firstNameError}</p>
                  )}
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2" htmlFor="role">
                    役割
                  </label>
                  <Select
                    id="role"
                    name="role"
                    value={editForm.role}
                    onChange={handleEditInput}
                    defaultSelectedKeys={userOptimistic.role.toString()}
                    aria-label="役割を選択"
                  >
                    <SelectItem key={1}>管理者</SelectItem>
                    <SelectItem key={2}>マネージャー</SelectItem>
                    <SelectItem key={4}>ユーザー</SelectItem>
                    <SelectItem key={8}>ゲスト</SelectItem>
                  </Select>
                </div>
                {editError.generalError && (
                  <p className="text-red-500">{editError.generalError}</p>
                )}
                <div className="flex justify-end gap-2 mt-6">
                  <Button
                    color="danger"
                    variant="light"
                    onPress={() => setIsEditingOpen(false)}
                    disabled={isEditSending}
                    aria-label="cancel"
                  >
                    キャンセル
                  </Button>
                  <Button
                    type="submit"
                    color="primary"
                    disabled={isEditSending}
                    aria-label="save"
                  >
                    {isEditSending ? '保存中...' : '保存'}
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
        </div>
      )}

      {/* アカウント削除確認モーダル */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <Card shadow="none" className="w-80 p-3">
            <CardHeader>
              <h2 className="text-lg font-bold text-red-600">アカウント削除の確認</h2>
            </CardHeader>
            <CardBody className="text-center">
              <p className="text-center mb-6 text-gray-700">
                作成したTodoもすべて削除されます。
                <br />
                この操作は取り消すことができません。
              </p>
              <Checkbox
                isSelected={isDeleteChecked}
                onChange={(e) => setIsDeleteChecked(e.target.checked)}
                id="confirmDelete"
                className="mx-auto"
              >
                確認しました
              </Checkbox>

              {deleteError && <p className="text-red-500 mb-2">{deleteError}</p>}
              <div className="flex justify-end gap-2 mt-6">
                <Button
                  color="danger"
                  variant="light"
                  onPress={() => {
                    setIsDeleteConfirmOpen(false);
                    setDeleteError(null);
                  }}
                >
                  キャンセル
                </Button>
                <Button
                  color="danger"
                  onPress={handleAccountDelete}
                  disabled={isDeleting}
                >
                  削除
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}

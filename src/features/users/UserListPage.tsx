'use client';

import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Select,
  SelectItem,
  useDisclosure,
} from '@heroui/react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { deleteUser, logout } from '@/lib/api';

// インターフェースの定義

/**
 * ユーザー情報のインターフェース。
 * ユーザー情報を表すためのインターフェースです。
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
 * ページネーション情報のインターフェース。
 * APIから取得されるページネーション関連の情報を表すためのインターフェースです。
 *
 * @interface PaginationInfo
 * @property {number} currentPage - 現在のページ番号
 * @property {number} totalPages - 総ページ数
 * @property {number} totalItems - 総アイテム数
 * @property {number} itemsPerPage - 1ページ当たりのアイテム数
 */
interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

/**
 * Propsのインターフェース。
 * UserListPageコンポーネントに渡されるpropsの型を定義します。
 */
interface Props {
  currentUserId: string;
  currentUserRole: number;
}

/**
 * ロール番号とラベルの対応表。
 * ユーザーロール番号を対応するラベルに変換するためのオブジェクトです。
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
 * @returns {Record<number, string>} 権限ごとのスタイルクラスを返します。
 */
const roleStyles: Record<number, string> = {
  1: 'px-2 py-1 text-xs font-semibold rounded bg-red-100 text-red-800',
  2: 'px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800',
  3: 'px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-800',
  4: 'px-2 py-1 text-xs font-semibold rounded bg-gray-100 text-gray-800',
};
/**
 * ユーザー一覧ページコンポーネント。
 * ADMINおよびMANAGER専用のユーザー管理画面を表示するコンポーネントです。
 * @returns
 */
export default function UserListPage({ currentUserId, currentUserRole }: Props) {
  // ステートの管理

  // ユーザー一覧データ
  const [users, setUsers] = useState<User[]>([]);
  // 現在のページ番号
  const [page, setPage] = useState<number>(1);
  // ページネーション情報
  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo | null>(null);
  // ページの権限フィルター
  const [roleFilter, setRoleFilter] = useState<number | 'all'>('all');
  // ソート項目
  const [sortBy, setSortBy] = useState<
    'createdAt' | 'username' | 'firstName' | 'lastName' | 'role'
  >('createdAt');
  // ソート順序
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  // 検索キーワード(ユーザー名、名前で検索)
  const [searchQuery, setSearchQuery] = useState<string>('');
  // データ取得中フラグ
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // エラーメッセージ
  const [error, setError] = useState<string>('');
  // 成功メッセージ
  const [successMessage, setSuccessMessage] = useState<string>('');
  // 削除対象のユーザーIDを保存するステート
  const [userToDeleteId, setUserToDeleteId] = useState<string | null>(null);

  // ユーザー削除モーダル関連のステートと関数を追加
  const { isOpen, onOpen, onClose } = useDisclosure();

  /**
   * ユーザー一覧データを取得する非同期関数。
   * ユーザーの検索条件に基づいて、APIからユーザー一覧データを取得し、ステートに設定します。
   * useCallbackを使用して、依存配列内の値が変更された場合のみインスタンスが再生成されるようにします。
   * @return {Promise<void>}
   * @throws {Error} ユーザー一覧の取得に失敗した場合にエラーをスローします。
   */
  const fetchUsers = useCallback(async () => {
    // ローディング状態を設定し、エラーメッセージをクリア。
    setIsLoading(true);
    setError('');

    try {
      // クエリパラメータを構築
      const queryParams = new URLSearchParams({
        page: page.toString(),
        perPage: '20',
        sortBy,
        sortOrder,
      });

      // searchQueryが空でなければクエリパラメータに追加する。
      if (searchQuery.trim()) {
        queryParams.append('username', searchQuery.trim());
      }

      // roleFilterがallでなければクエリパラメータに追加する。
      if (roleFilter !== 'all') {
        queryParams.append('role', roleFilter.toString());
      }

      // 構築したクエリパラメータを使用してAPIエンドポイントを呼び出す
      const response = await fetch(`/api/users?${queryParams.toString()}`);

      // レスポンスのエラーチェック
      if (!response.ok) {
        throw new Error('ユーザー一覧の取得に失敗しました');
      }

      // レスポンスのデータをオブジェクトに変換
      const data = await response.json();

      // APIレスポンスは入れ子構造のため、ユーザーのデータを抽出して変数に格納
      const responseData = data.data;
      // ユーザー一覧データをステートに設定
      setUsers(responseData.data || []);
      // ページネーション情報をステートに設定
      setPaginationInfo({
        currentPage: responseData.pagination.currentPage,
        totalPages: responseData.pagination.totalPages,
        totalItems: responseData.pagination.totalUsers,
        itemsPerPage: responseData.pagination.perPage,
      });
    } catch (err) {
      // エラー発生時の処理
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    } finally {
      // ローディングの終了
      setIsLoading(false);
    }
  }, [page, roleFilter, sortBy, sortOrder, searchQuery]);

  // useEffectを使用して検索条件が変更されたときのデータの再取得処理を行います。
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ユーザー削除モーダルを開く関数を追加し、削除対象のユーザーをステートに保存する。 STEP3 ADD START
  /**
   * ユーザー削除モーダルを開く。
   * @param {string} userId - 削除対象のユーザーID
   */
  const openDeleteUser = (userId: string) => {
    // 削除対象のユーザーIDをステートに保存し、モーダルを開く
    setUserToDeleteId(userId);
    onOpen();
  };
  // STEP3 ADD END

  /**
   * ユーザー削除用の非同期関数。
   * 指定されたユーザーIDのアカウントを削除します。（ADMIN専用機能）
   * @return {Promise<void>}
   * @throws {Error} ユーザー削除に失敗した場合にエラーをスローします。
   */
  const handleDeleteUser = async () => {
    // 削除対象のユーザーがない場合は処理を終了する。
    if (!userToDeleteId) return;

    // モーダルを閉じる
    onClose();

    // エラーメッセージと成功メッセージをクリア
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      // lib/api.tsの削除関数を使用
      const result = await deleteUser(userToDeleteId);

      // エラーレスポンスの場合は、例外をスロー
      if (!result.success) {
        throw new Error(result.error || 'ユーザーの削除に失敗しました');
      }

      // 削除成功メッセージを表示
      setSuccessMessage('ユーザーを削除しました');

      // ステートから削除されたユーザーを除外。現在のusersを参照してidが削除対象と異なるものだけを残す。
      setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userToDeleteId));

      // ページネーション情報を更新
      if (paginationInfo) {
        setPaginationInfo({
          ...paginationInfo,
          totalItems: paginationInfo.totalItems - 1,
        });
      }

      // 削除対象ユーザーをクリア
      setUserToDeleteId(null);

      // 成功メッセージを3秒後にクリア
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * ログアウト処理の非同期関数。
   * 現在のユーザーをログアウトし、ログインページにリダイレクトします。
   *
   * @return {Promise<void>}
   * @throws {Error} ログアウトに失敗した場合にエラーをスローします。
   */
  const handleLogout = async () => {
    // ログアウトAPIを呼び出し
    await logout();
  };

  /**
   * ユーザーのフルネームを取得する関数。
   * ユーザーの姓と名を結合してフルネームを生成します。(なければ"name is not set"を返します)
   * @param {User} user - ユーザーオブジェクト
   * @return {string} ユーザーのフルネームまたはデフォルトメッセージ
   */
  const getFullName = (user: User): string => {
    if (user.firstName || user.lastName) {
      return `${user.lastName || ''} ${user.firstName || ''}`.trim();
    }
    return 'name is not set';
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* ヘッダーナビゲーション */}
      {/* herouiに変更 STEP3 MOD START */}
      <Navbar className="border-b border-gray-200">
        <NavbarBrand>
          <Link href="/todos" className="hover:opacity-80 transition-opacity">
            <h1 className="text-3xl font-bold text-gray-900">Todoアプリ</h1>
          </Link>
        </NavbarBrand>
        <NavbarContent className="hidden sm:flex gap-4" justify="center">
          <NavbarItem>
            <Link
              href="/todos"
              color="foreground"
              className="hover:text-blue-600 font-medium"
            >
              Todo一覧
            </Link>
          </NavbarItem>
          <NavbarItem>
            <Link
              href="/profile"
              color="foreground"
              className="hover:text-blue-600 font-medium"
            >
              プロフィール
            </Link>
          </NavbarItem>
          {currentUserRole <= 2 && (
            <NavbarItem>
              <Link
                href="/users"
                color="foreground"
                className="hover:text-blue-600 font-medium"
              >
                ユーザー管理
              </Link>
            </NavbarItem>
          )}
        </NavbarContent>
        <NavbarContent justify="end">
          <NavbarItem>
            <Button type="button" onPress={handleLogout} className="font-medium">
              ログアウト
            </Button>
          </NavbarItem>
        </NavbarContent>
      </Navbar>
      {/* STEP3 MOD END */}

      {/* メインコンテンツ */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-10 w-full">
        {/* エラーメッセージ表示 */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* 成功メッセージ表示 */}
        {successMessage && (
          <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700 text-sm">{successMessage}</p>
          </div>
        )}

        {/* ページタイトルと新規作成ボタン */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">ユーザー管理</h2>
          </div>
          {/* 新規ユーザー作成ボタン */}
          <Button
            as={Link}
            href="/users/create"
            color="primary"
            className="font-medium shadow-md hover:shadow-lg"
          >
            新規ユーザー作成
          </Button>
        </div>

        {/* 検索・フィルターCard */}
        <Card className="mb-8">
          <CardHeader>
            <h3 className="text-xl font-semibold text-gray-900">検索・フィルター</h3>
          </CardHeader>
          <CardBody className="space-y-4">
            {/* 検索ボックス */}
            <Input
              id="search"
              label="ユーザー名"
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="ユーザー名で検索"
            />

            {/* ロールフィルター、ソートのコントロール */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* ロールフィルター */}
              <div>
                {/* select → Select STEP3 MOD START */}
                <Select
                  id="roleFilter"
                  label="ロールフィルター"
                  selectedKeys={[String(roleFilter)]}
                  onSelectionChange={(keys) => {
                    // Set から最初の要素を取得
                    const selected = Array.from(keys)[0] as string;
                    // 'all' の場合はそのまま、数値の場合は Number に変換
                    setRoleFilter(selected === 'all' ? 'all' : Number(selected));
                    setPage(1); // フィルター条件が変わったらページ番号を1にリセット
                  }}
                >
                  <SelectItem key="all">すべて</SelectItem>
                  <SelectItem key="1">ADMIN</SelectItem>
                  <SelectItem key="2">MANAGER</SelectItem>
                  <SelectItem key="3">USER</SelectItem>
                  <SelectItem key="4">GUEST</SelectItem>
                </Select>
                {/* STEP3 MOD END */}
              </div>

              {/* ソート項目 */}
              <div>
                <Select
                  id="sortBy"
                  label="並び順"
                  selectedKeys={[sortBy]}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as typeof sortBy;
                    setSortBy(selected);
                  }}
                >
                  <SelectItem key="createdAt">作成日時</SelectItem>
                  <SelectItem key="username">ユーザー名</SelectItem>
                  <SelectItem key="firstName">名前</SelectItem>
                  <SelectItem key="lastName">姓</SelectItem>
                  <SelectItem key="role">ロール</SelectItem>
                </Select>
              </div>

              {/* ソート順序 */}
              <div>
                <Select
                  id="sortOrder"
                  label="順序"
                  selectedKeys={[sortOrder]}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as 'asc' | 'desc';
                    setSortOrder(selected);
                  }}
                >
                  <SelectItem key="desc">降順</SelectItem>
                  <SelectItem key="asc">昇順</SelectItem>
                </Select>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* ユーザー一覧Card */}
        <Card>
          <CardBody>
            {/* ヘッダー部分 */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">ユーザー一覧</h2>

              {/* ページネーション情報 */}
              {paginationInfo && (
                <p className="text-sm text-gray-600">
                  全{paginationInfo.totalItems}件中{' '}
                  {(paginationInfo.currentPage - 1) * paginationInfo.itemsPerPage + 1}～
                  {Math.min(
                    paginationInfo.currentPage * paginationInfo.itemsPerPage,
                    paginationInfo.totalItems,
                  )}
                  件を表示
                </p>
              )}
            </div>

            {/* ローディング表示 */}
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-gray-500">読み込み中...</div>
              </div>
            ) : users.length === 0 ? ( // ユーザーが存在しない場合の表示
              <div className="text-center py-12 text-gray-500 text-lg">
                ユーザーが見つかりませんでした
              </div>
            ) : (
              // 各ユーザーを個別のCardで表示
              <div className="space-y-4">
                {users.map((user) => (
                  <Card
                    key={user.id}
                    className="bg-gray-50 hover:bg-gray-100 hover:border-primary transition-all"
                  >
                    <CardBody className="flex flex-row items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        {/* ユーザー情報 */}
                        <div className="flex-1">
                          {/* ユーザー名 */}
                          <Link
                            href={`/users/${user.id}`}
                            className="hover:text-blue-600 transition-colors"
                          >
                            <h3 className="font-medium text-lg text-gray-900 flex items-center gap-3">
                              {user.username}
                              {/* ロールバッジ */}
                              <span className={roleStyles[user.role]}>
                                {roleLabels[user.role]}
                              </span>
                            </h3>
                          </Link>

                          {/* フルネーム */}
                          <p className="text-sm text-gray-600 mt-2">
                            {getFullName(user)}
                          </p>

                          {/* 作成日時 */}
                          <p className="text-xs text-gray-400 mt-3">
                            作成: {new Date(user.createdAt).toLocaleString('ja-JP')}
                          </p>
                        </div>
                      </div>

                      {/* アクションボタン */}
                      <div className="flex items-center gap-3 ml-4">
                        {/* 詳細ボタン */}
                        <Button
                          as={Link}
                          href={`/users/${user.id}`}
                          color="primary"
                          size="sm"
                          className="font-medium"
                        >
                          詳細
                        </Button>

                        {/* ADMIN権限のユーザーのみ削除ボタンを表示 */}
                        {currentUserRole === 1 && user.id !== currentUserId && (
                          <Button
                            type="button"
                            onPress={() => openDeleteUser(user.id)}
                            color="danger"
                            size="sm"
                            className="font-medium"
                          >
                            削除
                          </Button>
                        )}
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            )}

            {/* ページネーションコントロールボタン */}
            {paginationInfo && paginationInfo.totalPages > 1 && (
              <CardFooter className="justify-between mt-8 pt-6 border-t border-gray-200">
                <Button
                  type="button"
                  onPress={() => setPage(page - 1)}
                  isDisabled={page === 1}
                  variant={page === 1 ? 'flat' : 'solid'}
                  className="px-6 py-2.5"
                >
                  前のページ
                </Button>

                <span className="text-sm text-gray-600 font-medium">
                  ページ {paginationInfo.currentPage} / {paginationInfo.totalPages}
                </span>

                <Button
                  type="button"
                  onPress={() => setPage(page + 1)}
                  isDisabled={page === paginationInfo.totalPages}
                  variant={page === paginationInfo.totalPages ? 'flat' : 'solid'}
                  className="px-6 py-2.5"
                >
                  次のページ
                </Button>
              </CardFooter>
            )}
          </CardBody>
        </Card>

        {/* 削除確認モーダルの追加 STEP3 ADD START */}
        <Modal isOpen={isOpen} onClose={onClose} isDismissable={false}>
          <ModalContent>
            <ModalHeader className="flex flex-col gap-1">削除確認</ModalHeader>
            <ModalBody>
              <p className="text-gray-700">このユーザーを削除してもよろしいですか？</p>
              <p className="text-sm text-gray-500 mt-2">
                この操作は取り消すことができません。
              </p>
            </ModalBody>
            <ModalFooter>
              <Button onPress={onClose}>キャンセル</Button>
              <Button color="danger" onPress={handleDeleteUser} isLoading={isLoading}>
                削除
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
        {/* STEP3 ADD END */}
      </main>
    </div>
  );
}

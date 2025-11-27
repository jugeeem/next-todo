/**
 * ユーザー関連の型定義をまとめたファイル。
 */

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
export interface User {
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
export interface Todo {
  id: string;
  title: string;
  descriptions: string | null;
  completed: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 権限情報とラベルの対応表
 *
 */
export const roleLabels: Record<number, string> = {
  1: 'ADMIN',
  2: 'MANAGER',
  3: 'USER',
  4: 'GUEST',
};

/**
 * ロール別のバッジスタイルを取得する関数。
 * ユーザー権限情報を元に、対応するバッジのスタイルクラスを返します。
 *
 * @param {number} role - ユーザー権限情報
 * @returns {string} - バッジのスタイルクラス
 */
export const getRoleStyle = (role: number): string => {
  const roleStyles: Record<number, string> = {
    1: 'px-2 py-1 text-xs font-semibold rounded bg-red-100 text-red-800',
    2: 'px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800',
    3: 'px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-800',
    4: 'px-2 py-1 text-xs font-semibold rounded bg-gray-100 text-gray-800',
  };
  return roleStyles[role] || roleStyles[4];
};

/**
 * フルネームを取得する関数。
 */
export const getFullName = (user: User): string => {
  if (user.firstName || user.lastName) {
    return `${user.lastName || ''} ${user.firstName || ''}`.trim();
  }
  return 'name is not set';
};

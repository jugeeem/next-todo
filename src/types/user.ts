/**
 * ユーザー情報を表すインターフェース
 *
 * @interface User
 * @property {string} id - ユーザーの一意な識別子
 * @property {string} username - ユーザー名
 * @property {string} [firstName] - ユーザーの名（任意）
 * @property {string} [lastName] - ユーザーの姓（任意）
 * @property {number} role - ユーザーの役割を示す数値（1: ADMIN, 2: MANAGER, 3: USER, 4: GUEST）
 * @property {string} createdAt - ユーザーアカウントの作成日時（ISO 8601形式の文字列）
 * @property {string} updatedAt - ユーザーアカウントの最終更新日時（ISO 8601形式の文字列）
 */
export interface User {
  id: string;
  username: string;
  firstName?: string;
  firstNameRuby?: string;
  lastName?: string;
  lastNameRuby?: string;
  role: number; // 1: ADMIN, 2: MANAGER, 3: USER, 4: GUEST
  createdAt: string;
  updatedAt: string;
}

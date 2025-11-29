/**
 * プロフィール関連の型定義
 */

/**
 * ユーザー情報のインターフェース。
 * ユーザーの基本的なプロフィール情報を表します。
 *
 * @interface User
 * @property {string} id - ユーザーの一意な識別子
 * @property {string} username - ユーザー名
 * @property {string | null} firstName - ユーザーの名
 * @property {string | null} lastName - ユーザーの姓
 * @property {number} role - ユーザーの役割を示す数値
 */
export interface User {
  id: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  role: number;
}

/**
 * Todo統計情報のインターフェース。
 * ユーザーのTodoに関する統計データを表します。
 *
 * @interface TodoStats
 * @property {number} totalTodos - 総Todo数
 * @property {number} completedTodos - 完了したTodo数
 * @property {number} pendingTodos - 未完了のTodo数
 * @property {number} completionRate - 完了率（パーセンテージ）
 */
export interface TodoStats {
  totalTodos: number;
  completedTodos: number;
  pendingTodos: number;
  completionRate: number;
}

/**
 * Todoアイテムのインターフェース。
 * ユーザーのTodoリストに含まれる各Todoアイテムの情報を表します。
 *
 * @interface Todo
 * @property {string} id - Todoの一意な識別子
 * @property {string} title - Todoのタイトル
 * @property {string | null} descriptions - Todoの詳細説明
 * @property {boolean} completed - Todoの完了状態
 * @property {string} createdAt - Todoの作成日時（ISO 8601形式の文字列）
 * @property {string} updatedAt - Todoの最終更新日時（ISO 8601形式の文字列）
 */
export interface Todo {
  id: string;
  title: string;
  descriptions: string | null;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

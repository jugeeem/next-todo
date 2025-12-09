/**
 * Todoアイテムの型定義
 *
 * @interface Todo
 * @property {string} id - Todoアイテムの一意な識別子
 * @property {string} title - Todoアイテムのタイトル
 * @property {string} [descriptions] - Todoアイテムの詳細説明（任意）
 * @property {boolean} completed - Todoアイテムの完了状態
 * @property {string} userId - Todoアイテムを作成したユーザーのID
 * @property {string} createdAt - Todoアイテムの作成日時（ISO 8601形式の文字列）
 * @property {string} updatedAt - Todoアイテムの最終更新日時（ISO 8601形式の文字列）
 */
export interface Todo {
  id: string;
  title: string;
  descriptions?: string;
  completed: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

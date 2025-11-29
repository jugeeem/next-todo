/**
 * Todo関連の型定義。
 * 他のコンポーネントやモジュールで使用される型をここにまとめています。
 *
 */

/**
 * Todoアイテムの型定義。
 *
 * @interface Todo Todoアイテムの情報を表すインターフェース
 * @property {number} id - Todoの一意な識別子
 * @property {string} title - Todoのタイトル
 * @property {string | null} descriptions - Todoの詳細説明（null可能）
 * @property {boolean} completed - Todoの完了状態
 * @property {number} userId - Todoを作成したユーザーのID
 * @property {string} createdAt - Todoの作成日時（ISO 8601形式の文字列）
 * @property {string} updatedAt - Todoの最終更新日時（ISO 8601形式の文字列）
 */
export interface Todo {
  id: number;
  title: string;
  descriptions: string | null;
  completed: boolean;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * ページネーション情報の型定義。
 *
 * @interface PaginationInfo ページネーションの情報を表すインターフェース
 *
 */
export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

/**
 * フィルター・ソートの型。
 *
 * @type CompletedFilter 完了状態のフィルタータイプ
 * @type SortBy ソート基準のタイプ
 * @type SortOrder ソート順序のタイプ
 */
export type CompletedFilter = 'all' | 'completed' | 'incomplete';
export type SortBy = 'createdAt' | 'updatedAt' | 'title';
export type SortOrder = 'asc' | 'desc';

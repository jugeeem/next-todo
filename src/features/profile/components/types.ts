/**
 * ユーザー型定義
 */
export interface User {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  role: number;
}

/**
 * Todo統計情報
 */
export interface TodoStats {
  totalTodos: number;
  completedTodos: number;
  pendingTodos: number;
  completionRate: number;
}

/**
 * Todo型定義（簡易版）
 */
export interface Todo {
  id: string;
  title: string;
  descriptions?: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

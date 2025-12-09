/**
 * Todo統計情報の型定義
 *
 */
export interface TodoStats {
  totalTodos: number; // 総Todo数
  completedTodos: number; // 完了済みTodo数
  pendingTodos: number; // 未完了Todo数
  completionRate: number; // 完了率（パーセンテージ）
}

/**
 * @fileoverview ユーザーTodo統計API
 *
 * このファイルは、ログインユーザーのTodo統計情報取得エンドポイントを提供します。
 * プロフィール画面でユーザーのTodo統計（総数、完了数、進行中数、完了率）を表示するために使用されます。
 *
 * @author jugeeem
 * @since 1.0.0
 */

import type { NextRequest } from 'next/server';
import { Container } from '@/lib/container';
import { internalError, success, unauthorized } from '@/lib/response';

/**
 * ログインユーザーのTodo統計情報取得エンドポイント
 *
 * ログインユーザーのTodo統計情報（総数、完了数、進行中数、完了率）を取得します。
 * プロフィール画面での統計表示に使用されます。
 *
 * @param request - Next.js のリクエストオブジェクト
 * @returns Todo統計情報または適切なエラーレスポンス
 *
 * @example
 * ```typescript
 * // Todo統計情報を取得
 * const response = await fetch('/api/users/me/todos/stats', {
 *   headers: {
 *     'Authorization': 'Bearer jwt-token'
 *   }
 * });
 *
 * // 成功レスポンス例
 * {
 *   "success": true,
 *   "message": "Request successful",
 *   "data": {
 *     "totalTodos": 10,
 *     "completedTodos": 6,
 *     "pendingTodos": 4,
 *     "completionRate": 60
 *   }
 * }
 * ```
 *
 * @throws {401} 認証エラー - JWTトークンが無効または期限切れの場合
 * @throws {500} サーバーエラー - 予期しないエラーが発生した場合
 */
export async function GET(request: NextRequest) {
  try {
    // ミドルウェアで認証済みのユーザー情報を取得
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return unauthorized('Authentication required');
    }

    const container = Container.getInstance();

    // ユーザーのTodo統計情報を取得
    const stats = await container.todoUseCase.getTodoStatsByUserId(userId);

    return success(stats);
  } catch (err) {
    console.error('Get user todo stats error:', err);
    return internalError();
  }
}

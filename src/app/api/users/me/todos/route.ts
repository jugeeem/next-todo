/**
 * @fileoverview ログインユーザーTodo管理API
 *
 * このファイルは、ログインユーザーのTodo一覧取得エンドポイントを提供します。
 * プロフィール画面でユーザー自身のTodo一覧を表示するために使用されます。
 *
 * @author jugeeem
 * @since 1.0.0
 */

import type { NextRequest } from 'next/server';
import { Container } from '@/lib/container';
import { internalError, success, unauthorized } from '@/lib/response';

/**
 * ログインユーザーのTodo一覧取得エンドポイント
 *
 * ログインユーザーが作成したTodo一覧を取得します。
 * プロフィール画面でのTodo表示に使用されます。
 *
 * @param request - Next.js のリクエストオブジェクト
 * @returns Todo一覧または適切なエラーレスポンス
 *
 * @example
 * ```typescript
 * // 自分のTodo一覧を取得
 * const response = await fetch('/api/users/me/todos', {
 *   headers: {
 *     'Authorization': 'Bearer jwt-token'
 *   }
 * });
 *
 * // 成功レスポンス例
 * {
 *   "success": true,
 *   "message": "Request successful",
 *   "data": [
 *     {
 *       "id": 1,
 *       "title": "Todo タイトル",
 *       "descriptions": "Todo 説明",
 *       "userId": "user-123",
 *       "createdAt": "2025-07-30T00:00:00.000Z",
 *       "updatedAt": "2025-07-30T00:00:00.000Z"
 *     }
 *   ]
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

    // ユーザーのTodo一覧を取得
    const todos = await container.todoUseCase.getTodosByUserId(userId);

    return success(todos);
  } catch (err) {
    console.error('Get user todos error:', err);
    return internalError();
  }
}

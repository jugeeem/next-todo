/**
 * @fileoverview ユーザー別Todo管理API
 *
 * このファイルは、特定ユーザーのTodo一覧取得エンドポイントを提供します。
 * ユーザー詳細画面でそのユーザーが作成したTodoの一覧を表示するために使用されます。
 *
 * @author jugeeem
 * @since 1.0.0
 */

import type { NextRequest } from 'next/server';
import { UserRole } from '@/domain/entities/User';
import { Container } from '@/lib/container';
import {
  forbidden,
  internalError,
  notFound,
  success,
  unauthorized,
} from '@/lib/response';

/**
 * 特定ユーザーのTodo一覧取得エンドポイント
 *
 * 指定されたユーザーIDに紐づくTodo一覧を取得します。
 * 管理者は全ユーザーのTodoにアクセス可能、一般ユーザーは自分のTodoのみアクセス可能です。
 *
 * @param request - Next.js のリクエストオブジェクト
 * @param params - ルートパラメータ（ユーザーID）
 * @returns Todo一覧または適切なエラーレスポンス
 *
 * @example
 * ```typescript
 * // 自分のTodo一覧を取得
 * const response = await fetch('/api/users/user-123/todos', {
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
 * @throws {403} 権限エラー - 他ユーザーのTodoにアクセスしようとした場合
 * @throws {404} ユーザー未存在エラー - 指定されたユーザーが存在しない場合
 * @throws {500} サーバーエラー - 予期しないエラーが発生した場合
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    // ミドルウェアで認証済みのユーザー情報を取得
    const currentUserId = request.headers.get('x-user-id');
    const currentUserRole = request.headers.get('x-user-role');

    if (!currentUserId || !currentUserRole) {
      return unauthorized('Authentication required');
    }

    // パラメータからユーザーIDを取得
    const { id: targetUserId } = await context.params;

    const container = Container.getInstance();

    // 権限チェック: 管理者または本人のみアクセス可能
    const isAdmin = Number(currentUserRole) === UserRole.ADMIN;
    const isOwner = currentUserId === targetUserId;

    if (!isAdmin && !isOwner) {
      return forbidden('Access denied');
    }

    // 対象ユーザーの存在確認
    try {
      await container.userUseCase.getUserById(targetUserId);
    } catch {
      return notFound('User not found');
    }

    // 対象ユーザーのTodo一覧を取得
    const todos = await container.todoUseCase.getTodosByUserId(targetUserId);

    return success(todos);
  } catch (err) {
    console.error('Get user todos error:', err);
    return internalError();
  }
}

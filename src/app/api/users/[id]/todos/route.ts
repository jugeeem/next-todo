/**
 * @fileoverview ユーザー別Todo管理API
 *
 * このファイルは、特定ユーザーのTodo一覧取得エンドポイントを提供します。
 * ユーザー詳細画面でそのユーザーが作成したTodoの一覧をページネーション形式で表示するために使用されます。
 *
 * @author jugeeem
 * @since 1.0.0
 */

import type { NextRequest } from 'next/server';
import { UserRole } from '@/domain/entities/User';
import { Container } from '@/lib/container';
import {
  error,
  forbidden,
  internalError,
  notFound,
  success,
  unauthorized,
} from '@/lib/response';
import { UserTodosPaginationSchema } from '@/lib/validation';

/**
 * 特定ユーザーのTodo一覧取得エンドポイント（ページネーション対応）
 *
 * 指定されたユーザーIDに紐づくTodo一覧をページネーション形式で取得します。
 * クエリパラメータで、ページ番号、件数、フィルター、ソート順を指定可能です。
 * 管理者は全ユーザーのTodoにアクセス可能、一般ユーザーは自分のTodoのみアクセス可能です。
 *
 * @param request - Next.js のリクエストオブジェクト
 * @param context - ルートパラメータ（ユーザーID）
 * @returns ページネーション対応のTodo一覧または適切なエラーレスポンス
 *
 * @example
 * ```typescript
 * // 基本的な使用例（デフォルト値: page=1, perPage=10）
 * const response = await fetch('/api/users/user-123/todos', {
 *   headers: {
 *     'Authorization': 'Bearer jwt-token'
 *   }
 * });
 *
 * // ページネーションパラメータ指定
 * const response = await fetch('/api/users/user-123/todos?page=2&perPage=20', {
 *   headers: {
 *     'Authorization': 'Bearer jwt-token'
 *   }
 * });
 *
 * // フィルター・ソート指定
 * const response = await fetch(
 *   '/api/users/user-123/todos?completedFilter=incomplete&sortBy=title&sortOrder=asc',
 *   {
 *     headers: {
 *       'Authorization': 'Bearer jwt-token'
 *     }
 *   }
 * );
 *
 * // 成功レスポンス例
 * {
 *   "success": true,
 *   "message": "Todos retrieved successfully",
 *   "data": {
 *     "data": [
 *       {
 *         "id": "todo-1",
 *         "title": "Todo タイトル",
 *         "descriptions": "Todo 説明",
 *         "userId": "user-123",
 *         "completed": false,
 *         "createdAt": "2025-07-30T00:00:00.000Z",
 *         "updatedAt": "2025-07-30T00:00:00.000Z"
 *       }
 *     ],
 *     "total": 50,
 *     "page": 1,
 *     "perPage": 10,
 *     "totalPages": 5
 *   }
 * }
 * ```
 *
 * @throws {400} バリデーションエラー - クエリパラメータが不正な場合
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

    // クエリパラメータを取得
    const { searchParams } = new URL(request.url);
    const queryParams = {
      page: searchParams.get('page'),
      perPage: searchParams.get('perPage'),
      completedFilter: searchParams.get('completedFilter'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder'),
    };

    // バリデーション
    const validationResult = UserTodosPaginationSchema.safeParse(queryParams);
    if (!validationResult.success) {
      return error('Validation failed', 400, validationResult.error.issues);
    }

    const { page, perPage, completedFilter, sortBy, sortOrder } = validationResult.data;

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

    // ページネーション対応でTodo一覧を取得
    const result = await container.todoUseCase.getTodosByUserIdWithOptions(
      targetUserId,
      {
        page,
        perPage,
        completedFilter,
        sortBy,
        sortOrder,
      },
    );

    return success(result, 'Todos retrieved successfully');
  } catch (err) {
    console.error('Error in GET /api/users/[id]/todos:', err);
    return internalError('Failed to retrieve todos');
  }
}

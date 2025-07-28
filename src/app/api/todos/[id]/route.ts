import type { NextRequest } from 'next/server';
import { Container } from '@/lib/container';
import {
  error,
  forbidden,
  internalError,
  notFound,
  success,
  unauthorized,
} from '@/lib/response';
import { updateTodoSchema } from '@/types/validation';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * TODO詳細取得API
 *
 * 指定されたIDのTODOアイテムの詳細を取得します。
 * 認証されたユーザーが所有するTODOのみアクセス可能です。
 *
 * @route GET /api/todos/{id}
 *
 * @param {string} id - TODO ID（URLパラメータ）
 *
 * @headers {string} Authorization - JWTトークン（例: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."）
 *
 * @returns {Object} レスポンス
 * @returns {boolean} success - 成功フラグ
 * @returns {string} message - レスポンスメッセージ
 * @returns {Object} data - TODOアイテム
 * @returns {number} data.id - TODO ID
 * @returns {string} data.title - TODOタイトル
 * @returns {string} [data.descriptions] - TODO説明
 * @returns {number} data.userId - ユーザーID
 * @returns {string} data.createdAt - 作成日時（ISO8601形式）
 * @returns {string} data.updatedAt - 更新日時（ISO8601形式）
 *
 * @example
 * // リクエスト例
 * GET /api/todos/1
 * Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *
 * // 成功レスポンス例 (200)
 * {
 *   "success": true,
 *   "message": "Request successful",
 *   "data": {
 *     "id": 1,
 *     "title": "買い物リスト作成",
 *     "descriptions": "今週の食材を買う",
 *     "userId": 1,
 *     "createdAt": "2025-07-24T10:00:00.000Z",
 *     "updatedAt": "2025-07-24T10:00:00.000Z"
 *   }
 * }
 *
 * // 認証エラー例 (401)
 * {
 *   "success": false,
 *   "message": "Unauthorized"
 * }
 *
 * // アクセス拒否例 (403)
 * {
 *   "success": false,
 *   "message": "Access denied"
 * }
 *
 * // 存在しないTODO例 (404)
 * {
 *   "success": false,
 *   "message": "Todo not found"
 * }
 *
 * @throws {401} 認証エラー - JWTトークンが無効または期限切れの場合
 * @throws {403} アクセス拒否 - 他のユーザーのTODOにアクセスしようとした場合
 * @throws {404} 見つからない - 指定されたIDのTODOが存在しない場合
 * @throws {500} サーバーエラー - 予期しないエラーが発生した場合
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // ミドルウェアで認証済みのユーザー情報を取得
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return unauthorized('Authentication required');
    }

    const container = Container.getInstance();
    const todo = await container.todoUseCase.getTodoById(id);

    if (!todo) {
      return notFound('Todo not found');
    }

    if (todo.userId !== userId) {
      return forbidden('Access denied');
    }

    return success(todo);
  } catch (err) {
    console.error('Get todo error:', err);

    return internalError();
  }
}

/**
 * TODO更新API
 *
 * 指定されたIDのTODOアイテムを更新します。
 * 認証されたユーザーが所有するTODOのみ更新可能です。
 * リクエストボディに含まれたフィールドのみが更新されます（部分更新）。
 *
 * @route PUT /api/todos/{id}
 *
 * @param {string} id - TODO ID（URLパラメータ）
 *
 * @headers {string} Authorization - JWTトークン（例: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."）
 *
 * @body {Object} request - リクエストボディ
 * @body {string} [request.title] - TODOタイトル（任意、1〜32文字）
 * @body {string} [request.descriptions] - TODO説明（任意、128文字以下）
 *
 * @returns {Object} レスポンス
 * @returns {boolean} success - 成功フラグ
 * @returns {string} message - レスポンスメッセージ
 * @returns {Object} data - 更新されたTODOアイテム
 * @returns {number} data.id - TODO ID
 * @returns {string} data.title - TODOタイトル
 * @returns {string} [data.descriptions] - TODO説明
 * @returns {number} data.userId - ユーザーID
 * @returns {string} data.createdAt - 作成日時（ISO8601形式）
 * @returns {string} data.updatedAt - 更新日時（ISO8601形式）
 *
 * @example
 * // リクエスト例（タイトルのみ更新）
 * PUT /api/todos/1
 * Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 * Content-Type: application/json
 *
 * {
 *   "title": "更新されたタイトル"
 * }
 *
 * // リクエスト例（両方の項目を更新）
 * PUT /api/todos/1
 * Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 * Content-Type: application/json
 *
 * {
 *   "title": "完了済み：買い物リスト作成",
 *   "descriptions": "食材購入完了、冷蔵庫に保管済み"
 * }
 *
 * // 成功レスポンス例 (200)
 * {
 *   "success": true,
 *   "message": "Todo updated successfully",
 *   "data": {
 *     "id": 1,
 *     "title": "完了済み：買い物リスト作成",
 *     "descriptions": "食材購入完了、冷蔵庫に保管済み",
 *     "userId": 1,
 *     "createdAt": "2025-07-24T10:00:00.000Z",
 *     "updatedAt": "2025-07-24T15:30:00.000Z"
 *   }
 * }
 *
 * // バリデーションエラー例 (400)
 * {
 *   "success": false,
 *   "message": "Invalid input: Title must be less than 32 characters"
 * }
 *
 * // 認証エラー例 (401)
 * {
 *   "success": false,
 *   "message": "Unauthorized"
 * }
 *
 * // アクセス拒否例 (403)
 * {
 *   "success": false,
 *   "message": "Access denied"
 * }
 *
 * // 存在しないTODO例 (404)
 * {
 *   "success": false,
 *   "message": "Todo not found"
 * }
 *
 * @throws {400} バリデーションエラー - リクエストボディの形式が不正な場合
 * @throws {401} 認証エラー - JWTトークンが無効または期限切れの場合
 * @throws {403} アクセス拒否 - 他のユーザーのTODOを更新しようとした場合
 * @throws {404} 見つからない - 指定されたIDのTODOが存在しない場合
 * @throws {500} サーバーエラー - 予期しないエラーが発生した場合
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // ミドルウェアで認証済みのユーザー情報を取得
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return unauthorized('Authentication required');
    }

    const body = await request.json();
    const validationResult = updateTodoSchema.safeParse(body);
    if (!validationResult.success) {
      return error(
        'Invalid input: ' +
          validationResult.error.issues.map((issue) => issue.message).join(', '),
      );
    }

    const container = Container.getInstance();

    const existingTodo = await container.todoUseCase.getTodoById(id);
    if (!existingTodo) {
      return notFound('Todo not found');
    }

    if (existingTodo.userId !== userId) {
      return forbidden('Access denied');
    }

    const todo = await container.todoUseCase.updateTodo(id, validationResult.data);

    if (!todo) {
      return notFound('Todo not found');
    }

    return success(todo, 'Todo updated successfully');
  } catch (err) {
    console.error('Update todo error:', err);
    if (err instanceof Error) {
      return error(err.message);
    }

    return internalError();
  }
}

/**
 * TODO削除API
 *
 * 指定されたIDのTODOアイテムを削除します。
 * 認証されたユーザーが所有するTODOのみ削除可能です。
 * 削除は物理削除で、一度削除されたTODOは復元できません。
 *
 * @route DELETE /api/todos/{id}
 *
 * @param {string} id - TODO ID（URLパラメータ）
 *
 * @headers {string} Authorization - JWTトークン（例: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."）
 *
 * @returns {Object} レスポンス
 * @returns {boolean} success - 成功フラグ
 * @returns {string} message - レスポンスメッセージ
 * @returns {null} data - データはnull（削除操作のため）
 *
 * @example
 * // リクエスト例
 * DELETE /api/todos/1
 * Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *
 * // 成功レスポンス例 (200)
 * {
 *   "success": true,
 *   "message": "Todo deleted successfully",
 *   "data": null
 * }
 *
 * // 認証エラー例 (401)
 * {
 *   "success": false,
 *   "message": "Unauthorized"
 * }
 *
 * // アクセス拒否例 (403)
 * {
 *   "success": false,
 *   "message": "Access denied"
 * }
 *
 * // 存在しないTODO例 (404)
 * {
 *   "success": false,
 *   "message": "Todo not found"
 * }
 *
 * @throws {401} 認証エラー - JWTトークンが無効または期限切れの場合
 * @throws {403} アクセス拒否 - 他のユーザーのTODOを削除しようとした場合
 * @throws {404} 見つからない - 指定されたIDのTODOが存在しない場合
 * @throws {500} サーバーエラー - 予期しないエラーが発生した場合
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // ミドルウェアで認証済みのユーザー情報を取得
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return unauthorized('Authentication required');
    }

    const container = Container.getInstance();

    const existingTodo = await container.todoUseCase.getTodoById(id);
    if (!existingTodo) {
      return notFound('Todo not found');
    }

    if (existingTodo.userId !== userId) {
      return forbidden('Access denied');
    }

    const deleteSuccess = await container.todoUseCase.deleteTodo(id);

    if (!deleteSuccess) {
      return notFound('Todo not found');
    }

    return success(null, 'Todo deleted successfully');
  } catch (err) {
    console.error('Delete todo error:', err);

    return internalError();
  }
}

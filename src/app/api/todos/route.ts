import type { NextRequest } from 'next/server';
import { Container } from '@/lib/container';
import { error, internalError, success, unauthorized } from '@/lib/response';
import { createTodoSchema } from '@/types/validation';

/**
 * ユーザーのTODOリスト取得API
 *
 * 認証されたユーザーが所有するすべてのTODOアイテムを取得します。
 * 認証はJWTトークンを使用して行われます。
 *
 * @route GET /api/todos
 *
 * @headers {string} Authorization - JWTトークン（例: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."）
 *
 * @returns {Object} レスポンス
 * @returns {boolean} success - 成功フラグ
 * @returns {string} message - レスポンスメッセージ
 * @returns {Array} data - TODOアイテムの配列
 * @returns {number} data[].id - TODO ID
 * @returns {string} data[].title - TODOタイトル
 * @returns {string} [data[].descriptions] - TODO説明（任意）
 * @returns {number} data[].userId - ユーザーID
 * @returns {string} data[].createdAt - 作成日時（ISO8601形式）
 * @returns {string} data[].updatedAt - 更新日時（ISO8601形式）
 *
 * @example
 * // リクエスト例
 * GET /api/todos
 * Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *
 * // 成功レスポンス例 (200)
 * {
 *   "success": true,
 *   "message": "Request successful",
 *   "data": [
 *     {
 *       "id": 1,
 *       "title": "買い物リスト作成",
 *       "descriptions": "今週の食材を買う",
 *       "userId": 1,
 *       "createdAt": "2025-07-24T10:00:00.000Z",
 *       "updatedAt": "2025-07-24T10:00:00.000Z"
 *     },
 *     {
 *       "id": 2,
 *       "title": "プロジェクト資料作成",
 *       "descriptions": null,
 *       "userId": 1,
 *       "createdAt": "2025-07-24T11:00:00.000Z",
 *       "updatedAt": "2025-07-24T11:00:00.000Z"
 *     }
 *   ]
 * }
 *
 * // 認証エラー例 (401)
 * {
 *   "success": false,
 *   "message": "Unauthorized"
 * }
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
    const todos = await container.todoUseCase.getTodosByUserId(userId);

    return success(todos);
  } catch (err) {
    console.error('Get todos error:', err);

    return internalError();
  }
}

/**
 * TODO作成API
 *
 * 認証されたユーザーの新しいTODOアイテムを作成します。
 * 作成されたTODOは自動的に認証ユーザーに関連付けられます。
 *
 * @route POST /api/todos
 *
 * @headers {string} Authorization - JWTトークン（例: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."）
 *
 * @body {Object} request - リクエストボディ
 * @body {string} request.title - TODOタイトル（必須、1〜32文字）
 * @body {string} [request.descriptions] - TODO説明（任意、128文字以下）
 *
 * @returns {Object} レスポンス
 * @returns {boolean} success - 成功フラグ
 * @returns {string} message - レスポンスメッセージ
 * @returns {Object} data - 作成されたTODOアイテム
 * @returns {number} data.id - TODO ID
 * @returns {string} data.title - TODOタイトル
 * @returns {string} [data.descriptions] - TODO説明
 * @returns {number} data.userId - ユーザーID
 * @returns {string} data.createdAt - 作成日時（ISO8601形式）
 * @returns {string} data.updatedAt - 更新日時（ISO8601形式）
 *
 * @example
 * // リクエスト例（最小構成）
 * POST /api/todos
 * Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 * Content-Type: application/json
 *
 * {
 *   "title": "新しいタスク"
 * }
 *
 * // リクエスト例（全項目）
 * POST /api/todos
 * Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 * Content-Type: application/json
 *
 * {
 *   "title": "プレゼンテーション準備",
 *   "descriptions": "来週の会議用のスライドを作成する"
 * }
 *
 * // 成功レスポンス例 (200)
 * {
 *   "success": true,
 *   "message": "Todo created successfully",
 *   "data": {
 *     "id": 3,
 *     "title": "プレゼンテーション準備",
 *     "descriptions": "来週の会議用のスライドを作成する",
 *     "userId": 1,
 *     "createdAt": "2025-07-24T12:00:00.000Z",
 *     "updatedAt": "2025-07-24T12:00:00.000Z"
 *   }
 * }
 *
 * // バリデーションエラー例 (400)
 * {
 *   "success": false,
 *   "message": "Invalid input: Title is required"
 * }
 *
 * // 認証エラー例 (401)
 * {
 *   "success": false,
 *   "message": "Unauthorized"
 * }
 *
 * @throws {400} バリデーションエラー - リクエストボディの形式が不正な場合
 * @throws {401} 認証エラー - JWTトークンが無効または期限切れの場合
 * @throws {500} サーバーエラー - 予期しないエラーが発生した場合
 */
export async function POST(request: NextRequest) {
  try {
    // ミドルウェアで認証済みのユーザー情報を取得
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return unauthorized('Authentication required');
    }

    const body = await request.json();

    const validationResult = createTodoSchema.safeParse(body);
    if (!validationResult.success) {
      return error(
        'Invalid input: ' +
          validationResult.error.issues.map((issue) => issue.message).join(', '),
      );
    }

    const container = Container.getInstance();
    const todoInput = {
      ...validationResult.data,
      userId: userId,
    };

    const todo = await container.todoUseCase.createTodo(todoInput);

    return success(todo, 'Todo created successfully');
  } catch (err) {
    console.error('Create todo error:', err);
    if (err instanceof Error) {
      return error(err.message);
    }

    return internalError();
  }
}

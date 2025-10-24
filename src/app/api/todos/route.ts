import type { NextRequest } from 'next/server';
import { Container } from '@/lib/container';
import { error, internalError, success, unauthorized } from '@/lib/response';
import { createTodoSchema } from '@/types/validation';

/**
 * ユーザーのTODOリスト取得API
 *
 * 認証されたユーザーが所有するTODOアイテムを取得します。
 * ページネーション、フィルタリング、ソート機能をサポートします。
 *
 * @route GET /api/todos
 *
 * @headers {string} Authorization - JWTトークン（例: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."）
 *
 * @query {number} [page=1] - ページ番号（1以上）
 * @query {number} [perPage=20] - 1ページあたりの件数（1〜100）
 * @query {string} [completedFilter=all] - 完了状態フィルター（all: 全件、completed: 完了済みのみ、incomplete: 未完了のみ）
 * @query {string} [sortBy=createdAt] - ソート基準（createdAt, updatedAt, title）
 * @query {string} [sortOrder=asc] - ソート順序（asc: 昇順、desc: 降順）
 *
 * @returns {Object} レスポンス
 * @returns {boolean} success - 成功フラグ
 * @returns {string} message - レスポンスメッセージ
 * @returns {Object} data - レスポンスデータ
 * @returns {Array} data.data - TODOアイテムの配列
 * @returns {number} data.data[].id - TODO ID
 * @returns {string} data.data[].title - TODOタイトル
 * @returns {string} [data.data[].descriptions] - TODO説明（任意）
 * @returns {boolean} data.data[].completed - 完了状態
 * @returns {number} data.data[].userId - ユーザーID
 * @returns {string} data.data[].createdAt - 作成日時（ISO8601形式）
 * @returns {string} data.data[].updatedAt - 更新日時（ISO8601形式）
 * @returns {number} data.total - 総件数
 * @returns {number} data.page - 現在のページ番号
 * @returns {number} data.perPage - 1ページあたりの件数
 * @returns {number} data.totalPages - 総ページ数
 *
 * @example
 * // リクエスト例（デフォルト）
 * GET /api/todos
 * Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *
 * // リクエスト例（ページネーション）
 * GET /api/todos?page=2&perPage=10
 * Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *
 * // リクエスト例（未完了のみ取得）
 * GET /api/todos?completedFilter=incomplete
 * Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *
 * // リクエスト例（完了済みのみ取得）
 * GET /api/todos?completedFilter=completed
 * Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *
 * // リクエスト例（作成日時の降順ソート）
 * GET /api/todos?sortBy=createdAt&sortOrder=desc
 * Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *
 * // 成功レスポンス例 (200)
 * {
 *   "success": true,
 *   "message": "Request successful",
 *   "data": {
 *     "data": [
 *       {
 *         "id": 1,
 *         "title": "買い物リスト作成",
 *         "descriptions": "今週の食材を買う",
 *         "completed": false,
 *         "userId": 1,
 *         "createdAt": "2025-07-24T10:00:00.000Z",
 *         "updatedAt": "2025-07-24T10:00:00.000Z"
 *       },
 *       {
 *         "id": 2,
 *         "title": "プロジェクト資料作成",
 *         "descriptions": null,
 *         "completed": true,
 *         "userId": 1,
 *         "createdAt": "2025-07-24T11:00:00.000Z",
 *         "updatedAt": "2025-07-24T11:00:00.000Z"
 *       }
 *     ],
 *     "total": 50,
 *     "page": 1,
 *     "perPage": 20,
 *     "totalPages": 3
 *   }
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

    // クエリパラメータの取得
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const perPage = Math.max(
      1,
      Math.min(100, parseInt(searchParams.get('perPage') ?? '20', 10)),
    );
    const completedFilter = searchParams.get('completedFilter') ?? 'all';
    const sortBy = searchParams.get('sortBy') ?? 'createdAt';
    const sortOrder = searchParams.get('sortOrder') ?? 'asc';

    // 完了状態フィルタのバリデーション
    const validCompletedFilter =
      completedFilter === 'completed' || completedFilter === 'incomplete'
        ? completedFilter
        : 'all';

    // ソート基準のバリデーション
    const validSortBy =
      sortBy === 'createdAt' || sortBy === 'updatedAt' || sortBy === 'title'
        ? sortBy
        : 'createdAt';

    // ソート順序のバリデーション
    const validSortOrder = sortOrder === 'desc' ? 'desc' : 'asc';

    const container = Container.getInstance();
    const result = await container.todoUseCase.getTodosByUserIdWithOptions(userId, {
      page,
      perPage,
      completedFilter: validCompletedFilter,
      sortBy: validSortBy,
      sortOrder: validSortOrder,
    });

    return success(result);
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

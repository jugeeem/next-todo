/**
 * @fileoverview API レスポンスヘルパー
 *
 * このファイルは、Next.js API ルートで使用される統一されたレスポンス形式を提供します。
 * 一貫性のあるAPI レスポンス構造とHTTP ステータスコードの管理を行います。
 *
 * 主な機能:
 * - 成功レスポンスの生成
 * - エラーレスポンスの生成（400, 401, 403, 404, 500）
 * - 型安全なレスポンス構造
 * - 統一されたAPI インターフェース
 *
 * レスポンス形式:
 * ```typescript
 * // 成功時
 * {
 *   success: true,
 *   data: T,
 *   message?: string
 * }
 *
 * // エラー時
 * {
 *   success: false,
 *   error: string
 * }
 * ```
 *
 * @author jugeeem
 * @since 1.0.0
 */

import { NextResponse } from 'next/server';
import type { ApiResponse } from '@/types/api';

/**
 * 成功レスポンス生成
 *
 * API 処理が成功した場合のレスポンスを生成します。
 * データとオプションのメッセージを含む統一された形式を提供します。
 *
 * @template T - レスポンスデータの型
 * @param {T} data - レスポンスに含めるデータ
 * @param {string} [message] - 追加メッセージ（任意）
 * @returns {NextResponse<ApiResponse<T>>} 成功レスポンス（200 OK）
 *
 * @example
 * ```typescript
 * // 基本的な使用例
 * export async function GET() {
 *   const users = await getUserList();
 *   return success(users, "ユーザー一覧取得成功");
 * }
 *
 * // データ型を指定した使用例
 * interface UserData {
 *   id: string;
 *   name: string;
 * }
 *
 * export async function POST(request: NextRequest) {
 *   const userData: UserData = await createUser(request);
 *   return success<UserData>(userData, "ユーザー作成完了");
 * }
 *
 * // レスポンス例
 * // {
 * //   "success": true,
 * //   "data": { "id": "123", "name": "John" },
 * //   "message": "ユーザー作成完了"
 * // }
 * ```
 */
export function success<T>(data: T, message?: string): NextResponse<ApiResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
    message,
  });
}

/**
 * エラーレスポンス生成
 *
 * クライアントエラー（4xx）やサーバーエラー（5xx）のレスポンスを生成します。
 * デフォルトは400 Bad Request ですが、適切なステータスコードを指定できます。
 *
 * @param {string} error - エラーメッセージ
 * @param {number} [status=400] - HTTP ステータスコード（デフォルト: 400）
 * @returns {NextResponse<ApiResponse>} エラーレスポンス
 *
 * @example
 * ```typescript
 * // 基本的な使用例（400 Bad Request）
 * export async function POST(request: NextRequest) {
 *   const { title } = await request.json();
 *
 *   if (!title) {
 *     return error("タイトルは必須です");
 *   }
 *
 *   // 処理続行...
 * }
 *
 * // カスタムステータスコード
 * export async function DELETE(request: NextRequest) {
 *   const result = await deleteResource(id);
 *
 *   if (result.hasConflict) {
 *     return error("リソースが他の場所で使用されています", 409);
 *   }
 * }
 *
 * // レスポンス例
 * // {
 * //   "success": false,
 * //   "error": "タイトルは必須です"
 * // }
 * ```
 */
export function error(error: string, status = 400): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
    },
    { status },
  );
}

/**
 * 認証エラーレスポンス生成
 *
 * 認証が必要なリソースへの未認証アクセス時のレスポンスを生成します。
 * HTTP 401 Unauthorized ステータスコードを返します。
 *
 * @param {string} [error="Unauthorized"] - エラーメッセージ（デフォルト: "Unauthorized"）
 * @returns {NextResponse<ApiResponse>} 認証エラーレスポンス（401 Unauthorized）
 *
 * @example
 * ```typescript
 * // 基本的な使用例
 * export async function GET(request: NextRequest) {
 *   const token = request.headers.get('authorization');
 *
 *   if (!token) {
 *     return unauthorized("認証トークンが必要です");
 *   }
 *
 *   const user = verifyToken(token);
 *   if (!user) {
 *     return unauthorized("無効な認証トークンです");
 *   }
 *
 *   // 認証成功時の処理...
 * }
 *
 * // ミドルウェアでの使用
 * export function middleware(request: NextRequest) {
 *   const authResult = authenticateRequest(request);
 *
 *   if (!authResult.success) {
 *     return unauthorized();
 *   }
 *
 *   return NextResponse.next();
 * }
 *
 * // レスポンス例
 * // {
 * //   "success": false,
 * //   "error": "認証トークンが必要です"
 * // }
 * ```
 */
export function unauthorized(error = 'Unauthorized'): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
    },
    { status: 401 },
  );
}

/**
 * アクセス拒否レスポンス生成
 *
 * 認証済みユーザーが権限不足でアクセスできないリソースへのアクセス時のレスポンスを生成します。
 * HTTP 403 Forbidden ステータスコードを返します。
 *
 * @param {string} [error="Forbidden"] - エラーメッセージ（デフォルト: "Forbidden"）
 * @returns {NextResponse<ApiResponse>} アクセス拒否レスポンス（403 Forbidden）
 *
 * @example
 * ```typescript
 * // 管理者権限が必要な操作
 * export async function DELETE(request: NextRequest) {
 *   const user = await getCurrentUser(request);
 *
 *   if (user.role !== 'admin') {
 *     return forbidden("管理者権限が必要です");
 *   }
 *
 *   // 管理者のみ実行可能な処理...
 * }
 *
 * // リソース所有者チェック
 * export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
 *   const user = await getCurrentUser(request);
 *   const resource = await getResource(params.id);
 *
 *   if (resource.ownerId !== user.id) {
 *     return forbidden("このリソースを編集する権限がありません");
 *   }
 *
 *   // リソース更新処理...
 * }
 *
 * // レスポンス例
 * // {
 * //   "success": false,
 * //   "error": "管理者権限が必要です"
 * // }
 * ```
 */
export function forbidden(error = 'Forbidden'): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
    },
    { status: 403 },
  );
}

/**
 * リソース未発見レスポンス生成
 *
 * 要求されたリソースが存在しない場合のレスポンスを生成します。
 * HTTP 404 Not Found ステータスコードを返します。
 *
 * @param {string} [error="Not found"] - エラーメッセージ（デフォルト: "Not found"）
 * @returns {NextResponse<ApiResponse>} リソース未発見レスポンス（404 Not Found）
 *
 * @example
 * ```typescript
 * // 個別リソース取得API
 * export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
 *   const todo = await getTodoById(params.id);
 *
 *   if (!todo) {
 *     return notFound("指定されたタスクは見つかりません");
 *   }
 *
 *   return success(todo);
 * }
 *
 * // ユーザー別リソース取得
 * export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
 *   const user = await getUserById(params.userId);
 *
 *   if (!user) {
 *     return notFound("ユーザーが見つかりません");
 *   }
 *
 *   const userTodos = await getTodosByUserId(params.userId);
 *   return success(userTodos);
 * }
 *
 * // レスポンス例
 * // {
 * //   "success": false,
 * //   "error": "指定されたタスクは見つかりません"
 * // }
 * ```
 */
export function notFound(error = 'Not found'): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
    },
    { status: 404 },
  );
}

/**
 * サーバー内部エラーレスポンス生成
 *
 * サーバー側で予期しないエラーが発生した場合のレスポンスを生成します。
 * HTTP 500 Internal Server Error ステータスコードを返します。
 *
 * @param {string} [error="Internal server error"] - エラーメッセージ（デフォルト: "Internal server error"）
 * @returns {NextResponse<ApiResponse>} サーバー内部エラーレスポンス（500 Internal Server Error）
 *
 * @example
 * ```typescript
 * // データベース接続エラー
 * export async function GET() {
 *   try {
 *     const data = await databaseQuery();
 *     return success(data);
 *   } catch (error) {
 *     console.error('Database error:', error);
 *     return internalError("データベース接続エラーが発生しました");
 *   }
 * }
 *
 * // 外部API呼び出しエラー
 * export async function POST(request: NextRequest) {
 *   try {
 *     const result = await callExternalAPI(data);
 *     return success(result);
 *   } catch (error) {
 *     console.error('External API error:', error);
 *     return internalError("外部サービスとの通信に失敗しました");
 *   }
 * }
 *
 * // 予期しないエラー
 * export async function PUT(request: NextRequest) {
 *   try {
 *     // 何らかの処理...
 *   } catch (error) {
 *     console.error('Unexpected error:', error);
 *     return internalError(); // デフォルトメッセージを使用
 *   }
 * }
 *
 * // レスポンス例
 * // {
 * //   "success": false,
 * //   "error": "データベース接続エラーが発生しました"
 * // }
 * ```
 */
export function internalError(
  error = 'Internal server error',
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
    },
    { status: 500 },
  );
}

/**
 * レガシーサポート用 ResponseHelper オブジェクト
 *
 * 従来のインポート方式との後方互換性を維持するためのヘルパーオブジェクトです。
 * 既存のコードが `ResponseHelper.success()` 形式でアクセスできるように提供されています。
 * 新しいコードでは名前付きインポートの使用を推奨します。
 *
 * @deprecated 新しいコードでは名前付きインポート（success, error等）を使用してください
 *
 * @example
 * ```typescript
 * // レガシー方式（非推奨）
 * import { ResponseHelper } from '@/lib/response';
 * export async function GET() {
 *   return ResponseHelper.success(data);
 * }
 *
 * // 推奨方式
 * import { success, error } from '@/lib/response';
 * export async function GET() {
 *   return success(data);
 * }
 * ```
 */
// レガシーサポートのためのResponseHelperオブジェクト
export const ResponseHelper = {
  success,
  error,
  unauthorized,
  forbidden,
  notFound,
  internalError,
};

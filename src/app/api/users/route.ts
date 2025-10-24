/**
 * @fileoverview ユーザー管理API - 一覧取得・新規作成エンドポイント
 *
 * このファイルは、ユーザーに関する基本的なCRUD操作のうち、
 * 一覧取得（GET）と新規作成（POST）を処理します。
 * 管理者権限での全ユーザー取得と、新規ユーザー登録機能を提供します。
 *
 * @author jugeeem
 * @since 1.0.0
 */

import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { UserRole } from '@/domain/entities/User';
import { Container } from '@/lib/container';
import { error, forbidden, internalError, success, unauthorized } from '@/lib/response';
import { createUserSchema, getUsersQuerySchema } from '@/types/validation';

/**
 * @typedef {Object} Pagination
 * @property {number} currentPage 現在のページ番号（1始まり）
 * @property {number} totalPages 総ページ数
 * @property {number} totalUsers 総ユーザー数
 * @property {number} perPage 1ページあたり件数
 */

/**
 * @typedef {Object} UsersListResponse
 * @property {Array<unknown>} data ユーザー配列（機微情報は含まない）
 * @property {Pagination} pagination ページネーション情報
 */

/**
 * @summary ユーザー一覧取得
 * @description
 * 管理者（ADMIN=1）またはマネージャー（MANAGER=2）のみが全ユーザー一覧を取得できます。
 * 削除ステータスのフィルタリング、複数フィールドでの検索、ソート機能をサポートします。
 *
 * 認証ヘッダー:
 * - `x-user-id`
 * - `x-user-role`
 *
 * クエリパラメータ:
 * - `page`            : number >= 1（省略時 1）
 * - `perPage`         : number 1..100（省略時 20）
 * - `id`              : string（部分一致）
 * - `username`        : string（部分一致）
 * - `firstName`       : string（部分一致）
 * - `firstNameRuby`   : string（部分一致）
 * - `lastName`        : string（部分一致）
 * - `lastNameRuby`    : string（部分一致）
 * - `role`            : number
 * - `sortBy`          : 'id' | 'username' | 'first_name' | 'first_name_ruby' | 'last_name' | 'last_name_ruby' | 'role' | 'created_at'（省略時 'created_at'）
 * - `sortOrder`       : 'asc' | 'desc'（省略時 'asc'）
 *
 * 成功時: 200 OK / application/json
 * - 形式: `ApiResponse<UsersListResponse>`
 * - メッセージ: "ユーザー一覧を取得しました"
 *
 * エラー時:
 * - 400 Bad Request: クエリパラメータのバリデーションエラー
 * - 401 Unauthorized: 認証ヘッダー不足/不正（Authentication required）
 * - 403 Forbidden   : 許可ロール以外（管理者権限が必要です）
 * - 500 Internal Server Error: 予期せぬエラー（ユーザー一覧の取得に失敗しました）
 *
 * @param {import('next/server').NextRequest} request Next.js のリクエスト
 * @returns {Promise<Response>} ApiResponse<UsersListResponse> を含むJSONレスポンス
 *
 * @example <caption>cURL - ページネーション指定</caption>
 * curl -sS -X GET \
 *   "http://localhost:3000/api/users?page=1&perPage=20" \
 *   -H "x-user-id: admin-123" \
 *   -H "x-user-role: 1"
 *
 * @example <caption>cURL - ユーザー名で検索してソート</caption>
 * curl -sS -X GET \
 *   "http://localhost:3000/api/users?username=john&sortBy=username&sortOrder=asc" \
 *   -H "x-user-id: admin-123" \
 *   -H "x-user-role: 1"
 *
 * @example <caption>TypeScript (fetch)</caption>
 * const res = await fetch('/api/users?sortBy=first_name&sortOrder=asc', {
 *   headers: { 'x-user-id': 'admin-123', 'x-user-role': '1' },
 * });
 * const json = await res.json();
 *
 * @throws {Error} 400 Bad Request - バリデーションエラー
 * @throws {Error} 401 Unauthorized - Authentication required
 * @throws {Error} 403 Forbidden - 管理者権限が必要です
 * @throws {Error} 500 Internal Server Error - ユーザー一覧の取得に失敗しました
 */
export async function GET(request: NextRequest): Promise<Response> {
  try {
    // ミドルウェアで認証済みのユーザー情報を取得
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');

    if (!userId || !userRole) {
      return unauthorized('Authentication required');
    }

    // 管理者権限チェック（ADMIN=1 または MANAGER=2）
    const role = parseInt(userRole, 10);
    if (role > UserRole.MANAGER) {
      return forbidden('管理者権限が必要です');
    }

    // クエリパラメータの取得とバリデーション
    const url = new URL(request.url);
    const queryParams = {
      page: url.searchParams.get('page'),
      perPage: url.searchParams.get('perPage'),
      id: url.searchParams.get('id'),
      username: url.searchParams.get('username'),
      firstName: url.searchParams.get('firstName'),
      firstNameRuby: url.searchParams.get('firstNameRuby'),
      lastName: url.searchParams.get('lastName'),
      lastNameRuby: url.searchParams.get('lastNameRuby'),
      role: url.searchParams.get('role'),
      sortBy: url.searchParams.get('sortBy'),
      sortOrder: url.searchParams.get('sortOrder'),
    };

    const validatedQuery = getUsersQuerySchema.parse(queryParams);

    const container = Container.getInstance();

    // フィルタ条件の構築（削除済みユーザーは除外）
    const filters = {
      id: validatedQuery.id,
      username: validatedQuery.username,
      firstName: validatedQuery.firstName,
      firstNameRuby: validatedQuery.firstNameRuby,
      lastName: validatedQuery.lastName,
      lastNameRuby: validatedQuery.lastNameRuby,
      role: validatedQuery.role,
    };

    // ソート条件の構築
    const sortOptions = {
      sortBy: validatedQuery.sortBy,
      sortOrder: validatedQuery.sortOrder,
    };

    // フィルタリング・ソートされたユーザーを取得
    const allUsers = await container.userUseCase.getUsersWithFilters(
      filters,
      sortOptions,
    );

    // ページネーション計算
    const totalUsers = allUsers.length;
    const totalPages = Math.ceil(totalUsers / validatedQuery.perPage);
    const startIndex = (validatedQuery.page - 1) * validatedQuery.perPage;
    const endIndex = startIndex + validatedQuery.perPage;
    const users = allUsers.slice(startIndex, endIndex);

    // ページネーション情報を含むレスポンス
    const responseData = {
      data: users,
      pagination: {
        currentPage: validatedQuery.page,
        totalPages,
        totalUsers,
        perPage: validatedQuery.perPage,
      },
    };

    return success(responseData, 'ユーザー一覧を取得しました');
  } catch (err) {
    console.error('ユーザー一覧取得エラー:', err);

    if (err instanceof z.ZodError) {
      return error('クエリパラメータが正しくありません', 400);
    }

    return internalError('ユーザー一覧の取得に失敗しました');
  }
}

/**
 * 新規ユーザー作成エンドポイント
 *
 * 新しいユーザーアカウントを作成します。
 * 管理者権限が必要で、ユーザー名の重複チェックを行います。
 *
 * @param request - Next.js のリクエストオブジェクト
 * @returns 作成されたユーザー情報または適切なエラーレスポンス
 *
 * @example
 * ```typescript
 * // 管理者による新規ユーザー作成
 * const userData = {
 *   username: "new_employee",
 *   firstName: "太郎",
 *   lastName: "田中",
 *   password: "securePassword123",
 *   role: 1 // USER役割
 * };
 *
 * const response = await fetch('/api/users', {
 *   method: 'POST',
 *   headers: {
 *     'Content-Type': 'application/json',
 *     'Authorization': 'Bearer admin-jwt-token'
 *   },
 *   body: JSON.stringify(userData)
 * });
 *
 * const result: ApiResponse<User> = await response.json();
 * if (result.success) {
 *   console.log(`新規ユーザー作成: ${result.data.username}`);
 * }
 * ```
 *
 * @security
 * - 管理者権限（ADMIN または MANAGER）が必要
 * - パスワードは自動的にハッシュ化
 * - ユーザー名重複チェック
 * - レスポンスにパスワードハッシュ含まず
 *
 * @validation
 * - Zodスキーマによる入力検証
 * - ユーザー名の形式・長さチェック
 * - パスワード強度チェック
 */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    // ミドルウェアで認証済みのユーザー情報を取得
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');

    if (!userId || !userRole) {
      return unauthorized('Authentication required');
    }

    // 管理者権限チェック（ADMIN=1 または MANAGER=2）
    const role = parseInt(userRole, 10);
    if (role > UserRole.MANAGER) {
      return forbidden('管理者権限が必要です');
    }

    const body = await request.json();

    const validatedInput = createUserSchema.parse(body);

    const container = Container.getInstance();

    const newUser = await container.userUseCase.createUser(validatedInput);

    return success(newUser, '新規ユーザーを作成しました');
  } catch (err) {
    console.error('ユーザー作成エラー:', err);

    if (err instanceof z.ZodError) {
      return error('入力データが正しくありません', 400);
    }

    if (
      err instanceof Error &&
      err.message === 'このユーザー名は既に使用されています'
    ) {
      return error('このユーザー名は既に使用されています', 409);
    }

    return internalError('ユーザー作成に失敗しました');
  }
}

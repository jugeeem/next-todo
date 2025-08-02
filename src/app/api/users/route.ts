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
import { createUserSchema } from '@/types/validation';

/**
 * ユーザー一覧取得エンドポイント
 *
 * システム内の全ユーザーを取得します。
 * 管理者権限が必要で、論理削除されたユーザーは除外されます。
 *
 * @param request - Next.js のリクエストオブジェクト
 * @returns ユーザー一覧または適切なエラーレスポンス
 *
 * @example
 * ```typescript
 * // 管理者としてのリクエスト
 * const response = await fetch('/api/users', {
 *   headers: {
 *     'Authorization': 'Bearer admin-jwt-token'
 *   }
 * });
 *
 * const result: ApiResponse<User[]> = await response.json();
 * if (result.success) {
 *   console.log(`ユーザー数: ${result.data.length}`);
 *   result.data.forEach(user => {
 *     console.log(`${user.username} (${user.role})`);
 *   });
 * }
 * ```
 *
 * @security
 * - 管理者権限（ADMIN または MANAGER）が必要
 * - JWTトークンによる認証
 * - パスワードハッシュは除外してレスポンス
 *
 * @performance
 * - ページネーション対応済み（pageとperPageパラメータ）
 * - クエリパラメータでのフィルタリング対応
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

    // クエリパラメータの取得と検証
    const url = new URL(request.url);
    const pageParam = url.searchParams.get('page');
    const perPageParam = url.searchParams.get('perPage');

    const page = pageParam ? Math.max(1, parseInt(pageParam, 10)) : 1;
    const perPage = perPageParam
      ? Math.min(100, Math.max(1, parseInt(perPageParam, 10)))
      : 20;

    const container = Container.getInstance();

    // 全ユーザーを取得
    const allUsers = await container.userUseCase.getAllUsers();

    // ページネーション計算
    const totalUsers = allUsers.length;
    const totalPages = Math.ceil(totalUsers / perPage);
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    const users = allUsers.slice(startIndex, endIndex);

    // ページネーション情報を含むレスポンス
    const responseData = {
      data: users,
      pagination: {
        currentPage: page,
        totalPages,
        totalUsers,
        perPage,
      },
    };

    return success(responseData, 'ユーザー一覧を取得しました');
  } catch (err) {
    console.error('ユーザー一覧取得エラー:', err);

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

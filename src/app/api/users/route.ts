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
import { AuthMiddleware } from '@/lib/auth-middleware';
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
 * - 大量データ時のページネーション対応を検討中
 * - 将来的にクエリパラメータでフィルタリング対応予定
 */
export async function GET(request: NextRequest): Promise<Response> {
  try {
    const authMiddleware = new AuthMiddleware();
    const authResult = authMiddleware.authenticate(request);
    if (!authResult.success) {
      return unauthorized(authResult.error);
    }

    // 管理者権限チェック（ADMIN=1 または MANAGER=2）
    if (authResult.user.role > UserRole.MANAGER) {
      return forbidden('管理者権限が必要です');
    }

    const container = Container.getInstance();

    const users = await container.userUseCase.getAllUsers();

    return success(users, 'ユーザー一覧を取得しました');
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
    const authMiddleware = new AuthMiddleware();
    const authResult = authMiddleware.authenticate(request);
    if (!authResult.success) {
      return unauthorized(authResult.error);
    }

    // 管理者権限チェック（ADMIN=1 または MANAGER=2）
    if (authResult.user.role > UserRole.MANAGER) {
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

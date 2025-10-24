/**
 * @fileoverview ユーザー管理API - 個別ユーザー操作エンドポイント
 *
 * このファイルは、特定のユーザーIDに対するCRUD操作を処理します。
 * ユーザー情報の取得（GET）、更新（PATCH）、削除（DELETE）機能を提供します。
 *
 * @author jugeeem
 * @since 1.0.0
 */

import type { NextRequest } from 'next/server';
import { z } from 'zod';
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
import { updateUserSchema } from '@/types/validation';
import type { SafeUser } from '@/usecases/UserUseCase';

// 管理者用ユーザー更新スキーマ（ユーザー名とパスワード更新を含む）
const adminUpdateUserSchema = updateUserSchema.extend({
  username: z.string().min(1).max(50).optional(),
  password: z.string().min(6).optional(),
});

/**
 * 個別ユーザー情報取得エンドポイント
 *
 * 指定されたIDのユーザー情報を取得します。
 * 管理者は全ユーザーアクセス可、一般ユーザーは自分の情報のみアクセス可能です。
 *
 * @param request - Next.js のリクエストオブジェクト
 * @param params - ルートパラメータ（ユーザーID）
 * @returns ユーザー情報または適切なエラーレスポンス
 *
 * @example
 * ```typescript
 * // 自分の情報を取得
 * const response = await fetch('/api/users/user-123', {
 *   headers: {
 *     'Authorization': 'Bearer jwt-token'
 *   }
 * });
 *
 * const result: ApiResponse<User> = await response.json();
 * if (result.success) {
 *   console.log(`ユーザー名: ${result.data.username}`);
 *   console.log(`権限: ${result.data.role}`);
 * }
 * ```
 *
 * @security
 * - JWT認証が必要
 * - 管理者またはマネージャー（role <= MANAGER）は全ユーザーアクセス可
 * - 一般ユーザーは自分の情報のみアクセス可
 * - パスワードハッシュは除外してレスポンス
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    // ミドルウェアで認証済みのユーザー情報を取得
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');

    if (!userId || !userRole) {
      return unauthorized('Authentication required');
    }

    const { id } = await params;

    // ロール変換（文字列から数値へ）
    const role = parseInt(userRole, 10);
    if (role > UserRole.MANAGER && userId !== id) {
      return forbidden('このユーザー情報にアクセスする権限がありません');
    }

    const container = Container.getInstance();
    const user = await container.userUseCase.getUserById(id);

    if (!user) {
      return notFound('ユーザーが見つかりません');
    }

    return success(user, 'ユーザー情報を取得しました');
  } catch (err) {
    console.error('ユーザー情報取得エラー:', err);

    return internalError('ユーザー情報の取得に失敗しました');
  }
}

/**
 * ユーザー情報更新エンドポイント
 *
 * 指定されたIDのユーザー情報を部分更新します。
 * 管理者は全ユーザー更新可、一般ユーザーは自分の情報のみ更新可能です。
 *
 * @param request - Next.js のリクエストオブジェクト
 * @param params - ルートパラメータ（ユーザーID）
 * @returns 更新されたユーザー情報または適切なエラーレスポンス
 *
 * @example
 * ```typescript
 * // ユーザー情報の更新
 * const updateData = {
 *   firstName: "新しい名前",
 *   lastName: "新しい姓"
 * };
 *
 * const response = await fetch('/api/users/user-123', {
 *   method: 'PATCH',
 *   headers: {
 *     'Content-Type': 'application/json',
 *     'Authorization': 'Bearer jwt-token'
 *   },
 *   body: JSON.stringify(updateData)
 * });
 *
 * const result: ApiResponse<User> = await response.json();
 * if (result.success) {
 *   console.log('ユーザー情報を更新しました');
 * }
 * ```
 *
 * @security
 * - JWT認証が必要
 * - 管理者またはマネージャー（role <= MANAGER）は全ユーザー更新可
 * - 一般ユーザーは自分の情報のみ更新可
 * - パスワード更新時は自動ハッシュ化
 * - ユーザー名重複チェック実施
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    // ミドルウェアで認証済みのユーザー情報を取得
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');

    if (!userId || !userRole) {
      return unauthorized('Authentication required');
    }

    const { id } = await params;

    // ロール変換（文字列から数値へ）
    const role = parseInt(userRole, 10);
    if (role > UserRole.MANAGER && userId !== id) {
      return forbidden('このユーザー情報を更新する権限がありません');
    }

    const container = Container.getInstance();

    const body = await request.json();

    // 管理者と一般ユーザーで使用できるスキーマを分ける
    const schema = role <= UserRole.MANAGER ? adminUpdateUserSchema : updateUserSchema;
    const validatedInput = schema.parse(body);

    let updatedUser: SafeUser;
    if (role <= UserRole.MANAGER) {
      // 管理者の場合、パスワードやユーザー名更新も可能
      updatedUser = await container.userUseCase.updateUserAsAdmin(
        id,
        validatedInput as z.infer<typeof adminUpdateUserSchema>,
      );
    } else {
      // 一般ユーザーの場合、基本情報のみ更新可能
      updatedUser = await container.userUseCase.updateUser(id, validatedInput);
    }

    return success(updatedUser, 'ユーザー情報を更新しました');
  } catch (err) {
    console.error('ユーザー情報更新エラー:', err);

    if (err instanceof z.ZodError) {
      return error('入力データが正しくありません', 400);
    }

    if (err instanceof Error) {
      if (err.message === 'ユーザーが見つかりません') {
        return notFound('ユーザーが見つかりません');
      }
      if (err.message === 'このユーザー名は既に使用されています') {
        return error('このユーザー名は既に使用されています', 409);
      }
    }

    return internalError('ユーザー情報の更新に失敗しました');
  }
}

/**
 * ユーザー削除エンドポイント（物理削除）
 *
 * 指定されたIDのユーザーを物理削除します。
 * 管理者権限が必要で、データベースから完全にレコードを削除します。
 * この操作は元に戻せません。
 *
 * @param request - Next.js のリクエストオブジェクト
 * @param params - ルートパラメータ（ユーザーID）
 * @returns 削除結果または適切なエラーレスポンス
 *
 * @example
 * ```typescript
 * // ユーザーの削除
 * const response = await fetch('/api/users/user-123', {
 *   method: 'DELETE',
 *   headers: {
 *     'Authorization': 'Bearer admin-jwt-token'
 *   }
 * });
 *
 * const result: ApiResponse<{ deleted: boolean }> = await response.json();
 * if (result.success && result.data.deleted) {
 *   console.log('ユーザーを削除しました');
 * }
 * ```
 *
 * @security
 * - 管理者またはマネージャー権限（role <= MANAGER）が必要
 * - 物理削除のためデータ復旧は不可能
 * - 関連するToDoデータもCASCADE設定により自動削除
 *
 * @business_rules
 * - 自分自身の削除は禁止
 * - 最後の管理者の削除は禁止（今後実装予定）
 *
 * @warning この操作は元に戻せません。関連データも含めて完全に削除されます。
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    // ミドルウェアで認証済みのユーザー情報を取得
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');

    if (!userId || !userRole) {
      return unauthorized('Authentication required');
    }

    // ロール変換（文字列から数値へ）
    const role = parseInt(userRole, 10);
    if (role > UserRole.MANAGER) {
      return forbidden('管理者またはマネージャー権限が必要です');
    }

    const { id } = await params;

    if (userId === id) {
      return forbidden('自分自身を削除することはできません');
    }

    const container = Container.getInstance();

    await container.userUseCase.deleteUser(id);

    return success({ deleted: true, userId: id }, 'ユーザーを削除しました');
  } catch (err) {
    console.error('ユーザー削除エラー:', err);

    if (err instanceof Error && err.message === 'ユーザーが見つかりません') {
      return notFound('削除対象のユーザーが見つかりません');
    }

    return internalError('ユーザーの削除に失敗しました');
  }
}

/**
 * @fileoverview 現在ユーザー情報API - 自分の情報取得・更新エンドポイント
 *
 * このファイルは、現在認証されているユーザー自身の情報を操作するエンドポイントです。
 * JWTトークンから自動的にユーザーIDを取得し、そのユーザーの情報を返します。
 *
 * @author jugeeem
 * @since 1.0.0
 */

import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { UserRole } from '@/domain/entities/User';
import { Container } from '@/lib/container';
import { error, internalError, success, unauthorized } from '@/lib/response';
import { updateUserSchema } from '@/types/validation';

/**
 * 現在ユーザー情報取得エンドポイント
 *
 * 認証済みユーザーの自分自身の情報を取得します。
 * JWTトークンから自動的にユーザーIDを抽出し、該当するユーザー情報を返します。
 * パスワードハッシュは除外された安全なレスポンスを提供します。
 *
 * @param request - Next.js のリクエストオブジェクト
 * @returns 現在ユーザーの情報または適切なエラーレスポンス
 *
 * @example
 * ```typescript
 * // 自分の情報を取得
 * const response = await fetch('/api/users/me', {
 *   headers: {
 *     'Authorization': 'Bearer jwt-token'
 *   }
 * });
 *
 * const result: ApiResponse<User> = await response.json();
 * if (result.success) {
 *   console.log(`ユーザー名: ${result.data.username}`);
 *   console.log(`権限レベル: ${result.data.role}`);
 *   console.log(`作成日: ${result.data.createdAt}`);
 * }
 * ```
 *
 * @security
 * - JWT認証が必要
 * - ユーザーは自分の情報のみアクセス可能
 * - パスワードハッシュは自動的に除外
 * - トークンの有効期限チェック
 *
 * @use_cases
 * - ユーザーダッシュボードでのプロフィール表示
 * - 設定画面での現在情報表示
 * - ヘッダーでのユーザー名表示
 * - 権限レベルに基づくUI制御
 */
export async function GET(request: NextRequest): Promise<Response> {
  try {
    // ミドルウェアで認証済みのユーザー情報を取得
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return unauthorized('Authentication required');
    }

    const container = Container.getInstance();
    const user = await container.userUseCase.getUserById(userId);

    if (!user) {
      return unauthorized('ユーザー情報が見つかりません');
    }

    return success(user, 'ユーザー情報を取得しました');
  } catch (err) {
    console.error('現在ユーザー情報取得エラー:', err);

    return internalError('ユーザー情報の取得に失敗しました');
  }
}

/**
 * 現在ユーザー情報更新エンドポイント
 *
 * 認証済みユーザーが自分自身の情報を更新します。
 * 名前、名前読み仮名、権限レベルなどの基本情報を部分更新できます。
 * セキュリティ上、ユーザー名とパスワードの変更は別のエンドポイントで処理します。
 *
 * @param request - Next.js のリクエストオブジェクト
 * @returns 更新されたユーザー情報または適切なエラーレスポンス
 *
 * @example
 * ```typescript
 * // プロフィール更新
 * const updateData = {
 *   firstName: "新しい名前",
 *   lastName: "新しい姓",
 *   firstNameRuby: "あたらしいなまえ",
 *   lastNameRuby: "あたらしいせい"
 * };
 *
 * const response = await fetch('/api/users/me', {
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
 *   console.log('プロフィールを更新しました');
 *   updateUserDisplay(result.data);
 * }
 * ```
 *
 * @security
 * - JWT認証が必要
 * - ユーザーは自分の情報のみ更新可能
 * - ユーザー名とパスワード変更は除外
 * - 入力データのサニタイゼーション
 *
 * @validation
 * - Zodスキーマによる入力検証
 * - 文字数制限チェック
 * - 必要に応じて文字種チェック
 *
 * @business_rules
 * - 一般ユーザーは role フィールドを変更不可
 * - 管理者は `/api/users/[id]` エンドポイントを使用
 */
export async function PATCH(request: NextRequest): Promise<Response> {
  try {
    // ミドルウェアで認証済みのユーザー情報を取得
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');

    if (!userId || !userRole) {
      return unauthorized('Authentication required');
    }

    const container = Container.getInstance();

    const body = await request.json();

    const validatedInput = updateUserSchema.parse(body);

    // 一般ユーザーはrole変更不可、管理者は可能
    const role = parseInt(userRole, 10);
    const updateData =
      role <= UserRole.MANAGER
        ? validatedInput // 管理者・マネージャーは role 変更可能
        : (({ role, ...rest }) => rest)(validatedInput); // 一般ユーザーは role 変更不可

    const updatedUser = await container.userUseCase.updateUser(userId, updateData);

    return success(updatedUser, 'プロフィールを更新しました');
  } catch (err) {
    console.error('プロフィール更新エラー:', err);

    if (err instanceof z.ZodError) {
      return error('入力データが正しくありません', 400);
    }

    if (err instanceof Error && err.message === 'ユーザーが見つかりません') {
      return unauthorized('ユーザー情報が見つかりません');
    }

    return internalError('プロフィールの更新に失敗しました');
  }
}

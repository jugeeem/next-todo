/**
 * @fileoverview パスワード変更API - ユーザー自身のパスワード変更エンドポイント
 *
 * このファイルは、認証済みユーザーが自分自身のパスワードを変更するエンドポイントです。
 * セキュリティ上、現在のパスワードの検証が必須であり、
 * 新しいパスワードの妥当性チェックも行います。
 *
 * @author jugeeem
 * @since 1.0.0
 */

import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { Container } from '@/lib/container';
import { error, internalError, success, unauthorized } from '@/lib/response';
import { changePasswordSchema } from '@/types/validation';

/**
 * パスワード変更エンドポイント
 *
 * 認証済みユーザーが自分自身のパスワードを変更します。
 * セキュリティ上、現在のパスワードの検証を必須とし、
 * 新しいパスワードの妥当性確認も行います。
 *
 * @param request - Next.js のリクエストオブジェクト
 * @returns パスワード変更成功メッセージまたは適切なエラーレスポンス
 *
 * @example
 * ```typescript
 * // パスワード変更
 * const passwordData = {
 *   currentPassword: "currentSecurePassword",
 *   newPassword: "newSecurePassword123",
 *   confirmPassword: "newSecurePassword123"
 * };
 *
 * const response = await fetch('/api/users/me/password', {
 *   method: 'PUT',
 *   headers: {
 *     'Content-Type': 'application/json',
 *     'Authorization': 'Bearer jwt-token'
 *   },
 *   body: JSON.stringify(passwordData)
 * });
 *
 * const result: ApiResponse<null> = await response.json();
 * if (result.success) {
 *   console.log('パスワードを変更しました');
 *   // ログアウト処理やリダイレクト
 * } else {
 *   console.error('パスワード変更失敗:', result.message);
 * }
 * ```
 *
 * @security
 * - JWT認証が必要
 * - 現在のパスワード検証必須
 * - パスワード確認による入力ミス防止
 * - bcryptによる安全なパスワードハッシュ化
 * - 入力データのサニタイゼーション
 *
 * @validation
 * - Zodスキーマによる入力検証
 * - パスワード要件チェック（最低6文字）
 * - 新しいパスワードと確認パスワードの一致確認
 * - 現在パスワードの必須チェック
 *
 * @business_rules
 * - ユーザーは自分のパスワードのみ変更可能
 * - パスワード変更後、既存セッションは継続
 * - パスワード履歴の管理（将来実装予定）
 *
 * @use_cases
 * - セキュリティ設定でのパスワード変更
 * - 定期的なパスワード更新
 * - セキュリティ侵害時の緊急パスワード変更
 * - 初回ログイン後の強制パスワード変更
 */
export async function PUT(request: NextRequest): Promise<Response> {
  try {
    // ミドルウェアで認証済みのユーザー情報を取得
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return unauthorized('Authentication required');
    }

    const container = Container.getInstance();

    const body = await request.json();

    // 入力データのバリデーション
    const validatedInput = changePasswordSchema.parse(body);

    // パスワード変更処理
    await container.userUseCase.changePassword(
      userId,
      validatedInput.currentPassword,
      validatedInput.newPassword,
    );

    return success(null, 'パスワードを変更しました');
  } catch (err) {
    console.error('パスワード変更エラー:', err);

    if (err instanceof z.ZodError) {
      // バリデーションエラーの詳細レスポンス
      const errorMessages = err.errors.map((error) => error.message).join(', ');
      return error(`入力データが正しくありません: ${errorMessages}`, 400);
    }

    if (err instanceof Error) {
      // ビジネスロジックエラーの処理
      if (err.message === 'ユーザーが見つかりません') {
        return unauthorized('ユーザー情報が見つかりません');
      }

      if (err.message === '現在のパスワードが間違っています') {
        return error('現在のパスワードが間違っています', 400);
      }

      if (err.message === 'パスワードの更新に失敗しました') {
        return internalError('パスワードの更新に失敗しました');
      }
    }

    return internalError('パスワード変更処理中にエラーが発生しました');
  }
}

import type { NextRequest } from 'next/server';
import { Container } from '@/lib/container';
import { error, internalError, success } from '@/lib/response';
import { createUserSchema } from '@/types/validation';

/**
 * ユーザー登録API
 *
 * 新しいユーザーアカウントを作成します。
 * ユーザー名は一意である必要があり、既に存在する場合はエラーを返します。
 *
 * @route POST /api/auth/register
 *
 * @body {Object} request - リクエストボディ
 * @body {string} request.username - ユーザー名（必須、1〜50文字）
 * @body {string} request.password - パスワード（必須、6文字以上）
 * @body {string} [request.firstName] - 名前（任意、50文字以下）
 * @body {string} [request.firstNameRuby] - 名前のふりがな（任意、50文字以下）
 * @body {string} [request.lastName] - 姓（任意、50文字以下）
 * @body {string} [request.lastNameRuby] - 姓のふりがな（任意、50文字以下）
 * @body {number} [request.role] - ユーザーロール（任意）
 *
 * @returns {Object} レスポンス
 * @returns {boolean} success - 成功フラグ
 * @returns {string} message - レスポンスメッセージ
 * @returns {Object} data - レスポンスデータ（成功時のみ）
 * @returns {string} data.token - JWTトークン
 * @returns {Object} data.user - 作成されたユーザー情報
 * @returns {number} data.user.id - ユーザーID
 * @returns {string} data.user.username - ユーザー名
 * @returns {string} [data.user.firstName] - 名前（任意）
 * @returns {string} [data.user.firstNameRuby] - 名前のふりがな（任意）
 * @returns {string} [data.user.lastName] - 姓（任意）
 * @returns {string} [data.user.lastNameRuby] - 姓のふりがな（任意）
 * @returns {number} [data.user.role] - ユーザーロール（任意）
 *
 * @example
 * // リクエスト例（最小構成）
 * POST /api/auth/register
 * Content-Type: application/json
 *
 * {
 *   "username": "jane_doe",
 *   "password": "securePassword123"
 * }
 *
 * // リクエスト例（全項目）
 * POST /api/auth/register
 * Content-Type: application/json
 *
 * {
 *   "username": "taro_yamada",
 *   "password": "mySecretPassword456",
 *   "firstName": "太郎",
 *   "firstNameRuby": "たろう",
 *   "lastName": "山田",
 *   "lastNameRuby": "やまだ",
 *   "role": 1
 * }
 *
 * // 成功レスポンス例 (200)
 * {
 *   "success": true,
 *   "message": "Registration successful",
 *   "data": {
 *     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *     "user": {
 *       "id": 2,
 *       "username": "taro_yamada",
 *       "firstName": "太郎",
 *       "firstNameRuby": "たろう",
 *       "lastName": "山田",
 *       "lastNameRuby": "やまだ",
 *       "role": 1
 *     }
 *   }
 * }
 *
 * // バリデーションエラー例 (400)
 * {
 *   "success": false,
 *   "message": "Invalid input: Username is required, Password must be at least 6 characters"
 * }
 *
 * // ユーザー名重複エラー例 (400)
 * {
 *   "success": false,
 *   "message": "Username already exists"
 * }
 *
 * @throws {400} バリデーションエラー - リクエストボディの形式が不正な場合
 * @throws {400} 重複エラー - ユーザー名が既に存在する場合
 * @throws {500} サーバーエラー - 予期しないエラーが発生した場合
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validationResult = createUserSchema.safeParse(body);
    if (!validationResult.success) {
      return error(
        'Invalid input: ' +
          validationResult.error.issues.map((issue) => issue.message).join(', '),
      );
    }

    const container = Container.getInstance();
    const result = await container.authUseCase.register(validationResult.data);

    return success(result, 'Registration successful');
  } catch (err) {
    console.error('Registration error:', err);
    if (err instanceof Error) {
      return error(err.message, 400);
    }

    return internalError();
  }
}

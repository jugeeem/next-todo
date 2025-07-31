import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { Container } from '@/lib/container';
import { setAuthTokenCookie, setUserCookie } from '@/lib/cookie';
import { error, internalError, unauthorized } from '@/lib/response';
import { loginSchema } from '@/types/validation';

/**
 * ユーザーログインAPI
 *
 * ユーザー名とパスワードを使用してユーザー認証を行い、
 * 成功時にはJWTトークンを返却します。
 *
 * @route POST /api/auth/login
 *
 * @body {Object} request - リクエストボディ
 * @body {string} request.username - ユーザー名（必須、1文字以上）
 * @body {string} request.password - パスワード（必須、1文字以上）
 *
 * @returns {Object} レスポンス
 * @returns {boolean} success - 成功フラグ
 * @returns {string} message - レスポンスメッセージ
 * @returns {Object} data - レスポンスデータ（成功時のみ）
 * @returns {string} data.token - JWTトークン
 * @returns {Object} data.user - ユーザー情報
 * @returns {number} data.user.id - ユーザーID
 * @returns {string} data.user.username - ユーザー名
 * @returns {string} [data.user.firstName] - 名前（任意）
 * @returns {string} [data.user.firstNameRuby] - 名前のふりがな（任意）
 * @returns {string} [data.user.lastName] - 姓（任意）
 * @returns {string} [data.user.lastNameRuby] - 姓のふりがな（任意）
 * @returns {number} [data.user.role] - ユーザーロール（任意）
 *
 * @example
 * // リクエスト例
 * POST /api/auth/login
 * Content-Type: application/json
 *
 * {
 *   "username": "john_doe",
 *   "password": "securePassword123"
 * }
 *
 * // 成功レスポンス例 (200)
 * {
 *   "success": true,
 *   "message": "Login successful",
 *   "data": {
 *     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *     "user": {
 *       "id": 1,
 *       "username": "john_doe",
 *       "firstName": "John",
 *       "lastName": "Doe",
 *       "role": 1
 *     }
 *   }
 * }
 *
 * // バリデーションエラー例 (400)
 * {
 *   "success": false,
 *   "message": "Invalid input: Username is required"
 * }
 *
 * // 認証エラー例 (401)
 * {
 *   "success": false,
 *   "message": "Invalid username or password"
 * }
 *
 * @throws {400} バリデーションエラー - リクエストボディの形式が不正な場合
 * @throws {401} 認証エラー - ユーザー名またはパスワードが間違っている場合
 * @throws {500} サーバーエラー - 予期しないエラーが発生した場合
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validationResult = loginSchema.safeParse(body);
    if (!validationResult.success) {
      return error(
        'Invalid input: ' +
          validationResult.error.issues.map((issue) => issue.message).join(', '),
      );
    }

    const container = Container.getInstance();
    const result = await container.authUseCase.login(validationResult.data);

    // 成功レスポンスを作成
    const response = NextResponse.json(
      {
        success: true,
        message: 'Login successful',
        data: result,
      },
      { status: 200 },
    );

    // Cookieに認証情報を設定
    setAuthTokenCookie(response, result.token);
    setUserCookie(response, result.user);

    return response;
  } catch (err) {
    console.error('Login error:', err);
    if (err instanceof Error) {
      return unauthorized(err.message);
    }

    return internalError();
  }
}

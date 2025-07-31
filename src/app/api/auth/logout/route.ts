import { NextResponse } from 'next/server';
import { deleteAuthCookies } from '@/lib/cookie';

/**
 * ユーザーログアウトAPI
 *
 * ユーザーのログアウト処理を行い、認証Cookieを削除します。
 *
 * @route POST /api/auth/logout
 *
 * @returns {Object} レスポンス
 * @returns {boolean} success - 成功フラグ
 * @returns {string} message - レスポンスメッセージ
 *
 * @example
 * // リクエスト例
 * POST /api/auth/logout
 *
 * // 成功レスポンス例 (200)
 * {
 *   "success": true,
 *   "message": "Logout successful"
 * }
 *
 * @throws {500} サーバーエラー - 予期しないエラーが発生した場合
 */
export async function POST() {
  try {
    // 成功レスポンスを作成
    const response = NextResponse.json(
      {
        success: true,
        message: 'Logout successful',
      },
      { status: 200 },
    );

    // 認証Cookieを削除
    deleteAuthCookies(response);

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Logout failed',
      },
      { status: 500 },
    );
  }
}

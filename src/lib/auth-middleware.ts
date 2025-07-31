/**
 * @fileoverview 認証ミドルウェア
 *
 * このファイルは、Next.js APIルートやミドルウェアで使用される認証機能を提供します。
 * JWT トークンベースの認証システムを実装し、リクエストの認証状態を検証します。
 *
 * 主な機能:
 * - HTTP Authorizationヘッダーからのトークン抽出
 * - JWT トークンの検証と復号化
 * - 認証結果の構造化されたレスポンス
 * - 型安全な認証処理
 *
 * 使用例:
 * - API ルートでの認証チェック
 * - Next.js ミドルウェアでのルート保護
 * - 保護されたエンドポイントのアクセス制御
 *
 * @author jugeeem
 * @since 1.0.0
 */

import type { NextRequest } from 'next/server';
import { getAuthTokenFromServer } from '@/lib/cookie';
import { JWTService } from '@/lib/jwt';
import type { MiddlewareAuthResult } from '@/types/auth';

/**
 * 認証ミドルウェアクラス
 *
 * JWT トークンベースの認証機能を提供するクラスです。
 * Next.js のリクエストオブジェクトから認証情報を抽出し、
 * トークンの妥当性を検証して認証結果を返します。
 *
 * 認証フロー:
 * 1. リクエストヘッダーから Authorization ヘッダーを取得
 * 2. Bearer トークン形式の検証
 * 3. JWT トークンの復号化と検証
 * 4. ユーザー情報の抽出
 * 5. 構造化された認証結果の返却
 *
 * @class AuthMiddleware
 * @example
 * ```typescript
 * // API ルートでの使用例
 * import { AuthMiddleware } from '@/lib/auth-middleware';
 *
 * export async function GET(request: NextRequest) {
 *   const authMiddleware = new AuthMiddleware();
 *   const authResult = authMiddleware.authenticate(request);
 *
 *   if (!authResult.success) {
 *     return NextResponse.json(
 *       { error: authResult.error },
 *       { status: 401 }
 *     );
 *   }
 *
 *   // 認証成功時の処理
 *   const user = authResult.user;
 *   return NextResponse.json({ userId: user.userId });
 * }
 * ```
 */
export class AuthMiddleware {
  /**
   * JWT サービスインスタンス
   *
   * トークンの生成、検証、解析機能を提供します。
   * コンストラクタで初期化され、認証処理全体で使用されます。
   *
   * @private
   * @readonly
   */
  private jwtService: JWTService;

  /**
   * AuthMiddleware コンストラクタ
   *
   * JWT サービスのインスタンスを初期化します。
   * 環境変数から JWT_SECRET を読み込み、トークン処理の準備を行います。
   *
   * @constructor
   * @example
   * ```typescript
   * const authMiddleware = new AuthMiddleware();
   * // JWT サービスが自動的に初期化される
   * ```
   */
  constructor() {
    this.jwtService = new JWTService();
  }

  /**
   * リクエスト認証処理
   *
   * Next.js リクエストオブジェクトから認証情報を抽出し、
   * JWT トークンの妥当性を検証します。認証結果は構造化された
   * オブジェクトとして返され、成功時にはユーザー情報が含まれます。
   *
   * 認証処理ステップ:
   * 1. Authorization ヘッダーまたはCookieからトークンを取得
   * 2. Bearer トークンの抽出
   * 3. JWT トークンの検証
   * 4. ユーザー情報の復号化
   * 5. 結果の構造化
   *
   * @param {NextRequest} request - Next.js リクエストオブジェクト
   * @returns {MiddlewareAuthResult} 認証結果オブジェクト
   *
   * @example
   * ```typescript
   * const authMiddleware = new AuthMiddleware();
   *
   * // 成功例
   * const successResult = authMiddleware.authenticate(requestWithValidToken);
   * if (successResult.success) {
   *   console.log(`認証成功: ${successResult.user.username}`);
   *   console.log(`ユーザーID: ${successResult.user.userId}`);
   *   console.log(`権限: ${successResult.user.role}`);
   * }
   *
   * // 失敗例
   * const failureResult = authMiddleware.authenticate(requestWithoutToken);
   * if (!failureResult.success) {
   *   console.error(`認証失敗: ${failureResult.error}`);
   *   // "No token provided" or "Invalid token" etc.
   * }
   *
   * // 実際のAPI使用例
   * export async function POST(request: NextRequest) {
   *   const authResult = authMiddleware.authenticate(request);
   *
   *   if (!authResult.success) {
   *     return new Response(JSON.stringify({ error: authResult.error }), {
   *       status: 401,
   *       headers: { 'Content-Type': 'application/json' }
   *     });
   *   }
   *
   *   // 認証されたユーザーでの処理続行
   *   const currentUser = authResult.user;
   *   // ...
   * }
   * ```
   */
  async authenticate(request: NextRequest): Promise<MiddlewareAuthResult> {
    try {
      // まずAuthorizationヘッダーからトークンを試行
      const authHeader = request.headers.get('authorization');
      let token = this.jwtService.extractTokenFromHeader(authHeader || '');

      // Authorizationヘッダーにトークンがない場合はCookieから取得
      if (!token) {
        token = getAuthTokenFromServer(request);
      }

      if (!token) {
        return { success: false, error: 'No token provided' };
      }

      const user = await this.jwtService.verifyToken(token);

      if (!user) {
        return { success: false, error: 'Invalid token' };
      }

      return { success: true, user };
    } catch (error) {
      console.error('Authentication error:', error);
      return { success: false, error: 'Authentication failed' };
    }
  }
}

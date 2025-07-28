/**
 * @fileoverview JWT（JSON Web Token）サービス
 *
 * このファイルは、JWT トークンの生成、検証、解析機能を提供します。
 * 認証システムの中核となるサービスで、セキュアなトークンベース認証を実現します。
 *
 * 主な機能:
 * - JWT トークンの生成（サインイン時）
 * - JWT トークンの検証と復号化（認証時）
 * - Authorization ヘッダーからのトークン抽出
 * - 環境変数による秘密鍵管理
 *
 * セキュリティ機能:
 * - HMAC SHA256 アルゴリズムによる署名
 * - 24時間の有効期限設定
 * - 環境変数による秘密鍵の外部化
 * - トークン形式の厳密な検証
 *
 * @author jugeeem
 * @since 1.0.0
 */

import { jwtVerify, SignJWT } from 'jose';
import type { User } from '@/domain/entities/User';
import type { JWTPayload as CustomJWTPayload } from '@/types/auth';

/**
 * JWT サービスクラス
 *
 * JSON Web Token の生成、検証、解析機能を提供するサービスクラスです。
 * 認証システム全体で使用され、セキュアなトークンベース認証を実現します。
 *
 * トークン仕様:
 * - アルゴリズム: HS256 (HMAC SHA256)
 * - 有効期限: 24時間
 * - ペイロード: userId, username, role
 * - 形式: Bearer トークン
 *
 * セキュリティ考慮事項:
 * - 秘密鍵は環境変数で管理
 * - トークンの改ざん検出
 * - 期限切れトークンの自動拒否
 * - 不正な形式のトークン検証
 *
 * @class JWTService
 * @example
 * ```typescript
 * const jwtService = new JWTService();
 *
 * // ユーザー認証後のトークン生成
 * const user = { id: 'user-123', username: 'john', role: UserRole.USER };
 * const token = jwtService.generateToken(user);
 *
 * // クライアントでの使用
 * // Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *
 * // サーバーサイドでの検証
 * const authHeader = request.headers.get('authorization');
 * const token = jwtService.extractTokenFromHeader(authHeader);
 * const payload = jwtService.verifyToken(token);
 *
 * if (payload) {
 *   console.log(`認証成功: ${payload.username}`);
 * }
 * ```
 */
export class JWTService {
  /**
   * JWT 署名用秘密鍵（Uint8Array形式）
   *
   * JWT トークンの署名と検証に使用される秘密鍵です。
   * 環境変数 JWT_SECRET から読み込まれ、設定されていない場合は
   * フォールバック値が使用されます（本番環境では適切な秘密鍵を設定してください）。
   *
   * @private
   * @readonly
   */
  private secret: Uint8Array;

  /**
   * JWTService コンストラクタ
   *
   * 環境変数から JWT 秘密鍵を読み込み、初期化します。
   * 本番環境では必ず強力な秘密鍵を JWT_SECRET 環境変数に設定してください。
   *
   * @constructor
   * @example
   * ```typescript
   * // 環境変数の設定例
   * // JWT_SECRET=your-super-secret-key-here
   *
   * const jwtService = new JWTService();
   * // 自動的に環境変数から秘密鍵を読み込み
   * ```
   */
  constructor() {
    const secretString = process.env.JWT_SECRET || 'fallback-secret-key';
    this.secret = new TextEncoder().encode(secretString);
  }

  /**
   * JWT トークン生成
   *
   * ユーザー情報から JWT トークンを生成します。
   * ペイロードには最小限の必要情報のみを含め、セキュリティを確保します。
   *
   * @param {User} user - トークン生成対象のユーザー情報
   * @returns {string} 生成された JWT トークン
   *
   * @example
   * ```typescript
   * const jwtService = new JWTService();
   *
   * const user = {
   *   id: '123e4567-e89b-12d3-a456-426614174000',
   *   username: 'john_doe',
   *   role: UserRole.USER,
   *   // その他のユーザー情報...
   * };
   *
   * const token = jwtService.generateToken(user);
   * console.log(token);
   * // "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   *
   * // クライアントに送信
   * return NextResponse.json({
   *   success: true,
   *   token: token,
   *   user: { id: user.id, username: user.username }
   * });
   * ```
   */
  async generateToken(user: User): Promise<string> {
    const payload = {
      userId: user.id,
      username: user.username,
      role: user.role,
    };

    const jwt = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(this.secret);

    return jwt;
  }

  /**
   * JWT トークン検証
   *
   * 提供された JWT トークンの妥当性を検証し、ペイロードを復号化します。
   * 署名の検証、有効期限の確認、形式の妥当性チェックを行います。
   *
   * @param {string} token - 検証対象の JWT トークン
   * @returns {JWTPayload | null} 復号化されたペイロード、無効な場合はnull
   *
   * @example
   * ```typescript
   * const jwtService = new JWTService();
   *
   * // 有効なトークンの場合
   * const validToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
   * const payload = jwtService.verifyToken(validToken);
   *
   * if (payload) {
   *   console.log(`ユーザーID: ${payload.userId}`);
   *   console.log(`ユーザー名: ${payload.username}`);
   *   console.log(`権限: ${payload.role}`);
   *
   *   // 認証成功時の処理
   *   return NextResponse.json({
   *     message: "認証成功",
   *     user: payload
   *   });
   * } else {
   *   // 認証失敗時の処理
   *   return NextResponse.json(
   *     { error: "無効なトークンです" },
   *     { status: 401 }
   *   );
   * }
   *
   * // 期限切れ、改ざん、不正な形式の場合は null が返される
   * const expiredToken = "expired.jwt.token";
   * const result = jwtService.verifyToken(expiredToken);
   * console.log(result); // null
   * ```
   */
  async verifyToken(token: string): Promise<CustomJWTPayload | null> {
    try {
      const { payload } = await jwtVerify(token, this.secret);
      return payload as unknown as CustomJWTPayload;
    } catch (error) {
      console.error(
        'Token verification failed:',
        error instanceof Error ? error.message : String(error),
      );
      return null;
    }
  }

  /**
   * Authorization ヘッダーからトークン抽出
   *
   * HTTP Authorization ヘッダーから Bearer トークンを抽出します。
   * RFC 6750 に準拠した Bearer トークン形式を厳密に検証します。
   *
   * @param {string | undefined} authHeader - Authorization ヘッダーの値
   * @returns {string | null} 抽出されたトークン、無効な場合はnull
   *
   * @example
   * ```typescript
   * const jwtService = new JWTService();
   *
   * // 正しい形式の場合
   * const validHeader = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
   * const token = jwtService.extractTokenFromHeader(validHeader);
   * console.log(token); // "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   *
   * // 不正な形式の場合
   * const invalidHeaders = [
   *   "Basic dXNlcjpwYXNzd29yZA==",  // Basic認証
   *   "eyJhbGciOiJIUzI1NiIsInR5cCI6",    // Bearer プレフィックスなし
   *   "",                                // 空文字
   *   undefined                          // undefined
   * ];
   *
   * invalidHeaders.forEach(header => {
   *   const result = jwtService.extractTokenFromHeader(header);
   *   console.log(result); // 全て null
   * });
   *
   * // Next.js API ルートでの使用例
   * export async function GET(request: NextRequest) {
   *   const authHeader = request.headers.get('authorization');
   *   const token = jwtService.extractTokenFromHeader(authHeader);
   *
   *   if (!token) {
   *     return NextResponse.json(
   *       { error: "認証トークンが提供されていません" },
   *       { status: 401 }
   *     );
   *   }
   *
   *   // トークン検証処理...
   * }
   * ```
   */
  extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }
}

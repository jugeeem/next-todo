/**
 * @fileoverview 認証関連型定義
 *
 * このファイルは、JWT トークンベース認証システムで使用される型定義を提供します。
 * Next.js のリクエスト処理、ミドルウェア認証、ユーザー情報管理における
 * 型安全性を保証し、認証フローの整合性を維持します。
 *
 * 主な機能:
 * - JWT ペイロード構造の定義
 * - 認証済みリクエストの型拡張
 * - 認証結果の構造化された表現
 * - TypeScript による型安全な認証処理
 *
 * 使用例:
 * - JWT トークンの生成・検証
 * - Next.js ミドルウェアでの認証処理
 * - API ルートでの認証状態管理
 * - 保護されたエンドポイントでのユーザー情報取得
 *
 * @author jugeeem
 * @since 1.0.0
 */

import type { NextRequest } from 'next/server';

/**
 * JWT ペイロード型
 *
 * JSON Web Token に含まれるユーザー情報の構造を定義します。
 * この型は JWT の生成時と検証時の両方で使用され、
 * トークンに含まれるユーザーデータの整合性を保証します。
 *
 * JWT 仕様:
 * - アルゴリズム: HMAC SHA256 (HS256)
 * - 有効期限: 24時間
 * - 発行者: next-todo application
 * - 署名検証: 環境変数 JWT_SECRET による
 *
 * @interface JWTPayload
 *
 * @example
 * ```typescript
 * // JWT トークン生成時
 * const payload: JWTPayload = {
 *   userId: "user_123456789",
 *   username: "john_doe",
 *   role: 1
 * };
 *
 * const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
 *
 * // JWT トークン検証時
 * const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
 * console.log(`ユーザーID: ${decoded.userId}`);
 * console.log(`ユーザー名: ${decoded.username}`);
 * console.log(`権限レベル: ${decoded.role}`);
 *
 * // 認証ミドルウェアでの使用
 * const authResult = authMiddleware.authenticate(request);
 * if (authResult.success) {
 *   const user: JWTPayload = authResult.user;
 *   // user.userId, user.username, user.role が利用可能
 * }
 * ```
 */
export interface JWTPayload {
  /**
   * ユーザー一意識別子
   *
   * データベース内のユーザーレコードを特定するための主キーです。
   * UUID 形式またはプレフィックス付きの文字列として生成され、
   * 全てのユーザー操作でこのIDが使用されます。
   *
   * @type {string}
   * @example
   * ```typescript
   * // UUID 形式の例
   * userId: "550e8400-e29b-41d4-a716-446655440000"
   *
   * // プレフィックス付きの例
   * userId: "user_123456789"
   *
   * // API での使用例
   * const todos = await todoRepository.findByUserId(payload.userId);
   * const userProfile = await userRepository.findById(payload.userId);
   * ```
   */
  userId: string;

  /**
   * ユーザー名
   *
   * ログイン時に使用されるユーザーの識別名です。
   * アプリケーション内でユーザーを表示する際の表示名としても使用されます。
   * 一意性が保証され、大文字小文字を区別します。
   *
   * @type {string}
   * @example
   * ```typescript
   * // 英数字とアンダースコア
   * username: "john_doe"
   * username: "user123"
   * username: "admin_user"
   *
   * // UI での表示例
   * <div>ようこそ、{user.username}さん</div>
   *
   * // ログでの使用例
   * console.log(`${payload.username} がログインしました`);
   * ```
   */
  username: string;

  /**
   * ユーザー権限レベル
   *
   * ユーザーのアクセス権限を数値で表現します。
   * 数値が大きいほど高い権限を持ち、機能アクセスや
   * データ操作の範囲が決定されます。
   *
   * 権限レベル定義:
   * - 0: ゲストユーザー（読み取り専用）
   * - 1: 一般ユーザー（基本操作）
   * - 2: パワーユーザー（拡張操作）
   * - 3: モデレーター（管理操作）
   * - 4: 管理者（全ての操作）
   *
   * @type {number}
   * @example
   * ```typescript
   * // 権限チェックの例
   * function hasPermission(userRole: number, requiredRole: number): boolean {
   *   return userRole >= requiredRole;
   * }
   *
   * // 使用例
   * if (hasPermission(payload.role, 2)) {
   *   // パワーユーザー以上の操作を許可
   *   await performAdvancedOperation();
   * }
   *
   * // ミドルウェアでの権限チェック
   * if (payload.role < 3) {
   *   return new Response('権限が不足しています', { status: 403 });
   * }
   *
   * // 条件付きUI表示
   * {payload.role >= 4 && <AdminPanel />}
   * ```
   */
  role: number;
}

/**
 * 認証済みリクエスト型
 *
 * Next.js の NextRequest を拡張し、認証済みユーザー情報を含むリクエスト型です。
 * 認証ミドルウェアによって処理された後のリクエストオブジェクトで使用され、
 * API ルート内でユーザー情報に安全にアクセスできます。
 *
 * 拡張内容:
 * - user フィールドの追加（JWTPayload 型）
 * - 既存の NextRequest 機能の継承
 * - 型安全なユーザー情報アクセス
 *
 * @interface AuthenticatedRequest
 * @extends NextRequest
 *
 * @example
 * ```typescript
 * // API ルートでの使用例
 * export async function POST(request: AuthenticatedRequest) {
 *   // 認証済みユーザー情報への安全なアクセス
 *   const currentUser = request.user;
 *   console.log(`リクエスト送信者: ${currentUser.username}`);
 *   console.log(`ユーザーID: ${currentUser.userId}`);
 *   console.log(`権限レベル: ${currentUser.role}`);
 *
 *   // ユーザー固有の処理
 *   const userTodos = await getTodosByUserId(currentUser.userId);
 *
 *   return NextResponse.json({
 *     success: true,
 *     data: userTodos,
 *     message: `${currentUser.username}のタスク一覧`
 *   });
 * }
 *
 * // ミドルウェアでのリクエスト拡張
 * export function middleware(request: NextRequest) {
 *   const authResult = authMiddleware.authenticate(request);
 *
 *   if (authResult.success) {
 *     // リクエストオブジェクトにユーザー情報を追加
 *     const authenticatedRequest = request as AuthenticatedRequest;
 *     authenticatedRequest.user = authResult.user;
 *
 *     return NextResponse.next();
 *   }
 *
 *   return new Response('Unauthorized', { status: 401 });
 * }
 *
 * // 型安全なユーザー情報チェック
 * function requireAdminRole(request: AuthenticatedRequest) {
 *   if (request.user.role < 4) {
 *     throw new Error('管理者権限が必要です');
 *   }
 * }
 * ```
 */
export interface AuthenticatedRequest extends NextRequest {
  /**
   * 認証済みユーザー情報
   *
   * JWT トークンから抽出・検証されたユーザー情報です。
   * 認証ミドルウェアによってリクエストオブジェクトに追加され、
   * API ルート内でユーザー固有の処理を行う際に使用されます。
   *
   * @type {JWTPayload}
   * @example
   * ```typescript
   * // ユーザー固有データの取得
   * const userSpecificData = await fetchUserData(request.user.userId);
   *
   * // 権限ベースのアクセス制御
   * if (request.user.role >= 2) {
   *   await performPrivilegedOperation();
   * }
   *
   * // ログ記録
   * logger.info(`${request.user.username} が ${request.method} ${request.url} にアクセス`);
   * ```
   */
  user: JWTPayload;
}

/**
 * ミドルウェア認証結果型
 *
 * 認証ミドルウェアの処理結果を表現する判別共用体型です。
 * 認証の成功・失敗を型安全に表現し、TypeScript の型ガードにより
 * 適切な処理分岐を可能にします。
 *
 * 結果パターン:
 * - 成功: success: true, user: JWTPayload
 * - 失敗: success: false, error: string
 *
 * この型により、認証結果の処理時にコンパイル時の型チェックが行われ、
 * 実行時エラーを防止できます。
 *
 * @type MiddlewareAuthResult
 *
 * @example
 * ```typescript
 * // 認証ミドルウェアでの使用
 * function authenticate(request: NextRequest): MiddlewareAuthResult {
 *   try {
 *     const token = extractToken(request);
 *     const user = verifyToken(token);
 *
 *     return { success: true, user };
 *   } catch (error) {
 *     return { success: false, error: 'Invalid token' };
 *   }
 * }
 *
 * // API ルートでの結果処理
 * const authResult = authMiddleware.authenticate(request);
 *
 * if (authResult.success) {
 *   // TypeScript が user の存在を保証
 *   const userId = authResult.user.userId;
 *   const username = authResult.user.username;
 *   const role = authResult.user.role;
 *
 *   // 認証成功時の処理
 *   return await handleAuthenticatedRequest(authResult.user);
 * } else {
 *   // TypeScript が error の存在を保証
 *   console.error('認証エラー:', authResult.error);
 *
 *   return new Response(
 *     JSON.stringify({ error: authResult.error }),
 *     { status: 401 }
 *   );
 * }
 *
 * // 型ガードによる安全な処理
 * function processAuthResult(result: MiddlewareAuthResult) {
 *   if (result.success) {
 *     // この分岐では result.user が確実に存在
 *     logUserActivity(result.user);
 *   } else {
 *     // この分岐では result.error が確実に存在
 *     logAuthenticationFailure(result.error);
 *   }
 * }
 *
 * // 関数型での使用例
 * const handleAuth = (result: MiddlewareAuthResult) =>
 *   result.success
 *     ? `認証成功: ${result.user.username}`
 *     : `認証失敗: ${result.error}`;
 * ```
 */
export type MiddlewareAuthResult =
  | {
      /**
       * 認証成功フラグ
       * @type {true}
       */
      success: true;

      /**
       * 認証済みユーザー情報
       * JWT トークンから抽出された検証済みのユーザーデータ
       * @type {JWTPayload}
       */
      user: JWTPayload;
    }
  | {
      /**
       * 認証失敗フラグ
       * @type {false}
       */
      success: false;

      /**
       * 認証エラーメッセージ
       * 認証失敗の理由を示す詳細メッセージ
       * @type {string}
       * @example "No token provided", "Invalid token", "Token expired"
       */
      error: string;
    };

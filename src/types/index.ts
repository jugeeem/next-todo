/**
 * @fileoverview Types Module Entry Point
 *
 * このファイルは、`src/types` ディレクトリ配下のすべての型定義を
 * 統一的にエクスポートする中央集権的なエントリーポイントです。
 * アプリケーション全体で一貫した型インポートを可能にし、
 * 依存関係の管理と保守性を向上させます。
 *
 * 主な機能:
 * - 型定義の中央集権的管理
 * - 統一されたインポートパス
 * - 型の再エクスポートによる依存関係の簡素化
 * - 名前空間の整理と衝突回避
 *
 * 管理対象:
 * - API レスポンス型
 * - 認証・JWT 関連型
 * - バリデーションスキーマと型
 * - アプリケーション共通型
 *
 * 使用例:
 * - `import { ApiResponse, JWTPayload } from '@/types';`
 * - 型定義の一括インポート
 * - 開発者体験の向上
 *
 * @author jugeeem
 * @since 1.0.0
 */

// =====================================
// 認証関連の型定義
// =====================================

/**
 * JWT ペイロード型
 *
 * JWT トークンに含まれるユーザー情報の構造を定義します。
 * 認証システム全体で統一して使用されます。
 *
 * @see {@link module:auth.JWTPayload} 詳細な型定義
 * @example
 * ```typescript
 * import { JWTPayload } from '@/types';
 *
 * const payload: JWTPayload = {
 *   userId: "user_123",
 *   username: "john_doe",
 *   role: 1
 * };
 * ```
 */
/**
 * 認証済みリクエスト型
 *
 * Next.js リクエストを拡張し、認証済みユーザー情報を含む型です。
 * 保護されたAPI エンドポイントで使用されます。
 *
 * @see {@link module:auth.AuthenticatedRequest} 詳細な型定義
 * @example
 * ```typescript
 * import { AuthenticatedRequest } from '@/types';
 *
 * export async function POST(request: AuthenticatedRequest) {
 *   const userId = request.user.userId;
 *   // ...
 * }
 * ```
 */
/**
 * ミドルウェア認証結果型
 *
 * 認証ミドルウェアの処理結果を表現する判別共用体型です。
 * 型安全な認証処理分岐を提供します。
 *
 * @see {@link module:auth.MiddlewareAuthResult} 詳細な型定義
 * @example
 * ```typescript
 * import { MiddlewareAuthResult } from '@/types';
 *
 * const result: MiddlewareAuthResult = authMiddleware.authenticate(request);
 * if (result.success) {
 *   // result.user が利用可能
 * } else {
 *   // result.error が利用可能
 * }
 * ```
 */
export type { AuthenticatedRequest, JWTPayload, MiddlewareAuthResult } from './auth';

// =====================================
// API 応答関連の型定義
// =====================================

/**
 * 統一API レスポンス型
 *
 * アプリケーション全体で使用される標準的なAPI レスポンス形式です。
 * 成功・失敗状態とデータを型安全に表現します。
 *
 * @see {@link module:api.ApiResponse} 詳細な型定義
 * @example
 * ```typescript
 * import { ApiResponse } from '@/types';
 *
 * // 成功レスポンス
 * const success: ApiResponse<User> = {
 *   success: true,
 *   data: userData,
 *   message: "ユーザー取得成功"
 * };
 *
 * // エラーレスポンス
 * const error: ApiResponse = {
 *   success: false,
 *   error: "User not found",
 *   message: "ユーザーが見つかりません"
 * };
 * ```
 */
export type { ApiResponse } from './api';

// =====================================
// バリデーション関連の型定義とスキーマ
// =====================================

/**
 * ユーザー作成バリデーション型
 *
 * 新規ユーザー登録時の入力データ型です。
 * createUserSchema から推論された型安全な構造を提供します。
 *
 * @see {@link module:validation.CreateUserValidation} 詳細な型定義
 * @example
 * ```typescript
 * import { CreateUserValidation } from '@/types';
 *
 * const newUser: CreateUserValidation = {
 *   username: "john_doe",
 *   password: "securePassword",
 *   firstName: "John",
 *   lastName: "Doe"
 * };
 * ```
 */
/**
 * ユーザー更新バリデーション型
 *
 * 既存ユーザー情報更新時の入力データ型です。
 * すべての項目がオプションで、部分的な更新をサポートします。
 *
 * @see {@link module:validation.UpdateUserValidation} 詳細な型定義
 * @example
 * ```typescript
 * import { UpdateUserValidation } from '@/types';
 *
 * const updates: UpdateUserValidation = {
 *   firstName: "UpdatedName"
 *   // 他のフィールドは更新しない
 * };
 * ```
 */
/**
 * ログインバリデーション型
 *
 * ユーザー認証時の入力データ型です。
 * ユーザー名とパスワードの両方が必須です。
 *
 * @see {@link module:validation.LoginValidation} 詳細な型定義
 * @example
 * ```typescript
 * import { LoginValidation } from '@/types';
 *
 * const credentials: LoginValidation = {
 *   username: "john_doe",
 *   password: "userPassword"
 * };
 * ```
 */
/**
 * タスク作成バリデーション型
 *
 * 新規タスク作成時の入力データ型です。
 * タイトルが必須で、説明はオプションです。
 *
 * @see {@link module:validation.CreateTodoValidation} 詳細な型定義
 * @example
 * ```typescript
 * import { CreateTodoValidation } from '@/types';
 *
 * const newTodo: CreateTodoValidation = {
 *   title: "重要なタスク",
 *   descriptions: "詳細な説明"
 * };
 * ```
 */
/**
 * タスク更新バリデーション型
 *
 * 既存タスク更新時の入力データ型です。
 * すべての項目がオプションで、部分的な更新をサポートします。
 *
 * @see {@link module:validation.UpdateTodoValidation} 詳細な型定義
 * @example
 * ```typescript
 * import { UpdateTodoValidation } from '@/types';
 *
 * const updates: UpdateTodoValidation = {
 *   title: "更新されたタイトル"
 *   // descriptions は更新しない
 * };
 * ```
 */
export type {
  CreateTodoValidation,
  CreateUserValidation,
  LoginValidation,
  UpdateTodoValidation,
  UpdateUserValidation,
} from './validation';

// =====================================
// バリデーションスキーマの再エクスポート
// =====================================

/**
 * ユーザー作成バリデーションスキーマ
 *
 * Zod スキーマによる実行時バリデーション機能を提供します。
 * API エンドポイントやフォームでの入力検証に使用されます。
 *
 * @see {@link module:validation.createUserSchema} 詳細なスキーマ定義
 * @example
 * ```typescript
 * import { createUserSchema } from '@/types';
 *
 * try {
 *   const validData = createUserSchema.parse(formData);
 *   await createUser(validData);
 * } catch (error) {
 *   console.error('バリデーションエラー:', error.errors);
 * }
 * ```
 */
/**
 * ユーザー更新バリデーションスキーマ
 *
 * ユーザー情報の部分的な更新を検証するZodスキーマです。
 *
 * @see {@link module:validation.updateUserSchema} 詳細なスキーマ定義
 */
/**
 * ログインバリデーションスキーマ
 *
 * 認証時の入力データを検証するZodスキーマです。
 *
 * @see {@link module:validation.loginSchema} 詳細なスキーマ定義
 */
/**
 * タスク作成バリデーションスキーマ
 *
 * 新規タスク作成時の入力データを検証するZodスキーマです。
 *
 * @see {@link module:validation.createTodoSchema} 詳細なスキーマ定義
 */
/**
 * タスク更新バリデーションスキーマ
 *
 * タスク情報の部分的な更新を検証するZodスキーマです。
 *
 * @see {@link module:validation.updateTodoSchema} 詳細なスキーマ定義
 */
export {
  createTodoSchema,
  createUserSchema,
  loginSchema,
  updateTodoSchema,
  updateUserSchema,
} from './validation';

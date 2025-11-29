/**
 * @fileoverview バリデーション再エクスポートモジュール
 *
 * このファイルは、src/types/validation から型定義とスキーマを再エクスポートし、
 * 後方互換性を維持するためのレガシーエイリアスを提供します。
 *
 * 主な機能:
 * - types/validation からの型とスキーマの再エクスポート
 * - レガシーコードとの後方互換性維持
 * - 段階的な移行サポート
 * - 統一されたバリデーション インターフェース
 *
 * 移行状況:
 * - ✅ 型定義: src/types/validation に移動完了
 * - ✅ スキーマ定義: src/types/validation に移動完了
 * - ✅ 後方互換性: エイリアスで既存コードをサポート
 * - 🔄 段階的移行: 新しいインポートパスへの移行推奨
 *
 * @deprecated このモジュールは後方互換性のために提供されています
 * 新しいコードでは @/types/validation からの直接インポートを使用してください
 *
 * @author jugeeem
 * @since 1.0.0
 */

/**
 * レガシー型エイリアスの再エクスポート
 *
 * 既存のコードが引き続き動作するように、古い型名を新しい型名に
 * マッピングするエイリアスを提供します。
 *
 * @deprecated 新しいコードでは @/types/validation から直接インポートしてください
 *
 * @example
 * ```typescript
 * // レガシー方式（このファイル経由、非推奨）
 * import { CreateTodoInput, CreateUserInput } from '@/lib/validation';
 *
 * // 推奨方式（types/validation から直接）
 * import { CreateTodoValidation, CreateUserValidation } from '@/types/validation';
 *
 * // 両方とも同じ型を参照
 * const todoData: CreateTodoInput = { title: "タスク", userId: "user-123" };
 * const userData: CreateUserInput = { username: "user", password: "pass" };
 * ```
 */
// Re-export from types for backward compatibility

// Legacy aliases for backward compatibility
export type {
  CreateTodoValidation as CreateTodoInput,
  CreateUserValidation as CreateUserInput,
  LoginValidation as LoginInput,
  UpdateTodoValidation as UpdateTodoInput,
  UpdateUserValidation as UpdateUserInput,
} from '@/types/validation';

/**
 * 型定義とスキーマの再エクスポート
 *
 * src/types/validation で定義された全ての型とスキーマを再エクスポートします。
 * 新しいコードでは types/validation からの直接インポートを推奨しますが、
 * 移行期間中はこのモジュール経由でもアクセス可能です。
 *
 * エクスポート内容:
 * - 型定義: CreateTodoValidation, CreateUserValidation, LoginValidation, UpdateTodoValidation, UpdateUserValidation
 * - スキーマ: createTodoSchema, createUserSchema, loginSchema, updateTodoSchema, updateUserSchema
 *
 * @example
 * ```typescript
 * // 型定義の使用
 * import { CreateTodoValidation } from '@/lib/validation';
 *
 * const todoData: CreateTodoValidation = {
 *   title: "重要なタスク",
 *   descriptions: "詳細な説明",
 *   userId: "user-123"
 * };
 *
 * // スキーマの使用
 * import { createTodoSchema } from '@/lib/validation';
 *
 * const validationResult = createTodoSchema.safeParse(todoData);
 * if (validationResult.success) {
 *   console.log("バリデーション成功");
 * } else {
 *   console.error("バリデーションエラー:", validationResult.error);
 * }
 *
 * // 推奨: 直接インポート
 * import { CreateTodoValidation, createTodoSchema } from '@/types/validation';
 * ```
 */
export {
  type CreateTodoValidation,
  type CreateUserValidation,
  createTodoSchema,
  createUserSchema,
  type LoginValidation,
  loginSchema,
  type UpdateTodoValidation,
  type UpdateUserValidation,
  updateTodoSchema,
  updateUserSchema,
} from '@/types/validation';

/**
 * ユーザー別Todo一覧取得のページネーションパラメータバリデーションスキーマ
 *
 * ユーザー詳細画面でのTodo一覧取得APIにおけるクエリパラメータの
 * バリデーションを行います。ページネーション、フィルター、ソート機能を提供します。
 *
 * @example
 * ```typescript
 * // APIエンドポイントでの使用
 * const { searchParams } = new URL(request.url);
 * const queryParams = {
 *   page: searchParams.get('page'),
 *   perPage: searchParams.get('perPage'),
 *   completedFilter: searchParams.get('completedFilter'),
 *   sortBy: searchParams.get('sortBy'),
 *   sortOrder: searchParams.get('sortOrder'),
 * };
 *
 * const validationResult = UserTodosPaginationSchema.safeParse(queryParams);
 * if (!validationResult.success) {
 *   return error('Validation failed', 400, validationResult.error.issues);
 * }
 *
 * const { page, perPage, completedFilter, sortBy, sortOrder } = validationResult.data;
 * ```
 */
import { z } from 'zod';

export const UserTodosPaginationSchema = z.object({
  /**
   * ページ番号（1から開始）
   * デフォルト: 1
   */
  page: z.coerce
    .number()
    .int()
    .min(1, 'ページ番号は1以上である必要があります')
    .optional()
    .default(1),

  /**
   * 1ページあたりの件数（1〜100）
   * デフォルト: 10
   */
  perPage: z.coerce
    .number()
    .int()
    .min(1, '1ページあたりの件数は1以上である必要があります')
    .max(100, '1ページあたりの件数は100以下である必要があります')
    .optional()
    .default(10),

  /**
   * 完了状態フィルター
   * - 'all': 全件取得
   * - 'completed': 完了済みのみ
   * - 'incomplete': 未完了のみ
   * デフォルト: 'all'
   */
  completedFilter: z
    .enum(['all', 'completed', 'incomplete'])
    .optional()
    .default('all'),

  /**
   * ソート基準フィールド
   * - 'createdAt': 作成日時
   * - 'updatedAt': 更新日時
   * - 'title': タイトル
   * デフォルト: 'createdAt'
   */
  sortBy: z
    .enum(['createdAt', 'updatedAt', 'title'])
    .optional()
    .default('createdAt'),

  /**
   * ソート順序
   * - 'asc': 昇順
   * - 'desc': 降順
   * デフォルト: 'desc'
   */
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

/**
 * ユーザー別Todo一覧取得のページネーションパラメータ型
 */
export type UserTodosPaginationParams = z.infer<typeof UserTodosPaginationSchema>;

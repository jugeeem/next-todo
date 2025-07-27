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

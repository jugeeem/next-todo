/**
 * @fileoverview ユーザードメインエンティティ
 *
 * このファイルは、アプリケーションのユーザーに関するドメインモデルを定義します。
 * ドメイン駆動設計（DDD）のアプローチに従い、ビジネスロジックとデータ構造を
 * インフラストラクチャから独立して定義しています。
 *
 * @author jugeeem
 * @since 1.0.0
 */

/**
 * ユーザーエンティティ
 *
 * システム内のユーザーを表現するドメインエンティティです。
 * 認証、認可、プロフィール管理に必要な全ての情報を含みます。
 *
 * @interface User
 * @example
 * ```typescript
 * const user: User = {
 *   id: "550e8400-e29b-41d4-a716-446655440000",
 *   username: "john_doe",
 *   firstName: "John",
 *   firstNameRuby: "ジョン",
 *   lastName: "Doe",
 *   lastNameRuby: "ドウ",
 *   role: UserRole.USER,
 *   passwordHash: "$2a$10$...",
 *   createdAt: new Date("2024-01-01T00:00:00Z"),
 *   createdBy: "system",
 *   updatedAt: new Date("2024-01-01T00:00:00Z"),
 *   updatedBy: "system",
 *   deleted: false
 * };
 * ```
 */
export interface User {
  /** ユーザーの一意識別子（UUID v4形式） */
  id: string;

  /** ログイン用のユーザー名（重複不可、1-50文字） */
  username: string;

  /** 名前（任意、最大50文字） */
  firstName?: string;

  /** 名前のふりがな（任意、最大50文字） */
  firstNameRuby?: string;

  /** 姓（任意、最大50文字） */
  lastName?: string;

  /** 姓のふりがな（任意、最大50文字） */
  lastNameRuby?: string;

  /** ユーザーの権限レベル */
  role: UserRole;

  /** ハッシュ化されたパスワード（bcryptを使用） */
  passwordHash: string;

  /** 作成日時 */
  createdAt: Date;

  /** 作成者のユーザーID */
  createdBy: string;

  /** 最終更新日時 */
  updatedAt: Date;

  /** 最終更新者のユーザーID */
  updatedBy: string;

  /** 論理削除フラグ（true: 削除済み、false: 有効） */
  deleted: boolean;
}

/**
 * ユーザー権限レベル列挙型
 *
 * システム内でのユーザーの権限レベルを定義します。
 * ビットフラグ形式で設計されており、将来的な権限の組み合わせに対応可能です。
 *
 * @enum {number} UserRole
 * @example
 * ```typescript
 * // 管理者権限のチェック
 * if (user.role === UserRole.ADMIN) {
 *   // 管理者のみ実行可能な処理
 * }
 *
 * // 複数権限の組み合わせ（将来的な拡張）
 * const combinedRole = UserRole.MANAGER | UserRole.USER;
 * ```
 */
export enum UserRole {
  /** システム管理者：全機能へのアクセス権限 */
  ADMIN = 1,

  /** マネージャー：部門管理および高度な機能へのアクセス権限 */
  MANAGER = 2,

  /** 一般ユーザー：基本機能へのアクセス権限 */
  USER = 4,

  /** ゲストユーザー：読み取り専用アクセス権限 */
  GUEST = 8,
}

/**
 * ユーザー作成入力データ
 *
 * 新しいユーザーを作成する際に必要な入力データを定義します。
 * パスワードは平文で受け取り、サービス層でハッシュ化されます。
 *
 * @interface CreateUserInput
 * @example
 * ```typescript
 * const createUserData: CreateUserInput = {
 *   username: "new_user",
 *   firstName: "太郎",
 *   firstNameRuby: "タロウ",
 *   lastName: "山田",
 *   lastNameRuby: "ヤマダ",
 *   role: UserRole.USER,
 *   password: "securePassword123"
 * };
 * ```
 */
export interface CreateUserInput {
  /** ログイン用のユーザー名（必須、1-50文字、重複不可） */
  username: string;

  /** 名前（任意、最大50文字） */
  firstName?: string;

  /** 名前のふりがな（任意、最大50文字） */
  firstNameRuby?: string;

  /** 姓（任意、最大50文字） */
  lastName?: string;

  /** 姓のふりがな（任意、最大50文字） */
  lastNameRuby?: string;

  /** ユーザーの権限レベル（任意、デフォルト: USER） */
  role?: UserRole;

  /** 平文パスワード（必須、最小6文字） */
  password: string;
}

/**
 * ユーザー更新入力データ
 *
 * 既存ユーザーの情報を更新する際に使用するデータ構造です。
 * 全てのフィールドが任意であり、部分的な更新が可能です。
 * ユーザー名とパスワードは更新対象外です。
 *
 * @interface UpdateUserInput
 * @example
 * ```typescript
 * const updateData: UpdateUserInput = {
 *   firstName: "次郎",
 *   role: UserRole.MANAGER
 * };
 * ```
 */
export interface UpdateUserInput {
  /** 名前（任意、最大50文字） */
  firstName?: string;

  /** 名前のふりがな（任意、最大50文字） */
  firstNameRuby?: string;

  /** 姓（任意、最大50文字） */
  lastName?: string;

  /** 姓のふりがな（任意、最大50文字） */
  lastNameRuby?: string;

  /** ユーザーの権限レベル（任意） */
  role?: UserRole;
}

/**
 * ログイン入力データ
 *
 * ユーザー認証時に必要な入力データを定義します。
 *
 * @interface LoginInput
 * @example
 * ```typescript
 * const loginData: LoginInput = {
 *   username: "john_doe",
 *   password: "userPassword123"
 * };
 * ```
 */
export interface LoginInput {
  /** ログイン用のユーザー名（必須） */
  username: string;

  /** 平文パスワード（必須） */
  password: string;
}

/**
 * 認証結果データ
 *
 * 認証成功時に返されるデータ構造です。
 * セキュリティ上の理由から、パスワードハッシュは除外されます。
 *
 * @interface AuthResult
 * @example
 * ```typescript
 * const authResult: AuthResult = {
 *   user: {
 *     id: "550e8400-e29b-41d4-a716-446655440000",
 *     username: "john_doe",
 *     // ... other user properties except passwordHash
 *   },
 *   token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 * };
 * ```
 */
export interface AuthResult {
  /** パスワードハッシュを除いたユーザー情報 */
  user: Omit<User, 'passwordHash'>;

  /** JWT認証トークン */
  token: string;
}

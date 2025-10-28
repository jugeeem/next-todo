/**
 * @fileoverview ユーザーリポジトリインターフェース
 *
 * このファイルは、ユーザーデータの永続化に関するドメインレイヤーの
 * リポジトリパターンインターフェースを定義します。
 * ドメイン駆動設計（DDD）において、インフラストラクチャ層の実装から
 * ドメインロジックを分離する役割を果たします。
 *
 * @author jugeeem
 * @since 1.0.0
 */

import type { CreateUserInput, UpdateUserInput, User } from '../entities/User';

/**
 * ユーザー検索フィルタ条件
 */
export interface UserSearchFilters {
  /** ID検索 */
  id?: string;
  /** ユーザー名検索（部分一致） */
  username?: string;
  /** 名前検索（部分一致） */
  firstName?: string;
  /** 名前ふりがな検索（部分一致） */
  firstNameRuby?: string;
  /** 姓検索（部分一致） */
  lastName?: string;
  /** 姓ふりがな検索（部分一致） */
  lastNameRuby?: string;
  /** 権限レベル検索 */
  role?: number;
}

/**
 * ユーザーソート条件
 */
export interface UserSortOptions {
  /** ソート対象フィールド */
  sortBy:
    | 'id'
    | 'username'
    | 'firstName'
    | 'firstNameRuby'
    | 'lastName'
    | 'lastNameRuby'
    | 'role'
    | 'createdAt';
  /** ソート順序 */
  sortOrder: 'asc' | 'desc';
}

/**
 * ユーザーリポジトリインターフェース
 *
 * ユーザーエンティティに対するデータアクセス操作を定義します。
 * このインターフェースは、具体的なデータストア（PostgreSQL、MongoDB等）に
 * 依存しない抽象的な操作を提供します。
 *
 * 実装クラスは、インフラストラクチャ層で提供され、
 * 依存性注入によってアプリケーション層に注入されます。
 *
 * @interface UserRepository
 * @example
 * ```typescript
 * // 依存性注入の例
 * const userUseCase = new UserUseCase(userRepository);
 *
 * // リポジトリの使用例
 * const user = await userRepository.findById("user-123");
 * if (user) {
 *   console.log(`ユーザー名: ${user.username}`);
 * }
 * ```
 */
export interface UserRepository {
  /**
   * ユーザーIDによる単一ユーザー検索
   *
   * 指定されたIDのユーザーを検索します。
   * 論理削除されたユーザーは検索対象外です。
   *
   * @param id - 検索対象のユーザーID（UUID v4形式）
   * @returns ユーザーオブジェクト、または見つからない場合はnull
   * @throws {Error} データベース接続エラーまたはクエリエラー
   *
   * @example
   * ```typescript
   * const user = await userRepository.findById("550e8400-e29b-41d4-a716-446655440000");
   * if (user) {
   *   console.log(`ユーザー: ${user.username}`);
   * } else {
   *   console.log("ユーザーが見つかりません");
   * }
   * ```
   */
  findById(id: string): Promise<User | null>;

  /**
   * ユーザー名による単一ユーザー検索
   *
   * 指定されたユーザー名のユーザーを検索します。
   * 認証処理で主に使用されます。
   * 論理削除されたユーザーは検索対象外です。
   *
   * @param username - 検索対象のユーザー名
   * @returns ユーザーオブジェクト、または見つからない場合はnull
   * @throws {Error} データベース接続エラーまたはクエリエラー
   *
   * @example
   * ```typescript
   * const user = await userRepository.findByUsername("john_doe");
   * if (user) {
   *   // パスワード照合処理など
   *   const isValid = await bcrypt.compare(password, user.passwordHash);
   * }
   * ```
   */
  findByUsername(username: string): Promise<User | null>;

  /**
   * 新規ユーザー作成
   *
   * 新しいユーザーをデータストアに永続化します。
   * ユーザー名の重複チェックは実装層で行われます。
   *
   * @param input - ユーザー作成に必要なデータ
   * @returns 作成されたユーザーオブジェクト（ID、タイムスタンプ等が設定済み）
   * @throws {Error} ユーザー名重複エラー、データベースエラー等
   *
   * @example
   * ```typescript
   * const createData: CreateUserInput = {
   *   username: "new_user",
   *   firstName: "太郎",
   *   lastName: "山田",
   *   role: UserRole.USER,
   *   password: "plainPassword123"
   * };
   *
   * const newUser = await userRepository.create(createData);
   * console.log(`新規ユーザー作成: ${newUser.id}`);
   * ```
   */
  create(input: CreateUserInput): Promise<User>;

  /**
   * 既存ユーザー情報更新
   *
   * 指定されたIDのユーザー情報を更新します。
   * 部分更新をサポートし、指定されたフィールドのみが更新されます。
   *
   * @param id - 更新対象のユーザーID
   * @param input - 更新するデータ（部分更新対応）
   * @returns 更新されたユーザーオブジェクト、または対象が見つからない場合はnull
   * @throws {Error} データベース接続エラーまたは制約違反エラー
   *
   * @example
   * ```typescript
   * const updateData: UpdateUserInput = {
   *   firstName: "次郎",
   *   role: UserRole.MANAGER
   * };
   *
   * const updatedUser = await userRepository.update("user-123", updateData);
   * if (updatedUser) {
   *   console.log(`ユーザー更新完了: ${updatedUser.username}`);
   * }
   * ```
   */
  update(id: string, input: UpdateUserInput): Promise<User | null>;

  /**
   * ユーザー削除（物理削除）
   *
   * 指定されたIDのユーザーを物理削除します。
   * データベースから完全にレコードを削除するため、この操作は元に戻せません。
   * 関連するToDoデータはCASCADE設定により自動的に削除されます。
   *
   * @param id - 削除対象のユーザーID
   * @returns 削除処理が成功した場合はtrue、対象が見つからない場合はfalse
   * @throws {Error} データベース接続エラー
   *
   * @example
   * ```typescript
   * const deleted = await userRepository.delete("user-123");
   * if (deleted) {
   *   console.log("ユーザー削除完了");
   * } else {
   *   console.log("削除対象のユーザーが見つかりません");
   * }
   * ```
   *
   * @warning この操作は元に戻せません。関連データも含めて完全に削除されます。
   */
  delete(id: string): Promise<boolean>;

  /**
   * 全ユーザー一覧取得
   *
   * システム内の全ての有効なユーザー（論理削除されていない）を取得します。
   * 管理者機能での一覧表示等で使用されます。
   * 大量データ対応のため、将来的にページネーション対応を検討する必要があります。
   *
   * @returns 全ユーザーの配列
   * @throws {Error} データベース接続エラーまたはクエリエラー
   *
   * @example
   * ```typescript
   * const users = await userRepository.findAll();
   * console.log(`登録ユーザー数: ${users.length}`);
   *
   * // 権限別の集計
   * const adminCount = users.filter(u => u.role === UserRole.ADMIN).length;
   * console.log(`管理者数: ${adminCount}`);
   * ```
   *
   * @todo 大量データ対応のためのページネーション実装を検討
   */
  findAll(): Promise<User[]>;

  /**
   * ユーザー検索・フィルタリング・ソート
   *
   * 指定された条件に基づいてユーザーを検索し、ソートして返します。
   * 複数の検索条件を組み合わせてフィルタリングできます。
   *
   * @param filters - 検索フィルタ条件
   * @param sortOptions - ソート条件
   * @returns フィルタリング・ソートされたユーザーの配列
   * @throws {Error} データベース接続エラーまたはクエリエラー
   *
   * @example
   * ```typescript
   * // アクティブな管理者ユーザーを名前順で取得
   * const admins = await userRepository.findWithFilters(
   *   { deleted: false, role: 1 },
   *   { sortBy: 'first_name', sortOrder: 'asc' }
   * );
   *
   * // ユーザー名で検索
   * const users = await userRepository.findWithFilters(
   *   { username: 'john' },
   *   { sortBy: 'created_at', sortOrder: 'desc' }
   * );
   * ```
   */
  findWithFilters(
    filters: UserSearchFilters,
    sortOptions: UserSortOptions,
  ): Promise<User[]>;

  /**
   * ユーザーパスワード変更
   *
   * 指定されたIDのユーザーのパスワードを変更します。
   * 現在のパスワードの検証と新しいパスワードのハッシュ化を行います。
   * セキュリティ上、現在のパスワードの検証が必須です。
   *
   * @param id - 対象ユーザーのID
   * @param currentPassword - 現在のパスワード（プレーンテキスト）
   * @param newPassword - 新しいパスワード（プレーンテキスト）
   * @returns 更新されたユーザー情報、対象が見つからない場合はnull
   * @throws {Error} ユーザーが見つからない、現在のパスワードが間違っている等
   *
   * @example
   * ```typescript
   * try {
   *   const updatedUser = await userRepository.changePassword(
   *     "user-123",
   *     "currentPassword",
   *     "newSecurePassword123"
   *   );
   *   if (updatedUser) {
   *     console.log("パスワード変更完了");
   *   }
   * } catch (error) {
   *   if (error.message === "現在のパスワードが間違っています") {
   *     console.error("認証失敗");
   *   }
   * }
   * ```
   */
  changePassword(
    id: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<User | null>;
}

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
   * ユーザー削除（論理削除）
   *
   * 指定されたIDのユーザーを論理削除します。
   * データは物理的には削除されず、deletedフラグがtrueに設定されます。
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

/**
 * @fileoverview PostgreSQL ユーザーリポジトリ実装
 *
 * このファイルは、Userエンティティに対するPostgreSQLデータベースアクセスを実装します。
 * ドメイン層のUserRepositoryインターフェースを実装し、具体的なデータ永続化ロジックを提供します。
 *
 * 主な機能:
 * - ユーザーアカウントのCRUD操作（作成、読み取り、更新、削除）
 * - 認証用のユーザー名・パスワード検証
 * - bcryptによるセキュアなパスワードハッシュ化
 * - SQLインジェクション対策のパラメータ化クエリ
 * - データベース行からドメインエンティティへの型安全なマッピング
 *
 * @author jugeeem
 * @since 1.0.0
 */

import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import {
  type CreateUserInput,
  type UpdateUserInput,
  type User,
  UserRole,
} from '@/domain/entities/User';
import type {
  UserRepository,
  UserSearchFilters,
  UserSortOptions,
} from '@/domain/repositories/UserRepository';
import { database } from '@/infrastructure/database/connection';
import { dbNowJST, dbValueToJST } from '@/lib/date-utils';

/**
 * PostgreSQL ユーザーリポジトリ実装クラス
 *
 * ドメイン層のUserRepositoryインターフェースを実装し、PostgreSQLデータベースに対する
 * ユーザーデータの永続化処理を提供します。パスワードの安全なハッシュ化、
 * 認証情報の管理、データの整合性確保などの機能を含みます。
 *
 * セキュリティ機能:
 * - bcryptによるパスワードハッシュ化（ソルトラウンド: 10）
 * - SQLインジェクション対策のパラメータ化クエリ
 * - 論理削除による安全なデータ管理
 *
 * データベーススキーマ要件:
 * ```sql
 * CREATE TABLE users (
 *   id UUID PRIMARY KEY,
 *   username VARCHAR(50) UNIQUE NOT NULL,
 *   first_name VARCHAR(50),
 *   first_name_ruby VARCHAR(50),
 *   last_name VARCHAR(50),
 *   last_name_ruby VARCHAR(50),
 *   password_hash VARCHAR(255) NOT NULL,
 *   role INTEGER NOT NULL DEFAULT 4,
 *   created_at TIMESTAMP NOT NULL DEFAULT NOW(),
 *   created_by VARCHAR(255) NOT NULL DEFAULT 'system',
 *   updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
 *   updated_by VARCHAR(255) NOT NULL DEFAULT 'system',
 *   deleted BOOLEAN NOT NULL DEFAULT FALSE,
 *   INDEX idx_users_username (username),
 *   INDEX idx_users_role (role)
 * );
 * ```
 *
 * @class PostgresUserRepository
 * @implements {UserRepository}
 */
export class PostgresUserRepository implements UserRepository {
  /**
   * ID によるユーザー検索
   *
   * 指定されたIDのユーザー情報を取得します。論理削除されたユーザーは除外されます。
   * パスワードハッシュも含む完全なユーザー情報を返却するため、認証処理で主に使用されます。
   *
   * @param {string} id - 検索対象のユーザーID（UUID形式）
   * @returns {Promise<User | null>} ユーザー情報、見つからない場合はnull
   * @throws {Error} データベース接続エラーまたはクエリエラー
   *
   * @example
   * ```typescript
   * const repository = new PostgresUserRepository();
   * const user = await repository.findById('123e4567-e89b-12d3-a456-426614174000');
   * if (user) {
   *   console.log(`Found user: ${user.username}`);
   *   // パスワード認証等の処理が可能
   *   const isValid = await bcrypt.compare(inputPassword, user.passwordHash);
   * }
   * ```
   */
  async findById(id: string): Promise<User | null> {
    const query = `
      SELECT id, username, first_name, first_name_ruby, last_name, last_name_ruby, password_hash, role, created_at, created_by, updated_at, updated_by, deleted
      FROM users 
      WHERE id = $1 AND deleted = FALSE
    `;

    const result = await database.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToUser(result.rows[0]);
  }

  /**
   * ユーザー名によるユーザー検索
   *
   * 指定されたユーザー名のユーザー情報を取得します。論理削除されたユーザーは除外されます。
   * 認証処理で主に使用され、ログイン時のユーザー名確認とパスワード照合に使用されます。
   *
   * @param {string} username - 検索対象のユーザー名（1-50文字、一意）
   * @returns {Promise<User | null>} ユーザー情報、見つからない場合はnull
   * @throws {Error} データベース接続エラーまたはクエリエラー
   *
   * @example
   * ```typescript
   * const repository = new PostgresUserRepository();
   * const user = await repository.findByUsername('john_doe');
   * if (user) {
   *   // ログイン認証処理
   *   const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
   *   if (isPasswordValid) {
   *     console.log(`Login successful for user: ${user.username}`);
   *   }
   * } else {
   *   console.log('User not found');
   * }
   * ```
   */
  async findByUsername(username: string): Promise<User | null> {
    const query = `
      SELECT id, username, first_name, first_name_ruby, last_name, last_name_ruby, password_hash, role, created_at, created_by, updated_at, updated_by, deleted
      FROM users 
      WHERE username = $1 AND deleted = FALSE
    `;

    const result = await database.query(query, [username]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToUser(result.rows[0]);
  }

  /**
   * 新規ユーザー作成
   *
   * 新しいユーザーアカウントを作成します。パスワードは自動的にbcryptでハッシュ化され、
   * UUIDが自動生成されます。ユーザー名の重複チェックは呼び出し元で実行してください。
   *
   * @param {CreateUserInput} input - ユーザー作成入力データ
   * @param {string} input.username - ログイン用ユーザー名（必須、1-50文字、重複不可）
   * @param {string} [input.firstName] - 名前（任意、最大50文字）
   * @param {string} [input.firstNameRuby] - 名前のふりがな（任意、最大50文字）
   * @param {string} [input.lastName] - 姓（任意、最大50文字）
   * @param {string} [input.lastNameRuby] - 姓のふりがな（任意、最大50文字）
   * @param {UserRole} [input.role] - ユーザーの権限レベル（任意、デフォルト: USER）
   * @param {string} input.password - 平文パスワード（必須、最小6文字）
   * @returns {Promise<User>} 作成されたユーザー情報（ID、タイムスタンプ等が設定済み）
   * @throws {Error} ユーザー名重複エラー、データベースエラー等
   *
   * @example
   * ```typescript
   * const repository = new PostgresUserRepository();
   *
   * try {
   *   const newUser = await repository.create({
   *     username: 'new_user',
   *     firstName: '太郎',
   *     firstNameRuby: 'タロウ',
   *     lastName: '山田',
   *     lastNameRuby: 'ヤマダ',
   *     password: 'securePassword123',
   *     role: UserRole.USER
   *   });
   *   console.log(`新規ユーザー作成: ${newUser.id} (${newUser.username})`);
   * } catch (error) {
   *   console.error('ユーザー作成エラー:', error.message);
   * }
   * ```
   */
  async create(input: CreateUserInput): Promise<User> {
    const id = uuidv4();
    const hashedPassword = await bcrypt.hash(input.password, 12);
    const now = dbNowJST();

    const query = `
      INSERT INTO users (id, username, first_name, first_name_ruby, last_name, last_name_ruby, password_hash, role, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id, username, first_name, first_name_ruby, last_name, last_name_ruby, password_hash, role, created_at, created_by, updated_at, updated_by, deleted
    `;

    const values = [
      id,
      input.username,
      input.firstName || null,
      input.firstNameRuby || null,
      input.lastName || null,
      input.lastNameRuby || null,
      hashedPassword,
      input.role || UserRole.USER,
      now,
      now,
    ];

    const result = await database.query(query, values);
    return this.mapRowToUser(result.rows[0]);
  }

  /**
   * 既存ユーザー情報更新
   *
   * 指定されたIDのユーザー情報を更新します。部分更新をサポートし、
   * 指定されたフィールドのみが更新されます。ユーザー名とパスワードは更新対象外です。
   *
   * @param {string} id - 更新対象のユーザーID（UUID形式）
   * @param {UpdateUserInput} input - 更新するデータ（部分更新対応）
   * @param {string} [input.firstName] - 名前（任意、最大50文字）
   * @param {string} [input.firstNameRuby] - 名前のふりがな（任意、最大50文字）
   * @param {string} [input.lastName] - 姓（任意、最大50文字）
   * @param {string} [input.lastNameRuby] - 姓のふりがな（任意、最大50文字）
   * @param {UserRole} [input.role] - ユーザーの権限レベル（任意）
   * @returns {Promise<User | null>} 更新されたユーザー情報、対象が見つからない場合はnull
   * @throws {Error} データベース接続エラーまたは制約違反エラー
   *
   * @example
   * ```typescript
   * const repository = new PostgresUserRepository();
   *
   * // 部分更新の例
   * const updatedUser = await repository.update('user-id', {
   *   firstName: '次郎',
   *   role: UserRole.ADMIN
   * });
   *
   * if (updatedUser) {
   *   console.log(`ユーザー更新完了: ${updatedUser.username}`);
   *   console.log(`新しい権限: ${updatedUser.role}`);
   * } else {
   *   console.log('更新対象のユーザーが見つかりません');
   * }
   * ```
   */
  async update(id: string, input: UpdateUserInput): Promise<User | null> {
    const updateFields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (input.firstName !== undefined) {
      updateFields.push(`first_name = $${paramIndex++}`);
      values.push(input.firstName);
    }

    if (input.firstNameRuby !== undefined) {
      updateFields.push(`first_name_ruby = $${paramIndex++}`);
      values.push(input.firstNameRuby);
    }

    if (input.lastName !== undefined) {
      updateFields.push(`last_name = $${paramIndex++}`);
      values.push(input.lastName);
    }

    if (input.lastNameRuby !== undefined) {
      updateFields.push(`last_name_ruby = $${paramIndex++}`);
      values.push(input.lastNameRuby);
    }

    if (input.role !== undefined) {
      updateFields.push(`role = $${paramIndex++}`);
      values.push(input.role);
    }

    if (updateFields.length === 0) {
      return this.findById(id);
    }

    updateFields.push(`updated_at = $${paramIndex++}`);
    values.push(dbNowJST());

    values.push(id);

    const query = `
      UPDATE users 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex} AND deleted = FALSE
      RETURNING id, username, first_name, first_name_ruby, last_name, last_name_ruby, password_hash, role, created_at, created_by, updated_at, updated_by, deleted
    `;

    const result = await database.query(query, values);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToUser(result.rows[0]);
  }

  /**
   * ユーザー削除（物理削除）
   *
   * 指定されたIDのユーザーを物理削除します。
   * データベースから完全にレコードを削除するため、この操作は元に戻せません。
   * 関連するToDoデータはCASCADE設定により自動的に削除されます。
   *
   * @param {string} id - 削除対象のユーザーID（UUID形式）
   * @returns {Promise<boolean>} 削除が成功した場合true、対象が見つからない場合false
   * @throws {Error} データベース接続エラー
   *
   * @example
   * ```typescript
   * const repository = new PostgresUserRepository();
   *
   * const deleted = await repository.delete('123e4567-e89b-12d3-a456-426614174000');
   * if (deleted) {
   *   console.log('ユーザー削除完了');
   * } else {
   *   console.log('削除対象のユーザーが見つかりません');
   * }
   *
   * // 削除後の確認
   * const user = await repository.findById('123e4567-e89b-12d3-a456-426614174000');
   * console.log(user); // null（物理削除により完全に削除）
   * ```
   *
   * @warning この操作は元に戻せません。関連データも含めて完全に削除されます。
   */
  async delete(id: string): Promise<boolean> {
    const query = `
      DELETE FROM users 
      WHERE id = $1 AND deleted = FALSE
    `;

    const result = await database.query(query, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * 全ユーザー一覧取得
   *
   * システム内の全ての有効なユーザー（論理削除されていない）を取得します。
   * 管理者機能での一覧表示等で使用されます。パスワードハッシュも含む完全なユーザー情報を返却します。
   * 大量データ対応のため、将来的にページネーション対応を検討する必要があります。
   *
   * @returns {Promise<User[]>} 全ユーザーの配列（作成日時の降順でソート）
   * @throws {Error} データベース接続エラーまたはクエリエラー
   *
   * @example
   * ```typescript
   * const repository = new PostgresUserRepository();
   *
   * const users = await repository.findAll();
   * console.log(`登録ユーザー数: ${users.length}`);
   *
   * // 権限別の集計
   * const adminCount = users.filter(u => u.role === UserRole.ADMIN).length;
   * const userCount = users.filter(u => u.role === UserRole.USER).length;
   * console.log(`管理者: ${adminCount}人, 一般ユーザー: ${userCount}人`);
   *
   * // 最新の登録ユーザー
   * if (users.length > 0) {
   *   console.log(`最新登録ユーザー: ${users[0].username}`);
   * }
   * ```
   *
   * @todo 大量データ対応のためのページネーション実装を検討
   */
  async findAll(): Promise<User[]> {
    const query = `
      SELECT id, username, first_name, first_name_ruby, last_name, last_name_ruby, password_hash, role, created_at, created_by, updated_at, updated_by, deleted
      FROM users 
      WHERE deleted = FALSE
      ORDER BY created_at DESC
    `;

    const result = await database.query(query);
    return result.rows.map((row: Record<string, unknown>) => this.mapRowToUser(row));
  }

  /**
   * ユーザー検索・フィルタリング・ソート
   *
   * 指定された条件に基づいてユーザーを検索し、ソートして返します。
   * WHERE句を動的に構築し、複数の検索条件を組み合わせてフィルタリングします。
   * 削除済みユーザーは常に除外されます。
   *
   * @param filters - 検索フィルタ条件
   * @param sortOptions - ソート条件
   * @returns フィルタリング・ソートされたユーザーの配列
   * @throws {Error} データベース接続エラーまたはクエリエラー
   *
   * @example
   * ```typescript
   * const repository = new PostgresUserRepository();
   *
   * // 管理者ユーザーを名前順で取得
   * const admins = await repository.findWithFilters(
   *   { role: 1 },
   *   { sortBy: 'firstName', sortOrder: 'asc' }
   * );
   *
   * // ユーザー名で部分検索
   * const users = await repository.findWithFilters(
   *   { username: 'john' },
   *   { sortBy: 'createdAt', sortOrder: 'desc' }
   * );
   * ```
   */
  async findWithFilters(
    filters: UserSearchFilters,
    sortOptions: UserSortOptions,
  ): Promise<User[]> {
    const whereClauses: string[] = ['deleted = FALSE'];
    const values: unknown[] = [];
    let paramIndex = 1;

    // ID検索
    if (filters.id) {
      whereClauses.push(`id = $${paramIndex++}`);
      values.push(filters.id);
    }

    // ユーザー名検索（部分一致）
    if (filters.username) {
      whereClauses.push(`username ILIKE $${paramIndex++}`);
      values.push(`%${filters.username}%`);
    }

    // 名前検索（部分一致）
    if (filters.firstName) {
      whereClauses.push(`first_name ILIKE $${paramIndex++}`);
      values.push(`%${filters.firstName}%`);
    }

    // 名前ふりがな検索（部分一致）
    if (filters.firstNameRuby) {
      whereClauses.push(`first_name_ruby ILIKE $${paramIndex++}`);
      values.push(`%${filters.firstNameRuby}%`);
    }

    // 姓検索（部分一致）
    if (filters.lastName) {
      whereClauses.push(`last_name ILIKE $${paramIndex++}`);
      values.push(`%${filters.lastName}%`);
    }

    // 姓ふりがな検索（部分一致）
    if (filters.lastNameRuby) {
      whereClauses.push(`last_name_ruby ILIKE $${paramIndex++}`);
      values.push(`%${filters.lastNameRuby}%`);
    }

    // 権限レベル検索
    if (filters.role !== undefined) {
      whereClauses.push(`role = $${paramIndex++}`);
      values.push(filters.role);
    }

    // WHERE句の構築
    const whereClause =
      whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // camelCaseをsnake_caseに変換
    const sortByMap: Record<string, string> = {
      id: 'id',
      username: 'username',
      firstName: 'first_name',
      firstNameRuby: 'first_name_ruby',
      lastName: 'last_name',
      lastNameRuby: 'last_name_ruby',
      role: 'role',
      createdAt: 'created_at',
    };

    const dbSortBy = sortByMap[sortOptions.sortBy] || sortOptions.sortBy;

    // ORDER BY句の構築
    const orderByClause = `ORDER BY ${dbSortBy} ${sortOptions.sortOrder.toUpperCase()}`;

    // クエリの実行
    const query = `
      SELECT id, username, first_name, first_name_ruby, last_name, last_name_ruby, password_hash, role, created_at, created_by, updated_at, updated_by, deleted
      FROM users 
      ${whereClause}
      ${orderByClause}
    `;

    const result = await database.query(query, values);
    return result.rows.map((row: Record<string, unknown>) => this.mapRowToUser(row));
  }

  /**
   * ユーザーパスワード変更
   *
   * 指定されたIDのユーザーのパスワードを変更します。
   * セキュリティ上、現在のパスワードの検証を行ってから新しいパスワードに変更します。
   * 新しいパスワードは自動的にbcryptでハッシュ化されます。
   *
   * @param {string} id - 対象ユーザーのID（UUID形式）
   * @param {string} currentPassword - 現在のパスワード（プレーンテキスト）
   * @param {string} newPassword - 新しいパスワード（プレーンテキスト）
   * @returns {Promise<User | null>} 更新されたユーザー情報、対象が見つからない場合はnull
   * @throws {Error} ユーザーが見つからない、現在のパスワードが間違っている等
   *
   * @example
   * ```typescript
   * const repository = new PostgresUserRepository();
   *
   * try {
   *   const updatedUser = await repository.changePassword(
   *     'user-id-123',
   *     'currentPassword',
   *     'newSecurePassword123'
   *   );
   *
   *   if (updatedUser) {
   *     console.log(`パスワード変更完了: ${updatedUser.username}`);
   *   } else {
   *     console.log('ユーザーが見つかりません');
   *   }
   * } catch (error) {
   *   if (error.message === '現在のパスワードが間違っています') {
   *     console.error('認証失敗: 現在のパスワードが正しくありません');
   *   } else {
   *     console.error('パスワード変更エラー:', error.message);
   *   }
   * }
   * ```
   *
   * @security
   * - 現在のパスワードを bcrypt で検証
   * - 新しいパスワードを bcrypt でハッシュ化（ソルトラウンド: 10）
   * - SQLインジェクション対策のパラメータ化クエリ
   * - 論理削除されたユーザーは更新対象外
   */
  async changePassword(
    id: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<User | null> {
    // ユーザー情報を取得（パスワードハッシュ含む）
    const user = await this.findById(id);

    if (!user) {
      throw new Error('ユーザーが見つかりません');
    }

    // 現在のパスワードを検証
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash,
    );

    if (!isCurrentPasswordValid) {
      throw new Error('現在のパスワードが間違っています');
    }

    // 新しいパスワードをハッシュ化
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // パスワードを更新
    const query = `
      UPDATE users 
      SET password_hash = $1, updated_at = $2
      WHERE id = $3 AND deleted = FALSE
      RETURNING id, username, first_name, first_name_ruby, last_name, last_name_ruby, password_hash, role, created_at, created_by, updated_at, updated_by, deleted
    `;

    const result = await database.query(query, [newPasswordHash, dbNowJST(), id]);

    if (result.rows.length === 0) {
      throw new Error('パスワードの更新に失敗しました');
    }

    return this.mapRowToUser(result.rows[0]);
  }

  /**
   * データベース行をUserエンティティにマッピング
   *
   * PostgreSQLクエリ結果の行データを、ドメインエンティティのUser型に変換します。
   * データベースのsnake_case命名からTypeScriptのcamelCase命名に変換し、
   * 適切な型キャストを行います。パスワードハッシュも含む完全なユーザー情報を生成します。
   *
   * データベース列とエンティティプロパティのマッピング:
   * - id → id (UUID文字列)
   * - username → username (文字列)
   * - first_name → firstName (文字列 | undefined)
   * - first_name_ruby → firstNameRuby (文字列 | undefined)
   * - last_name → lastName (文字列 | undefined)
   * - last_name_ruby → lastNameRuby (文字列 | undefined)
   * - password_hash → passwordHash (文字列)
   * - role → role (UserRole enum)
   * - created_at → createdAt (Date)
   * - created_by → createdBy (文字列)
   * - updated_at → updatedAt (Date)
   * - updated_by → updatedBy (文字列)
   * - deleted → deleted (boolean)
   *
   * @private
   * @param {Record<string, unknown>} row - PostgreSQLクエリ結果の行データ
   * @returns {User} マッピングされたUserエンティティ
   *
   * @example
   * ```typescript
   * // データベースクエリ結果の例
   * const dbRow = {
   *   id: '123e4567-e89b-12d3-a456-426614174000',
   *   username: 'john_doe',
   *   first_name: '太郎',
   *   first_name_ruby: 'タロウ',
   *   last_name: '山田',
   *   last_name_ruby: 'ヤマダ',
   *   password_hash: '$2a$10$...',
   *   role: 4, // UserRole.USER
   *   created_at: '2024-01-01T00:00:00Z',
   *   created_by: 'system',
   *   updated_at: '2024-01-01T00:00:00Z',
   *   updated_by: 'system',
   *   deleted: false
   * };
   *
   * // マッピング結果
   * const user = this.mapRowToUser(dbRow);
   * // user.firstName === '太郎'
   * // user.role === UserRole.USER
   * // user.createdAt instanceof Date === true
   * ```
   */
  private mapRowToUser(row: Record<string, unknown>): User {
    return {
      id: row.id as string,
      username: row.username as string,
      firstName: row.first_name as string | undefined,
      firstNameRuby: row.first_name_ruby as string | undefined,
      lastName: row.last_name as string | undefined,
      lastNameRuby: row.last_name_ruby as string | undefined,
      passwordHash: row.password_hash as string,
      role: row.role as UserRole,
      createdAt: dbValueToJST(row.created_at) ?? dbNowJST(),
      createdBy: row.created_by as string,
      updatedAt: dbValueToJST(row.updated_at) ?? dbNowJST(),
      updatedBy: row.updated_by as string,
      deleted: row.deleted as boolean,
    };
  }
}

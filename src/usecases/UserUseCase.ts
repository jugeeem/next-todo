/**
 * @fileoverview ユーザー管理ユースケース
 *
 * このファイルは、ユーザー管理に関するビジネスロジックを実装します。
 * Clean Architecture のユースケース層として、ドメインエンティティと
 * リポジトリを組み合わせて、ユーザー管理機能の核となる処理を提供します。
 *
 * 主な機能:
 * - ユーザー一覧取得（管理者権限）
 * - 個別ユーザー情報取得
 * - ユーザー情報更新
 * - ユーザー削除（論理削除）
 * - 新規ユーザー作成（管理者権限）
 *
 * セキュリティ特徴:
 * - パスワードハッシュの適切な除外
 * - 権限チェック（管理者権限の検証）
 * - ユーザー名重複チェック
 * - 安全なユーザー情報レスポンス
 *
 * 使用例:
 * - API ルートでのユーザー管理処理
 * - 管理者向けユーザー管理機能
 * - プロフィール情報更新
 *
 * @author jugeeem
 * @since 1.0.0
 */

import bcrypt from 'bcryptjs';
import type { CreateUserInput, UpdateUserInput, User } from '@/domain/entities/User';
import type {
  UserRepository,
  UserSearchFilters,
  UserSortOptions,
} from '@/domain/repositories/UserRepository';
import { dbNowJST } from '@/lib/date-utils';

/**
 * 安全なユーザー情報型（パスワードハッシュを除外）
 */
export type SafeUser = Omit<User, 'passwordHash'>;

/**
 * 管理者用ユーザー更新入力データ（パスワード更新を含む）
 */
export interface AdminUpdateUserInput extends UpdateUserInput {
  /** パスワード更新（任意、管理者のみ） */
  password?: string;
  /** ユーザー名更新（任意、管理者のみ） */
  username?: string;
}

/**
 * ユーザー管理ユースケースクラス
 *
 * ユーザー管理に関する全てのビジネスロジックを管理するクラスです。
 * Clean Architecture の原則に従い、ドメイン層とインフラストラクチャ層を
 * 橋渡しし、ユーザー管理機能の中核となる処理を提供します。
 *
 * アーキテクチャ特徴:
 * - 依存性注入による疎結合設計
 * - ドメインエンティティの活用
 * - リポジトリパターンによるデータアクセス抽象化
 * - セキュリティを考慮したデータレスポンス
 *
 * セキュリティ機能:
 * - パスワードハッシュの外部非公開
 * - ユーザー名重複チェック
 * - 権限ベースアクセス制御
 * - 適切なエラーハンドリング
 *
 * @class UserUseCase
 *
 * @example
 * ```typescript
 * // 依存性注入コンテナでの使用例
 * const userUseCase = new UserUseCase(userRepository);
 *
 * // ユーザー一覧取得
 * const users = await userUseCase.getAllUsers();
 *
 * // 個別ユーザー取得
 * const user = await userUseCase.getUserById("user_123");
 *
 * // ユーザー更新
 * const updatedUser = await userUseCase.updateUser("user_123", {
 *   firstName: "新しい名前"
 * });
 * ```
 */
export class UserUseCase {
  /**
   * ユーザーリポジトリインスタンス
   *
   * ユーザーデータの永続化と取得を担当するリポジトリです。
   * データベースアクセスを抽象化し、ビジネスロジックから
   * データストレージの詳細を隠蔽します。
   *
   * @private
   * @readonly
   */
  private userRepository: UserRepository;

  /**
   * UserUseCase コンストラクタ
   *
   * 依存性注入により必要なサービスを受け取り、
   * ユーザー管理ユースケースのインスタンスを初期化します。
   *
   * @param {UserRepository} userRepository - ユーザーデータアクセス用リポジトリ
   *
   * @example
   * ```typescript
   * // コンテナからの依存性注入
   * const container = Container.getInstance();
   * const userUseCase = new UserUseCase(container.userRepository);
   * ```
   */
  constructor(userRepository: UserRepository) {
    this.userRepository = userRepository;
  }

  /**
   * 全ユーザー取得処理
   *
   * システム内の全ユーザーを取得し、パスワードハッシュを除外した
   * 安全なユーザー情報のリストを返します。
   * 管理者権限でのみ利用可能な機能です。
   *
   * セキュリティ考慮事項:
   * - パスワードハッシュの自動除外
   * - 論理削除されたユーザーの除外
   * - 安全なレスポンス形式の保証
   *
   * @returns {Promise<SafeUser[]>} パスワードハッシュを除外したユーザー一覧
   *
   * @throws {Error} データベースアクセスエラー時
   *
   * @example
   * ```typescript
   * try {
   *   const users = await userUseCase.getAllUsers();
   *   console.log(`ユーザー数: ${users.length}`);
   *   users.forEach(user => {
   *     console.log(`${user.username} (${user.role})`);
   *   });
   * } catch (error) {
   *   console.error('ユーザー一覧取得エラー:', error);
   * }
   * ```
   */
  async getAllUsers(): Promise<SafeUser[]> {
    const users = await this.userRepository.findAll();

    return users.map((user: User) => {
      const { passwordHash, ...safeUser } = user;
      return safeUser;
    });
  }

  /**
   * ユーザー検索・フィルタリング・ソート取得処理
   *
   * 指定された条件に基づいてユーザーを検索し、ソートした結果を取得します。
   * パスワードハッシュを除外した安全なユーザー情報のリストを返します。
   *
   * @param filters - 検索フィルタ条件
   * @param sortOptions - ソート条件
   * @returns パスワードハッシュを除外したユーザー一覧
   * @throws {Error} データベースアクセスエラー時
   *
   * @example
   * ```typescript
   * // アクティブな管理者ユーザーを取得
   * const admins = await userUseCase.getUsersWithFilters(
   *   { deleted: false, role: 1 },
   *   { sortBy: 'first_name', sortOrder: 'asc' }
   * );
   *
   * // ユーザー名で検索
   * const users = await userUseCase.getUsersWithFilters(
   *   { username: 'john' },
   *   { sortBy: 'created_at', sortOrder: 'desc' }
   * );
   * ```
   */
  async getUsersWithFilters(
    filters: UserSearchFilters,
    sortOptions: UserSortOptions,
  ): Promise<SafeUser[]> {
    const users = await this.userRepository.findWithFilters(filters, sortOptions);

    return users.map((user: User) => {
      const { passwordHash, ...safeUser } = user;
      return safeUser;
    });
  }

  /**
   * 個別ユーザー取得処理
   *
   * 指定されたIDのユーザー情報を取得し、パスワードハッシュを除外した
   * 安全なユーザー情報を返します。
   *
   * セキュリティ考慮事項:
   * - パスワードハッシュの自動除外
   * - 存在しないユーザーへの適切な対応
   * - 論理削除されたユーザーの除外
   *
   * @param {string} id - 取得対象ユーザーのID
   * @returns {Promise<SafeUser | null>} パスワードハッシュを除外したユーザー情報、または null
   *
   * @throws {Error} データベースアクセスエラー時
   *
   * @example
   * ```typescript
   * try {
   *   const user = await userUseCase.getUserById("user_123");
   *   if (user) {
   *     console.log(`ユーザー名: ${user.username}`);
   *     console.log(`権限: ${user.role}`);
   *   } else {
   *     console.log('ユーザーが見つかりませんでした');
   *   }
   * } catch (error) {
   *   console.error('ユーザー取得エラー:', error);
   * }
   * ```
   */
  async getUserById(id: string): Promise<SafeUser | null> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      return null;
    }

    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  /**
   * ユーザー情報更新処理（一般ユーザー向け）
   *
   * 指定されたIDのユーザー情報を更新し、パスワードハッシュを除外した
   * 更新後のユーザー情報を返します。
   * パスワードやユーザー名の更新は含まれません。
   *
   * @param {string} id - 更新対象ユーザーのID
   * @param {UpdateUserInput} input - 更新情報
   * @returns {Promise<SafeUser>} パスワードハッシュを除外した更新後のユーザー情報
   *
   * @throws {Error} ユーザーが存在しない場合
   * @throws {Error} データベースアクセスエラー時
   */
  async updateUser(id: string, input: UpdateUserInput): Promise<SafeUser> {
    const existingUser = await this.userRepository.findById(id);
    if (!existingUser) {
      throw new Error('ユーザーが見つかりません');
    }

    const updatedUser = await this.userRepository.update(id, input);

    if (!updatedUser) {
      throw new Error('ユーザーの更新に失敗しました');
    }

    const { passwordHash, ...safeUser } = updatedUser;
    return safeUser;
  }

  /**
   * ユーザー情報更新処理（管理者向け）
   *
   * 管理者権限でユーザー情報を更新します。
   * パスワードやユーザー名の更新も可能です。
   * パスワードが含まれる場合は自動的にハッシュ化されます。
   *
   * セキュリティ考慮事項:
   * - パスワードの自動ハッシュ化
   * - パスワードハッシュの外部非公開
   * - 適切な入力検証
   *
   * @param {string} id - 更新対象ユーザーのID
   * @param {AdminUpdateUserInput} input - 更新情報
   * @returns {Promise<SafeUser>} パスワードハッシュを除外した更新後のユーザー情報
   *
   * @throws {Error} ユーザーが存在しない場合
   * @throws {Error} データベースアクセスエラー時
   *
   * @example
   * ```typescript
   * try {
   *   const updatedUser = await userUseCase.updateUserAsAdmin("user_123", {
   *     firstName: "新しい名前",
   *     password: "newPassword123"
   *   });
   *   console.log(`更新完了: ${updatedUser.username}`);
   * } catch (error) {
   *   console.error('ユーザー更新エラー:', error);
   * }
   * ```
   */
  async updateUserAsAdmin(id: string, input: AdminUpdateUserInput): Promise<SafeUser> {
    const existingUser = await this.userRepository.findById(id);
    if (!existingUser) {
      throw new Error('ユーザーが見つかりません');
    }

    // 基本的な更新データ
    const basicUpdate: UpdateUserInput = {
      firstName: input.firstName,
      firstNameRuby: input.firstNameRuby,
      lastName: input.lastName,
      lastNameRuby: input.lastNameRuby,
      role: input.role,
    };

    // 基本情報を更新
    let updatedUser = await this.userRepository.update(id, basicUpdate);

    if (!updatedUser) {
      throw new Error('ユーザーの更新に失敗しました');
    }

    // パスワード更新が指定されている場合
    if (input.password) {
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(input.password, saltRounds);

      // パスワードハッシュを直接データベースで更新
      const query = `
        UPDATE users 
        SET password_hash = $1, updated_at = $2
        WHERE id = $3 AND deleted = FALSE
      `;

      const db = await import('@/infrastructure/database/connection');
      await db.database.query(query, [passwordHash, dbNowJST(), id]);

      // 更新後のユーザー情報を取得
      updatedUser = await this.userRepository.findById(id);
      if (!updatedUser) {
        throw new Error('ユーザーの更新後の取得に失敗しました');
      }
    }

    // ユーザー名更新が指定されている場合
    if (input.username && input.username !== existingUser.username) {
      // ユーザー名の重複チェック
      const existingByUsername = await this.userRepository.findByUsername(
        input.username,
      );
      if (existingByUsername && existingByUsername.id !== id) {
        throw new Error('このユーザー名は既に使用されています');
      }

      // ユーザー名を直接データベースで更新
      const query = `
        UPDATE users 
        SET username = $1, updated_at = $2
        WHERE id = $3 AND deleted = FALSE
      `;

      const db = await import('@/infrastructure/database/connection');
      await db.database.query(query, [input.username, dbNowJST(), id]);

      // 更新後のユーザー情報を取得
      updatedUser = await this.userRepository.findById(id);
      if (!updatedUser) {
        throw new Error('ユーザーの更新後の取得に失敗しました');
      }
    }

    const { passwordHash, ...safeUser } = updatedUser;
    return safeUser;
  }

  /**
   * ユーザー削除処理（物理削除）
   *
   * 指定されたIDのユーザーを物理削除します。
   * データベースから完全にレコードを削除するため、この操作は元に戻せません。
   * 関連するToDoデータはCASCADE設定により自動的に削除されます。
   *
   * @param {string} id - 削除対象ユーザーのID
   * @returns {Promise<void>}
   *
   * @throws {Error} ユーザーが存在しない場合
   * @throws {Error} データベースアクセスエラー時
   *
   * @example
   * ```typescript
   * try {
   *   await userUseCase.deleteUser("user_123");
   *   console.log('ユーザーを削除しました');
   * } catch (error) {
   *   console.error('ユーザー削除エラー:', error);
   * }
   * ```
   *
   * @warning この操作は元に戻せません。関連データも含めて完全に削除されます。
   */
  async deleteUser(id: string): Promise<void> {
    const existingUser = await this.userRepository.findById(id);
    if (!existingUser) {
      throw new Error('ユーザーが見つかりません');
    }

    await this.userRepository.delete(id);
  }

  /**
   * 新規ユーザー作成処理
   *
   * 新しいユーザーアカウントを作成します。
   * ユーザー名の重複チェックとパスワードのハッシュ化を自動的に行い、
   * パスワードハッシュを除外した安全なユーザー情報を返します。
   *
   * 処理フロー:
   * 1. ユーザー名の重複チェック
   * 2. パスワードのハッシュ化
   * 3. 新規ユーザーの作成
   * 4. パスワードハッシュを除外したレスポンス
   *
   * セキュリティ考慮事項:
   * - bcrypt による安全なパスワードハッシュ化
   * - ユーザー名の一意性保証
   * - パスワードハッシュの外部非公開
   *
   * @param {CreateUserInput} input - 新規ユーザー情報
   * @returns {Promise<SafeUser>} パスワードハッシュを除外した作成されたユーザー情報
   *
   * @throws {Error} ユーザー名が既に存在する場合
   * @throws {Error} データベースアクセスエラー時
   *
   * @example
   * ```typescript
   * try {
   *   const newUser = await userUseCase.createUser({
   *     username: "new_employee",
   *     firstName: "太郎",
   *     lastName: "田中",
   *     password: "securePassword123",
   *     role: 4
   *   });
   *   console.log(`新規ユーザー作成: ${newUser.username}`);
   * } catch (error) {
   *   console.error('ユーザー作成エラー:', error);
   * }
   * ```
   */
  async createUser(input: CreateUserInput): Promise<SafeUser> {
    // ユーザー名の重複チェック
    const existingUser = await this.userRepository.findByUsername(input.username);
    if (existingUser) {
      throw new Error('このユーザー名は既に使用されています');
    }

    // パスワードのハッシュ化
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(input.password, saltRounds);

    // 新規ユーザー作成
    const newUser = await this.userRepository.create({
      ...input,
      password: passwordHash,
    });

    // パスワードハッシュを除外してレスポンス
    const { passwordHash: _unused, ...safeUser } = newUser;
    return safeUser;
  }

  /**
   * ユーザー名による検索処理
   *
   * 指定されたユーザー名でユーザーを検索し、パスワードハッシュを除外した
   * 安全なユーザー情報を返します。
   *
   * @param {string} username - 検索対象のユーザー名
   * @returns {Promise<SafeUser | null>} パスワードハッシュを除外したユーザー情報、または null
   *
   * @throws {Error} データベースアクセスエラー時
   *
   * @example
   * ```typescript
   * try {
   *   const user = await userUseCase.getUserByUsername("john_doe");
   *   if (user) {
   *     console.log(`ユーザーID: ${user.id}`);
   *     console.log(`権限: ${user.role}`);
   *   } else {
   *     console.log('ユーザーが見つかりませんでした');
   *   }
   * } catch (error) {
   *   console.error('ユーザー検索エラー:', error);
   * }
   * ```
   */
  async getUserByUsername(username: string): Promise<SafeUser | null> {
    const user = await this.userRepository.findByUsername(username);

    if (!user) {
      return null;
    }

    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  /**
   * ユーザーのパスワードを変更
   *
   * 現在のパスワードを確認してから新しいパスワードに変更します。
   * セキュリティ上、現在のパスワードの検証が必須です。
   * 実際のデータベース操作はリポジトリ層で行います。
   *
   * @param id - 対象ユーザーのID
   * @param currentPassword - 現在のパスワード（プレーンテキスト）
   * @param newPassword - 新しいパスワード（プレーンテキスト）
   * @returns 更新されたユーザー情報（SafeUser型）
   *
   * @throws Error 'ユーザーが見つかりません' ユーザーが存在しない場合
   * @throws Error '現在のパスワードが間違っています' パスワード認証失敗
   * @throws Error パスワード更新時のデータベースエラー
   *
   * @example
   * ```typescript
   * try {
   *   const updatedUser = await userUseCase.changePassword(
   *     'user-id-123',
   *     'currentPassword',
   *     'newSecurePassword123'
   *   );
   *   console.log('パスワードを変更しました');
   * } catch (error) {
   *   if (error.message === '現在のパスワードが間違っています') {
   *     console.error('パスワードが間違っています');
   *   } else {
   *     console.error('パスワード変更エラー:', error);
   *   }
   * }
   * ```
   */
  async changePassword(
    id: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<SafeUser> {
    // リポジトリ層でパスワード変更処理を実行
    const updatedUser = await this.userRepository.changePassword(
      id,
      currentPassword,
      newPassword,
    );

    if (!updatedUser) {
      throw new Error('パスワードの更新に失敗しました');
    }

    // パスワードハッシュを除いた安全なユーザー情報を返す
    const { passwordHash, ...safeUser } = updatedUser;
    return safeUser;
  }
}

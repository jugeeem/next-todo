/**
 * @fileoverview データベース接続管理モジュール
 *
 * このファイルは、PostgreSQLデータベースへの接続を管理するインフラストラクチャ層の
 * 中核モジュールです。コネクションプールを使用した効率的なデータベース接続管理と、
 * アプリケーション全体で統一されたデータベースアクセスインターフェースを提供します。
 *
 * 主な機能:
 * - PostgreSQLコネクションプールの管理
 * - トランザクション対応のクエリ実行
 * - 自動的なコネクション開放とエラーハンドリング
 * - 環境変数ベースの設定管理
 *
 * @author jugeeem
 * @since 1.0.0
 */

import { Pool, type PoolClient, type QueryResult } from 'pg';

/**
 * データベース接続管理クラス
 *
 * PostgreSQLデータベースへの接続を管理し、効率的なクエリ実行を提供します。
 * シングルトンパターンを採用し、アプリケーション全体で単一のコネクションプールを共有します。
 *
 * 特徴:
 * - コネクションプールによる効率的なリソース管理
 * - 自動的なコネクション取得・開放
 * - SQLインジェクション対策（パラメータ化クエリ）
 * - 環境変数による設定の外部化
 *
 * @class Database
 * @example
 * ```typescript
 * // 基本的な使用例
 * import { database } from '@/infrastructure/database/connection';
 *
 * // 単発クエリの実行
 * const result = await database.query(
 *   'SELECT * FROM users WHERE id = $1',
 *   ['user-123']
 * );
 *
 * // トランザクションが必要な場合
 * const client = await database.getClient();
 * try {
 *   await client.query('BEGIN');
 *   await client.query('INSERT INTO users ...');
 *   await client.query('INSERT INTO profiles ...');
 *   await client.query('COMMIT');
 * } catch (error) {
 *   await client.query('ROLLBACK');
 *   throw error;
 * } finally {
 *   client.release();
 * }
 * ```
 */
class Database {
  /** PostgreSQLコネクションプール */
  private pool: Pool;

  /**
   * データベース接続の初期化
   *
   * 環境変数から接続情報を取得し、PostgreSQLコネクションプールを作成します。
   * SSL設定や接続タイムアウト等のパラメータは、環境やセキュリティ要件に応じて調整可能です。
   *
   * @constructor
   * @throws {Error} 環境変数DB_URLが設定されていない場合
   *
   * @example
   * ```typescript
   * // 環境変数の設定例 (.env.local)
   * DB_URL=postgresql://username:password@localhost:5432/next_todo_db
   * ```
   */
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DB_URL,
      ssl: false, // 開発環境用設定。本番環境では true に変更を推奨
    });
  }

  /**
   * データベースクライアント取得
   *
   * コネクションプールから単一のデータベースクライアントを取得します。
   * トランザクション処理や複数のクエリを連続実行する際に使用します。
   * 使用後は必ずclient.release()を呼び出してコネクションを解放してください。
   *
   * @returns データベースクライアント
   * @throws {Error} コネクションプールからの接続取得に失敗した場合
   *
   * @example
   * ```typescript
   * const client = await database.getClient();
   * try {
   *   await client.query('BEGIN');
   *
   *   const user = await client.query(
   *     'INSERT INTO users (username, email) VALUES ($1, $2) RETURNING *',
   *     ['john_doe', 'john@example.com']
   *   );
   *
   *   await client.query(
   *     'INSERT INTO user_profiles (user_id, display_name) VALUES ($1, $2)',
   *     [user.rows[0].id, 'John Doe']
   *   );
   *
   *   await client.query('COMMIT');
   * } catch (error) {
   *   await client.query('ROLLBACK');
   *   throw error;
   * } finally {
   *   client.release(); // 必須: コネクションの解放
   * }
   * ```
   */
  async getClient(): Promise<PoolClient> {
    return this.pool.connect();
  }

  /**
   * パラメータ化クエリ実行
   *
   * SQLクエリを安全に実行します。パラメータ化クエリを使用することで、
   * SQLインジェクション攻撃を防止し、型安全なデータベースアクセスを実現します。
   *
   * @param text - 実行するSQLクエリ（プレースホルダー $1, $2, ... を使用）
   * @param params - クエリパラメータの配列（任意）
   * @returns クエリ実行結果
   * @throws {Error} SQLエラー、接続エラー、制約違反等
   *
   * @example
   * ```typescript
   * // SELECT クエリの例
   * const users = await database.query(
   *   'SELECT id, username, created_at FROM users WHERE role = $1 AND active = $2',
   *   ['admin', true]
   * );
   * console.log(`見つかったユーザー数: ${users.rowCount}`);
   *
   * // INSERT クエリの例
   * const newUser = await database.query(
   *   'INSERT INTO users (id, username, email, password_hash) VALUES ($1, $2, $3, $4) RETURNING *',
   *   [generateUUID(), 'new_user', 'user@example.com', hashedPassword]
   * );
   *
   * // UPDATE クエリの例
   * const updated = await database.query(
   *   'UPDATE users SET last_login = $1 WHERE id = $2',
   *   [new Date(), 'user-123']
   * );
   * console.log(`更新された行数: ${updated.rowCount}`);
   *
   * // DELETE クエリの例（論理削除）
   * await database.query(
   *   'UPDATE users SET deleted = true, updated_at = $1 WHERE id = $2',
   *   [new Date(), 'user-123']
   * );
   * ```
   *
   * @security SQLインジェクション対策として、動的にクエリ文字列を構築せず、
   *           必ずパラメータ化クエリを使用してください
   */
  async query(text: string, params?: unknown[]): Promise<QueryResult> {
    const client = await this.getClient();
    try {
      const result = await client.query(text, params);
      return result;
    } finally {
      client.release();
    }
  }

  /**
   * データベース接続終了
   *
   * アプリケーション終了時にコネクションプールを適切に閉じます。
   * 通常、アプリケーションのシャットダウンプロセスで呼び出されます。
   *
   * @returns Promise<void>
   * @throws {Error} コネクションプールの終了処理でエラーが発生した場合
   *
   * @example
   * ```typescript
   * // アプリケーション終了時の処理
   * process.on('SIGTERM', async () => {
   *   console.log('データベース接続を終了しています...');
   *   await database.close();
   *   console.log('データベース接続を終了しました');
   *   process.exit(0);
   * });
   * ```
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}

/**
 * データベース接続インスタンス
 *
 * アプリケーション全体で共有されるデータベース接続インスタンスです。
 * シングルトンパターンにより、効率的なリソース管理を実現します。
 *
 * @constant {Database} database
 * @example
 * ```typescript
 * import { database } from '@/infrastructure/database/connection';
 *
 * // リポジトリでの使用例
 * export class PostgresUserRepository implements UserRepository {
 *   async findById(id: string): Promise<User | null> {
 *     const result = await database.query(
 *       'SELECT * FROM users WHERE id = $1 AND deleted = false',
 *       [id]
 *     );
 *     return result.rows[0] || null;
 *   }
 * }
 * ```
 */
export const database = new Database();

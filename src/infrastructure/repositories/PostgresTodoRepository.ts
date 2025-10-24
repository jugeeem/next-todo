/**
 * @fileoverview PostgreSQL ToDoリポジトリ実装
 *
 * このファイルは、ToDoエンティティに対するPostgreSQLデータベースアクセスを実装します。
 * ドメイン層のTodoRepositoryインターフェースを実装し、具体的なデータ永続化ロジックを提供します。
 *
 * 主な機能:
 * - ToDoタスクのCRUD操作（作成、読み取り、更新、削除）
 * - ユーザー別タスク管理による適切なデータ分離
 * - 論理削除によるタスク履歴の保持
 * - SQLインジェクション対策のパラメータ化クエリ
 * - データベース行からドメインエンティティへの型安全なマッピング
 *
 * @author jugeeem
 * @since 1.0.0
 */

import { v4 as uuidv4 } from 'uuid';
import type { CreateTodoInput, Todo, UpdateTodoInput } from '@/domain/entities/Todo';
import type { TodoRepository } from '@/domain/repositories/TodoRepository';
import { database } from '@/infrastructure/database/connection';
import { dbNowJST, dbValueToJST } from '@/lib/date-utils';

/**
 * PostgreSQL ToDoリポジトリ実装クラス
 *
 * ドメイン層のTodoRepositoryインターフェースを実装し、PostgreSQLデータベースに対する
 * ToDoタスクデータの永続化処理を提供します。UUIDによる一意識別子の生成、
 * 論理削除によるデータ保護、ユーザー別データ分離などの機能を含みます。
 *
 * データベーススキーマ要件:
 * ```sql
 * CREATE TABLE todos (
 *   id UUID PRIMARY KEY,
 *   title VARCHAR(32) NOT NULL,
 *   descriptions VARCHAR(128),
 *   completed BOOLEAN NOT NULL DEFAULT FALSE,
 *   user_id UUID NOT NULL REFERENCES users(id),
 *   created_at TIMESTAMP NOT NULL DEFAULT NOW(),
 *   created_by VARCHAR(255) NOT NULL DEFAULT 'system',
 *   updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
 *   updated_by VARCHAR(255) NOT NULL DEFAULT 'system',
 *   deleted BOOLEAN NOT NULL DEFAULT FALSE,
 *   INDEX idx_todos_user_id (user_id),
 *   INDEX idx_todos_created_at (created_at)
 * );
 * ```
 *
 * @class PostgresTodoRepository
 * @implements {TodoRepository}
 */
export class PostgresTodoRepository implements TodoRepository {
  /**
   * ID によるToDoタスク検索
   *
   * 指定されたIDのToDoタスク情報を取得します。論理削除されたタスクは除外されます。
   * 個別タスクの詳細表示や編集時に使用される主要なメソッドです。
   *
   * @param {string} id - 検索対象のToDoタスクID（UUID形式）
   * @returns {Promise<Todo | null>} ToDoタスク情報、見つからない場合はnull
   * @throws {Error} データベース接続エラーまたはクエリエラー
   *
   * @example
   * ```typescript
   * const repository = new PostgresTodoRepository();
   * const todo = await repository.findById('123e4567-e89b-12d3-a456-426614174000');
   * if (todo) {
   *   console.log(`タスク: ${todo.title}`);
   *   console.log(`説明: ${todo.descriptions || 'なし'}`);
   *   console.log(`作成者: ${todo.userId}`);
   * } else {
   *   console.log('指定されたタスクが見つかりません');
   * }
   * ```
   */
  async findById(id: string): Promise<Todo | null> {
    const query = `
      SELECT id, title, descriptions, completed, created_at, created_by, updated_at, updated_by, deleted, user_id
      FROM todos 
      WHERE id = $1 AND deleted = FALSE
    `;

    const result = await database.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToTodo(result.rows[0]);
  }

  /**
   * ユーザー別ToDoタスク一覧取得
   *
   * 指定されたユーザーIDに紐づく全てのToDoタスクを取得します。
   * ユーザー専用のタスク管理画面での一覧表示に使用されます。
   * 論理削除されたタスクは除外され、作成日時の降順でソートされます。
   *
   * @param {string} userId - 検索対象のユーザーID（UUID形式）
   * @returns {Promise<Todo[]>} ユーザーのToDoタスク一覧（作成日時降順）
   * @throws {Error} データベース接続エラーまたはクエリエラー
   *
   * @example
   * ```typescript
   * const repository = new PostgresTodoRepository();
   * const userTodos = await repository.findByUserId('user-123');
   *
   * console.log(`${userTodos.length}件のタスクがあります`);
   *
   * // 最新のタスク表示
   * if (userTodos.length > 0) {
   *   const latestTodo = userTodos[0];
   *   console.log(`最新タスク: ${latestTodo.title}`);
   * }
   *
   * // 全タスクの一覧表示
   * userTodos.forEach((todo, index) => {
   *   console.log(`${index + 1}. ${todo.title}`);
   *   if (todo.descriptions) {
   *     console.log(`   説明: ${todo.descriptions}`);
   *   }
   * });
   * ```
   */
  async findByUserId(userId: string): Promise<Todo[]> {
    const query = `
      SELECT id, title, descriptions, completed, created_at, created_by, updated_at, updated_by, deleted, user_id
      FROM todos 
      WHERE user_id = $1 AND deleted = FALSE
      ORDER BY created_at DESC
    `;

    const result = await database.query(query, [userId]);
    return result.rows.map((row: Record<string, unknown>) => this.mapRowToTodo(row));
  }

  /**
   * ユーザー別ToDoタスク一覧取得（ページネーション、フィルター、ソート対応）
   *
   * 指定されたユーザーIDに紐づくToDoタスクを、ページネーション、フィルタリング、
   * ソート機能を使用して取得します。削除済みのタスクは除外されます。
   *
   * @param {string} userId - 検索対象のユーザーID（UUID形式）
   * @param {Object} options - 検索オプション
   * @param {number} options.page - ページ番号（1から開始、デフォルト: 1）
   * @param {number} options.perPage - 1ページあたりの件数（デフォルト: 20）
   * @param {string} options.completedFilter - 完了状態フィルター（'all': 全件、'completed': 完了済みのみ、'incomplete': 未完了のみ、デフォルト: 'all'）
   * @param {string} options.sortBy - ソート基準フィールド（デフォルト: 'createdAt'）
   * @param {string} options.sortOrder - ソート順序（'asc': 昇順、'desc': 降順、デフォルト: 'asc'）
   * @returns {Promise<Object>} ページネーション情報を含むToDoタスクデータ
   * @throws {Error} データベース接続エラーまたはクエリエラー
   *
   * @example
   * ```typescript
   * const repository = new PostgresTodoRepository();
   *
   * // 基本的な使用例
   * const result = await repository.findByUserIdWithOptions('user-123', {
   *   page: 1,
   *   perPage: 20,
   *   completedFilter: 'incomplete',
   *   sortBy: 'createdAt',
   *   sortOrder: 'asc'
   * });
   *
   * console.log(`総件数: ${result.total}`);
   * console.log(`現在のページ: ${result.page}/${result.totalPages}`);
   * console.log(`取得したタスク数: ${result.data.length}`);
   *
   * // 完了済みタスクのみ取得
   * const completedResult = await repository.findByUserIdWithOptions('user-123', {
   *   completedFilter: 'completed'
   * });
   *
   * // タイトルで降順ソート
   * const sortedResult = await repository.findByUserIdWithOptions('user-123', {
   *   sortBy: 'title',
   *   sortOrder: 'desc'
   * });
   * ```
   */
  async findByUserIdWithOptions(
    userId: string,
    options: {
      page?: number;
      perPage?: number;
      completedFilter?: 'all' | 'completed' | 'incomplete';
      sortBy?: 'createdAt' | 'updatedAt' | 'title';
      sortOrder?: 'asc' | 'desc';
    } = {},
  ): Promise<{
    data: Todo[];
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  }> {
    // デフォルト値の設定
    const page = Math.max(1, options.page ?? 1);
    const perPage = Math.max(1, Math.min(100, options.perPage ?? 20));
    const completedFilter = options.completedFilter ?? 'all';
    const sortBy = options.sortBy ?? 'createdAt';
    const sortOrder = options.sortOrder ?? 'asc';

    // WHERE句の構築（削除済みを除外）
    let whereClause = 'WHERE user_id = $1 AND deleted = FALSE';

    // 完了状態フィルターの追加
    if (completedFilter === 'completed') {
      whereClause += ' AND completed = TRUE';
    } else if (completedFilter === 'incomplete') {
      whereClause += ' AND completed = FALSE';
    }
    // 'all' の場合は completed の条件を追加しない

    // ソートカラムのマッピング
    const sortColumnMap: Record<string, string> = {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      title: 'title',
    };
    const sortColumn = sortColumnMap[sortBy] ?? 'created_at';

    // ORDER BY句の構築
    const orderByClause = `ORDER BY ${sortColumn} ${sortOrder.toUpperCase()}`;

    // 総件数取得クエリ
    const countQuery = `
      SELECT COUNT(*) as total
      FROM todos 
      ${whereClause}
    `;

    // データ取得クエリ
    const offset = (page - 1) * perPage;
    const dataQuery = `
      SELECT id, title, descriptions, completed, created_at, created_by, updated_at, updated_by, deleted, user_id
      FROM todos 
      ${whereClause}
      ${orderByClause}
      LIMIT $2 OFFSET $3
    `;

    // クエリ実行
    const countResult = await database.query(countQuery, [userId]);
    const total = parseInt(countResult.rows[0].total, 10);
    const totalPages = Math.ceil(total / perPage);

    const dataResult = await database.query(dataQuery, [userId, perPage, offset]);
    const data = dataResult.rows.map((row: Record<string, unknown>) =>
      this.mapRowToTodo(row),
    );

    return {
      data,
      total,
      page,
      perPage,
      totalPages,
    };
  }

  /**
   * 新規ToDoタスク作成
   *
   * 新しいToDoタスクを作成します。UUIDが自動生成され、作成・更新タイムスタンプが設定されます。
   * タスクは特定のユーザーに紐づけられ、適切なデータ分離が確保されます。
   *
   * @param {CreateTodoInput} input - ToDoタスク作成入力データ
   * @param {string} input.title - タスクのタイトル（必須、最大32文字）
   * @param {string} [input.descriptions] - タスクの詳細説明（任意、最大128文字）
   * @param {string} input.userId - タスクの所有者ユーザーID（必須、UUID形式）
   * @returns {Promise<Todo>} 作成されたToDoタスク情報（ID、タイムスタンプ等が設定済み）
   * @throws {Error} データベースエラー、外部キー制約違反（存在しないユーザーID）等
   *
   * @example
   * ```typescript
   * const repository = new PostgresTodoRepository();
   *
   * try {
   *   const newTodo = await repository.create({
   *     title: '重要なタスク',
   *     descriptions: '明日までに完了させる必要があります',
   *     userId: 'user-123'
   *   });
   *
   *   console.log(`新規タスク作成完了: ${newTodo.id}`);
   *   console.log(`タイトル: ${newTodo.title}`);
   *   console.log(`作成日時: ${newTodo.createdAt.toLocaleString()}`);
   * } catch (error) {
   *   console.error('タスク作成エラー:', error.message);
   *   // 外部キー制約違反の場合は、存在しないユーザーIDが指定された
   * }
   * ```
   */
  async create(input: CreateTodoInput): Promise<Todo> {
    const id = uuidv4();
    const now = dbNowJST();

    const query = `
      INSERT INTO todos (id, title, descriptions, completed, user_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, title, descriptions, completed, created_at, created_by, updated_at, updated_by, deleted, user_id
    `;

    const values = [
      id,
      input.title,
      input.descriptions || null,
      input.completed ?? false,
      input.userId,
      now,
      now,
    ];

    const result = await database.query(query, values);
    return this.mapRowToTodo(result.rows[0]);
  }

  /**
   * 既存ToDoタスク更新
   *
   * 指定されたIDのToDoタスク情報を更新します。部分更新をサポートし、
   * 指定されたフィールドのみが更新されます。ユーザーIDは変更できません。
   *
   * @param {string} id - 更新対象のToDoタスクID（UUID形式）
   * @param {UpdateTodoInput} input - 更新するデータ（部分更新対応）
   * @param {string} [input.title] - 新しいタスクタイトル（任意、最大32文字）
   * @param {string} [input.descriptions] - 新しい詳細説明（任意、最大128文字）
   * @returns {Promise<Todo | null>} 更新されたToDoタスク情報、対象が見つからない場合はnull
   * @throws {Error} データベース接続エラーまたは制約違反エラー
   *
   * @example
   * ```typescript
   * const repository = new PostgresTodoRepository();
   *
   * // タイトルのみ更新
   * const updatedTodo = await repository.update('todo-123', {
   *   title: '更新されたタスク名'
   * });
   *
   * if (updatedTodo) {
   *   console.log(`タスク更新完了: ${updatedTodo.title}`);
   *   console.log(`更新日時: ${updatedTodo.updatedAt.toLocaleString()}`);
   * } else {
   *   console.log('更新対象のタスクが見つかりません');
   * }
   *
   * // 説明も同時に更新
   * const fullyUpdated = await repository.update('todo-123', {
   *   title: '完全に新しいタスク名',
   *   descriptions: '詳細な説明も更新されました'
   * });
   *
   * // 空の更新（現在の情報を取得）
   * const current = await repository.update('todo-123', {});
   * // これは findById と同等の動作
   * ```
   */
  async update(id: string, input: UpdateTodoInput): Promise<Todo | null> {
    const updateFields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (input.title !== undefined) {
      updateFields.push(`title = $${paramIndex++}`);
      values.push(input.title);
    }

    if (input.descriptions !== undefined) {
      updateFields.push(`descriptions = $${paramIndex++}`);
      values.push(input.descriptions);
    }

    if (input.completed !== undefined) {
      updateFields.push(`completed = $${paramIndex++}`);
      values.push(input.completed);
    }

    if (updateFields.length === 0) {
      return this.findById(id);
    }

    updateFields.push(`updated_at = $${paramIndex++}`);
    values.push(dbNowJST());

    values.push(id);

    const query = `
      UPDATE todos 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex} AND deleted = FALSE
      RETURNING id, title, descriptions, completed, created_at, created_by, updated_at, updated_by, deleted, user_id
    `;

    const result = await database.query(query, values);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToTodo(result.rows[0]);
  }

  /**
   * ToDoタスク削除（論理削除）
   *
   * 指定されたIDのToDoタスクを論理削除します。物理削除は行わず、
   * deletedフラグをTRUEに設定してタスク履歴を保持します。
   * これにより、削除されたタスクの追跡と復元が可能になります。
   *
   * @param {string} id - 削除対象のToDoタスクID（UUID形式）
   * @returns {Promise<boolean>} 削除が成功した場合true、対象が見つからない場合false
   * @throws {Error} データベース接続エラー
   *
   * @example
   * ```typescript
   * const repository = new PostgresTodoRepository();
   *
   * const deleted = await repository.delete('123e4567-e89b-12d3-a456-426614174000');
   * if (deleted) {
   *   console.log('タスク削除完了');
   * } else {
   *   console.log('削除対象のタスクが見つかりません');
   * }
   *
   * // 削除後の確認
   * const task = await repository.findById('123e4567-e89b-12d3-a456-426614174000');
   * console.log(task); // null（論理削除により検索対象外）
   *
   * // ユーザーのタスク一覧からも除外される
   * const userTasks = await repository.findByUserId('user-123');
   * // 削除されたタスクは含まれない
   * ```
   */
  async delete(id: string): Promise<boolean> {
    const query = `
      UPDATE todos 
      SET deleted = TRUE, updated_at = $1
      WHERE id = $2 AND deleted = FALSE
    `;

    const result = await database.query(query, [dbNowJST(), id]);
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * 全ToDoタスク一覧取得
   *
   * システム内の全ての有効なToDoタスク（論理削除されていない）を取得します。
   * 管理者機能でのタスク一覧表示や、システム全体の分析で使用されます。
   * 作成日時の降順でソートされ、最新のタスクが先頭に表示されます。
   *
   * @returns {Promise<Todo[]>} 全ToDoタスクの配列（作成日時降順）
   * @throws {Error} データベース接続エラーまたはクエリエラー
   *
   * @example
   * ```typescript
   * const repository = new PostgresTodoRepository();
   *
   * const allTodos = await repository.findAll();
   * console.log(`システム内タスク総数: ${allTodos.length}`);
   *
   * // ユーザー別のタスク数集計
   * const userTaskCounts = allTodos.reduce((acc, todo) => {
   *   acc[todo.userId] = (acc[todo.userId] || 0) + 1;
   *   return acc;
   * }, {} as Record<string, number>);
   *
   * console.log('ユーザー別タスク数:', userTaskCounts);
   *
   * // 最新の5つのタスク表示
   * const latestTasks = allTodos.slice(0, 5);
   * console.log('最新のタスク:');
   * latestTasks.forEach((todo, index) => {
   *   console.log(`${index + 1}. ${todo.title} (ユーザー: ${todo.userId})`);
   * });
   * ```
   *
   * @todo 大量データ対応のためのページネーション実装を検討
   * @todo フィルタリング機能（期間、ユーザー等）の追加を検討
   */
  async findAll(): Promise<Todo[]> {
    const query = `
      SELECT id, title, descriptions, completed, created_at, created_by, updated_at, updated_by, deleted, user_id
      FROM todos 
      WHERE deleted = FALSE
      ORDER BY created_at DESC
    `;

    const result = await database.query(query);
    return result.rows.map((row: Record<string, unknown>) => this.mapRowToTodo(row));
  }

  /**
   * データベース行をToDoエンティティにマッピング
   *
   * PostgreSQLクエリ結果の行データを、ドメインエンティティのTodo型に変換します。
   * データベースのsnake_case命名からTypeScriptのcamelCase命名に変換し、
   * 適切な型キャストと日付オブジェクトの生成を行います。
   *
   * データベース列とエンティティプロパティのマッピング:
   * - id → id (UUID文字列)
   * - title → title (文字列、必須)
   * - descriptions → descriptions (文字列 | undefined)
   * - completed → completed (boolean)
   * - user_id → userId (UUID文字列)
   * - created_at → createdAt (Date)
   * - created_by → createdBy (文字列)
   * - updated_at → updatedAt (Date)
   * - updated_by → updatedBy (文字列)
   * - deleted → deleted (boolean)
   *
   * @private
   * @param {Record<string, unknown>} row - PostgreSQLクエリ結果の行データ
   * @returns {Todo} マッピングされたToDoエンティティ
   *
   * @example
   * ```typescript
   * // データベースクエリ結果の例
   * const dbRow = {
   *   id: '123e4567-e89b-12d3-a456-426614174000',
   *   title: '重要なタスク',
   *   descriptions: 'このタスクは重要です',
   *   user_id: 'user-123',
   *   created_at: '2024-01-01T10:00:00Z',
   *   created_by: 'system',
   *   updated_at: '2024-01-01T11:00:00Z',
   *   updated_by: 'system',
   *   deleted: false
   * };
   *
   * // マッピング結果
   * const todo = this.mapRowToTodo(dbRow);
   * // todo.title === '重要なタスク'
   * // todo.userId === 'user-123'
   * // todo.createdAt instanceof Date === true
   * // todo.descriptions === 'このタスクは重要です'
   *
   * // descriptions が null の場合
   * const dbRowWithoutDesc = { ...dbRow, descriptions: null };
   * const todoWithoutDesc = this.mapRowToTodo(dbRowWithoutDesc);
   * // todoWithoutDesc.descriptions === undefined
   * ```
   */
  private mapRowToTodo(row: Record<string, unknown>): Todo {
    return {
      id: row.id as string,
      title: row.title as string,
      descriptions: row.descriptions as string | undefined,
      completed: row.completed as boolean,
      createdAt: dbValueToJST(row.created_at) ?? dbNowJST(),
      createdBy: row.created_by as string,
      updatedAt: dbValueToJST(row.updated_at) ?? dbNowJST(),
      updatedBy: row.updated_by as string,
      deleted: row.deleted as boolean,
      userId: row.user_id as string,
    };
  }
}

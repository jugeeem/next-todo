/**
 * @fileoverview ToDoリポジトリインターフェース
 *
 * このファイルは、ToDoタスクデータの永続化に関するドメインレイヤーの
 * リポジトリパターンインターフェースを定義します。
 * ドメイン駆動設計（DDD）において、インフラストラクチャ層の実装から
 * ドメインロジックを分離する役割を果たします。
 *
 * @author jugeeem
 * @since 1.0.0
 */

import type { CreateTodoInput, Todo, UpdateTodoInput } from '../entities/Todo';

/**
 * ToDoリポジトリインターフェース
 *
 * ToDoエンティティに対するデータアクセス操作を定義します。
 * このインターフェースは、具体的なデータストア（PostgreSQL、MongoDB等）に
 * 依存しない抽象的な操作を提供します。
 *
 * 実装クラスは、インフラストラクチャ層で提供され、
 * 依存性注入によってアプリケーション層に注入されます。
 *
 * @interface TodoRepository
 * @example
 * ```typescript
 * // 依存性注入の例
 * const todoUseCase = new TodoUseCase(todoRepository);
 *
 * // リポジトリの使用例
 * const todo = await todoRepository.findById("todo-123");
 * if (todo) {
 *   console.log(`タスク: ${todo.title}`);
 * }
 * ```
 */
export interface TodoRepository {
  /**
   * ToDoタスクIDによる単一タスク検索
   *
   * 指定されたIDのToDoタスクを検索します。
   * 論理削除されたタスクは検索対象外です。
   *
   * @param id - 検索対象のToDoタスクID（UUID v4形式）
   * @returns ToDoタスクオブジェクト、または見つからない場合はnull
   * @throws {Error} データベース接続エラーまたはクエリエラー
   *
   * @example
   * ```typescript
   * const todo = await todoRepository.findById("550e8400-e29b-41d4-a716-446655440000");
   * if (todo) {
   *   console.log(`タスク: ${todo.title}`);
   *   console.log(`説明: ${todo.descriptions || "説明なし"}`);
   * } else {
   *   console.log("タスクが見つかりません");
   * }
   * ```
   */
  findById(id: string): Promise<Todo | null>;

  /**
   * ユーザーIDによるToDoタスク一覧取得
   *
   * 指定されたユーザーが所有する全てのToDoタスクを取得します。
   * 論理削除されたタスクは結果に含まれません。
   * タスクは作成日時の降順で返されます。
   *
   * @param userId - 取得対象のユーザーID
   * @returns ユーザーが所有するToDoタスクの配列
   * @throws {Error} データベース接続エラーまたはクエリエラー
   *
   * @example
   * ```typescript
   * const userTodos = await todoRepository.findByUserId("user-123");
   * console.log(`${userTodos.length}件のタスクが見つかりました`);
   *
   * // 最新のタスクを表示
   * if (userTodos.length > 0) {
   *   const latestTodo = userTodos[0];
   *   console.log(`最新タスク: ${latestTodo.title}`);
   * }
   * ```
   */
  findByUserId(userId: string): Promise<Todo[]>;

  /**
   * ユーザーIDによるToDoタスク一覧取得（ページネーション、フィルター、ソート対応）
   *
   * 指定されたユーザーが所有するToDoタスクを、ページネーション、フィルタリング、
   * ソート機能を使用して取得します。削除済みのタスクは除外されます。
   *
   * @param userId - 取得対象のユーザーID
   * @param options - 検索オプション
   * @param options.page - ページ番号（1から開始、デフォルト: 1）
   * @param options.perPage - 1ページあたりの件数（デフォルト: 20）
   * @param options.completedFilter - 完了状態フィルター（'all': 全件、'completed': 完了済みのみ、'incomplete': 未完了のみ、デフォルト: 'all'）
   * @param options.sortBy - ソート基準フィールド（デフォルト: 'createdAt'）
   * @param options.sortOrder - ソート順序（'asc': 昇順、'desc': 降順、デフォルト: 'asc'）
   * @returns ページネーション情報を含むToDoタスクデータ
   * @throws {Error} データベース接続エラーまたはクエリエラー
   *
   * @example
   * ```typescript
   * // 基本的な使用例
   * const result = await todoRepository.findByUserIdWithOptions("user-123", {
   *   page: 1,
   *   perPage: 20,
   *   completedFilter: 'incomplete',
   *   sortBy: 'createdAt',
   *   sortOrder: 'asc'
   * });
   * console.log(`総件数: ${result.total}, ページ: ${result.page}/${result.totalPages}`);
   * ```
   */
  findByUserIdWithOptions(
    userId: string,
    options?: {
      page?: number;
      perPage?: number;
      completedFilter?: 'all' | 'completed' | 'incomplete';
      sortBy?: 'createdAt' | 'updatedAt' | 'title';
      sortOrder?: 'asc' | 'desc';
    },
  ): Promise<{
    data: Todo[];
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  }>;

  /**
   * 新規ToDoタスク作成
   *
   * 新しいToDoタスクをデータストアに永続化します。
   * タスクIDの重複チェックは実装層で行われます。
   *
   * @param input - ToDoタスク作成に必要なデータ
   * @returns 作成されたToDoタスクオブジェクト（ID、タイムスタンプ等が設定済み）
   * @throws {Error} ユーザーID不正エラー、データベースエラー等
   *
   * @example
   * ```typescript
   * const createData: CreateTodoInput = {
   *   title: "プロジェクト企画書作成",
   *   descriptions: "Q1新プロジェクトの企画書を作成し、関係者に共有する",
   *   userId: "user-123"
   * };
   *
   * const newTodo = await todoRepository.create(createData);
   * console.log(`新規タスク作成: ${newTodo.id}`);
   * console.log(`タイトル: ${newTodo.title}`);
   * ```
   */
  create(input: CreateTodoInput): Promise<Todo>;

  /**
   * 既存ToDoタスク情報更新
   *
   * 指定されたIDのToDoタスク情報を更新します。
   * 部分更新をサポートし、指定されたフィールドのみが更新されます。
   * タスクの所有者（userId）は変更できません。
   *
   * @param id - 更新対象のToDoタスクID
   * @param input - 更新するデータ（部分更新対応）
   * @returns 更新されたToDoタスクオブジェクト、または対象が見つからない場合はnull
   * @throws {Error} データベース接続エラーまたは制約違反エラー
   *
   * @example
   * ```typescript
   * const updateData: UpdateTodoInput = {
   *   title: "プロジェクト企画書作成（進行中）",
   *   descriptions: "Q1新プロジェクトの企画書を作成中。進捗50%"
   * };
   *
   * const updatedTodo = await todoRepository.update("todo-123", updateData);
   * if (updatedTodo) {
   *   console.log(`タスク更新完了: ${updatedTodo.title}`);
   * }
   * ```
   */
  update(id: string, input: UpdateTodoInput): Promise<Todo | null>;

  /**
   * ToDoタスク削除（論理削除）
   *
   * 指定されたIDのToDoタスクを論理削除します。
   * データは物理的には削除されず、deletedフラグがtrueに設定されます。
   *
   * @param id - 削除対象のToDoタスクID
   * @returns 削除処理が成功した場合はtrue、対象が見つからない場合はfalse
   * @throws {Error} データベース接続エラー
   *
   * @example
   * ```typescript
   * const deleted = await todoRepository.delete("todo-123");
   * if (deleted) {
   *   console.log("タスク削除完了");
   * } else {
   *   console.log("削除対象のタスクが見つかりません");
   * }
   * ```
   */
  delete(id: string): Promise<boolean>;

  /**
   * 全ToDoタスク一覧取得
   *
   * システム内の全ての有効なToDoタスク（論理削除されていない）を取得します。
   * 管理者機能での一覧表示や統計情報生成等で使用されます。
   * 大量データ対応のため、将来的にページネーション対応を検討する必要があります。
   *
   * @returns 全ToDoタスクの配列（作成日時降順）
   * @throws {Error} データベース接続エラーまたはクエリエラー
   *
   * @example
   * ```typescript
   * const allTodos = await todoRepository.findAll();
   * console.log(`総タスク数: ${allTodos.length}`);
   *
   * // ユーザー別の集計
   * const userTaskCounts = allTodos.reduce((acc, todo) => {
   *   acc[todo.userId] = (acc[todo.userId] || 0) + 1;
   *   return acc;
   * }, {} as Record<string, number>);
   *
   * console.log("ユーザー別タスク数:", userTaskCounts);
   * ```
   *
   * @todo 大量データ対応のためのページネーション実装を検討
   * @todo パフォーマンス向上のためのインデックス最適化を検討
   */
  findAll(): Promise<Todo[]>;
}

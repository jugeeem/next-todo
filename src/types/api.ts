/**
 * @fileoverview API レスポンス型定義
 *
 * このファイルは、アプリケーション全体で統一されたAPI レスポンス形式を定義します。
 * すべてのAPI エンドポイントは、この形式に準拠したレスポンスを返すことで、
 * フロントエンドとバックエンド間の一貫したデータ交換を保証します。
 *
 * 主な機能:
 * - 型安全なAPI レスポンス構造
 * - 成功・失敗状態の明確な識別
 * - ジェネリック型による柔軟なデータ型対応
 * - エラーメッセージの標準化
 *
 * 使用例:
 * - REST API エンドポイントのレスポンス型
 * - フロントエンドでのAPI レスポンス処理
 * - レスポンスヘルパー関数での型指定
 *
 * @author jugeeem
 * @since 1.0.0
 */

/**
 * 統一API レスポンス型
 *
 * アプリケーション全体で使用される標準的なAPI レスポンス形式です。
 * すべてのAPI エンドポイントはこの型に準拠したレスポンスを返し、
 * 一貫性のあるデータ構造を提供します。
 *
 * レスポンス形式の特徴:
 * - success フィールドによる成功・失敗の明確な識別
 * - ジェネリック型 T によるデータ型の柔軟な指定
 * - オプショナルなエラーメッセージとユーザーメッセージ
 * - TypeScript の型安全性を活用した開発体験の向上
 *
 * @template T レスポンスデータの型（デフォルト: unknown）
 *
 * @interface ApiResponse
 *
 * @example
 * ```typescript
 * // 成功レスポンスの例
 * const successResponse: ApiResponse<User> = {
 *   success: true,
 *   data: {
 *     userId: "123",
 *     username: "john_doe",
 *     firstName: "John"
 *   },
 *   message: "ユーザー情報を取得しました"
 * };
 *
 * // エラーレスポンスの例
 * const errorResponse: ApiResponse = {
 *   success: false,
 *   error: "ユーザーが見つかりません",
 *   message: "指定されたユーザーは存在しません"
 * };
 *
 * // API エンドポイントでの使用例
 * export async function GET(): Promise<NextResponse<ApiResponse<Todo[]>>> {
 *   try {
 *     const todos = await getTodos();
 *     return NextResponse.json({
 *       success: true,
 *       data: todos,
 *       message: "タスク一覧を取得しました"
 *     });
 *   } catch (error) {
 *     return NextResponse.json({
 *       success: false,
 *       error: "データベースエラーが発生しました",
 *       message: "タスクの取得に失敗しました"
 *     }, { status: 500 });
 *   }
 * }
 *
 * // フロントエンドでの使用例
 * const response = await fetch('/api/todos');
 * const result: ApiResponse<Todo[]> = await response.json();
 *
 * if (result.success) {
 *   console.log('取得したタスク:', result.data);
 *   console.log('メッセージ:', result.message);
 * } else {
 *   console.error('エラー:', result.error);
 *   alert(result.message || result.error);
 * }
 * ```
 */
export interface ApiResponse<T = unknown> {
  /**
   * API リクエストの成功・失敗を示すフラグ
   *
   * このフィールドにより、クライアント側でレスポンスの処理を分岐できます。
   * true の場合は data フィールドにレスポンスデータが含まれ、
   * false の場合は error フィールドにエラー情報が含まれます。
   *
   * @type {boolean}
   * @example
   * ```typescript
   * if (response.success) {
   *   // 成功時の処理
   *   handleSuccess(response.data);
   * } else {
   *   // 失敗時の処理
   *   handleError(response.error);
   * }
   * ```
   */
  success: boolean;

  /**
   * API レスポンスデータ（成功時のみ）
   *
   * success が true の場合に含まれるレスポンスデータです。
   * ジェネリック型 T により、エンドポイントごとに適切な型を指定できます。
   *
   * @type {T | undefined}
   * @optional
   * @example
   * ```typescript
   * // ユーザー情報取得API
   * const userResponse: ApiResponse<User> = await fetchUser();
   * if (userResponse.success && userResponse.data) {
   *   const user = userResponse.data; // 型: User
   *   console.log(`ユーザー名: ${user.username}`);
   * }
   *
   * // タスク一覧取得API
   * const todosResponse: ApiResponse<Todo[]> = await fetchTodos();
   * if (todosResponse.success && todosResponse.data) {
   *   const todos = todosResponse.data; // 型: Todo[]
   *   todos.forEach(todo => console.log(todo.title));
   * }
   * ```
   */
  data?: T;

  /**
   * エラーメッセージ（失敗時のみ）
   *
   * success が false の場合に含まれるエラーの詳細情報です。
   * 主に開発者向けの技術的なエラー内容を含み、ログ出力や
   * デバッグに使用されます。
   *
   * @type {string | undefined}
   * @optional
   * @example
   * ```typescript
   * if (!response.success) {
   *   console.error('API エラー:', response.error);
   *   // 例: "Database connection failed"
   *   //     "Validation error: username is required"
   *   //     "User not found"
   * }
   * ```
   */
  error?: string;

  /**
   * ユーザー向けメッセージ（成功・失敗共通）
   *
   * エンドユーザーに表示するためのわかりやすいメッセージです。
   * 成功時は操作完了の通知、失敗時はユーザーフレンドリーな
   * エラーメッセージとして使用されます。
   *
   * @type {string | undefined}
   * @optional
   * @example
   * ```typescript
   * // 成功時のメッセージ
   * const successMessage = response.message;
   * // 例: "タスクを作成しました"
   * //     "ユーザー情報を更新しました"
   * //     "ログインに成功しました"
   *
   * // 失敗時のメッセージ
   * const errorMessage = response.message;
   * // 例: "入力内容を確認してください"
   * //     "権限がありません"
   * //     "一時的なエラーが発生しました"
   *
   * // UI での表示例
   * if (response.message) {
   *   showNotification(response.message, response.success ? 'success' : 'error');
   * }
   * ```
   */
  message?: string;
}

/**
 * ページネーション対応レスポンス型
 *
 * データ一覧を取得するAPIにおいて、ページネーション情報を含む
 * レスポンス形式を定義します。総件数、ページ情報などのメタデータを提供し、
 * フロントエンドでのページング実装を容易にします。
 *
 * @template T データ配列の要素型
 *
 * @interface PaginatedResponse
 *
 * @example
 * ```typescript
 * // API レスポンスの型定義
 * const response: ApiResponse<PaginatedResponse<Todo>> = {
 *   success: true,
 *   data: {
 *     data: [...todos],
 *     total: 50,
 *     page: 1,
 *     perPage: 10,
 *     totalPages: 5
 *   },
 *   message: 'Todos retrieved successfully'
 * };
 *
 * // フロントエンドでの使用
 * const result = await fetch('/api/users/123/todos?page=1&perPage=10');
 * const json: ApiResponse<PaginatedResponse<Todo>> = await result.json();
 *
 * if (json.success && json.data) {
 *   console.log(`総件数: ${json.data.total}`);
 *   console.log(`現在ページ: ${json.data.page}/${json.data.totalPages}`);
 *   json.data.data.forEach(todo => console.log(todo.title));
 * }
 * ```
 */
export interface PaginatedResponse<T> {
  /**
   * データ配列
   *
   * 現在のページに含まれるデータの配列です。
   *
   * @type {T[]}
   * @example
   * ```typescript
   * const todos: Todo[] = response.data.data;
   * todos.forEach(todo => {
   *   console.log(`${todo.title}: ${todo.completed ? '完了' : '未完了'}`);
   * });
   * ```
   */
  data: T[];

  /**
   * 総件数
   *
   * フィルター条件に一致する全データの件数です。
   * ページネーション UI の表示に使用されます。
   *
   * @type {number}
   * @example
   * ```typescript
   * console.log(`全${response.data.total}件中 ${response.data.data.length}件を表示`);
   * ```
   */
  total: number;

  /**
   * 現在のページ番号（1から開始）
   *
   * @type {number}
   * @example
   * ```typescript
   * const currentPage = response.data.page; // 1, 2, 3, ...
   * ```
   */
  page: number;

  /**
   * 1ページあたりの件数
   *
   * @type {number}
   * @example
   * ```typescript
   * const itemsPerPage = response.data.perPage; // 10, 20, etc.
   * ```
   */
  perPage: number;

  /**
   * 総ページ数
   *
   * total と perPage から算出される総ページ数です。
   * ページネーション UI の構築に使用されます。
   *
   * @type {number}
   * @example
   * ```typescript
   * const totalPages = response.data.totalPages;
   * for (let i = 1; i <= totalPages; i++) {
   *   renderPageButton(i, i === response.data.page);
   * }
   * ```
   */
  totalPages: number;
}

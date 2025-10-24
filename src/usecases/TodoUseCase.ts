/**
 * @fileoverview タスク管理ユースケース
 *
 * このファイルは、タスク（Todo）管理に関するビジネスロジックを実装します。
 * Clean Architecture のユースケース層として、ドメインエンティティと
 * リポジトリを組み合わせて、タスク管理機能の核となる処理を提供します。
 *
 * 主な機能:
 * - タスクの作成・取得・更新・削除（CRUD操作）
 * - ユーザー固有のタスク管理
 * - タスク一覧取得（全体・ユーザー別）
 * - タスク詳細情報の取得
 *
 * 設計特徴:
 * - リポジトリパターンによるデータアクセス抽象化
 * - ドメインエンティティの活用
 * - 型安全なビジネスロジック実装
 * - 疎結合なアーキテクチャ設計
 *
 * 使用例:
 * - API ルートでのタスク操作処理
 * - タスク管理機能の実装
 * - ユーザーダッシュボードでのタスク表示
 *
 * @author jugeeem
 * @since 1.0.0
 */

import type { CreateTodoInput, Todo, UpdateTodoInput } from '@/domain/entities/Todo';
import type { TodoRepository } from '@/domain/repositories/TodoRepository';

/**
 * タスク管理ユースケースクラス
 *
 * タスク（Todo）に関する全てのビジネスロジックを管理するクラスです。
 * Clean Architecture の原則に従い、ドメイン層とインフラストラクチャ層を
 * 橋渡しし、タスク管理機能の中核となる処理を提供します。
 *
 * アーキテクチャ特徴:
 * - 依存性注入による疎結合設計
 * - ドメインエンティティの活用
 * - リポジトリパターンによるデータアクセス抽象化
 * - CRUD操作の完全実装
 *
 * 提供機能:
 * - タスクライフサイクル管理（作成〜削除）
 * - ユーザー固有のタスクフィルタリング
 * - 効率的なタスク検索・取得
 * - データ整合性の保証
 *
 * @class TodoUseCase
 *
 * @example
 * ```typescript
 * // 依存性注入コンテナでの使用例
 * const todoUseCase = new TodoUseCase(todoRepository);
 *
 * // タスク作成
 * const newTodo = await todoUseCase.createTodo({
 *   title: "重要なタスク",
 *   descriptions: "詳細な説明",
 *   userId: "user_123"
 * });
 *
 * // ユーザーのタスク一覧取得
 * const userTodos = await todoUseCase.getTodosByUserId("user_123");
 *
 * // タスク更新
 * const updatedTodo = await todoUseCase.updateTodo("todo_456", {
 *   title: "更新されたタイトル",
 *   completed: true
 * });
 *
 * // タスク削除
 * const deleted = await todoUseCase.deleteTodo("todo_456");
 * ```
 */
export class TodoUseCase {
  /**
   * タスクリポジトリインスタンス
   *
   * タスクデータの永続化と取得を担当するリポジトリです。
   * データベースアクセスを抽象化し、ビジネスロジックから
   * データストレージの詳細を隠蔽します。
   *
   * @private
   * @readonly
   */
  private todoRepository: TodoRepository;

  /**
   * TodoUseCase コンストラクタ
   *
   * 依存性注入により必要なリポジトリを受け取り、
   * タスク管理ユースケースのインスタンスを初期化します。
   *
   * @param {TodoRepository} todoRepository - タスクデータアクセス用リポジトリ
   *
   * @example
   * ```typescript
   * // コンテナからの依存性注入
   * const container = Container.getInstance();
   * const todoUseCase = new TodoUseCase(container.todoRepository);
   *
   * // 直接インスタンス化
   * const todoRepository = new PostgresTodoRepository();
   * const todoUseCase = new TodoUseCase(todoRepository);
   * ```
   */
  constructor(todoRepository: TodoRepository) {
    this.todoRepository = todoRepository;
  }

  /**
   * 新規タスク作成
   *
   * 指定された入力データに基づいて新しいタスクを作成します。
   * 作成時には自動的にタイムスタンプが設定され、
   * 初期状態として未完了（completed: false）で作成されます。
   *
   * 処理内容:
   * - 入力データの検証（リポジトリ層で実行）
   * - 一意ID の自動生成
   * - 作成日時の自動設定
   * - データベースへの永続化
   *
   * ビジネスルール:
   * - タイトルは必須項目
   * - 説明はオプション項目
   * - ユーザーID は必須（認証済みユーザーのみ）
   * - 初期状態は未完了
   *
   * @param {CreateTodoInput} input - タスク作成入力データ
   * @returns {Promise<Todo>} 作成されたタスクオブジェクト
   *
   * @throws {Error} 入力データが無効な場合
   * @throws {Error} データベースエラーが発生した場合
   *
   * @example
   * ```typescript
   * // API エンドポイントでの使用
   * export async function POST(request: NextRequest) {
   *   const authResult = authMiddleware.authenticate(request);
   *   if (!authResult.success) {
   *     return unauthorized(authResult.error);
   *   }
   *
   *   try {
   *     const body = await request.json();
   *     const validatedData = createTodoSchema.parse(body);
   *
   *     const newTodo = await todoUseCase.createTodo({
   *       ...validatedData,
   *       userId: authResult.user.userId
   *     });
   *
   *     return success(newTodo, "タスクを作成しました");
   *   } catch (error) {
   *     return internalError("タスク作成に失敗しました");
   *   }
   * }
   *
   * // React コンポーネントでの使用
   * const CreateTodoForm = () => {
   *   const [title, setTitle] = useState('');
   *   const [description, setDescription] = useState('');
   *   const [loading, setLoading] = useState(false);
   *
   *   const handleSubmit = async (event: FormEvent) => {
   *     event.preventDefault();
   *     setLoading(true);
   *
   *     try {
   *       const response = await fetch('/api/todos', {
   *         method: 'POST',
   *         headers: {
   *           'Content-Type': 'application/json',
   *           'Authorization': `Bearer ${getAuthToken()}`
   *         },
   *         body: JSON.stringify({
   *           title,
   *           descriptions: description
   *         })
   *       });
   *
   *       const result = await response.json();
   *
   *       if (result.success) {
   *         setTitle('');
   *         setDescription('');
   *         showNotification('タスクが作成されました', 'success');
   *
   *         // タスク一覧を再読み込み
   *         await refreshTodoList();
   *       } else {
   *         showNotification(result.message || 'エラーが発生しました', 'error');
   *       }
   *     } catch (error) {
   *       showNotification('ネットワークエラーが発生しました', 'error');
   *     } finally {
   *       setLoading(false);
   *     }
   *   };
   *
   *   return (
   *     <form onSubmit={handleSubmit}>
   *       <input
   *         type="text"
   *         value={title}
   *         onChange={(e) => setTitle(e.target.value)}
   *         placeholder="タスクのタイトル"
   *         required
   *       />
   *       <textarea
   *         value={description}
   *         onChange={(e) => setDescription(e.target.value)}
   *         placeholder="タスクの説明（オプション）"
   *       />
   *       <button type="submit" disabled={loading}>
   *         {loading ? '作成中...' : 'タスクを作成'}
   *       </button>
   *     </form>
   *   );
   * };
   * ```
   */
  async createTodo(input: CreateTodoInput): Promise<Todo> {
    return this.todoRepository.create(input);
  }

  /**
   * タスクID による単一タスク取得
   *
   * 指定されたタスクID に対応するタスクの詳細情報を取得します。
   * 存在しないタスクの場合は null を返します。
   *
   * 機能特徴:
   * - 型安全なタスク情報取得
   * - null セーフな戻り値
   * - 効率的な単一レコード検索
   * - 完全なタスク情報の取得
   *
   * 使用場面:
   * - タスク詳細画面での情報表示
   * - タスク編集前の現在値取得
   * - タスク削除前の確認表示
   * - API エンドポイントでのタスク検証
   *
   * @param {string} id - 取得対象のタスクID
   * @returns {Promise<Todo | null>} タスク情報（見つからない場合は null）
   *
   * @example
   * ```typescript
   * // タスク詳細API エンドポイント
   * export async function GET(
   *   request: NextRequest,
   *   { params }: { params: { id: string } }
   * ) {
   *   const authResult = authMiddleware.authenticate(request);
   *   if (!authResult.success) {
   *     return unauthorized(authResult.error);
   *   }
   *
   *   try {
   *     const todo = await todoUseCase.getTodoById(params.id);
   *
   *     if (!todo) {
   *       return notFound("タスクが見つかりません");
   *     }
   *
   *     // ユーザーの権限チェック
   *     if (todo.userId !== authResult.user.userId && authResult.user.role < 3) {
   *       return forbidden("このタスクにアクセスする権限がありません");
   *     }
   *
   *     return success(todo, "タスク情報を取得しました");
   *   } catch (error) {
   *     return internalError("タスク取得に失敗しました");
   *   }
   * }
   *
   * // React でのタスク詳細表示
   * const TodoDetailPage = ({ todoId }: { todoId: string }) => {
   *   const [todo, setTodo] = useState<Todo | null>(null);
   *   const [loading, setLoading] = useState(true);
   *   const [error, setError] = useState<string | null>(null);
   *
   *   useEffect(() => {
   *     const fetchTodo = async () => {
   *       try {
   *         const response = await fetch(`/api/todos/${todoId}`, {
   *           headers: {
   *             'Authorization': `Bearer ${getAuthToken()}`
   *           }
   *         });
   *
   *         const result = await response.json();
   *
   *         if (result.success) {
   *           setTodo(result.data);
   *         } else {
   *           setError(result.message);
   *         }
   *       } catch (err) {
   *         setError('タスクの読み込みに失敗しました');
   *       } finally {
   *         setLoading(false);
   *       }
   *     };
   *
   *     fetchTodo();
   *   }, [todoId]);
   *
   *   if (loading) return <LoadingSpinner />;
   *   if (error) return <ErrorMessage message={error} />;
   *   if (!todo) return <TodoNotFound />;
   *
   *   return (
   *     <div className="todo-detail">
   *       <h1>{todo.title}</h1>
   *       <p>{todo.descriptions}</p>
   *       <div className="todo-meta">
   *         <span>状態: {todo.completed ? '完了' : '未完了'}</span>
   *         <span>作成日: {formatDate(todo.createdAt)}</span>
   *         <span>更新日: {formatDate(todo.updatedAt)}</span>
   *       </div>
   *
   *       <div className="todo-actions">
   *         <button onClick={() => editTodo(todo)}>編集</button>
   *         <button onClick={() => toggleCompletion(todo)}>
   *           {todo.completed ? '未完了にする' : '完了にする'}
   *         </button>
   *         <button onClick={() => deleteTodo(todo.todoId)}>削除</button>
   *       </div>
   *     </div>
   *   );
   * };
   * ```
   */
  async getTodoById(id: string): Promise<Todo | null> {
    return this.todoRepository.findById(id);
  }

  /**
   * ユーザー固有のタスク一覧取得
   *
   * 指定されたユーザーID に属する全てのタスクを取得します。
   * ユーザーごとのタスク管理機能の基盤となる重要なメソッドです。
   *
   * 機能特徴:
   * - ユーザー固有のタスクフィルタリング
   * - 効率的な一括取得処理
   * - 作成日時によるソート（新しい順）
   * - 完全なタスク情報配列の取得
   *
   * 使用場面:
   * - ユーザーダッシュボードでのタスク表示
   * - タスク管理画面での一覧表示
   * - タスク検索・フィルタリング機能
   * - 統計情報の生成
   *
   * @param {string} userId - 対象ユーザーのID
   * @returns {Promise<Todo[]>} ユーザーのタスク配列
   *
   * @example
   * ```typescript
   * // ユーザーのタスク一覧API
   * export async function GET(request: NextRequest) {
   *   const authResult = authMiddleware.authenticate(request);
   *   if (!authResult.success) {
   *     return unauthorized(authResult.error);
   *   }
   *
   *   try {
   *     const userTodos = await todoUseCase.getTodosByUserId(authResult.user.userId);
   *
   *     // タスクの統計情報も合わせて返す
   *     const stats = {
   *       total: userTodos.length,
   *       completed: userTodos.filter(todo => todo.completed).length,
   *       pending: userTodos.filter(todo => !todo.completed).length
   *     };
   *
   *     return success({
   *       todos: userTodos,
   *       statistics: stats
   *     }, "タスク一覧を取得しました");
   *   } catch (error) {
   *     return internalError("タスク一覧の取得に失敗しました");
   *   }
   * }
   *
   * // React でのタスク一覧表示
   * const TodoListPage = () => {
   *   const [todos, setTodos] = useState<Todo[]>([]);
   *   const [loading, setLoading] = useState(true);
   *   const [filter, setFilter] = useState<'all' | 'completed' | 'pending'>('all');
   *
   *   useEffect(() => {
   *     const fetchTodos = async () => {
   *       try {
   *         const response = await fetch('/api/todos', {
   *           headers: {
   *             'Authorization': `Bearer ${getAuthToken()}`
   *           }
   *         });
   *
   *         const result = await response.json();
   *
   *         if (result.success) {
   *           setTodos(result.data.todos);
   *         }
   *       } catch (error) {
   *         console.error('タスク一覧の取得に失敗:', error);
   *       } finally {
   *         setLoading(false);
   *       }
   *     };
   *
   *     fetchTodos();
   *   }, []);
   *
   *   // フィルタリング処理
   *   const filteredTodos = useMemo(() => {
   *     switch (filter) {
   *       case 'completed':
   *         return todos.filter(todo => todo.completed);
   *       case 'pending':
   *         return todos.filter(todo => !todo.completed);
   *       default:
   *         return todos;
   *     }
   *   }, [todos, filter]);
   *
   *   const handleToggleCompletion = async (todoId: string) => {
   *     try {
   *       const todo = todos.find(t => t.todoId === todoId);
   *       if (!todo) return;
   *
   *       const response = await fetch(`/api/todos/${todoId}`, {
   *         method: 'PATCH',
   *         headers: {
   *           'Content-Type': 'application/json',
   *           'Authorization': `Bearer ${getAuthToken()}`
   *         },
   *         body: JSON.stringify({
   *           completed: !todo.completed
   *         })
   *       });
   *
   *       if (response.ok) {
   *         setTodos(prevTodos =>
   *           prevTodos.map(t =>
   *             t.todoId === todoId
   *               ? { ...t, completed: !t.completed }
   *               : t
   *           )
   *         );
   *       }
   *     } catch (error) {
   *       console.error('タスク状態の更新に失敗:', error);
   *     }
   *   };
   *
   *   if (loading) return <LoadingSpinner />;
   *
   *   return (
   *     <div className="todo-list">
   *       <div className="filter-controls">
   *         <button
   *           className={filter === 'all' ? 'active' : ''}
   *           onClick={() => setFilter('all')}
   *         >
   *           すべて ({todos.length})
   *         </button>
   *         <button
   *           className={filter === 'pending' ? 'active' : ''}
   *           onClick={() => setFilter('pending')}
   *         >
   *           未完了 ({todos.filter(t => !t.completed).length})
   *         </button>
   *         <button
   *           className={filter === 'completed' ? 'active' : ''}
   *           onClick={() => setFilter('completed')}
   *         >
   *           完了済み ({todos.filter(t => t.completed).length})
   *         </button>
   *       </div>
   *
   *       <div className="todo-items">
   *         {filteredTodos.map(todo => (
   *           <TodoItem
   *             key={todo.todoId}
   *             todo={todo}
   *             onToggleCompletion={handleToggleCompletion}
   *             onEdit={() => openEditModal(todo)}
   *             onDelete={() => deleteTodo(todo.todoId)}
   *           />
   *         ))}
   *       </div>
   *     </div>
   *   );
   * };
   * ```
   */
  async getTodosByUserId(userId: string): Promise<Todo[]> {
    return this.todoRepository.findByUserId(userId);
  }

  /**
   * ユーザー固有のタスク一覧取得（ページネーション、フィルター、ソート対応）
   *
   * 指定されたユーザーID に属するタスクを、ページネーション、フィルタリング、
   * ソート機能を使用して取得します。削除済みのタスクは除外されます。
   *
   * @param {string} userId - 対象ユーザーのID
   * @param {Object} options - 検索オプション
   * @returns {Promise<Object>} ページネーション情報を含むタスクデータ
   *
   * @example
   * ```typescript
   * const result = await todoUseCase.getTodosByUserIdWithOptions('user-123', {
   *   page: 2,
   *   perPage: 10,
   *   completedFilter: 'incomplete',
   *   sortBy: 'createdAt',
   *   sortOrder: 'desc'
   * });
   * ```
   */
  async getTodosByUserIdWithOptions(
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
  }> {
    return this.todoRepository.findByUserIdWithOptions(userId, options);
  }

  /**
   * タスク情報更新
   *
   * 指定されたタスクID のタスクを、提供された更新データで更新します。
   * 部分的な更新をサポートし、指定されたフィールドのみが更新されます。
   *
   * 処理内容:
   * - 既存タスクの存在確認
   * - 部分的データ更新
   * - 更新日時の自動設定
   * - データベースの更新実行
   *
   * 更新可能フィールド:
   * - title: タスクタイトル
   * - descriptions: タスクの説明
   * - completed: 完了状態
   * - その他のカスタムフィールド
   *
   * @param {string} id - 更新対象のタスクID
   * @param {UpdateTodoInput} input - 更新データ
   * @returns {Promise<Todo | null>} 更新されたタスク（存在しない場合は null）
   *
   * @example
   * ```typescript
   * // タスク更新API エンドポイント
   * export async function PATCH(
   *   request: NextRequest,
   *   { params }: { params: { id: string } }
   * ) {
   *   const authResult = authMiddleware.authenticate(request);
   *   if (!authResult.success) {
   *     return unauthorized(authResult.error);
   *   }
   *
   *   try {
   *     // 既存タスクの権限チェック
   *     const existingTodo = await todoUseCase.getTodoById(params.id);
   *     if (!existingTodo) {
   *       return notFound("タスクが見つかりません");
   *     }
   *
   *     if (existingTodo.userId !== authResult.user.userId && authResult.user.role < 3) {
   *       return forbidden("このタスクを更新する権限がありません");
   *     }
   *
   *     // 更新データの検証
   *     const body = await request.json();
   *     const validatedData = updateTodoSchema.parse(body);
   *
   *     // タスク更新実行
   *     const updatedTodo = await todoUseCase.updateTodo(params.id, validatedData);
   *
   *     if (updatedTodo) {
   *       return success(updatedTodo, "タスクを更新しました");
   *     } else {
   *       return notFound("更新対象のタスクが見つかりません");
   *     }
   *   } catch (error) {
   *     if (error instanceof z.ZodError) {
   *       return error("入力データが正しくありません", 400);
   *     }
   *     return internalError("タスク更新に失敗しました");
   *   }
   * }
   *
   * // React でのタスク編集機能
   * const EditTodoModal = ({ todo, onClose, onUpdate }: {
   *   todo: Todo;
   *   onClose: () => void;
   *   onUpdate: (updatedTodo: Todo) => void;
   * }) => {
   *   const [title, setTitle] = useState(todo.title);
   *   const [description, setDescription] = useState(todo.descriptions || '');
   *   const [completed, setCompleted] = useState(todo.completed);
   *   const [loading, setLoading] = useState(false);
   *
   *   const handleSubmit = async (event: FormEvent) => {
   *     event.preventDefault();
   *     setLoading(true);
   *
   *     try {
   *       const updateData = {
   *         title,
   *         descriptions: description,
   *         completed
   *       };
   *
   *       const response = await fetch(`/api/todos/${todo.todoId}`, {
   *         method: 'PATCH',
   *         headers: {
   *           'Content-Type': 'application/json',
   *           'Authorization': `Bearer ${getAuthToken()}`
   *         },
   *         body: JSON.stringify(updateData)
   *       });
   *
   *       const result = await response.json();
   *
   *       if (result.success) {
   *         onUpdate(result.data);
   *         onClose();
   *         showNotification('タスクを更新しました', 'success');
   *       } else {
   *         showNotification(result.message || 'エラーが発生しました', 'error');
   *       }
   *     } catch (error) {
   *       showNotification('ネットワークエラーが発生しました', 'error');
   *     } finally {
   *       setLoading(false);
   *     }
   *   };
   *
   *   return (
   *     <Modal onClose={onClose}>
   *       <form onSubmit={handleSubmit}>
   *         <h2>タスクを編集</h2>
   *
   *         <div className="form-group">
   *           <label htmlFor="title">タイトル</label>
   *           <input
   *             id="title"
   *             type="text"
   *             value={title}
   *             onChange={(e) => setTitle(e.target.value)}
   *             required
   *           />
   *         </div>
   *
   *         <div className="form-group">
   *           <label htmlFor="description">説明</label>
   *           <textarea
   *             id="description"
   *             value={description}
   *             onChange={(e) => setDescription(e.target.value)}
   *           />
   *         </div>
   *
   *         <div className="form-group">
   *           <label>
   *             <input
   *               type="checkbox"
   *               checked={completed}
   *               onChange={(e) => setCompleted(e.target.checked)}
   *             />
   *             完了
   *           </label>
   *         </div>
   *
   *         <div className="form-actions">
   *           <button type="button" onClick={onClose}>
   *             キャンセル
   *           </button>
   *           <button type="submit" disabled={loading}>
   *             {loading ? '更新中...' : '更新'}
   *           </button>
   *         </div>
   *       </form>
   *     </Modal>
   *   );
   * };
   * ```
   */
  async updateTodo(id: string, input: UpdateTodoInput): Promise<Todo | null> {
    return this.todoRepository.update(id, input);
  }

  /**
   * タスク削除
   *
   * 指定されたタスクID のタスクをシステムから完全に削除します。
   * この操作は不可逆的であり、削除されたタスクは復元できません。
   *
   * 処理内容:
   * - タスクの存在確認
   * - 削除権限の検証
   * - データベースからの物理削除
   * - 関連データのクリーンアップ
   *
   * セキュリティ考慮事項:
   * - 削除権限の厳密なチェック
   * - カスケード削除の適切な処理
   * - 削除ログの記録
   *
   * @param {string} id - 削除対象のタスクID
   * @returns {Promise<boolean>} 削除成功時は true、失敗時は false
   *
   * @example
   * ```typescript
   * // タスク削除API エンドポイント
   * export async function DELETE(
   *   request: NextRequest,
   *   { params }: { params: { id: string } }
   * ) {
   *   const authResult = authMiddleware.authenticate(request);
   *   if (!authResult.success) {
   *     return unauthorized(authResult.error);
   *   }
   *
   *   try {
   *     // 削除対象タスクの権限チェック
   *     const todoToDelete = await todoUseCase.getTodoById(params.id);
   *     if (!todoToDelete) {
   *       return notFound("削除対象のタスクが見つかりません");
   *     }
   *
   *     if (todoToDelete.userId !== authResult.user.userId && authResult.user.role < 3) {
   *       return forbidden("このタスクを削除する権限がありません");
   *     }
   *
   *     // タスク削除実行
   *     const deleted = await todoUseCase.deleteTodo(params.id);
   *
   *     if (deleted) {
   *       // 削除ログの記録
   *       console.log(`Task deleted: ${params.id} by user: ${authResult.user.userId}`);
   *
   *       return success(null, "タスクを削除しました");
   *     } else {
   *       return notFound("削除対象のタスクが見つかりません");
   *     }
   *   } catch (error) {
   *     console.error(`Failed to delete task ${params.id}:`, error);
   *     return internalError("タスク削除に失敗しました");
   *   }
   * }
   *
   * // React での削除機能実装
   * const DeleteTodoButton = ({ todo, onDelete }: {
   *   todo: Todo;
   *   onDelete: (todoId: string) => void;
   * }) => {
   *   const [loading, setLoading] = useState(false);
   *   const [showConfirm, setShowConfirm] = useState(false);
   *
   *   const handleDelete = async () => {
   *     setLoading(true);
   *
   *     try {
   *       const response = await fetch(`/api/todos/${todo.todoId}`, {
   *         method: 'DELETE',
   *         headers: {
   *           'Authorization': `Bearer ${getAuthToken()}`
   *         }
   *       });
   *
   *       const result = await response.json();
   *
   *       if (result.success) {
   *         onDelete(todo.todoId);
   *         showNotification('タスクを削除しました', 'success');
   *         setShowConfirm(false);
   *       } else {
   *         showNotification(result.message || 'エラーが発生しました', 'error');
   *       }
   *     } catch (error) {
   *       showNotification('ネットワークエラーが発生しました', 'error');
   *     } finally {
   *       setLoading(false);
   *     }
   *   };
   *
   *   return (
   *     <>
   *       <button
   *         className="delete-button"
   *         onClick={() => setShowConfirm(true)}
   *         disabled={loading}
   *       >
   *         削除
   *       </button>
   *
   *       {showConfirm && (
   *         <ConfirmDialog
   *           title="タスクの削除"
   *           message={`「${todo.title}」を削除しますか？この操作は取り消せません。`}
   *           onConfirm={handleDelete}
   *           onCancel={() => setShowConfirm(false)}
   *           confirmText="削除"
   *           cancelText="キャンセル"
   *           loading={loading}
   *         />
   *       )}
   *     </>
   *   );
   * };
   *
   * // 一括削除機能
   * const BulkDeleteTodos = ({ selectedTodos, onBulkDelete }: {
   *   selectedTodos: string[];
   *   onBulkDelete: (todoIds: string[]) => void;
   * }) => {
   *   const handleBulkDelete = async () => {
   *     const results = await Promise.all(
   *       selectedTodos.map(async (todoId) => {
   *         try {
   *           const success = await todoUseCase.deleteTodo(todoId);
   *           return { todoId, success };
   *         } catch (error) {
   *           return { todoId, success: false, error };
   *         }
   *       })
   *     );
   *
   *     const successfulDeletes = results
   *       .filter(result => result.success)
   *       .map(result => result.todoId);
   *
   *     onBulkDelete(successfulDeletes);
   *
   *     showNotification(
   *       `${successfulDeletes.length}個のタスクを削除しました`,
   *       'success'
   *     );
   *   };
   *
   *   return (
   *     <button onClick={handleBulkDelete}>
   *       選択したタスクを削除 ({selectedTodos.length})
   *     </button>
   *   );
   * };
   * ```
   */
  async deleteTodo(id: string): Promise<boolean> {
    return this.todoRepository.delete(id);
  }

  /**
   * 全タスク取得（管理者用）
   *
   * システム内の全てのタスクを取得します。
   * 主に管理者機能や統計情報生成で使用される管理用メソッドです。
   *
   * 機能特徴:
   * - システム全体のタスク一覧取得
   * - 管理者権限での包括的データアクセス
   * - 統計情報生成の基盤データ
   * - パフォーマンス監視対応
   *
   * 使用場面:
   * - 管理者ダッシュボードでの全体統計
   * - システム監視とパフォーマンス分析
   * - データエクスポート機能
   * - 全体的なタスク傾向分析
   *
   * 注意事項:
   * - 大量データの場合はページネーション推奨
   * - 管理者権限の事前チェック必須
   * - メモリ使用量への配慮が必要
   *
   * @returns {Promise<Todo[]>} 全タスクの配列
   *
   * @example
   * ```typescript
   * // 管理者用統計API
   * export async function GET(request: NextRequest) {
   *   const authResult = authMiddleware.authenticate(request);
   *   if (!authResult.success) {
   *     return unauthorized(authResult.error);
   *   }
   *
   *   // 管理者権限チェック
   *   if (authResult.user.role < 4) {
   *     return forbidden("管理者権限が必要です");
   *   }
   *
   *   try {
   *     const allTodos = await todoUseCase.getAllTodos();
   *
   *     // 統計情報の生成
   *     const statistics = {
   *       total: allTodos.length,
   *       completed: allTodos.filter(todo => todo.completed).length,
   *       pending: allTodos.filter(todo => !todo.completed).length,
   *       byUser: allTodos.reduce((acc, todo) => {
   *         acc[todo.userId] = (acc[todo.userId] || 0) + 1;
   *         return acc;
   *       }, {} as Record<string, number>),
   *       createdToday: allTodos.filter(todo =>
   *         isToday(new Date(todo.createdAt))
   *       ).length,
   *       createdThisWeek: allTodos.filter(todo =>
   *         isThisWeek(new Date(todo.createdAt))
   *       ).length
   *     };
   *
   *     return success({
   *       todos: allTodos,
   *       statistics
   *     }, "全タスク情報を取得しました");
   *   } catch (error) {
   *     return internalError("タスクデータの取得に失敗しました");
   *   }
   * }
   *
   * // 管理者ダッシュボード
   * const AdminDashboard = () => {
   *   const [allTodos, setAllTodos] = useState<Todo[]>([]);
   *   const [loading, setLoading] = useState(true);
   *   const [statistics, setStatistics] = useState(null);
   *
   *   useEffect(() => {
   *     const fetchAllTodos = async () => {
   *       try {
   *         const response = await fetch('/api/admin/todos', {
   *           headers: {
   *             'Authorization': `Bearer ${getAuthToken()}`
   *           }
   *         });
   *
   *         const result = await response.json();
   *
   *         if (result.success) {
   *           setAllTodos(result.data.todos);
   *           setStatistics(result.data.statistics);
   *         }
   *       } catch (error) {
   *         console.error('管理者データの取得に失敗:', error);
   *       } finally {
   *         setLoading(false);
   *       }
   *     };
   *
   *     fetchAllTodos();
   *   }, []);
   *
   *   if (loading) return <LoadingSpinner />;
   *
   *   return (
   *     <div className="admin-dashboard">
   *       <h1>システム統計</h1>
   *
   *       {statistics && (
   *         <div className="statistics-grid">
   *           <StatCard title="総タスク数" value={statistics.total} />
   *           <StatCard title="完了済み" value={statistics.completed} />
   *           <StatCard title="未完了" value={statistics.pending} />
   *           <StatCard title="今日作成" value={statistics.createdToday} />
   *           <StatCard title="今週作成" value={statistics.createdThisWeek} />
   *         </div>
   *       )}
   *
   *       <div className="user-activity">
   *         <h2>ユーザー別アクティビティ</h2>
   *         <UserActivityChart data={statistics?.byUser} />
   *       </div>
   *
   *       <div className="recent-todos">
   *         <h2>最近のタスク</h2>
   *         <TodoTable
   *           todos={allTodos.slice(0, 10)}
   *           showUser={true}
   *           isAdmin={true}
   *         />
   *       </div>
   *     </div>
   *   );
   * };
   *
   * // データエクスポート機能
   * const ExportTodosButton = () => {
   *   const [exporting, setExporting] = useState(false);
   *
   *   const handleExport = async () => {
   *     setExporting(true);
   *
   *     try {
   *       const allTodos = await todoUseCase.getAllTodos();
   *
   *       // CSV形式でエクスポート
   *       const csvData = allTodos.map(todo => ({
   *         'タスクID': todo.todoId,
   *         'タイトル': todo.title,
   *         '説明': todo.descriptions || '',
   *         '状態': todo.completed ? '完了' : '未完了',
   *         'ユーザーID': todo.userId,
   *         '作成日': formatDate(todo.createdAt),
   *         '更新日': formatDate(todo.updatedAt)
   *       }));
   *
   *       downloadCSV(csvData, 'all-todos.csv');
   *       showNotification('データをエクスポートしました', 'success');
   *     } catch (error) {
   *       showNotification('エクスポートに失敗しました', 'error');
   *     } finally {
   *       setExporting(false);
   *     }
   *   };
   *
   *   return (
   *     <button onClick={handleExport} disabled={exporting}>
   *       {exporting ? 'エクスポート中...' : 'データをエクスポート'}
   *     </button>
   *   );
   * };
   * ```
   */
  async getAllTodos(): Promise<Todo[]> {
    return this.todoRepository.findAll();
  }

  /**
   * ユーザーのTodo統計情報を取得します
   *
   * 指定されたユーザーIDに関連するTodoの統計情報を計算して返します。
   * 総Todo数、完了数、進行中数、完了率などの情報を提供します。
   *
   * @param userId - 統計を取得するユーザーID
   * @returns Promise<TodoStats> Todo統計情報
   *
   * @example
   * ```typescript
   * const stats = await todoUseCase.getTodoStatsByUserId('user-123');
   * console.log(`完了率: ${stats.completionRate}%`);
   * ```
   */
  async getTodoStatsByUserId(userId: string): Promise<{
    totalTodos: number;
    completedTodos: number;
    pendingTodos: number;
    completionRate: number;
  }> {
    const todos = await this.getTodosByUserId(userId);

    const totalTodos = todos.length;
    // 現在のTodoエンティティには完了状態がないため、全て進行中として扱う
    const completedTodos = 0; // TODO: 将来的に完了状態フィールドが追加された場合に実装
    const pendingTodos = totalTodos;
    const completionRate =
      totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0;

    return {
      totalTodos,
      completedTodos,
      pendingTodos,
      completionRate,
    };
  }
}

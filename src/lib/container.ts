/**
 * @fileoverview 依存性注入コンテナ
 *
 * このファイルは、アプリケーション全体で使用されるサービスとリポジトリの
 * 依存性注入コンテナを提供します。Singleton パターンを採用し、
 * アプリケーション全体で単一のインスタンスを共有します。
 *
 * 主な機能:
 * - リポジトリインスタンスの一元管理
 * - サービスレイヤーの依存性解決
 * - ユースケース層への依存性注入
 * - アプリケーション全体でのインスタンス共有
 *
 * 設計原則:
 * - Singleton パターンによる単一インスタンス保証
 * - 依存性の逆転（Dependency Inversion）
 * - 疎結合なアーキテクチャの実現
 * - テスタビリティの向上
 *
 * @author jugeeem
 * @since 1.0.0
 */

import { PostgresTodoRepository } from '@/infrastructure/repositories/PostgresTodoRepository';
import { PostgresUserRepository } from '@/infrastructure/repositories/PostgresUserRepository';
import { JWTService } from '@/lib/jwt';
import { AuthUseCase } from '@/usecases/AuthUseCase';
import { TodoUseCase } from '@/usecases/TodoUseCase';
import { UserUseCase } from '@/usecases/UserUseCase';

/**
 * 依存性注入コンテナクラス
 *
 * アプリケーション全体で使用されるサービス、リポジトリ、ユースケースの
 * インスタンスを一元管理するSingletonクラスです。依存関係を適切に解決し、
 * 全てのレイヤー間での疎結合を実現します。
 *
 * 管理対象コンポーネント:
 * - Infrastructure Layer: PostgresUserRepository, PostgresTodoRepository
 * - Service Layer: JWTService
 * - Use Case Layer: AuthUseCase, TodoUseCase, UserUseCase
 *
 * 依存関係グラフ:
 * ```
 * AuthUseCase
 * ├── PostgresUserRepository (データアクセス)
 * └── JWTService (認証トークン管理)
 *
 * TodoUseCase
 * └── PostgresTodoRepository (データアクセス)
 *
 * UserUseCase
 * └── PostgresUserRepository (データアクセス)
 * ```
 *
 * @class Container
 * @example
 * ```typescript
 * // Singleton インスタンスの取得
 * const container = Container.getInstance();
 *
 * // リポジトリの使用
 * const users = await container.userRepository.findAll();
 *
 * // ユースケースの使用
 * const loginResult = await container.authUseCase.login({
 *   username: 'user',
 *   password: 'password'
 * });
 *
 * // API ルートでの使用例
 * export async function POST(request: NextRequest) {
 *   const container = Container.getInstance();
 *   const authUseCase = container.authUseCase;
 *
 *   const { username, password } = await request.json();
 *   const result = await authUseCase.login({ username, password });
 *
 *   if (result.success) {
 *     return NextResponse.json(result.data);
 *   } else {
 *     return NextResponse.json({ error: result.error }, { status: 401 });
 *   }
 * }
 * ```
 */
export class Container {
  /**
   * Singleton インスタンス
   *
   * アプリケーション全体で単一のコンテナインスタンスを保持します。
   * 初回アクセス時に作成され、以降は同じインスタンスが返却されます。
   *
   * @private
   * @static
   */
  private static instance: Container;

  /**
   * ユーザーリポジトリインスタンス
   *
   * PostgreSQL データベースに対するユーザーデータアクセスを提供します。
   * 認証、ユーザー管理機能で使用されます。
   *
   * @public
   * @readonly
   */
  public readonly userRepository: PostgresUserRepository;

  /**
   * ToDoリポジトリインスタンス
   *
   * PostgreSQL データベースに対するToDoタスクデータアクセスを提供します。
   * タスク管理機能で使用されます。
   *
   * @public
   * @readonly
   */
  public readonly todoRepository: PostgresTodoRepository;

  /**
   * JWT サービスインスタンス
   *
   * JSON Web Token の生成、検証、解析機能を提供します。
   * 認証システム全体で使用されます。
   *
   * @public
   * @readonly
   */
  public readonly jwtService: JWTService;

  /**
   * 認証ユースケースインスタンス
   *
   * ユーザー認証関連のビジネスロジックを提供します。
   * ログイン、登録、トークン管理機能で使用されます。
   *
   * @public
   * @readonly
   */
  public readonly authUseCase: AuthUseCase;

  /**
   * ToDoユースケースインスタンス
   *
   * ToDoタスク管理のビジネスロジックを提供します。
   * タスクのCRUD操作、ユーザー別タスク管理で使用されます。
   *
   * @public
   * @readonly
   */
  public readonly todoUseCase: TodoUseCase;

  /**
   * ユーザー管理ユースケースインスタンス
   *
   * ユーザー管理のビジネスロジックを提供します。
   * ユーザーのCRUD操作、プロフィール管理で使用されます。
   *
   * @public
   * @readonly
   */
  public readonly userUseCase: UserUseCase;

  /**
   * プライベートコンストラクタ
   *
   * Singleton パターンの実装のため、外部からの直接インスタンス化を防ぎます。
   * 全ての依存関係を適切な順序で初期化し、ユースケース層に注入します。
   *
   * 初期化順序:
   * 1. Infrastructure Layer (Repositories)
   * 2. Service Layer (JWT Service)
   * 3. Use Case Layer (Business Logic)
   *
   * @private
   * @constructor
   */
  private constructor() {
    // Initialize repositories
    this.userRepository = new PostgresUserRepository();
    this.todoRepository = new PostgresTodoRepository();

    // Initialize services
    this.jwtService = new JWTService();

    // Initialize use cases
    this.authUseCase = new AuthUseCase(this.userRepository, this.jwtService);
    this.todoUseCase = new TodoUseCase(this.todoRepository);
    this.userUseCase = new UserUseCase(this.userRepository);
  }

  /**
   * Singleton インスタンス取得メソッド
   *
   * Container クラスの単一インスタンスを取得します。
   * 初回呼び出し時にインスタンスを作成し、以降は同じインスタンスを返却します。
   * スレッドセーフであり、アプリケーション全体で安全に使用できます。
   *
   * @static
   * @returns {Container} Container の単一インスタンス
   *
   * @example
   * ```typescript
   * // どこからでも同じインスタンスを取得
   * const container1 = Container.getInstance();
   * const container2 = Container.getInstance();
   * console.log(container1 === container2); // true
   *
   * // API ルートでの使用
   * export async function GET() {
   *   const container = Container.getInstance();
   *   const todos = await container.todoUseCase.getAllTodos();
   *   return NextResponse.json(todos);
   * }
   *
   * // ミドルウェアでの使用
   * export function middleware(request: NextRequest) {
   *   const container = Container.getInstance();
   *   const jwtService = container.jwtService;
   *   // 認証処理...
   * }
   *
   * // カスタムフックでの使用
   * export function useAuth() {
   *   const container = Container.getInstance();
   *   return container.authUseCase;
   * }
   * ```
   */
  static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }
}

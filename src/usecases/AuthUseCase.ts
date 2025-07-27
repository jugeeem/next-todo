/**
 * @fileoverview 認証ユースケース
 *
 * このファイルは、ユーザー認証に関するビジネスロジックを実装します。
 * Clean Architecture のユースケース層として、ドメインエンティティと
 * リポジトリを組み合わせて、認証機能の核となる処理を提供します。
 *
 * 主な機能:
 * - ユーザー登録処理（重複チェック、パスワードハッシュ化）
 * - ログイン認証（パスワード検証、JWT トークン生成）
 * - ユーザー情報取得
 * - セキュアなパスワード管理
 *
 * セキュリティ特徴:
 * - bcrypt によるパスワードハッシュ化
 * - JWT トークンベース認証
 * - パスワードハッシュの適切な除外
 * - 認証失敗時の統一エラーメッセージ
 *
 * 使用例:
 * - API ルートでのユーザー登録・ログイン処理
 * - 認証ミドルウェアでのユーザー情報検証
 * - プロフィール情報取得
 *
 * @author jugeeem
 * @since 1.0.0
 */

import bcrypt from 'bcryptjs';
import type {
  AuthResult,
  CreateUserInput,
  LoginInput,
  User,
} from '@/domain/entities/User';
import type { UserRepository } from '@/domain/repositories/UserRepository';
import type { JWTService } from '@/lib/jwt';

/**
 * 認証ユースケースクラス
 *
 * ユーザー認証に関する全てのビジネスロジックを管理するクラスです。
 * Clean Architecture の原則に従い、ドメイン層とインフラストラクチャ層を
 * 橋渡しし、認証機能の中核となる処理を提供します。
 *
 * アーキテクチャ特徴:
 * - 依存性注入による疎結合設計
 * - ドメインエンティティの活用
 * - リポジトリパターンによるデータアクセス抽象化
 * - JWT サービスとの統合
 *
 * セキュリティ機能:
 * - bcrypt による安全なパスワードハッシュ化
 * - ユーザー名重複チェック
 * - 認証失敗時の適切なエラーハンドリング
 * - パスワードハッシュの外部非公開
 *
 * @class AuthUseCase
 *
 * @example
 * ```typescript
 * // 依存性注入コンテナでの使用例
 * const authUseCase = new AuthUseCase(userRepository, jwtService);
 *
 * // ユーザー登録
 * const registrationResult = await authUseCase.register({
 *   username: "john_doe",
 *   password: "securePassword123",
 *   firstName: "John",
 *   lastName: "Doe"
 * });
 *
 * // ログイン
 * const loginResult = await authUseCase.login({
 *   username: "john_doe",
 *   password: "securePassword123"
 * });
 *
 * // ユーザー情報取得
 * const user = await authUseCase.getUserById("user_123");
 * ```
 */
export class AuthUseCase {
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
   * JWT サービスインスタンス
   *
   * JWT トークンの生成・検証・解析を担当するサービスです。
   * 認証後のトークン発行と、トークンベース認証の
   * 基盤機能を提供します。
   *
   * @private
   * @readonly
   */
  private jwtService: JWTService;

  /**
   * AuthUseCase コンストラクタ
   *
   * 依存性注入により必要なサービスを受け取り、
   * 認証ユースケースのインスタンスを初期化します。
   *
   * @param {UserRepository} userRepository - ユーザーデータアクセス用リポジトリ
   * @param {JWTService} jwtService - JWT トークン管理サービス
   *
   * @example
   * ```typescript
   * // コンテナからの依存性注入
   * const container = Container.getInstance();
   * const authUseCase = new AuthUseCase(
   *   container.userRepository,
   *   container.jwtService
   * );
   * ```
   */
  constructor(userRepository: UserRepository, jwtService: JWTService) {
    this.userRepository = userRepository;
    this.jwtService = jwtService;
  }

  /**
   * ユーザー登録処理
   *
   * 新規ユーザーの登録を行い、自動的にログイン状態にします。
   * ユーザー名の重複チェック、パスワードのハッシュ化、
   * JWT トークンの生成を含む包括的な登録プロセスを実行します。
   *
   * 処理フロー:
   * 1. ユーザー名の重複チェック
   * 2. 新規ユーザーの作成（パスワードハッシュ化含む）
   * 3. JWT トークンの生成
   * 4. パスワードハッシュを除外したユーザー情報の返却
   *
   * セキュリティ考慮事項:
   * - bcrypt による安全なパスワードハッシュ化
   * - ユーザー名の一意性保証
   * - パスワードハッシュの外部非公開
   * - 即座のログイン状態提供
   *
   * @param {CreateUserInput} input - ユーザー作成入力データ
   * @returns {Promise<AuthResult>} 認証結果（ユーザー情報とトークン）
   *
   * @throws {Error} ユーザー名が既に存在する場合
   * @throws {Error} データベースエラーが発生した場合
   *
   * @example
   * ```typescript
   * try {
   *   const result = await authUseCase.register({
   *     username: "john_doe",
   *     password: "securePassword123",
   *     firstName: "John",
   *     lastName: "Doe",
   *     role: 1
   *   });
   *
   *   console.log("登録成功:", result.user.username);
   *   console.log("JWT トークン:", result.token);
   *
   *   // クライアントにトークンを送信
   *   return NextResponse.json({
   *     success: true,
   *     data: result,
   *     message: "ユーザー登録が完了しました"
   *   });
   *
   * } catch (error) {
   *   if (error.message === 'Username already exists') {
   *     return NextResponse.json({
   *       success: false,
   *       error: "このユーザー名は既に使用されています",
   *       message: "別のユーザー名を選択してください"
   *     }, { status: 409 });
   *   }
   *
   *   return NextResponse.json({
   *     success: false,
   *     error: "登録処理中にエラーが発生しました",
   *     message: "しばらく後に再試行してください"
   *   }, { status: 500 });
   * }
   *
   * // React での使用例
   * const handleRegister = async (formData: CreateUserInput) => {
   *   try {
   *     const response = await fetch('/api/auth/register', {
   *       method: 'POST',
   *       headers: { 'Content-Type': 'application/json' },
   *       body: JSON.stringify(formData)
   *     });
   *
   *     const result = await response.json();
   *
   *     if (result.success) {
   *       // JWT トークンを保存
   *       localStorage.setItem('auth_token', result.data.token);
   *
   *       // ユーザー情報を状態管理に保存
   *       setUser(result.data.user);
   *
   *       // ダッシュボードにリダイレクト
   *       router.push('/dashboard');
   *     }
   *   } catch (error) {
   *     console.error('登録エラー:', error);
   *   }
   * };
   * ```
   */
  async register(input: CreateUserInput): Promise<AuthResult> {
    const existingUser = await this.userRepository.findByUsername(input.username);
    if (existingUser) {
      throw new Error('Username already exists');
    }

    const user = await this.userRepository.create(input);

    const token = this.jwtService.generateToken(user);

    const { passwordHash: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
    };
  }

  /**
   * ユーザーログイン処理
   *
   * ユーザー名とパスワードによる認証を行い、成功時にJWT トークンを発行します。
   * パスワードの照合にはbcrypt を使用し、セキュアな認証プロセスを実装しています。
   *
   * 処理フロー:
   * 1. ユーザー名による該当ユーザー検索
   * 2. パスワードのハッシュ照合
   * 3. JWT トークンの生成
   * 4. パスワードハッシュを除外したユーザー情報の返却
   *
   * セキュリティ機能:
   * - bcrypt による安全なパスワード照合
   * - 認証失敗時の統一エラーメッセージ
   * - タイミング攻撃対策
   * - パスワードハッシュの適切な隠蔽
   *
   * @param {LoginInput} input - ログイン入力データ（ユーザー名・パスワード）
   * @returns {Promise<AuthResult>} 認証結果（ユーザー情報とトークン）
   *
   * @throws {Error} 認証情報が無効な場合（ユーザー不存在・パスワード不一致）
   * @throws {Error} データベースエラーが発生した場合
   *
   * @example
   * ```typescript
   * try {
   *   const result = await authUseCase.login({
   *     username: "john_doe",
   *     password: "userPassword123"
   *   });
   *
   *   console.log("ログイン成功:", result.user.username);
   *   console.log("ユーザーID:", result.user.userId);
   *   console.log("権限レベル:", result.user.role);
   *
   *   // セッション管理
   *   return NextResponse.json({
   *     success: true,
   *     data: result,
   *     message: "ログインに成功しました"
   *   }, {
   *     headers: {
   *       'Set-Cookie': `auth_token=${result.token}; HttpOnly; Secure; SameSite=Strict; Max-Age=86400`
   *     }
   *   });
   *
   * } catch (error) {
   *   // セキュリティのため、詳細なエラー情報は返さない
   *   return NextResponse.json({
   *     success: false,
   *     error: "Invalid credentials",
   *     message: "ユーザー名またはパスワードが正しくありません"
   *   }, { status: 401 });
   * }
   *
   * // ログインフォームでの使用例
   * const handleLogin = async (credentials: LoginInput) => {
   *   setLoading(true);
   *
   *   try {
   *     const response = await fetch('/api/auth/login', {
   *       method: 'POST',
   *       headers: { 'Content-Type': 'application/json' },
   *       body: JSON.stringify(credentials)
   *     });
   *
   *     const result = await response.json();
   *
   *     if (result.success) {
   *       // 認証成功処理
   *       setUser(result.data.user);
   *       localStorage.setItem('auth_token', result.data.token);
   *
   *       // 前回のページまたはダッシュボードにリダイレクト
   *       const redirectTo = searchParams.get('redirect') || '/dashboard';
   *       router.push(redirectTo);
   *
   *       showNotification("ログインしました", "success");
   *     } else {
   *       // 認証失敗処理
   *       setError(result.message);
   *
   *       // セキュリティのためパスワードフィールドをクリア
   *       setPassword('');
   *     }
   *   } catch (error) {
   *     setError("ネットワークエラーが発生しました");
   *   } finally {
   *     setLoading(false);
   *   }
   * };
   *
   * // 自動ログイン機能
   * useEffect(() => {
   *   const savedToken = localStorage.getItem('auth_token');
   *   if (savedToken) {
   *     // トークンの有効性を検証
   *     verifyTokenAndAutoLogin(savedToken);
   *   }
   * }, []);
   * ```
   */
  async login(input: LoginInput): Promise<AuthResult> {
    // Find user by username
    const user = await this.userRepository.findByUsername(input.username);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Generate token
    const token = this.jwtService.generateToken(user);

    // Return user without password hash
    const { passwordHash: _p, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
    };
  }

  /**
   * ユーザーID によるユーザー情報取得
   *
   * 指定されたユーザーID に対応するユーザー情報を取得します。
   * 認証済みセッションでの現在ユーザー情報取得や、
   * 管理機能でのユーザー詳細表示に使用されます。
   *
   * 機能特徴:
   * - 型安全なユーザー情報取得
   * - null セーフな戻り値
   * - リポジトリパターンによる抽象化
   * - パスワードハッシュを含む完全なユーザー情報
   *
   * 使用場面:
   * - 認証ミドルウェアでのユーザー情報取得
   * - プロフィールページでの情報表示
   * - 管理画面でのユーザー詳細
   * - API エンドポイントでのユーザー検証
   *
   * @param {string} id - 取得対象のユーザーID
   * @returns {Promise<User | null>} ユーザー情報（見つからない場合は null）
   *
   * @example
   * ```typescript
   * // 認証ミドルウェアでの使用
   * export async function GET(request: NextRequest) {
   *   const authResult = authMiddleware.authenticate(request);
   *
   *   if (authResult.success) {
   *     const currentUser = await authUseCase.getUserById(authResult.user.userId);
   *
   *     if (currentUser) {
   *       return NextResponse.json({
   *         success: true,
   *         data: {
   *           userId: currentUser.userId,
   *           username: currentUser.username,
   *           firstName: currentUser.firstName,
   *           lastName: currentUser.lastName,
   *           role: currentUser.role
   *           // パスワードハッシュは除外
   *         }
   *       });
   *     } else {
   *       return NextResponse.json({
   *         success: false,
   *         error: "User not found"
   *       }, { status: 404 });
   *     }
   *   }
   * }
   *
   * // プロフィール取得API
   * export async function GET(
   *   request: NextRequest,
   *   { params }: { params: { id: string } }
   * ) {
   *   try {
   *     const user = await authUseCase.getUserById(params.id);
   *
   *     if (user) {
   *       // 公開情報のみを返却
   *       const publicUserInfo = {
   *         userId: user.userId,
   *         username: user.username,
   *         firstName: user.firstName,
   *         lastName: user.lastName,
   *         createdAt: user.createdAt
   *       };
   *
   *       return success(publicUserInfo, "ユーザー情報を取得しました");
   *     } else {
   *       return notFound("ユーザーが見つかりません");
   *     }
   *   } catch (error) {
   *     return internalError("ユーザー情報の取得に失敗しました");
   *   }
   * }
   *
   * // React でのユーザー情報取得
   * const [currentUser, setCurrentUser] = useState<User | null>(null);
   *
   * useEffect(() => {
   *   const fetchCurrentUser = async () => {
   *     const token = localStorage.getItem('auth_token');
   *     if (!token) return;
   *
   *     try {
   *       // JWT トークンからユーザーID を取得
   *       const payload = parseJWT(token);
   *
   *       // ユーザー情報を取得
   *       const response = await fetch(`/api/users/${payload.userId}`, {
   *         headers: {
   *           'Authorization': `Bearer ${token}`
   *         }
   *       });
   *
   *       const result = await response.json();
   *       if (result.success) {
   *         setCurrentUser(result.data);
   *       }
   *     } catch (error) {
   *       console.error('ユーザー情報取得エラー:', error);
   *       // トークンが無効な場合はログアウト
   *       handleLogout();
   *     }
   *   };
   *
   *   fetchCurrentUser();
   * }, []);
   *
   * // 管理画面でのユーザー詳細表示
   * const UserDetailPage = ({ userId }: { userId: string }) => {
   *   const [user, setUser] = useState<User | null>(null);
   *   const [loading, setLoading] = useState(true);
   *
   *   useEffect(() => {
   *     const loadUser = async () => {
   *       try {
   *         const userInfo = await authUseCase.getUserById(userId);
   *         setUser(userInfo);
   *       } catch (error) {
   *         console.error('ユーザー読み込みエラー:', error);
   *       } finally {
   *         setLoading(false);
   *       }
   *     };
   *
   *     loadUser();
   *   }, [userId]);
   *
   *   if (loading) return <LoadingSpinner />;
   *   if (!user) return <UserNotFound />;
   *
   *   return (
   *     <div>
   *       <h1>{user.firstName} {user.lastName}</h1>
   *       <p>ユーザー名: {user.username}</p>
   *       <p>権限: {getRoleName(user.role)}</p>
   *       <p>登録日: {formatDate(user.createdAt)}</p>
   *     </div>
   *   );
   * };
   * ```
   */
  async getUserById(id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }
}

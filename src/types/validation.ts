/**
 * @fileoverview バリデーションスキーマと型定義
 *
 * このファイルは、Zod ライブラリを使用したデータバリデーションスキーマと
 * 対応する TypeScript 型定義を提供します。API リクエストの入力検証、
 * フォームデータの妥当性チェック、データベース操作前の事前検証に使用されます。
 *
 * 主な機能:
 * - Zod スキーマによる実行時バリデーション
 * - TypeScript 型推論による型安全性
 * - 多言語対応エラーメッセージ
 * - API エンドポイント別の入力検証
 *
 * バリデーション対象:
 * - ユーザー管理: 作成・更新・認証
 * - タスク管理: 作成・更新
 * - 入力制限: 文字数・必須項目・形式チェック
 *
 * 使用例:
 * - API ルートでのリクエストボディ検証
 * - フロントエンドフォームでの入力チェック
 * - データベース保存前の事前バリデーション
 *
 * @author jugeeem
 * @since 1.0.0
 */

import { z } from 'zod';

/**
 * ユーザー作成バリデーションスキーマ
 *
 * 新規ユーザー登録時の入力データを検証するためのZodスキーマです。
 * 必須項目のチェック、文字数制限、データ形式の妥当性を検証し、
 * セキュアなユーザー登録プロセスを保証します。
 *
 * バリデーション項目:
 * - ユーザー名: 必須、1-50文字
 * - パスワード: 必須、最低6文字
 * - 個人情報: オプション、最大50文字
 * - 権限レベル: オプション、数値
 *
 * @constant createUserSchema
 * @type {z.ZodObject}
 *
 * @example
 * ```typescript
 * // API ルートでの使用例
 * export async function POST(request: NextRequest) {
 *   try {
 *     const body = await request.json();
 *     const validatedData = createUserSchema.parse(body);
 *
 *     // バリデーション済みデータでユーザー作成
 *     const newUser = await createUser(validatedData);
 *     return success(newUser, "ユーザーを作成しました");
 *
 *   } catch (error) {
 *     if (error instanceof z.ZodError) {
 *       const errors = error.errors.map(e => e.message).join(', ');
 *       return error(`入力エラー: ${errors}`, 400);
 *     }
 *     return internalError("ユーザー作成に失敗しました");
 *   }
 * }
 *
 * // フロントエンドでの使用例
 * const registerForm = {
 *   username: "john_doe",
 *   firstName: "John",
 *   lastName: "Doe",
 *   password: "securePassword123"
 * };
 *
 * try {
 *   const validData = createUserSchema.parse(registerForm);
 *   await submitRegistration(validData);
 * } catch (error) {
 *   console.error("フォーム入力エラー:", error.errors);
 * }
 *
 * // 段階的バリデーション
 * const result = createUserSchema.safeParse(formData);
 * if (result.success) {
 *   console.log("バリデーション成功:", result.data);
 * } else {
 *   console.log("バリデーションエラー:", result.error.format());
 * }
 * ```
 */
export const createUserSchema = z.object({
  /**
   * ユーザー名（必須）
   *
   * ログイン時の識別子として使用される一意のユーザー名です。
   * 英数字とアンダースコアが使用可能で、1文字以上50文字以下の制限があります。
   *
   * @type {string}
   * @constraints
   * - 最小長: 1文字
   * - 最大長: 50文字
   * - 必須項目
   *
   * @example "john_doe", "user123", "admin_user"
   */
  username: z
    .string()
    .min(1, 'Username is required')
    .max(50, 'Username must be less than 50 characters'),

  /**
   * 名前（オプション）
   *
   * ユーザーの名前を格納します。プロフィール表示や
   * 個人化されたメッセージで使用されます。
   *
   * @type {string | undefined}
   * @constraints
   * - 最大長: 50文字
   * - オプション項目
   *
   * @example "John", "太郎", "花子"
   */
  firstName: z
    .string()
    .max(50, 'First name must be less than 50 characters')
    .optional(),

  /**
   * 名前の読み仮名（オプション）
   *
   * 日本語名の読み方を格納します。ソート機能や
   * 検索機能で使用されます。
   *
   * @type {string | undefined}
   * @constraints
   * - 最大長: 50文字
   * - オプション項目
   *
   * @example "たろう", "はなこ", "ジョン"
   */
  firstNameRuby: z
    .string()
    .max(50, 'First name ruby must be less than 50 characters')
    .optional(),

  /**
   * 姓（オプション）
   *
   * ユーザーの姓を格納します。フルネーム表示や
   * 正式な文書作成時に使用されます。
   *
   * @type {string | undefined}
   * @constraints
   * - 最大長: 50文字
   * - オプション項目
   *
   * @example "Doe", "山田", "田中"
   */
  lastName: z.string().max(50, 'Last name must be less than 50 characters').optional(),

  /**
   * 姓の読み仮名（オプション）
   *
   * 日本語姓の読み方を格納します。名前の読み仮名と
   * 組み合わせて完全な読み仮名を構成します。
   *
   * @type {string | undefined}
   * @constraints
   * - 最大長: 50文字
   * - オプション項目
   *
   * @example "やまだ", "たなか", "ドウ"
   */
  lastNameRuby: z
    .string()
    .max(50, 'Last name ruby must be less than 50 characters')
    .optional(),

  /**
   * 権限レベル（オプション）
   *
   * ユーザーのアクセス権限を数値で表現します。
   * 省略した場合はデフォルト権限（一般ユーザー）が適用されます。
   *
   * @type {number | undefined}
   * @constraints
   * - 数値型
   * - オプション項目
   * - デフォルト: 1（一般ユーザー）
   *
   * @example 1, 2, 3, 4
   */
  role: z.number().optional(),

  /**
   * パスワード（必須）
   *
   * ユーザーアカウントのセキュリティを保護するパスワードです。
   * 最低6文字以上の強力なパスワードが要求されます。
   *
   * @type {string}
   * @constraints
   * - 最小長: 6文字
   * - 必須項目
   * - ハッシュ化して保存
   *
   * @security
   * - bcrypt によるハッシュ化
   * - ソルト付きハッシュ
   * - 平文での保存禁止
   *
   * @example "securePassword123", "mySecret!@#"
   */
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

/**
 * ユーザー更新バリデーションスキーマ
 *
 * 既存ユーザーの情報更新時の入力データを検証するためのZodスキーマです。
 * ユーザー名とパスワードを除く、更新可能な項目のみを含みます。
 * すべての項目がオプションで、部分的な更新をサポートします。
 *
 * @constant updateUserSchema
 * @type {z.ZodObject}
 *
 * @example
 * ```typescript
 * // プロフィール更新API
 * export async function PATCH(request: NextRequest) {
 *   const body = await request.json();
 *   const validatedData = updateUserSchema.parse(body);
 *
 *   const updatedUser = await updateUser(userId, validatedData);
 *   return success(updatedUser, "プロフィールを更新しました");
 * }
 *
 * // 部分的な更新例
 * const partialUpdate = {
 *   firstName: "更新された名前"
 *   // 他の項目は更新しない
 * };
 *
 * const result = updateUserSchema.parse(partialUpdate);
 * ```
 */
export const updateUserSchema = z.object({
  firstName: z
    .string()
    .max(50, 'First name must be less than 50 characters')
    .optional(),
  firstNameRuby: z
    .string()
    .max(50, 'First name ruby must be less than 50 characters')
    .optional(),
  lastName: z.string().max(50, 'Last name must be less than 50 characters').optional(),
  lastNameRuby: z
    .string()
    .max(50, 'Last name ruby must be less than 50 characters')
    .optional(),
  role: z.number().optional(),
});

/**
 * ログインバリデーションスキーマ
 *
 * ユーザー認証時の入力データを検証するためのZodスキーマです。
 * ユーザー名とパスワードの両方が必須で、空文字列は許可されません。
 *
 * @constant loginSchema
 * @type {z.ZodObject}
 *
 * @example
 * ```typescript
 * // ログインAPI
 * export async function POST(request: NextRequest) {
 *   const body = await request.json();
 *   const { username, password } = loginSchema.parse(body);
 *
 *   const user = await authenticateUser(username, password);
 *   if (user) {
 *     const token = generateJWT(user);
 *     return success({ token }, "ログインに成功しました");
 *   } else {
 *     return unauthorized("認証に失敗しました");
 *   }
 * }
 *
 * // フロントエンドでの使用
 * const loginData = {
 *   username: formData.get('username'),
 *   password: formData.get('password')
 * };
 *
 * try {
 *   const validData = loginSchema.parse(loginData);
 *   await performLogin(validData);
 * } catch (error) {
 *   setErrorMessage("ユーザー名とパスワードを入力してください");
 * }
 * ```
 */
export const loginSchema = z.object({
  /**
   * ログイン用ユーザー名（必須）
   * @type {string}
   * @constraints 空文字列不可
   */
  username: z.string().min(1, 'Username is required'),

  /**
   * ログイン用パスワード（必須）
   * @type {string}
   * @constraints 空文字列不可
   */
  password: z.string().min(1, 'Password is required'),
});

/**
 * タスク作成バリデーションスキーマ
 *
 * 新規タスク作成時の入力データを検証するためのZodスキーマです。
 * タイトルは必須で、説明はオプションです。文字数制限により
 * データベースの制約を事前にチェックします。
 *
 * @constant createTodoSchema
 * @type {z.ZodObject}
 *
 * @example
 * ```typescript
 * // タスク作成API
 * export async function POST(request: NextRequest) {
 *   const body = await request.json();
 *   const validatedData = createTodoSchema.parse(body);
 *
 *   const newTodo = await createTodo({
 *     ...validatedData,
 *     userId: authResult.user.userId
 *   });
 *
 *   return success(newTodo, "タスクを作成しました");
 * }
 *
 * // フォームデータの検証
 * const todoForm = {
 *   title: "重要なタスク",
 *   descriptions: "詳細な説明文"
 * };
 *
 * const result = createTodoSchema.safeParse(todoForm);
 * if (result.success) {
 *   submitTodo(result.data);
 * }
 * ```
 */
export const createTodoSchema = z.object({
  /**
   * タスクタイトル（必須）
   *
   * タスクの名前や概要を表す短いテキストです。
   * 1文字以上32文字以下で、タスク一覧での表示に使用されます。
   *
   * @type {string}
   * @constraints
   * - 最小長: 1文字
   * - 最大長: 32文字
   * - 必須項目
   *
   * @example "会議の準備", "レポート作成", "買い物"
   */
  title: z
    .string()
    .min(1, 'Title is required')
    .max(32, 'Title must be less than 32 characters'),

  /**
   * タスク説明（オプション）
   *
   * タスクの詳細な説明やメモを格納します。
   * 最大128文字まで入力可能で、タスクの詳細情報として使用されます。
   *
   * @type {string | undefined}
   * @constraints
   * - 最大長: 128文字
   * - オプション項目
   *
   * @example "明日の会議で使用する資料を準備する", "予算を考慮して必要な物品をリストアップ"
   */
  descriptions: z
    .string()
    .max(128, 'Description must be less than 128 characters')
    .optional(),
});

/**
 * タスク更新バリデーションスキーマ
 *
 * 既存タスクの情報更新時の入力データを検証するためのZodスキーマです。
 * すべての項目がオプションで、部分的な更新をサポートします。
 *
 * @constant updateTodoSchema
 * @type {z.ZodObject}
 *
 * @example
 * ```typescript
 * // タスク更新API
 * export async function PATCH(request: NextRequest) {
 *   const body = await request.json();
 *   const validatedData = updateTodoSchema.parse(body);
 *
 *   const updatedTodo = await updateTodo(todoId, validatedData);
 *   return success(updatedTodo, "タスクを更新しました");
 * }
 *
 * // タイトルのみ更新
 * const titleUpdate = { title: "新しいタイトル" };
 * updateTodoSchema.parse(titleUpdate);
 *
 * // 説明のみ更新
 * const descUpdate = { descriptions: "更新された説明" };
 * updateTodoSchema.parse(descUpdate);
 * ```
 */
export const updateTodoSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(32, 'Title must be less than 32 characters')
    .optional(),
  descriptions: z
    .string()
    .max(128, 'Description must be less than 128 characters')
    .optional(),
});

// =====================================
// 型定義（Type Inference）
// =====================================

/**
 * ユーザー作成バリデーション型
 *
 * createUserSchema から推論された TypeScript 型です。
 * API リクエストボディやフォームデータの型として使用され、
 * コンパイル時の型安全性を提供します。
 *
 * @type CreateUserValidation
 * @example
 * ```typescript
 * // API ハンドラーでの使用
 * async function handleUserCreation(data: CreateUserValidation) {
 *   const hashedPassword = await bcrypt.hash(data.password, 10);
 *   return await userRepository.create({
 *     ...data,
 *     password: hashedPassword
 *   });
 * }
 *
 * // React フォームでの使用
 * const [formData, setFormData] = useState<CreateUserValidation>({
 *   username: '',
 *   password: '',
 *   firstName: '',
 *   lastName: ''
 * });
 * ```
 */
export type CreateUserValidation = z.infer<typeof createUserSchema>;

/**
 * ユーザー更新バリデーション型
 *
 * updateUserSchema から推論された TypeScript 型です。
 * プロフィール更新やユーザー管理機能で使用されます。
 *
 * @type UpdateUserValidation
 * @example
 * ```typescript
 * async function updateUserProfile(
 *   userId: string,
 *   updates: UpdateUserValidation
 * ) {
 *   const updatedUser = await userRepository.update(userId, updates);
 *   return updatedUser;
 * }
 * ```
 */
export type UpdateUserValidation = z.infer<typeof updateUserSchema>;

/**
 * ログインバリデーション型
 *
 * loginSchema から推論された TypeScript 型です。
 * 認証システムやログインフォームで使用されます。
 *
 * @type LoginValidation
 * @example
 * ```typescript
 * async function authenticateUser(credentials: LoginValidation) {
 *   const user = await userRepository.findByUsername(credentials.username);
 *   if (user && await bcrypt.compare(credentials.password, user.password)) {
 *     return user;
 *   }
 *   throw new Error('Invalid credentials');
 * }
 * ```
 */
export type LoginValidation = z.infer<typeof loginSchema>;

/**
 * タスク作成バリデーション型
 *
 * createTodoSchema から推論された TypeScript 型です。
 * タスク作成機能やタスク管理フォームで使用されます。
 *
 * @type CreateTodoValidation
 * @example
 * ```typescript
 * async function createUserTodo(
 *   userId: string,
 *   todoData: CreateTodoValidation
 * ) {
 *   return await todoRepository.create({
 *     ...todoData,
 *     userId,
 *     completed: false,
 *     createdAt: new Date()
 *   });
 * }
 * ```
 */
export type CreateTodoValidation = z.infer<typeof createTodoSchema>;

/**
 * タスク更新バリデーション型
 *
 * updateTodoSchema から推論された TypeScript 型です。
 * タスク編集機能や一括更新処理で使用されます。
 *
 * @type UpdateTodoValidation
 * @example
 * ```typescript
 * async function updateTodoDetails(
 *   todoId: string,
 *   updates: UpdateTodoValidation
 * ) {
 *   const existingTodo = await todoRepository.findById(todoId);
 *   if (!existingTodo) {
 *     throw new Error('Todo not found');
 *   }
 *
 *   return await todoRepository.update(todoId, {
 *     ...updates,
 *     updatedAt: new Date()
 *   });
 * }
 * ```
 */
export type UpdateTodoValidation = z.infer<typeof updateTodoSchema>;

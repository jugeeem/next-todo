# Types Layer

このディレクトリは、アプリケーション全体で使用される型定義とバリデーションスキーマを統一管理しています。TypeScript の型安全性と Zod ライブラリによる実行時バリデーションを組み合わせ、堅牢で保守性の高い型システムを提供します。

## 概要

型層（Types Layer）は、アプリケーションの基盤となる型定義を提供し、以下の原則に基づいて設計されています：

- **型安全性**: TypeScript の型システムを最大限活用
- **実行時検証**: Zod による実行時バリデーション
- **統一性**: アプリケーション全体での一貫した型使用
- **拡張性**: 新機能追加時の型定義拡張サポート
- **開発者体験**: 直感的で使いやすい型定義

## ディレクトリ構成

```
src/types/
├── api.ts          # API レスポンス型定義
├── auth.ts         # 認証・JWT 関連型定義
├── validation.ts   # Zod バリデーションスキーマと推論型
├── index.ts        # 型定義エントリーポイント
└── README.md       # このファイル
```

## モジュール詳細

### API Response Types (`api.ts`)

#### `ApiResponse<T>`
アプリケーション全体で統一されたAPI レスポンス形式を定義します。

**特徴:**
- ジェネリック型による柔軟なデータ型対応
- 成功・失敗状態の明確な識別
- エラーメッセージとユーザーメッセージの分離
- Next.js API ルートとの完全統合

**構造:**
```typescript
interface ApiResponse<T = unknown> {
  success: boolean;        // 成功・失敗フラグ
  data?: T;               // レスポンスデータ（成功時）
  error?: string;         // エラーメッセージ（失敗時）
  message?: string;       // ユーザー向けメッセージ
}
```

**使用例:**
```typescript
// 成功レスポンス
const successResponse: ApiResponse<User> = {
  success: true,
  data: userData,
  message: "ユーザー情報を取得しました"
};

// エラーレスポンス
const errorResponse: ApiResponse = {
  success: false,
  error: "User not found",
  message: "ユーザーが見つかりません"
};
```

### Authentication Types (`auth.ts`)

JWT トークンベース認証システムで使用される型定義を提供します。

#### `JWTPayload`
JWT トークンに含まれるユーザー情報の構造を定義します。

```typescript
interface JWTPayload {
  userId: string;    // ユーザー一意識別子
  username: string;  // ユーザー名
  role: number;      // 権限レベル（0-4）
}
```

**権限レベル定義:**
- `0`: ゲストユーザー（読み取り専用）
- `1`: 一般ユーザー（基本操作）
- `2`: パワーユーザー（拡張操作）
- `3`: モデレーター（管理操作）
- `4`: 管理者（全ての操作）

#### `AuthenticatedRequest`
Next.js の NextRequest を拡張し、認証済みユーザー情報を含むリクエスト型です。

```typescript
interface AuthenticatedRequest extends NextRequest {
  user: JWTPayload;
}
```

#### `MiddlewareAuthResult`
認証ミドルウェアの処理結果を表現する判別共用体型です。

```typescript
type MiddlewareAuthResult =
  | { success: true; user: JWTPayload }
  | { success: false; error: string };
```

**使用例:**
```typescript
const authResult = authMiddleware.authenticate(request);

if (authResult.success) {
  // TypeScript が user の存在を保証
  const userId = authResult.user.userId;
} else {
  // TypeScript が error の存在を保証
  console.error('認証エラー:', authResult.error);
}
```

### Validation Schemas & Types (`validation.ts`)

Zod ライブラリを使用したバリデーションスキーマと対応するTypeScript 型定義を提供します。

#### User Validation Schemas

**`createUserSchema`** - ユーザー作成バリデーション
```typescript
const createUserSchema = z.object({
  username: z.string().min(1).max(50),        // 必須、1-50文字
  firstName: z.string().max(50).optional(),   // オプション、最大50文字
  lastName: z.string().max(50).optional(),    // オプション、最大50文字
  password: z.string().min(6),                // 必須、最低6文字
  role: z.number().optional()                 // オプション、権限レベル
});
```

**`updateUserSchema`** - ユーザー更新バリデーション
```typescript
const updateUserSchema = z.object({
  firstName: z.string().max(50).optional(),
  lastName: z.string().max(50).optional(),
  role: z.number().optional()
  // username と password は更新対象外
});
```

**`loginSchema`** - ログインバリデーション
```typescript
const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1)
});
```

#### Todo Validation Schemas

**`createTodoSchema`** - タスク作成バリデーション
```typescript
const createTodoSchema = z.object({
  title: z.string().min(1).max(32),              // 必須、1-32文字
  descriptions: z.string().max(128).optional()   // オプション、最大128文字
});
```

**`updateTodoSchema`** - タスク更新バリデーション
```typescript
const updateTodoSchema = z.object({
  title: z.string().min(1).max(32).optional(),
  descriptions: z.string().max(128).optional()
});
```

#### 推論型定義

Zod スキーマから TypeScript 型を自動推論し、型安全性を保証します。

```typescript
type CreateUserValidation = z.infer<typeof createUserSchema>;
type UpdateUserValidation = z.infer<typeof updateUserSchema>;
type LoginValidation = z.infer<typeof loginSchema>;
type CreateTodoValidation = z.infer<typeof createTodoSchema>;
type UpdateTodoValidation = z.infer<typeof updateTodoSchema>;
```

### Entry Point (`index.ts`)

すべての型定義を統一的にエクスポートする中央集権的なエントリーポイントです。

**エクスポート内容:**
- 認証関連型: `JWTPayload`, `AuthenticatedRequest`, `MiddlewareAuthResult`
- API レスポンス型: `ApiResponse`
- バリデーション型: `CreateUserValidation`, `LoginValidation` など
- バリデーションスキーマ: `createUserSchema`, `loginSchema` など

**使用方法:**
```typescript
// 統一されたインポート
import { 
  ApiResponse, 
  JWTPayload, 
  CreateUserValidation,
  createUserSchema 
} from '@/types';
```

## 使用ガイドライン

### API エンドポイントでの活用

```typescript
import { NextRequest } from 'next/server';
import { 
  ApiResponse, 
  AuthenticatedRequest,
  CreateTodoValidation,
  createTodoSchema 
} from '@/types';
import { success, error, unauthorized } from '@/lib/response';

export async function POST(request: NextRequest) {
  // 1. 認証チェック
  const authResult = authMiddleware.authenticate(request);
  if (!authResult.success) {
    return unauthorized(authResult.error);
  }

  try {
    // 2. リクエストボディの取得とバリデーション
    const body = await request.json();
    const validatedData: CreateTodoValidation = createTodoSchema.parse(body);

    // 3. ビジネスロジックの実行
    const newTodo = await todoUseCase.createTodo({
      ...validatedData,
      userId: authResult.user.userId
    });

    // 4. 統一されたレスポンス形式で返却
    return success(newTodo, "タスクを作成しました");

  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(e => e.message).join(', ');
      return error(`入力エラー: ${errors}`, 400);
    }
    return error("タスク作成に失敗しました", 500);
  }
}
```

### フロントエンドでの型活用

```typescript
import { 
  ApiResponse, 
  CreateUserValidation,
  createUserSchema 
} from '@/types';

// React フォームでの使用
const [formData, setFormData] = useState<CreateUserValidation>({
  username: '',
  password: '',
  firstName: '',
  lastName: ''
});

// フォーム送信時のバリデーション
const handleSubmit = async (event: FormEvent) => {
  event.preventDefault();
  
  try {
    // クライアントサイドバリデーション
    const validatedData = createUserSchema.parse(formData);
    
    // API 呼び出し
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validatedData)
    });
    
    // レスポンス処理
    const result: ApiResponse<User> = await response.json();
    
    if (result.success) {
      console.log('登録成功:', result.data);
      showNotification(result.message, 'success');
    } else {
      console.error('登録失敗:', result.error);
      showNotification(result.message || result.error, 'error');
    }
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(e => e.message);
      setValidationErrors(errors);
    }
  }
};
```

### 認証ミドルウェアでの型活用

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { AuthMiddleware } from '@/lib/auth-middleware';
import { MiddlewareAuthResult } from '@/types';

export function middleware(request: NextRequest) {
  const protectedPaths = ['/api/todos', '/api/users'];
  const isProtectedPath = protectedPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  );
  
  if (isProtectedPath) {
    const authMiddleware = new AuthMiddleware();
    const authResult: MiddlewareAuthResult = authMiddleware.authenticate(request);
    
    if (authResult.success) {
      // 認証成功: ユーザー情報をヘッダーに追加
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', authResult.user.userId);
      requestHeaders.set('x-user-role', authResult.user.role.toString());
      
      return NextResponse.next({
        request: { headers: requestHeaders }
      });
    } else {
      // 認証失敗: エラーレスポンス
      return new NextResponse(
        JSON.stringify({ 
          success: false, 
          error: authResult.error 
        }),
        { 
          status: 401, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }
  }
  
  return NextResponse.next();
}
```

## バリデーション戦略

### 多層バリデーション

アプリケーションでは以下の多層バリデーション戦略を採用しています：

1. **フロントエンド**: ユーザー体験向上のための即座のフィードバック
2. **API エンドポイント**: セキュリティとデータ整合性の保証
3. **データベース**: 最終的なデータ制約の強制

```typescript
// 1. フロントエンドバリデーション
const clientResult = createUserSchema.safeParse(formData);
if (!clientResult.success) {
  showValidationErrors(clientResult.error);
  return;
}

// 2. API エンドポイントバリデーション
export async function POST(request: NextRequest) {
  const body = await request.json();
  const serverResult = createUserSchema.safeParse(body);
  
  if (!serverResult.success) {
    return error("バリデーションエラー", 400);
  }
  
  // 3. データベース制約（PostgreSQL レベル）
  // - UNIQUE 制約
  // - NOT NULL 制約
  // - CHECK 制約
}
```

### エラーハンドリングパターン

```typescript
// バリデーションエラーの詳細分析
function handleValidationError(error: z.ZodError) {
  const fieldErrors = error.errors.reduce((acc, err) => {
    const field = err.path.join('.');
    acc[field] = err.message;
    return acc;
  }, {} as Record<string, string>);
  
  return {
    success: false,
    error: "Validation failed",
    details: fieldErrors,
    message: "入力内容を確認してください"
  };
}

// 統一されたエラーレスポンス
try {
  const validData = createUserSchema.parse(requestData);
  // ... 処理続行
} catch (error) {
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      handleValidationError(error),
      { status: 400 }
    );
  }
  // その他のエラー処理
}
```

## 型安全性のベストプラクティス

### 1. 厳密な型チェック

```typescript
// ❌ 悪い例: any 型の使用
function processUser(user: any) {
  return user.username; // 型チェックなし
}

// ✅ 良い例: 適切な型の使用
function processUser(user: JWTPayload) {
  return user.username; // 型安全
}
```

### 2. 型ガードの活用

```typescript
// 認証結果の型安全な処理
function handleAuthResult(result: MiddlewareAuthResult) {
  if (result.success) {
    // この分岐では result.user が確実に存在
    logUserActivity(result.user);
    return result.user.userId;
  } else {
    // この分岐では result.error が確実に存在
    logAuthenticationFailure(result.error);
    throw new Error(result.error);
  }
}
```

### 3. 型推論の活用

```typescript
// Zod スキーマから型を自動推論
const userData = createUserSchema.parse(input);
// userData の型は CreateUserValidation として推論される

// API レスポンスの型推論
const response: ApiResponse<User[]> = await fetchUsers();
if (response.success) {
  // response.data の型は User[] として推論される
  response.data.forEach(user => console.log(user.username));
}
```

## テスト戦略

### 型定義のテスト

```typescript
import { describe, it, expect } from 'vitest';
import { createUserSchema, CreateUserValidation } from '@/types';

describe('User Validation Types', () => {
  it('should validate correct user data', () => {
    const validData: CreateUserValidation = {
      username: 'testuser',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User'
    };
    
    const result = createUserSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });
  
  it('should reject invalid user data', () => {
    const invalidData = {
      username: '', // 空文字列は無効
      password: '123' // 6文字未満は無効
    };
    
    const result = createUserSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});
```

### API レスポンス型のテスト

```typescript
describe('API Response Types', () => {
  it('should handle success response correctly', () => {
    const response: ApiResponse<User> = {
      success: true,
      data: { userId: '123', username: 'test' },
      message: 'Success'
    };
    
    expect(response.success).toBe(true);
    expect(response.data).toBeDefined();
  });
  
  it('should handle error response correctly', () => {
    const response: ApiResponse = {
      success: false,
      error: 'Not found',
      message: 'User not found'
    };
    
    expect(response.success).toBe(false);
    expect(response.error).toBe('Not found');
  });
});
```

## パフォーマンス考慮事項

### バリデーション最適化

```typescript
// 効率的なバリデーション
export const optimizedUserSchema = createUserSchema
  .transform(data => ({
    ...data,
    username: data.username.toLowerCase().trim()
  }))
  .refine(data => !data.username.includes(' '), {
    message: 'Username cannot contain spaces'
  });
```

### 型推論キャッシュ

```typescript
// 型推論結果のキャッシュ
type CachedUserValidation = z.infer<typeof createUserSchema>;

// 再利用可能な型定義
const userValidationCache = new Map<string, CachedUserValidation>();
```

## 拡張性とメンテナンス

### 新しい型の追加

```typescript
// 新しいエンティティの型定義
export const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  status: z.enum(['active', 'inactive', 'archived'])
});

export type CreateProjectValidation = z.infer<typeof createProjectSchema>;
```

### バージョニング戦略

```typescript
// v1 API 型定義
export namespace v1 {
  export const createUserSchema = z.object({
    username: z.string(),
    password: z.string()
  });
}

// v2 API 型定義
export namespace v2 {
  export const createUserSchema = z.object({
    username: z.string(),
    password: z.string(),
    email: z.string().email(), // 新しいフィールド
    profile: z.object({
      firstName: z.string(),
      lastName: z.string()
    }).optional()
  });
}
```

### 後方互換性の維持

```typescript
// 互換性レイヤー
export const legacyUserSchema = createUserSchema.omit({ role: true });
export type LegacyUserValidation = z.infer<typeof legacyUserSchema>;

// マイグレーション関数
export function migrateLegacyUser(
  legacy: LegacyUserValidation
): CreateUserValidation {
  return {
    ...legacy,
    role: 1 // デフォルト権限
  };
}
```

## セキュリティ考慮事項

### 入力サニタイゼーション

```typescript
export const sanitizedUserSchema = createUserSchema.transform(data => ({
  ...data,
  username: data.username.toLowerCase().trim(),
  firstName: data.firstName?.trim(),
  lastName: data.lastName?.trim()
}));
```

### 機密情報の除外

```typescript
// レスポンス用の安全な型
export const safeUserSchema = createUserSchema.omit({ password: true });
export type SafeUserResponse = z.infer<typeof safeUserSchema>;
```

## 今後の改善予定

- [ ] GraphQL スキーマとの統合
- [ ] より詳細なバリデーションルール
- [ ] 国際化対応エラーメッセージ
- [ ] 動的バリデーションスキーマ
- [ ] パフォーマンス監視とメトリクス
- [ ] 自動生成ドキュメント

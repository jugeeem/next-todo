# Library Layer

このディレクトリは、アプリケーションの共通ライブラリとユーティリティ機能を提供するモジュールを格納しています。ビジネスロジックとインフラストラクチャの間で使用される横断的関心事を扱います。

## 概要

ライブラリ層は、アプリケーション全体で共有される汎用的な機能とサービスを提供します。この層は以下の原則に従って設計されています：

- **再利用性**: 複数の層で使用可能な汎用機能
- **横断的関心事**: 認証、バリデーション、レスポンス処理などの共通機能
- **依存性の管理**: 依存性注入によるモジュール間の疎結合
- **型安全性**: TypeScript の型システムを活用した堅牢な実装
- **包括的テスト**: 100%のテストカバレッジによる高品質保証

## ディレクトリ構成

```
src/lib/
├── auth-middleware.ts    # JWT認証ミドルウェア
├── container.ts          # 依存性注入コンテナ（Singleton）
├── cookie.ts            # Cookie管理ユーティリティ
├── date-utils.ts        # JST日時ユーティリティ
├── jwt.ts               # JWT トークンサービス（HMAC SHA256）
├── response.ts          # 統一APIレスポンスヘルパー
├── validation.ts        # バリデーション再エクスポート（レガシー互換）
├── __tests__/           # ユニットテストスイート（100%カバレッジ）
└── README.md           # このファイル
```

## モジュール詳細

### Authentication & Authorization (`auth-middleware.ts`, `jwt.ts`)

#### `auth-middleware.ts` - 認証ミドルウェア
- **目的**: JWT トークンベースの認証システム
- **主要機能**:
  - HTTP Authorization ヘッダーからのトークン抽出
  - JWT トークンの検証と復号化
  - 構造化された認証結果の返却
  - Next.js リクエストとの統合
- **使用場所**: API ルート、Next.js ミドルウェア、保護されたエンドポイント

```typescript
import { AuthMiddleware } from '@/lib/auth-middleware';

const authMiddleware = new AuthMiddleware();
const authResult = authMiddleware.authenticate(request);

if (authResult.success) {
  // 認証成功時の処理
  const user = authResult.user;
}
```

#### `jwt.ts` - JWT サービス
- **目的**: JSON Web Token の生成・検証・解析
- **主要機能**:
  - セキュアなトークン生成（HS256、24時間有効期限）
  - トークンの検証と復号化
  - Bearer トークン形式の厳密な検証
  - 環境変数による秘密鍵管理
- **セキュリティ仕様**: HMAC SHA256、RFC 6750準拠

```typescript
import { JWTService } from '@/lib/jwt';

const jwtService = new JWTService();
const token = jwtService.generateToken(user);
const payload = jwtService.verifyToken(token);
```

### Dependency Injection (`container.ts`)

#### `container.ts` - 依存性注入コンテナ
- **目的**: アプリケーション全体でのサービス・リポジトリ・ユースケース管理
- **設計パターン**: Singleton パターン
- **管理対象**:
  - Infrastructure Layer: PostgresUserRepository, PostgresTodoRepository
  - Service Layer: JWTService
  - Use Case Layer: AuthUseCase, TodoUseCase, UserUseCase
- **利点**: 疎結合なアーキテクチャ、テスタビリティの向上、依存関係の一元管理

```typescript
import { Container } from '@/lib/container';

const container = Container.getInstance();
const authUseCase = container.authUseCase;
const userUseCase = container.userUseCase;
const todoUseCase = container.todoUseCase;
```

### API Utilities (`response.ts`)

#### `response.ts` - API レスポンスヘルパー
- **目的**: 統一されたAPI レスポンス形式の提供
- **提供機能**:
  - 成功レスポンス生成（200 OK）
  - エラーレスポンス生成（400, 401, 403, 404, 500）
  - 型安全なレスポンス構造
  - Next.js との完全統合
- **レスポンス形式**: `{ success: boolean, data?: T, error?: string }`

```typescript
import { success, error, unauthorized } from '@/lib/response';

// 成功レスポンス
return success(userData, "ユーザー取得成功");

// エラーレスポンス
return error("バリデーションエラー", 400);
return unauthorized("認証が必要です");
```

### Data Validation (`validation.ts`)

#### `validation.ts` - バリデーション再エクスポート
- **目的**: 後方互換性を維持したバリデーション機能の提供
- **機能**:
  - `@/types/validation` からの型・スキーマ再エクスポート
  - レガシーコードとの互換性維持
  - 段階的移行のサポート
- **推奨**: 新しいコードでは `@/types/validation` からの直接インポート
- **注意**: このモジュールは後方互換性のために提供（@deprecated）

```typescript
// レガシー方式（互換性のため）
import { CreateTodoInput, createTodoSchema } from '@/lib/validation';

// 推奨方式
import { CreateTodoValidation, createTodoSchema } from '@/types/validation';
```

## アーキテクチャパターン

### 1. 依存性注入（Dependency Injection）

```typescript
// Container での依存関係解決
export class Container {
  private constructor() {
    // Infrastructure Layer
    this.userRepository = new PostgresUserRepository();
    this.todoRepository = new PostgresTodoRepository();
    
    // Service Layer
    this.jwtService = new JWTService();
    
    // Use Case Layer
    this.authUseCase = new AuthUseCase(this.userRepository, this.jwtService);
    this.todoUseCase = new TodoUseCase(this.todoRepository);
    this.userUseCase = new UserUseCase(this.userRepository);
  }
}
```

### 2. ミドルウェアパターン

```typescript
// 認証ミドルウェアの適用
export function middleware(request: NextRequest) {
  const authMiddleware = new AuthMiddleware();
  const authResult = authMiddleware.authenticate(request);
  
  if (!authResult.success) {
    return unauthorized(authResult.error);
  }
  
  return NextResponse.next();
}
```

### 3. ファクトリーパターン

```typescript
// レスポンスファクトリーの使用
export async function POST(request: NextRequest) {
  try {
    const data = await processRequest(request);
    return success(data, "処理完了");
  } catch (error) {
    return internalError("処理中にエラーが発生しました");
  }
}
```

## 使用ガイドライン

### API ルートでの統合例

```typescript
import { NextRequest } from 'next/server';
import { AuthMiddleware } from '@/lib/auth-middleware';
import { Container } from '@/lib/container';
import { success, unauthorized, error } from '@/lib/response';

export async function GET(request: NextRequest) {
  // 1. 認証チェック
  const authMiddleware = new AuthMiddleware();
  const authResult = authMiddleware.authenticate(request);
  
  if (!authResult.success) {
    return unauthorized(authResult.error);
  }
  
  // 2. 依存性注入コンテナから必要なサービス取得
  const container = Container.getInstance();
  const todoUseCase = container.todoUseCase;
  const userUseCase = container.userUseCase;
  
  try {
    // 3. ビジネスロジックの実行
    const todos = await todoUseCase.getTodosByUserId(authResult.user.userId);
    
    // 4. 統一されたレスポンス形式で返却
    return success(todos, "タスク一覧取得成功");
  } catch (err) {
    return error("タスク取得に失敗しました", 500);
  }
}
```

### ミドルウェアでの認証実装

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { AuthMiddleware } from '@/lib/auth-middleware';

export function middleware(request: NextRequest) {
  // 保護されたルートの定義
  const protectedPaths = ['/api/todos', '/api/users'];
  const isProtectedPath = protectedPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  );
  
  if (isProtectedPath) {
    const authMiddleware = new AuthMiddleware();
    const authResult = authMiddleware.authenticate(request);
    
    if (!authResult.success) {
      return new NextResponse(
        JSON.stringify({ error: authResult.error }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // 認証成功時はリクエストヘッダーにユーザー情報を追加
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', authResult.user.userId);
    requestHeaders.set('x-user-role', authResult.user.role.toString());
    
    return NextResponse.next({
      request: { headers: requestHeaders }
    });
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*']
};
```

## テスト戦略

### テスト環境
- **フレームワーク**: Jest
- **カバレッジ**: 100% (statements, branches, functions, lines)
- **モッキング**: jest.mock による依存関係のモック化
- **非同期テスト**: async/await による非同期処理のテスト

### 単体テスト例

```typescript
// AuthMiddleware のテスト例
describe('AuthMiddleware', () => {
  let authMiddleware: AuthMiddleware;
  
  beforeEach(() => {
    authMiddleware = new AuthMiddleware();
  });
  
  it('should authenticate valid token', () => {
    const mockRequest = createMockRequest({
      authorization: 'Bearer valid-jwt-token'
    });
    
    const result = authMiddleware.authenticate(mockRequest);
    
    expect(result.success).toBe(true);
    expect(result.user).toBeDefined();
  });
  
  it('should reject invalid token', () => {
    const mockRequest = createMockRequest({
      authorization: 'Bearer invalid-token'
    });
    
    const result = authMiddleware.authenticate(mockRequest);
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid token');
  });
});
```

### 統合テスト例

```typescript
// API エンドポイントの統合テスト
describe('/api/todos', () => {
  it('should return todos for authenticated user', async () => {
    const token = await generateValidToken(testUser);
    
    const response = await fetch('/api/todos', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });
});
```

## セキュリティ考慮事項

### 1. JWT トークン管理
- 強力な秘密鍵の使用（環境変数 `JWT_SECRET`）
- 適切な有効期限設定（24時間）
- トークンの改ざん検出とエラーハンドリング

### 2. 認証フロー
- Bearer トークン形式の厳密な検証
- 無効なトークンの適切な拒否
- 認証エラーの適切なログ記録

### 3. エラーハンドリング
- 機密情報の漏洩防止
- 統一されたエラーレスポンス形式
- 適切なHTTP ステータスコードの使用

## パフォーマンス最適化

### 1. Singleton パターン
- Container クラスによる単一インスタンス管理
- 不要なオブジェクト生成の削減
- メモリ使用量の最適化

### 2. 効率的な認証
- JWT の非同期検証
- 認証結果のキャッシュ戦略
- 無効なトークンの早期拒否

### 3. レスポンス最適化
- 型安全なレスポンス生成
- JSON シリアライゼーションの最適化
- 適切なHTTP ヘッダーの設定

## 拡張性

### 新しい認証方式の追加

```typescript
// 新しい認証プロバイダーの実装例
export class OAuth2Middleware {
  authenticate(request: NextRequest): MiddlewareAuthResult {
    // OAuth2 認証ロジック
  }
}

// Container での管理
export class Container {
  public readonly oauth2Middleware: OAuth2Middleware;
  
  private constructor() {
    // 既存の初期化...
    this.oauth2Middleware = new OAuth2Middleware();
  }
}
```

### 新しいレスポンス形式の追加

```typescript
// カスタムレスポンス形式
export function paginated<T>(
  data: T[],
  pagination: { page: number; total: number; limit: number }
): NextResponse<PaginatedApiResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
    pagination
  });
}
```

### JST日時管理の統合

#### `date-utils.ts` - JST日時ユーティリティ
- **目的**: システム全体で一貫したJST（日本標準時）の日時処理
- **主要機能**:
  - 現在のJST日時取得
  - 任意の日時をJSTに変換
  - ISO文字列からJST日時への変換
  - データベース用のJST日時生成
  - 日時の妥当性検証
- **設計方針**: システム内では常にDate型でJST時刻を表現

```typescript
import { nowJST, dbNowJST, dbValueToJST } from '@/lib/date-utils';

// 現在のJST日時を取得
const now = nowJST();

// データベース保存用
const user = {
  createdAt: dbNowJST(),
  updatedAt: dbNowJST()
};

// データベースから取得した値をJSTに変換
const createdAt = dbValueToJST(row.created_at);
```

### UserUseCase の統合

```typescript
// ユーザー管理機能の統合例
export class Container {
  public readonly userUseCase: UserUseCase;
  
  private constructor() {
    // 既存の初期化...
    this.userUseCase = new UserUseCase(this.userRepository);
  }
}

// API ルートでの使用例
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const container = Container.getInstance();
  const userUseCase = container.userUseCase;
  
  try {
    const updatedUser = await userUseCase.updateUser(params.id, updateData);
    return success(updatedUser, "ユーザー情報を更新しました");
  } catch (error) {
    return internalError("ユーザー更新に失敗しました");
  }
}
```

## 今後の改善予定

- [x] **UserUseCase の統合**: ユーザー管理ユースケースの依存性注入コンテナへの追加 ✓ 完了
- [x] **包括的テストスイート**: 100%テストカバレッジの達成 ✓ 完了  
- [x] **詳細なJSDocコメント**: 全モジュールの包括的なドキュメント化 ✓ 完了
- [ ] 認証キャッシュ機能の実装
- [ ] より詳細なログ記録システム
- [ ] 複数の認証プロバイダー対応
- [ ] レート制限機能の追加
- [ ] API バージョニング対応
- [ ] OpenAPI/Swagger ドキュメント生成

## 最近の更新履歴

### v2.0.0 (2025-07-28)
- **UserUseCase の追加**: 依存性注入コンテナにUserUseCaseを統合
- **テストカバレッジ100%達成**: 全libモジュールの包括的テスト完了
- **JSDocコメント強化**: 全モジュールの詳細なドキュメント化
- **validation.ts の非推奨化**: 後方互換性を保ちつつ新パスへの移行推奨

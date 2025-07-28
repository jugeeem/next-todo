# Claude AI 開発ガイド

このドキュメントは、GitHub Copilot Agent モード（Claude Sonnet 4）を使用した Next.js Todo API プロジェクトの開発ガイドです。統一した実装アプローチと品質基準を維持するための指針を提供します。

## 🎯 プロジェクト概要

### アーキテクチャ哲学
- **クリーンアーキテクチャ**: 依存性の逆転原則に基づく層分離
- **テスト駆動開発**: 99.5%のコードカバレッジを維持
- **型安全性**: TypeScript による厳密な型チェック
- **コード品質**: Biome による一貫したコードスタイル

### 技術スタック
```
Frontend: Next.js 15.4.3 + React 19.1.0 + TypeScript 5.8.3 + Turbopack
Backend: Next.js App Router + PostgreSQL 16
Testing: Jest 30.0.5 + Testing Library + JSDOM
Quality: Biome 2.1.2 (ESLint + Prettier 代替)
Container: Docker + Docker Compose
UI Framework: HeroUI 2.8.1 + Framer Motion 12.23.7 + Tailwind CSS 4
Libraries: bcryptjs, JOSE 6.0.12, Zod 3.22.4, UUID 9.0.1
```

## 🏗️ アーキテクチャ設計原則

### レイヤー構成
```
src/
├── app/api/           # 🌐 インターフェース層（Next.js App Router）
├── domain/            # 🎯 ドメイン層（ビジネスルール）
├── features/          # 🎨 フィーチャー層（UI コンポーネント）
├── usecases/         # 🔄 ユースケース層（アプリケーションサービス）
├── infrastructure/   # 🏗️ インフラストラクチャ層（外部依存）
├── lib/              # 🛠️ 共通ライブラリ（横断的関心事）
└── types/            # 📋 型定義（TypeScript interfaces）
```

### 依存性の方向
```
app/api → usecases → domain
features → usecases → domain
infrastructure → domain
lib → (すべての層で利用可能)
```

## 🚀 開発ワークフロー

### 1. 環境セットアップ
```bash
# 依存関係インストール
npm install

# 環境変数設定
cp .env.example .env.local

# Docker環境起動
docker compose up --build -d
```

### 2. 開発サイクル
```bash
# 開発サーバー起動（Turbopack使用）
npm run dev

# テスト実行（ウォッチモード）
npm run test:watch

# コード品質チェック
npm run check
```

### 3. デプロイメント
```bash
# ビルド
npm run build

# 本番起動
npm start
```

## 🧪 テスト戦略

### テストカバレッジ要件
- **ステートメント**: 99%以上（現在: 99.5%）
- **ブランチ**: 95%以上（現在: 96.7%）
- **関数**: 95%以上（現在: 95.38%）
- **ライン**: 99%以上（現在: 99.5%）

### テスト構成
```bash
src/
├── app/api/**/__tests__/        # APIエンドポイントテスト（17スイート）
├── usecases/**/__tests__/       # ビジネスロジックテスト（86テスト・100%カバレッジ）
├── infrastructure/**/__tests__/ # データアクセステスト（99%+カバレッジ）
└── lib/**/__tests__/            # ユーティリティテスト（100%カバレッジ）
```

### テスト実行コマンド
```bash
# 全テスト実行（326テスト・5.4秒）
npm test

# カバレッジ付きテスト
npm run test:coverage

# ウォッチモードでテスト実行
npm run test:watch

# 特定テスト実行
npm test -- --testPathPattern="auth"
```

## 📝 コーディング規約

### 1. ファイル・ディレクトリ命名規則

#### API ルート
```
src/app/api/
├── auth/
│   ├── login/route.ts           # POST /api/auth/login
│   └── register/route.ts        # POST /api/auth/register
├── todos/
│   ├── route.ts                 # GET/POST /api/todos
│   └── [id]/route.ts           # GET/PUT/DELETE /api/todos/[id]
└── users/
    ├── route.ts                 # GET/POST /api/users
    ├── [id]/route.ts           # GET/PUT/DELETE /api/users/[id]
    └── me/route.ts             # GET/PUT /api/users/me
```

#### ドメイン層
```
src/domain/
├── entities/
│   ├── User.ts                  # Userエンティティ
│   └── Todo.ts                  # Todoエンティティ
└── repositories/
    ├── UserRepository.ts        # Userリポジトリインターフェース
    └── TodoRepository.ts        # Todoリポジトリインターフェース
```

#### フィーチャー層
```
src/features/
├── auth/                        # 認証関連UIコンポーネント
│   ├── login/                   # ログインフォーム
│   └── register/                # ユーザー登録フォーム
├── todos/                       # Todo関連UIコンポーネント
│   └── ...                      # Todo管理UI
└── users/                       # ユーザー関連UIコンポーネント
    └── ...                      # ユーザー管理UI
```

#### ユースケース層
```
src/usecases/
├── AuthUseCase.ts              # 認証ビジネスロジック（26テスト）
├── UserUseCase.ts              # ユーザー管理ビジネスロジック（25テスト）
├── TodoUseCase.ts              # Todo管理ビジネスロジック（35テスト）
└── __tests__/                  # ユースケーステスト（100%カバレッジ）
```

### 2. TypeScript型定義パターン

#### エンティティ定義
```typescript
// src/domain/entities/User.ts
export interface User {
  readonly id: string;
  readonly username: string;
  readonly firstName: string | null;
  readonly lastName: string | null;
  readonly role: UserRole;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export type UserRole = 1 | 2 | 4 | 8; // admin | manager | user | guest
```

#### API レスポンス型
```typescript
// src/types/api.ts
export interface ApiResponse<T = unknown> {
  readonly success: boolean;
  readonly data?: T;
  readonly message: string;
  readonly timestamp: string;
}

export interface AuthResult {
  readonly user: User;
  readonly token: string;
}
```

#### リクエスト型
```typescript
// src/types/validation.ts
export interface TodoInput {
  readonly title: string;
  readonly descriptions?: string;
}

export interface UserInput {
  readonly username: string;
  readonly firstName?: string;
  readonly lastName?: string;
  readonly password: string;
  readonly role?: UserRole;
}
```

### 3. Next.js 15 対応パターン

#### App Router API ルート
```typescript
// src/app/api/todos/[id]/route.ts
import { NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id } = params;
    
    // ビジネスロジック実行
    const container = Container.getInstance();
    const result = await container.todoUseCase.findById(id);
    
    return success(result, 'Todo retrieved successfully');
  } catch (err) {
    console.error('Todo取得エラー:', err);
    if (err instanceof Error) {
      return notFound(err.message);
    }
    return internalError();
  }
}
```

#### ミドルウェア認証
```typescript
// src/lib/auth-middleware.ts
export async function withAuth<T extends Record<string, any>>(
  request: NextRequest,
  handler: (req: NextRequest, user: User) => Promise<Response>
): Promise<Response> {
  try {
    const token = extractToken(request);
    const user = await verifyToken(token);
    return await handler(request, user);
  } catch (err) {
    return unauthorized('Authentication required');
  }
}
```

### 4. バリデーション規約

#### Zod スキーマ定義
```typescript
// src/lib/validation.ts
import { z } from 'zod';

export const TodoSchema = z.object({
  title: z.string().min(1, '必須項目です').max(32, '32文字以内で入力してください'),
  descriptions: z.string().max(128, '128文字以内で入力してください').optional(),
});

export const UserRegistrationSchema = z.object({
  username: z.string().min(1, 'Username is required').max(50, 'Username must be less than 50 characters'),
  firstName: z.string().min(1, '必須項目です').max(50, '50文字以内で入力してください').optional(),
  lastName: z.string().min(1, '必須項目です').max(50, '50文字以内で入力してください').optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.number().int().min(1).max(8).optional(),
});
```

### 5. UI コンポーネント規約

#### HeroUI + Tailwind CSS 4 パターン
```typescript
// src/features/auth/login/LoginForm.tsx
import { Button, Input, Card, CardBody } from '@heroui/react';
import { motion } from 'framer-motion';

export function LoginForm() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-center min-h-screen"
    >
      <Card className="w-full max-w-md">
        <CardBody className="p-6">
          <Input
            label="ユーザー名"
            placeholder="ユーザー名を入力"
            variant="bordered"
            className="mb-4"
          />
          <Input
            label="パスワード"
            type="password"
            placeholder="パスワードを入力"
            variant="bordered"
            className="mb-6"
          />
          <Button
            color="primary"
            size="lg"
            className="w-full"
          >
            ログイン
          </Button>
        </CardBody>
      </Card>
    </motion.div>
  );
}
```

## 🔧 実装パターン

### 1. APIエンドポイント実装

#### 基本パターン
```typescript
import { NextRequest } from 'next/server';
import { Container } from '@/lib/container';
import { success, error, internalError } from '@/lib/response';
import { ValidationSchema } from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    // 1. リクエストデータ解析
    const body = await request.json();
    
    // 2. バリデーション
    const validationResult = ValidationSchema.safeParse(body);
    if (!validationResult.success) {
      return error('Validation failed', 400, validationResult.error.issues);
    }
    
    // 3. ビジネスロジック実行
    const container = Container.getInstance();
    const result = await container.useCase.execute(validationResult.data);
    
    // 4. レスポンス返却
    return success(result, 'Operation successful');
  } catch (err) {
    console.error('API Error:', err);
    if (err instanceof Error) {
      return error(err.message, 400);
    }
    return internalError();
  }
}
```

#### 認証が必要なエンドポイント
```typescript
import { withAuth } from '@/lib/auth-middleware';

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    const container = Container.getInstance();
    const result = await container.useCase.findByUser(user.id);
    return success(result, 'Data retrieved successfully');
  });
}
```

### 2. ユースケース実装

```typescript
// src/usecases/TodoUseCase.ts
export class TodoUseCase {
  constructor(
    private todoRepository: TodoRepository,
    private userRepository: UserRepository
  ) {}

  async createTodo(input: TodoInput, userId: string): Promise<Todo> {
    // 1. ユーザー存在確認
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // 2. ビジネスルール適用
    const todo = new Todo({
      id: generateId(),
      title: input.title,
      descriptions: input.descriptions,
      userId: user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 3. 永続化
    return await this.todoRepository.create(todo);
  }
}
```

### 3. リポジトリ実装

```typescript
// src/infrastructure/repositories/PostgresTodoRepository.ts
export class PostgresTodoRepository implements TodoRepository {
  constructor(private db: DatabaseConnection) {}

  async create(todo: Todo): Promise<Todo> {
    const query = `
      INSERT INTO todos (id, title, descriptions, user_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const values = [
      todo.id,
      todo.title,
      todo.descriptions,
      todo.userId,
      todo.createdAt,
      todo.updatedAt,
    ];

    const result = await this.db.query(query, values);
    return this.mapRowToTodo(result.rows[0]);
  }

  private mapRowToTodo(row: any): Todo {
    return new Todo({
      id: row.id,
      title: row.title,
      descriptions: row.descriptions,
      userId: row.user_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}
```

## 🧪 テストパターン

### 1. APIエンドポイントテスト

```typescript
// src/app/api/todos/__tests__/route.test.ts
describe('/api/todos API エンドポイント', () => {
  let mockContainer: MockContainer;

  beforeEach(() => {
    jest.clearAllMocks();
    mockContainer = createMockContainer();
  });

  describe('POST /api/todos - Todo作成', () => {
    it('有効なデータでTodo作成が成功する', async () => {
      // Arrange
      const todoData = { title: 'テストTodo', descriptions: '説明' };
      const mockTodo = createMockTodo(todoData);
      mockContainer.todoUseCase.createTodo.mockResolvedValue(mockTodo);

      const request = createMockRequest('POST', todoData);

      // Act
      const { POST } = await import('../route');
      await POST(request);

      // Assert
      expect(mockContainer.todoUseCase.createTodo).toHaveBeenCalledWith(todoData, expect.any(String));
      expect(mockSuccessResponse).toHaveBeenCalledWith(mockTodo, 'Todo created successfully');
    });
  });
});
```

### 2. ユースケーステスト

```typescript
// src/usecases/__tests__/TodoUseCase.test.ts
describe('TodoUseCase', () => {
  let todoUseCase: TodoUseCase;
  let mockTodoRepository: jest.Mocked<TodoRepository>;
  let mockUserRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    mockTodoRepository = createMockTodoRepository();
    mockUserRepository = createMockUserRepository();
    todoUseCase = new TodoUseCase(mockTodoRepository, mockUserRepository);
  });

  describe('createTodo', () => {
    it('有効なデータでTodo作成が成功する', async () => {
      // Arrange
      const input = { title: 'Test Todo', descriptions: 'Test Description' };
      const userId = 'user-123';
      const mockUser = createMockUser({ id: userId });
      const mockTodo = createMockTodo({ ...input, userId });

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockTodoRepository.create.mockResolvedValue(mockTodo);

      // Act
      const result = await todoUseCase.createTodo(input, userId);

      // Assert
      expect(result).toEqual(mockTodo);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockTodoRepository.create).toHaveBeenCalledWith(expect.objectContaining(input));
    });
  });
});
```

## 🔍 デバッグ & トラブルシューティング

### 1. 一般的な問題と解決策

#### Next.js 15 params Promise 型エラー
```typescript
// ❌ 古い書き方
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params; // TypeScript エラー
}

// ✅ 新しい書き方
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const { id } = params;
}
```

#### Jest動的インポート問題
```typescript
// ❌ 問題のあるパターン
import { POST } from '../route';

// ✅ 推奨パターン
const { POST } = await import('../route');
```

### 2. Docker環境での開発

#### 環境変数設定
```bash
# .env.local
DB_HOST=localhost
DB_LOCAL_PORT=5431
DB_CONTAINER_PORT=5432
DB_NAME=next_todo
DB_USER=postgres
DB_PASSWORD=password
JWT_SECRET=your-secret-key-here
NODE_ENV=development
```

#### Docker Compose サービス構成
```yaml
services:
  db:      # PostgreSQL 16 データベース
  app:     # Next.js 15.4.3 アプリケーション（Turbopack）
```

### 3. パフォーマンス最適化

#### データベースクエリ最適化
```typescript
// ❌ N+1問題
const todos = await this.todoRepository.findAll();
for (const todo of todos) {
  const user = await this.userRepository.findById(todo.userId);
}

// ✅ JOIN使用
const todosWithUsers = await this.todoRepository.findAllWithUsers();
```

## 📚 追加リソース

### 開発参考資料
- [Next.js 15 Documentation](https://nextjs.org/docs)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Jest Testing Framework](https://jestjs.io/docs/getting-started)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### プロジェクト固有リソース
- `README.md`: プロジェクト概要とセットアップ（最新仕様対応）
- `postman/`: API テストコレクション
- `coverage/`: テストカバレッジレポート（99.5%達成）
- `src/*/README.md`: 各層の詳細ドキュメント

---

**注意**: このガイドは Claude Sonnet 4 による GitHub Copilot Agent モードでの開発を前提としています。実装時はこのドキュメントの規約に従って一貫性のあるコードを維持してください。

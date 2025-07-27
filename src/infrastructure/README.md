# Infrastructure Layer

このディレクトリは、アプリケーションのインフラストラクチャ層を構成するモジュールを格納しています。ドメイン層とアプリケーション層から独立した外部システムとの統合コードを提供します。

## 概要

インフラストラクチャ層は、ドメイン駆動設計（DDD）アーキテクチャにおいて、外部システムやフレームワークとの統合を担う責任層です。この層は以下の原則に従って設計されています：

- **依存関係の逆転**: ドメイン層のインターフェースを実装し、具体的な技術選択をカプセル化
- **技術的関心の分離**: ビジネスロジックから技術的な実装詳細を分離
- **交換可能性**: 具体的な実装を容易に置き換え可能な設計

## ディレクトリ構成

```
src/infrastructure/
├── database/           # データベース接続管理
│   └── connection.ts   # PostgreSQL接続プール設定
└── repositories/       # データアクセス実装
    ├── PostgresUserRepository.ts     # ユーザーデータアクセス
    ├── PostgresTodoRepository.ts     # ToDoデータアクセス
    └── __tests__/                    # ユニットテスト
        ├── PostgresUserRepository.test.ts    # ユーザーリポジトリテスト
        ├── PostgresTodoRepository.test.ts    # ToDoリポジトリテスト
        └── README.md                         # テスト仕様書
```

## モジュール詳細

### Database (`database/`)

データベース接続とクエリ実行のインフラストラクチャを提供します。

#### `connection.ts`
- **目的**: PostgreSQLデータベースへの接続管理
- **主要機能**:
  - コネクションプール管理
  - パラメータ化クエリ実行
  - トランザクション制御
  - エラーハンドリング
- **技術スタック**: `pg` (node-postgres)
- **設計パターン**: Singleton Pattern

```typescript
import { database } from '@/infrastructure/database/connection';

// クエリ実行例
const result = await database.query('SELECT * FROM users WHERE id = $1', [userId]);
```

### Repositories (`repositories/`)

ドメイン層のリポジトリインターフェースの具体的な実装を提供します。

#### `PostgresUserRepository.ts`
- **目的**: ユーザーデータの永続化とクエリ
- **実装インターフェース**: `UserRepository`
- **主要機能**:
  - ユーザーIDによる検索 (`findById`)
  - ユーザー名による検索 (`findByUsername`)
  - ユーザー作成 (`create`)
  - ユーザー情報更新 (`update`)
  - ユーザー削除 (`delete`) - 論理削除
  - 全ユーザー取得 (`findAll`)
  - パスワードハッシュ化（bcrypt使用）
- **セキュリティ機能**: SQLインジェクション対策、パスワード保護、ユーザー認証

#### `PostgresTodoRepository.ts`
- **目的**: ToDoタスクデータの永続化とクエリ
- **実装インターフェース**: `TodoRepository`
- **主要機能**:
  - タスクIDによる検索 (`findById`)
  - ユーザー別タスク取得 (`findByUserId`)
  - タスク作成 (`create`)
  - タスク更新 (`update`)
  - タスク削除 (`delete`) - 論理削除
  - 全タスク取得 (`findAll`)
  - ユーザー別データ分離
- **データ整合性**: 外部キー制約、トランザクション制御、論理削除サポート

#### `__tests__/` - ユニットテストスイート
- **目的**: リポジトリ層の包括的なテスト
- **テスト対象**:
  - `PostgresUserRepository.test.ts`: 21テストケース、99.55%カバレッジ
  - `PostgresTodoRepository.test.ts`: 19テストケース、100%カバレッジ
- **テスト手法**:
  - データベース接続のモック化
  - bcryptjs のハッシュ化モック
  - UUID生成の予測可能な値への置換
  - 正常系・異常系・境界値テストの完全網羅
- **実行環境**: Node.js環境（@jest-environment node）

## 設計原則

### 1. 依存関係の逆転（Dependency Inversion）

インフラストラクチャ層は、ドメイン層で定義されたインターフェースを実装します：

```typescript
// ドメイン層で定義
interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  create(input: CreateUserInput): Promise<User>;
  update(id: string, input: UpdateUserInput): Promise<User | null>;
  delete(id: string): Promise<boolean>;
  findAll(): Promise<User[]>;
}

// インフラストラクチャ層で実装
class PostgresUserRepository implements UserRepository {
  async findById(id: string): Promise<User | null> {
    // PostgreSQL固有の実装
  }
  
  async findByUsername(username: string): Promise<User | null> {
    // PostgreSQL固有の実装
  }
}
```

### 2. 技術的抽象化

データベース固有の詳細は、リポジトリ実装に隠蔽されます：

```typescript
// ドメイン層からの使用
const user = await userRepository.findByUsername('john_doe');
const userById = await userRepository.findById('550e8400-e29b-41d4-a716-446655440000');

// SQLクエリの詳細は隠蔽される
```

### 3. エラーハンドリング

インフラストラクチャ層では、技術的なエラーをドメイン層で理解可能な形に変換します：

```typescript
try {
  const result = await database.query(query, params);
  return this.mapRowToEntity(result.rows[0]);
} catch (error) {
  // データベースエラーを適切にハンドリング
  throw new Error('データの取得に失敗しました');
}
```

## データベース設計

### テーブル設計原則

1. **UUID主キー**: 分散環境での一意性確保
2. **監査フィールド**: 作成・更新の追跡可能性
3. **論理削除**: データ履歴の保持
4. **外部キー制約**: 参照整合性の保証

### パフォーマンス最適化

- **インデックス戦略**: 頻繁なクエリパターンの最適化
- **コネクションプール**: 接続リソースの効率的利用
- **クエリ最適化**: N+1問題の回避

## セキュリティ考慮事項

### 1. SQLインジェクション対策
```typescript
// パラメータ化クエリの使用
const query = 'SELECT * FROM users WHERE username = $1';
const result = await database.query(query, [username]);
```

### 2. パスワードセキュリティ
```typescript
// bcryptによるハッシュ化
const hashedPassword = await bcrypt.hash(password, 10);
```

### 3. データアクセス制御
```typescript
// ユーザー別データ分離
const query = 'SELECT * FROM todos WHERE user_id = $1';
```

## 使用方法

### 依存性注入

リポジトリインスタンスは、依存性注入コンテナから取得します：

```typescript
import { container } from '@/lib/container';

const userRepository = container.get<UserRepository>('UserRepository');
const user = await userRepository.findByUsername(username);
```

### テスト戦略

インフラストラクチャ層のテストは、包括的なユニットテストスイートで実装されています：

```typescript
// PostgresUserRepository のユニットテスト例
describe('PostgresUserRepository', () => {
  it('should find user by username', async () => {
    const repository = new PostgresUserRepository();
    const user = await repository.findByUsername('testuser');
    expect(user).toBeDefined();
  });
  
  it('should create user with hashed password', async () => {
    const repository = new PostgresUserRepository();
    const input = {
      username: 'newuser',
      password: 'password123',
      role: UserRole.USER,
      createdBy: 'admin'
    };
    const user = await repository.create(input);
    expect(user.passwordHash).not.toBe('password123');
  });
});
```

#### テスト実行方法
```bash
# 個別テスト実行
npm test -- PostgresUserRepository.test.ts
npm test -- PostgresTodoRepository.test.ts

# 全リポジトリテスト実行
npm test -- __tests__

# カバレッジ付き実行
npm run test:coverage -- __tests__
```

#### テストカバレッジ
- **PostgresUserRepository**: 21テスト、99.55%カバレッジ
- **PostgresTodoRepository**: 19テスト、100%カバレッジ

## 拡張性

新しいデータストアや外部サービスの追加は、既存のインターフェースを実装することで実現できます：

```typescript
// 新しい実装例
class MongoUserRepository implements UserRepository {
  async findById(id: string): Promise<User | null> {
    // MongoDB固有の実装
  }
  
  async findByUsername(username: string): Promise<User | null> {
    // MongoDB固有の実装
  }
  
  async create(input: CreateUserInput): Promise<User> {
    // MongoDB固有の実装
  }
}
```

## パフォーマンス監視

データベースアクセスのパフォーマンス監視は、接続プールメトリクスとクエリ実行時間で行います：

```typescript
// 監視メトリクス例
console.log('Active connections:', database.pool.totalCount);
console.log('Idle connections:', database.pool.idleCount);
```

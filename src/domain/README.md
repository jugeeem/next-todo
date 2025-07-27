# Domain Layer / ドメイン層

このディレクトリは、next-todoアプリケーションのドメイン層を構成します。ドメイン駆動設計（Domain-Driven Design, DDD）のアーキテクチャパターンに従い、ビジネスロジックとビジネスルールを中心とした設計を採用しています。

## 📁 ディレクトリ構造

```
src/domain/
├── entities/           # エンティティ（ドメインオブジェクト）
│   ├── User.ts        # ユーザーエンティティと関連型
│   └── Todo.ts        # ToDoタスクエンティティと関連型
└── repositories/      # リポジトリインターフェース
    ├── UserRepository.ts    # ユーザーデータアクセス抽象化
    └── TodoRepository.ts    # ToDoデータアクセス抽象化
```

## 🎯 設計原則

### 1. 依存関係の逆転（Dependency Inversion）
ドメイン層は、他の層（インフラストラクチャ、アプリケーション層）に依存しません。代わりに、他の層がドメイン層に依存する構造となっています。

### 2. 純粋性（Purity）
ドメインエンティティとリポジトリインターフェースは、フレームワークやライブラリに依存しない純粋なTypeScriptコードで実装されています。

### 3. ビジネスロジックの集約
アプリケーションのビジネスルールとデータ構造はすべてこの層に集約されており、技術的な詳細から分離されています。

## 📋 エンティティ（Entities）

### User エンティティ
ユーザー管理に関するドメインモデルです。

**主要な型・インターフェース:**
- `User`: ユーザーエンティティの基本構造
- `UserRole`: ユーザー権限レベルの列挙型
- `CreateUserInput`: ユーザー作成時の入力データ
- `UpdateUserInput`: ユーザー更新時の入力データ
- `LoginInput`: ログイン時の入力データ
- `AuthResult`: 認証結果データ

**ビジネスルール:**
- ユーザー名は一意である必要があります
- パスワードは最低6文字以上である必要があります
- 論理削除により、データの整合性を保持します
- 権限レベルはビットフラグ形式で設計されています

### Todo エンティティ
ToDoタスク管理に関するドメインモデルです。

**主要な型・インターフェース:**
- `Todo`: ToDoタスクエンティティの基本構造
- `CreateTodoInput`: タスク作成時の入力データ
- `UpdateTodoInput`: タスク更新時の入力データ

**ビジネスルール:**
- タスクタイトルは必須で、1-32文字である必要があります
- タスク説明は任意で、最大128文字まで可能です
- 各タスクは特定のユーザーに所有されます
- 論理削除により、タスクの履歴を保持します

## 🗄️ リポジトリ（Repositories）

リポジトリパターンにより、データアクセスロジックを抽象化しています。これにより、ドメイン層は具体的なデータストレージ技術（PostgreSQL、MongoDB等）に依存しません。

### UserRepository
ユーザーデータの永続化操作を定義します。

**主要なメソッド:**
- `findById(id: string)`: ID検索
- `findByUsername(username: string)`: ユーザー名検索
- `create(input: CreateUserInput)`: ユーザー作成
- `update(id: string, input: UpdateUserInput)`: ユーザー更新
- `delete(id: string)`: ユーザー削除（論理削除）
- `findAll()`: 全ユーザー取得

### TodoRepository
ToDoタスクデータの永続化操作を定義します。

**主要なメソッド:**
- `findById(id: string)`: ID検索
- `findByUserId(userId: string)`: ユーザー別タスク検索
- `create(input: CreateTodoInput)`: タスク作成
- `update(id: string, input: UpdateTodoInput)`: タスク更新
- `delete(id: string)`: タスク削除（論理削除）
- `findAll()`: 全タスク取得

## 🔗 他の層との関係

### インフラストラクチャ層との関係
- インフラストラクチャ層は、リポジトリインターフェースの具象実装を提供します
- 例: `PostgresUserRepository`、`PostgresTodoRepository`

### アプリケーション層（UseCase）との関係
- ユースケースクラスは、ドメインエンティティとリポジトリを使用してビジネスロジックを実装します
- 例: `AuthUseCase`、`TodoUseCase`

### プレゼンテーション層（API Routes）との関係
- API層は、ドメインエンティティの型を使用してレスポンスデータを構築します
- バリデーション層を通じて、入力データをドメインの入力型に変換します

## 🧪 テスト戦略

ドメイン層のテストは以下のアプローチで実施できます：

### 1. エンティティのテスト
```typescript
// ユーザーエンティティの型チェック例
describe('User Entity', () => {
  it('should create valid user object', () => {
    const user: User = {
      id: 'test-id',
      username: 'testuser',
      role: UserRole.USER,
      // ... other properties
    };
    expect(user.username).toBe('testuser');
  });
});
```

### 2. リポジトリのモックテスト
```typescript
// リポジトリのモック例
const mockUserRepository: UserRepository = {
  findById: jest.fn(),
  findByUsername: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  findAll: jest.fn(),
};
```

## 📈 将来の拡張予定

### 短期的な改善
- [ ] ページネーション対応（大量データ処理）
- [ ] バリデーション強化（メールアドレス形式チェック等）
- [ ] タスクの完了状態管理機能

### 長期的な機能拡張
- [ ] タスクカテゴリ機能
- [ ] チーム・グループ機能
- [ ] タスクの優先度・期限管理
- [ ] 通知機能

## 🔧 開発ガイドライン

### 新しいエンティティの追加
1. `entities/`ディレクトリに新しいTypeScriptファイルを作成
2. エンティティインターフェースと関連する入力型を定義
3. JSDocコメントで詳細なドキュメントを記述
4. 対応するリポジトリインターフェースを作成

### 既存エンティティの変更
1. 破壊的変更を避けるため、新しいフィールドは`optional`として追加
2. バージョン管理戦略を検討（マイグレーション等）
3. 関連するユースケースへの影響を評価

### コーディング規約
- 全ての公開インターフェースにJSDocコメントを記述
- TypeScriptの厳密な型チェックを活用
- ビジネスロジックの意図を明確にするための命名規約に従う

---

**作成者**: jugeeem  
**最終更新**: 2025年7月24日  
**バージョン**: 1.0.0

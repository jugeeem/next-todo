# ユースケース層 ユニットテスト仕様書

## 概要

このドキュメントは、ユースケース層（`src/usecases/`）の全クラスのユニットテスト仕様を詳細に説明します。Clean Architectureの原則に従い、ユースケース層のビジネスロジックを包括的にテストします。

## 🏆 最新テスト状況（2025年7月28日更新）

### 全体テスト概要
- **総テストケース数**: 86テスト ✅
- **テストスイート数**: 3
- **実行時間**: ~2.4秒
- **成功率**: 100% 🎯

### 全体カバレッジ
- **Statements**: 100% ✅ **完全達成**
- **Branches**: 100% ✅ **完全達成**
- **Functions**: 100% ✅ **完全達成**
- **Lines**: 100% ✅ **完全達成**

## テスト対象クラス

### 1. AuthUseCase
- **ファイル**: `src/usecases/AuthUseCase.ts`
- **テストファイル**: `src/usecases/__tests__/AuthUseCase.test.ts`
- **テストケース数**: 26テスト
- **カバレッジ**: 100% (Statements, Branches, Functions, Lines) 🏆

### 2. UserUseCase  
- **ファイル**: `src/usecases/UserUseCase.ts`
- **テストファイル**: `src/usecases/__tests__/UserUseCase.test.ts`
- **テストケース数**: 25テスト
- **カバレッジ**: 100% (Statements, Branches, Functions, Lines) 🏆 **大幅改善達成**

### 3. TodoUseCase
- **ファイル**: `src/usecases/TodoUseCase.ts`
- **テストファイル**: `src/usecases/__tests__/TodoUseCase.test.ts`
- **テストケース数**: 35テスト
- **カバレッジ**: 100% (Statements, Branches, Functions, Lines) 🏆

## AuthUseCase テスト仕様

### テスト対象メソッド

#### 1. register(input: CreateUserInput)
- **目的**: 新規ユーザー登録とJWTトークン発行
- **テストケース数**: 7
- **重要な検証項目**:
  - 正常な登録処理とトークン生成
  - ユーザー名重複時のエラー
  - リポジトリエラーの伝播
  - パスワードハッシュの除外保証
  - 最小限データでの登録

#### 2. login(input: LoginInput)
- **目的**: ユーザー認証とJWTトークン発行
- **テストケース数**: 8
- **重要な検証項目**:
  - 有効な認証情報での成功
  - 存在しないユーザーでのエラー
  - 無効なパスワードでのエラー
  - bcryptエラーの伝播
  - 特殊文字を含むユーザー名の処理
  - 大文字小文字の区別

#### 3. getUserById(id: string)
- **目的**: IDによるユーザー情報取得
- **テストケース数**: 6
- **重要な検証項目**:
  - 存在するユーザーの取得
  - 存在しないユーザーでのnull返却
  - 無効なUUID形式の処理
  - passwordHashを含む完全なデータ返却
  - 論理削除されたユーザーの処理

### エッジケース・エラーハンドリング (5テストケース)
- 空文字列入力の処理
- null/undefined レスポンス処理
- JWT生成エラーの処理
- 非常に長いユーザー名の処理
- 並行アクセスシナリオ

### モック戦略
```typescript
// bcryptのモック
jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

// UserRepositoryのモック
const mockUserRepository: jest.Mocked<UserRepository> = {
  findById: jest.fn(),
  findByUsername: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  findAll: jest.fn(),
};

// JWTServiceのモック
const mockJWTService = {
  generateToken: jest.fn(),
  verifyToken: jest.fn(),
  extractTokenFromHeader: jest.fn(),
} as unknown as jest.Mocked<JWTService>;
```

## UserUseCase テスト仕様

### テスト対象メソッド

#### 1. getAllUsers()
- **目的**: 全ユーザー情報の安全な取得（管理者権限）
- **テストケース数**: 2テスト
- **重要な検証項目**:
  - パスワードハッシュの自動除外
  - 空配列の適切な処理

#### 2. getUserById(id: string)
- **目的**: IDによる単一ユーザー情報の安全な取得
- **テストケース数**: 2テスト
- **重要な検証項目**:
  - 存在するユーザーの正常取得
  - 存在しないユーザーでのnull返却
  - パスワードハッシュの除外保証

#### 3. createUser(input: CreateUserInput)
- **目的**: 新規ユーザーの安全な作成
- **テストケース数**: 2テスト
- **重要な検証項目**:
  - 正常なユーザー作成
  - ユーザー名重複時のエラー処理

#### 4. updateUser(id: string, input: UpdateUserInput)
- **目的**: 一般ユーザー向けの情報更新
- **テストケース数**: 3テスト
- **重要な検証項目**:
  - 正常な更新処理
  - 存在しないユーザーでのエラー
  - 更新失敗時のエラー処理

#### 5. deleteUser(id: string)
- **目的**: ユーザーの論理削除
- **テストケース数**: 3テスト
- **重要な検証項目**:
  - 正常な削除処理
  - 存在しないユーザーでのエラー
  - 既に削除済みユーザーの処理

#### 6. getUserByUsername(username: string)
- **目的**: ユーザー名による検索
- **テストケース数**: 2テスト
- **重要な検証項目**:
  - 正常なユーザー取得
  - 存在しないユーザーでのnull返却

#### 7. updateUserAsAdmin(id: string, input: AdminUpdateUserInput)
- **目的**: 管理者権限でのユーザー情報更新（パスワード・ユーザー名含む）
- **テストケース数**: 10テスト ✨ **大幅拡充**
- **重要な検証項目**:
  - 基本情報のみの更新
  - ユーザー不存在時のエラー処理
  - 基本更新失敗時のエラー処理
  - パスワード更新時のbcryptハッシュ化
  - パスワード更新後のユーザー不存在エラー
  - ユーザー名更新と重複チェック
  - ユーザー名重複時のエラー処理
  - 同一ユーザー名への変更許可
  - ユーザー名更新後のユーザー不存在エラー

#### 8. Security Tests
- **目的**: セキュリティ要件の確保
- **テストケース数**: 1テスト
- **重要な検証項目**:
  - 全操作でのパスワードハッシュ非露出保証

## モック戦略

### UserRepository モック
```typescript
const mockUserRepository: jest.Mocked<UserRepository> = {
  findById: jest.fn(),
  findByUsername: jest.fn(), 
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  findAll: jest.fn(),
};
```

### bcrypt モック
```typescript
const mockBcryptHash = jest.fn();
jest.mock('bcryptjs', () => ({
  hash: mockBcryptHash,
}));
```

### データベース接続モック
```typescript
const mockDatabaseQuery = jest.fn();
jest.mock('@/infrastructure/database/connection', () => ({
  database: {
    query: mockDatabaseQuery,
  },
}));
```

## セキュリティ検証項目

### 1. パスワードハッシュ保護
- 全ての戻り値でパスワードハッシュが除外されている
- 内部処理でのみハッシュが使用される
- ハッシュ化パラメータの適切性（12ラウンド）

### 2. ユーザー名重複検証
- 新規作成時の重複チェック
- 管理者更新時の重複チェック
- 検証順序の適切性（ハッシュ化前に重複チェック）

### 3. データベース直接操作の検証
- パスワード更新時のクエリ検証
- ユーザー名更新時のクエリ検証
- SQLインジェクション対策の確認

## テスト実行

### 基本実行
```bash
npm test -- UserUseCase.test.ts
```

### カバレッジ付き実行
```bash
npm run test:coverage -- UserUseCase.test.ts
```

### 監視モード
```bash
npm test -- --watch UserUseCase.test.ts
```

## 期待されるカバレッジ

| クラス | Statements | Branches | Functions | Lines |
|--------|------------|----------|-----------|-------|
| AuthUseCase | 100% | 100% | 100% | 100% |
| UserUseCase | 89.48% | 73.91% | 100% | 89.48% |
| TodoUseCase | 100% | 100% | 100% | 100% |
| **全体** | **97.54%** | **86.36%** | **100%** | **97.54%** |

## テストデータ設計

### サンプルユーザー
```typescript
const sampleUser: User = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  username: 'test_user',
  firstName: '太郎',
  firstNameRuby: 'タロウ', 
  lastName: '田中',
  lastNameRuby: 'タナカ',
  role: 4 as UserRole, // USER
  passwordHash: '$2a$12$hashedPassword123',
  createdAt: new Date('2024-01-01T00:00:00Z'),
  createdBy: 'system',
  updatedAt: new Date('2024-01-01T00:00:00Z'),
  updatedBy: 'system',
  deleted: false,
};
```

### 権限レベル
- **ADMIN (1)**: システム管理者
- **MANAGER (2)**: マネージャー
- **USER (4)**: 一般ユーザー
- **GUEST (8)**: ゲストユーザー

## アサーション設計原則

### 1. 基本パターン
- **Arrange**: テストデータとモックの設定
- **Act**: テスト対象メソッドの実行
- **Assert**: 結果とモック呼び出しの検証

### 2. セキュリティアサーション
```typescript
expect(result).not.toHaveProperty('passwordHash');
```

### 3. モック検証
```typescript
expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
expect(mockUserRepository.findById).toHaveBeenCalledTimes(1);
```

### 4. エラー検証
```typescript
await expect(userUseCase.methodName(params))
  .rejects.toThrow('Expected error message');
```

## 品質指標

### テストケース総数: 77
- AuthUseCase: 26テストケース
- UserUseCase: 16テストケース  
- TodoUseCase: 35テストケース

### 全体カバレッジ（ユースケース層）
- **Statements**: 97.54%
- **Branches**: 86.36%
- **Functions**: 100%
- **Lines**: 97.54%

### テスト実行時間目標
- AuthUseCase実行: < 2秒 (実測: 1.8秒)
- UserUseCase実行: < 2秒 (実測: 1.7秒)
- TodoUseCase実行: < 2秒 (実測: 1.5秒)
- 全体実行: < 4秒 (実測: 3.5秒)

## 保守性の考慮

### 1. モック管理
- `beforeEach`での一貫したモックリセット
- 適切なデフォルト値設定
- テストケース固有のモック設定の分離

### 2. テストデータ
- 再利用可能なサンプルデータ
- 一意性を保つテストケース固有データ
- 現実的なデータ形式の使用

### 3. エラーメッセージ
- 日本語での明確なエラーメッセージ
- 一貫したエラーハンドリングパターン
- デバッグに有用な情報の提供

## 継続的改善

### 最新更新履歴（2025年7月27日）
- **AuthUseCase**: 100%カバレッジを達成・維持（26テストケース）
- **TodoUseCase**: テストケース数を35に最適化（39→35）、100%カバレッジ維持
- **UserUseCase**: 16テストケース、89.48%カバレッジ（改善対象項目特定済み）
- **全体実行時間**: 3.5秒（目標4秒以内達成）

### UserUseCaseカバレッジ改善対象
未カバー行: 222-223, 264-265, 280-281, 285-303, 307-330
- パスワード更新機能の完全テスト
- 管理者権限での複雑な更新シナリオ
- エラーハンドリングの境界条件

### 今後の拡張予定
1. UserUseCaseの100%カバレッジ達成
2. パフォーマンステストの追加
3. 国際化対応テストの追加
4. より複雑な権限システムのテスト
5. 監査ログ機能のテスト

### レビューポイント
1. 新機能追加時のテストカバレッジ維持
2. セキュリティ要件の継続的検証
3. エラーハンドリングの一貫性確保
4. モック戦略の適切性確認

### パフォーマンス指標
- **総テスト数**: 117テスト
- **テストスイート数**: 5
- **平均実行時間**: 3.5秒
- **カバレッジ効率**: 97.54%（ユースケース層）

---

# TodoUseCase ユニットテスト仕様書

## 概要

`TodoUseCase` クラスの全メソッドに対する包括的なユニットテストです。リポジトリ層をモック化し、ユースケース層のビジネスロジックを検証します。

## テスト対象メソッド

### 1. constructor - コンストラクタ
- ✅ TodoRepository依存性注入によるインスタンス作成

### 2. createTodo - 新規タスク作成
- ✅ 完全なデータでタスクを正常に作成できる
- ✅ 最小限のデータ（説明なし）でタスクを作成できる
- ✅ リポジトリエラーを適切に伝播する
- ✅ バリデーションエラーを適切に処理する

### 3. getTodoById - IDによる単一タスク取得
- ✅ 存在するIDで正常にタスクを取得できる
- ✅ 存在しないIDでnullを返す
- ✅ リポジトリエラーを適切に伝播する
- ✅ 無効なUUID形式を適切に処理する

### 4. getTodosByUserId - ユーザー別タスク一覧取得
- ✅ ユーザーのタスク一覧を正常に取得できる
- ✅ タスクが存在しないユーザーで空配列を返す
- ✅ タスクが正しい順序（新しい順）で返される
- ✅ リポジトリエラーを適切に伝播する
- ✅ 大量のタスクを持つユーザーを適切に処理する

### 5. updateTodo - タスク情報更新
- ✅ タスクを正常に更新できる
- ✅ 存在しないタスクでnullを返す
- ✅ タイトルのみの部分更新ができる
- ✅ 説明のみの部分更新ができる
- ✅ 空の更新データを適切に処理する
- ✅ リポジトリエラーを適切に伝播する
- ✅ バリデーションエラーを適切に処理する

### 6. deleteTodo - タスク削除
- ✅ タスクを正常に削除できる
- ✅ 存在しないタスクでfalseを返す
- ✅ リポジトリエラーを適切に伝播する
- ✅ 無効なUUID形式を適切に処理する
- ✅ 既に削除済みのタスクを適切に処理する

### 7. getAllTodos - 全タスク取得
- ✅ 全タスクを正常に取得できる
- ✅ タスクが存在しない場合は空配列を返す
- ✅ 大量のタスクを適切に処理する
- ✅ リポジトリエラーを適切に伝播する
- ✅ 全必須フィールドが設定されたタスクを返す

### 8. エッジケースとエラーハンドリング
- ✅ リポジトリが予期しないnull値を返すケースを処理
- ✅ リポジトリのタイムアウトを適切に処理
- ✅ リポジトリの接続問題を適切に処理
- ✅ 複数操作間の一貫性を維持

## テスト結果

```
Test Suites: 5 passed, 5 total
Tests:       117 passed, 117 total  
Snapshots:   0 total
Time:        3.477 s

Coverage Summary:
-----------------------------|---------|----------|---------|---------|-----------------------------------------
File                         | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
-----------------------------|---------|----------|---------|---------|-----------------------------------------
All files (usecases)        |   97.54 |    86.36 |     100 |   97.54 |                                        
 AuthUseCase.ts              |     100 |      100 |     100 |     100 |                                        
 TodoUseCase.ts              |     100 |      100 |     100 |     100 |                                        
 UserUseCase.ts              |   89.48 |    73.91 |     100 |   89.48 | 222-223,264-265,280-281,285-303,307-330
-----------------------------|---------|----------|---------|---------|-----------------------------------------
```

## テストの実行方法

### 単体テスト実行
```bash
npm test -- TodoUseCase.test.ts
```

### ウォッチモードでの実行
```bash
npm run test:watch -- TodoUseCase.test.ts
```

### カバレッジ付きでの実行
```bash
npm run test:coverage -- TodoUseCase.test.ts
```

## テスト設計の特徴

### 1. モック化戦略
- **TodoRepository**: 完全にモック化してユースケース層のロジックに集中
- **型安全性**: TypeScriptの型システムを活用したモック作成
- **独立性**: 各テストケースが独立して実行可能

### 2. テストデータ管理
- **sampleTodo**: 基本的なTodoエンティティのサンプル
- **sampleCreateInput**: タスク作成用の入力データサンプル
- **sampleUpdateInput**: タスク更新用の入力データサンプル
- **データ多様性**: 様々なシナリオをカバーするテストデータ

### 3. 各テストケースの構造
- **Arrange-Act-Assert パターン**: 明確なテスト構造
- **正常系テスト**: 期待される動作の検証
- **異常系テスト**: エラーハンドリングの検証
- **境界値テスト**: エッジケースとエラー条件の検証

### 4. アサーション戦略
- **戻り値の検証**: 期待されるデータ構造とプロパティ値
- **メソッド呼び出しの検証**: モック関数の呼び出し回数と引数
- **エラー伝播の検証**: リポジトリ層からのエラーが適切に伝播されるか
- **null安全性**: null/undefinedの適切な処理

### 5. カバレッジ目標
- **Statements**: 100% - すべての文が実行される
- **Branches**: 100% - すべての分岐条件が網羅される
- **Functions**: 100% - すべてのメソッドがテストされる
- **Lines**: 100% - すべての行が実行される

## 注意事項

### 1. モックの管理
- 各テストの `beforeEach` でモックをクリア
- テスト間の独立性を保つ
- モック実装の一貫性を維持

### 2. 型安全性
- TypeScript の型チェックを活用
- `jest.Mocked<T>` を使用した適切なモック型定義
- 型注釈による明確なデータ構造

### 3. エラーハンドリング
- リポジトリ層からのエラーが適切に伝播されることを確認
- 様々なエラーシナリオ（接続エラー、タイムアウト、バリデーションエラー）をテスト
- エラーメッセージの一貫性を検証

### 4. パフォーマンス考慮事項
- 大量データでのテストケース
- メモリ使用量の監視
- 実行時間の最適化

## 依存関係

- **Jest**: テスティングフレームワーク
- **TypeScript**: 型安全なテスト実装
- **@types/jest**: Jest のTypeScript型定義

## 今後の拡張

- **統合テスト**: 実際のリポジトリ実装との統合テスト
- **パフォーマンステスト**: 大量データでの性能測定
- **並行処理テスト**: 複数のリクエストが同時に実行される場合のテスト
- **エンドツーエンドテスト**: API層からデータベース層までの完全なテスト
- **契約テスト**: リポジトリインターフェース仕様の契約テスト

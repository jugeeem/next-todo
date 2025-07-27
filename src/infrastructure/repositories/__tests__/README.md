# Repository Layer ユニットテスト

## 概要

リポジトリ層の各クラスに対する包括的なユニットテストです。データベース接続をモック化し、各種データ操作の正常性とエラーハンドリングを検証します。

## テスト対象クラス

- **PostgresTodoRepository**: ToDoタスクのデータ永続化
- **PostgresUserRepository**: ユーザー情報のデータ永続化

## PostgresTodoRepository テスト対象メソッド

### 1. findById - IDによる単一タスク検索
- ✅ 存在するIDで正常にToDoタスクを取得できる
- ✅ 存在しないIDでnullを返す
- ✅ データベースエラーが発生した場合は例外を投げる

### 2. findByUserId - ユーザー別タスク一覧取得
- ✅ ユーザーのToDoタスク一覧を正常に取得できる
- ✅ ユーザーにタスクが存在しない場合は空配列を返す

### 3. create - 新規タスク作成
- ✅ 新規ToDoタスクを正常に作成できる
- ✅ descriptionなしでToDoタスクを作成できる

### 4. update - 既存タスク更新
- ✅ ToDoタスクのタイトルを正常に更新できる
- ✅ ToDoタスクの説明を正常に更新できる
- ✅ タイトルと説明を同時に更新できる
- ✅ 更新項目が空の場合はfindByIdと同じ動作をする
- ✅ 存在しないIDで更新した場合はnullを返す

### 5. delete - タスク論理削除
- ✅ ToDoタスクを正常に論理削除できる
- ✅ 存在しないIDで削除した場合はfalseを返す
- ✅ rowCountがnullの場合はfalseを返す

### 6. findAll - 全タスク一覧取得
- ✅ 全てのToDoタスクを正常に取得できる
- ✅ ToDoタスクが存在しない場合は空配列を返す

### 7. mapRowToTodo - データベース行のエンティティマッピング
- ✅ データベース行を正常にToDoエンティティにマッピングできる
- ✅ descriptionsがnullの場合はnullのままマッピングされる

## PostgresUserRepository テスト対象メソッド

### 1. findById - IDによる単一ユーザー検索
- ✅ 存在するIDで正常にユーザーを取得できる
- ✅ 存在しないIDでnullを返す
- ✅ データベースエラーが発生した場合は例外を投げる

### 2. findByUsername - ユーザー名による検索
- ✅ 存在するユーザー名で正常にユーザーを取得できる
- ✅ 存在しないユーザー名でnullを返す
- ✅ データベースエラーが発生した場合は例外を投げる

### 3. create - 新規ユーザー作成
- ✅ 完全なデータでユーザーを作成し、パスワードをハッシュ化できる
- ✅ 最小限のデータでユーザーを作成できる
- ✅ bcryptハッシュ化エラーを適切に処理する
- ✅ データベースエラーが発生した場合は例外を投げる

### 4. update - 既存ユーザー更新
- ✅ 完全なデータでユーザーを正常に更新できる
- ✅ 存在しないIDで更新した場合はnullを返す
- ✅ データベースエラーが発生した場合は例外を投げる

### 5. delete - ユーザー論理削除
- ✅ ユーザーを正常に論理削除できる
- ✅ 存在しないIDで削除した場合はfalseを返す
- ✅ rowCountがnullの場合はfalseを返す
- ✅ データベースエラーが発生した場合は例外を投げる

### 6. findAll - 全ユーザー一覧取得
- ✅ 全てのユーザーを作成日順で正常に取得できる
- ✅ ユーザーが存在しない場合は空配列を返す
- ✅ オプションフィールドがnullのユーザーを適切に処理する
- ✅ データベースエラーが発生した場合は例外を投げる

## テスト結果

### PostgresTodoRepository
```
Test Suites: 1 passed, 1 total
Tests:       19 passed, 19 total
Snapshots:   0 total
Coverage:    100% (Statements, Branches, Functions, Lines)
```

### PostgresUserRepository
```
Test Suites: 1 passed, 1 total
Tests:       21 passed, 21 total
Snapshots:   0 total
Coverage:    99.55% (Statements: 99.55%, Branches: 93.1%, Functions: 100%, Lines: 99.55%)
```

## テストの実行方法

### PostgresTodoRepository テスト実行
```bash
npm test -- PostgresTodoRepository.test.ts
```

### PostgresUserRepository テスト実行
```bash
npm test -- PostgresUserRepository.test.ts
```

### 全リポジトリテスト実行
```bash
npm test -- __tests__
```

### ウォッチモードでの実行
```bash
npm run test:watch -- PostgresTodoRepository.test.ts
npm run test:watch -- PostgresUserRepository.test.ts
```

### カバレッジ付きでの実行
```bash
npm run test:coverage -- PostgresTodoRepository.test.ts
npm run test:coverage -- PostgresUserRepository.test.ts
npm run test:coverage -- __tests__
```

## テスト設計の特徴

### 1. モック化
- **データベース接続**: `@/infrastructure/database/connection` をモック化
- **UUID生成**: `uuid` ライブラリをモック化して予測可能なIDを生成
- **日付生成**: `Date` コンストラクタをモック化して固定日時を使用（PostgresTodoRepositoryのみ）
- **bcryptjs**: パスワードハッシュ化をモック化（PostgresUserRepositoryのみ）

### 2. テストデータ
- **PostgresTodoRepository**:
  - `sampleTodo`: 期待値としてのToDoエンティティサンプル
  - `sampleDbRow`: データベース行データサンプル（snake_case）
- **PostgresUserRepository**:
  - 日本語文字列を含む包括的なユーザーデータ
  - UserRole列挙型を使用したロール管理
  - オプションフィールド（名前、読み仮名）のテスト

### 3. 各テストケース
- **Arrange-Act-Assert パターン**: 明確なテスト構造
- **正常系テスト**: 各メソッドの期待される動作を検証
- **異常系テスト**: エラーハンドリングと境界値の検証
- **境界値テスト**: 空データ、null値、存在しないIDなど

### 4. アサーション
- **戻り値の検証**: 期待されるデータ構造とプロパティ値
- **メソッド呼び出しの検証**: モック関数の呼び出し回数と引数
- **SQLクエリの検証**: 適切なクエリとパラメータが使用されているか

### 5. Node.js環境設定
- **@jest-environment node**: PostgreSQL関連のテストで必要
- Node.js環境でのみ実行される依存関係の適切な処理

## カバレッジ

### PostgresTodoRepository
本テストスイートは以下の100%カバレッジを達成しています：
- **Statements**: 100% - すべての文が実行される
- **Branches**: 100% - すべての分岐条件が網羅される
- **Functions**: 100% - すべてのメソッドがテストされる
- **Lines**: 100% - すべての行が実行される

### PostgresUserRepository
本テストスイートは以下の高いカバレッジを達成しています：
- **Statements**: 99.55% - ほぼすべての文が実行される
- **Branches**: 93.1% - 大部分の分岐条件が網羅される
- **Functions**: 100% - すべてのメソッドがテストされる
- **Lines**: 99.55% - ほぼすべての行が実行される

## 注意事項

### 1. モックの管理
- 各テストの `beforeEach` でモックをクリア
- Date モックは使用後に必ずリストア（PostgresTodoRepositoryのみ）
- テスト間の独立性を保つ

### 2. 型安全性
- TypeScript の型チェックを活用
- `any` 型の使用を避けて適切な型注釈を使用
- モック関数の型も適切に定義

### 3. 実装との整合性
- 実際のSQLクエリ構造に合わせた検証
- データベーススキーマとの整合性を保つ
- null値の扱いは実装に合わせて調整

### 4. 環境固有の考慮事項
- **Node.js環境**: PostgreSQL関連テストでは `@jest-environment node` が必要
- **bcryptjs**: CommonJS形式でのrequireが必要
- **相対パス**: __tests__ディレクトリ配置による適切なパス設定

## 今後の拡張

- **統合テスト**: 実際のデータベースを使用したテスト
- **パフォーマンステスト**: 大量データでの動作確認
- **並行処理テスト**: 複数のリクエストが同時に実行される場合のテスト
- **トランザクションテスト**: データベーストランザクションの整合性テスト
- **認証・認可テスト**: ユーザー権限に関する追加テスト
- **パスワード関連テスト**: bcryptの実装詳細に関するテスト

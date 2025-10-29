# Next.js Todo API

JWT認証機能を持ったTodoアプリのAPI。クリーンアーキテクチャに従って実装され、包括的なテストカバレッジを提供します。

## 技術スタック

- **Framework**: Next.js 15.4.3 + Turbopack
- **Runtime**: React 19.1.0
- **Database**: PostgreSQL 16
- **ORM**: 生のSQL (pg 8.12.0)
- **Authentication**: JWT (jsonwebtoken 9.0.2)
- **Validation**: Zod 3.22.4
- **Testing**: Jest 30.0.5 + Testing Library + JSDOM
- **Code Quality**: Biome 2.1.2 (linting & formatting)
- **Container**: Docker & Docker Compose
- **UI Framework**: HeroUI 2.8.1 + Framer Motion 12.23.7
- **Styling**: Tailwind CSS 4 + PostCSS 4
- **Date & Time**: date-fns 4.1.0 + date-fns-tz 3.2.0
- **Additional Libraries**: bcryptjs, JOSE 6.0.12, UUID 9.0.1

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.example`を`.env.local`にコピーし、必要に応じて値を変更してください。

```bash
cp .env.example .env.local
```

#### 主要な環境変数

| 変数名 | 説明 | デフォルト値 |
|--------|------|-------------|
| `DB_HOST` | データベースホスト | `localhost` |
| `DB_LOCAL_PORT` | ローカルDBポート | `5431` |
| `DB_CONTAINER_PORT` | コンテナDBポート | `5432` |
| `DB_NAME` | データベース名 | `next_todo` |
| `DB_USER` | データベースユーザー | `postgres` |
| `DB_PASSWORD` | データベースパスワード | `password` |
| `JWT_SECRET` | JWT署名用秘密鍵 | ランダム文字列 |
| `NODE_ENV` | 実行環境 | `development` |

### 3. Dockerでの起動

```bash
# データベースとアプリケーションを起動
docker compose up --build

# バックグラウンドで起動する場合
docker compose up -d --build
```

## 本番環境でのデプロイ（PM2）

このプロジェクトは **PM2** を使用した本番環境でのデプロイに対応しています。

### PM2とは

PM2は Node.js アプリケーション向けのプロセスマネージャーです。以下の機能を提供します：

- プロセス管理（起動・停止・再起動）
- クラスタモード（マルチコアCPUの活用）
- 自動再起動（クラッシュ時の自動復旧）
- ログ管理
- モニタリング

### PM2でのデプロイ手順

#### 1. アプリケーションのビルド

```bash
npm run build
```

#### 2. 環境変数の設定

本番環境用の `.env` ファイルを作成します。

```bash
cp .env.example .env
# 必要な環境変数を設定（DATABASE_URL、JWT_SECRET など）
```

#### 3. PM2でアプリケーションを起動

```bash
# 本番環境で起動
pm2 start ecosystem.config.js --env production

# または、package.json のスクリプトを使用
npm run pm2:start
```

### PM2の主要コマンド

```bash
# ステータス確認
npm run pm2:status

# ログ確認
npm run pm2:logs

# アプリケーションの停止
npm run pm2:stop

# アプリケーションの再起動
npm run pm2:restart

# モニタリング
npm run pm2:monit
```

### PM2の詳細ドキュメント

PM2の詳細な使い方については、[PM2運用ガイド](.docs/PM2.md) を参照してください。


## テスト

このプロジェクトは包括的なテストスイートを備えています：

- **総テスト数**: 425テスト（全て通過）
- **テストスイート数**: 24スイート
- **テストカバレッジ**: 95.06%（ステートメント）
- **ブランチカバレッジ**: 90.57%
- **関数カバレッジ**: 88.99%
- **ラインカバレッジ**: 95.06%
- **実行時間**: 約5.3秒

### テストの実行

```bash
# 全テストを実行
npm test

# ウォッチモードでテスト実行
npm run test:watch

# カバレッジレポート付きでテスト実行
npm run test:coverage
```

### テスト構成

- **API エンドポイントテスト**: 全ての REST API の動作検証
- **ユースケーステスト**: ビジネスロジックの単体テスト
- **リポジトリテスト**: データアクセス層のテスト
- **ライブラリテスト**: 共通ライブラリの単体テスト

各テストは以下をカバーしています：
- 正常系の動作確認
- 異常系・エラーハンドリング
- バリデーション処理
- 認証・認可機能
- エッジケース処理

### 主要なテストファイル

- `src/app/api/*/route.test.ts`: API エンドポイントのテスト
- `src/usecases/__tests__/*.test.ts`: ユースケースのテスト
- `src/infrastructure/repositories/__tests__/*.test.ts`: リポジトリのテスト
- `src/lib/__tests__/*.test.ts`: ライブラリのテスト

## API エンドポイント

### 認証

#### ユーザー登録
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "firstName": "John",
  "lastName": "Doe",
  "password": "password123",
  "role": 4
}
```

#### ユーザーログイン
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "john_doe",
  "password": "password123"
}
```

### ユーザー管理

#### ユーザー一覧取得
```http
GET /api/users
Authorization: Bearer <token>
```

#### ユーザー詳細取得
```http
GET /api/users/{id}
Authorization: Bearer <token>
```

#### 現在ユーザー情報取得
```http
GET /api/users/me
Authorization: Bearer <token>
```

#### 現在ユーザーのTodo一覧取得
```http
GET /api/users/me/todos
Authorization: Bearer <token>
```

#### 現在ユーザーのTodo統計取得
```http
GET /api/users/me/todos/stats
Authorization: Bearer <token>
```

#### プロフィール更新
```http
PUT /api/users/me
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "太郎",
  "lastName": "田中",
  "firstNameRuby": "タロウ",
  "lastNameRuby": "タナカ"
}
```

#### パスワード変更
```http
PUT /api/users/me/password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "old_password",
  "newPassword": "new_password"
}
```

#### ユーザー作成（管理者用）
```http
POST /api/users
Authorization: Bearer <token>
Content-Type: application/json

{
  "username": "new_user",
  "firstName": "新",
  "lastName": "ユーザー",
  "password": "password123",
  "role": 4
}
```

#### ユーザー更新（管理者用）
```http
PUT /api/users/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "更新",
  "lastName": "太郎",
  "role": 2
}
```

#### ユーザー削除（管理者用）
```http
DELETE /api/users/{id}
Authorization: Bearer <token>
```

#### 特定ユーザーのTodo一覧取得
```http
GET /api/users/{id}/todos
Authorization: Bearer <token>
```

### Todo

すべてのTodo APIは認証が必要です。ヘッダーに`Authorization: Bearer <token>`を含めてください。

#### Todo一覧取得
```http
GET /api/todos
Authorization: Bearer <token>
```

#### Todo作成
```http
POST /api/todos
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "新しいタスク",
  "descriptions": "タスクの詳細説明"
}
```

#### Todo詳細取得
```http
GET /api/todos/{id}
Authorization: Bearer <token>
```

#### Todo更新
```http
PUT /api/todos/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "更新されたタスク",
  "descriptions": "更新された詳細説明"
}
```

#### Todo削除
```http
DELETE /api/todos/{id}
Authorization: Bearer <token>
```

### ヘルスチェック

#### アプリケーション状態確認
```http
GET /api/health
```

## データベーススキーマ

### users テーブル

| カラム | 型 | 制約 | 説明 |
|--------|----|----- |------|
| id | UUID | PRIMARY KEY, NOT NULL | 一意なID |
| username | VARCHAR | NOT NULL, UNIQUE | ユーザー名 |
| first_name | VARCHAR | NULL | 名 |
| first_name_ruby | VARCHAR | NULL | 名(カナ) |
| last_name | VARCHAR | NULL | 姓 |
| last_name_ruby | VARCHAR | NULL | 姓(カナ) |
| role | INTEGER | NOT NULL, DEFAULT 8 | 役割 (1=admin, 2=manager, 4=user, 8=guest) |
| password_hash | VARCHAR | NOT NULL | ハッシュ化されたパスワード |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 作成日時 |
| created_by | VARCHAR | NOT NULL, DEFAULT 'system' | 作成者 |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 更新日時 |
| updated_by | VARCHAR | NOT NULL, DEFAULT 'system' | 更新者 |
| deleted | BOOLEAN | NOT NULL, DEFAULT FALSE | 削除フラグ |

### todos テーブル

| カラム | 型 | 制約 | 説明 |
|--------|----|----- |------|
| id | UUID | PRIMARY KEY, NOT NULL | 一意なID |
| title | VARCHAR(32) | NOT NULL | todoのタイトル |
| descriptions | VARCHAR(128) | NULL | todoの詳細 |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 作成日時 |
| created_by | VARCHAR | NOT NULL, DEFAULT 'system' | 作成者 |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 更新日時 |
| updated_by | VARCHAR | NOT NULL, DEFAULT 'system' | 更新者 |
| deleted | BOOLEAN | NOT NULL, DEFAULT FALSE | 削除フラグ |
| user_id | UUID | NOT NULL, FOREIGN KEY | users.id の外部キー |

## アーキテクチャ

このプロジェクトはクリーンアーキテクチャに従って構成されており、高いテスト可能性と保守性を実現しています：

```
src/
├── app/api/           # API ルート (インターフェース層)
│   ├── auth/          # 認証エンドポイント
│   ├── todos/         # Todo 管理エンドポイント
│   ├── users/         # ユーザー管理エンドポイント
│   └── health/        # ヘルスチェック
├── domain/            # ドメイン層
│   ├── entities/      # エンティティ（User, Todo）
│   └── repositories/  # リポジトリインターフェース
├── features/          # フィーチャー層（UI コンポーネント）
│   ├── auth/          # 認証関連コンポーネント
│   ├── todos/         # Todo関連コンポーネント
│   └── users/         # ユーザー関連コンポーネント
├── infrastructure/    # インフラストラクチャ層
│   ├── database/      # データベース接続
│   └── repositories/  # リポジトリ実装（PostgreSQL）
├── usecases/         # ユースケース層 (アプリケーションサービス)
│   ├── AuthUseCase.ts    # 認証ビジネスロジック
│   ├── TodoUseCase.ts    # Todo ビジネスロジック
│   ├── UserUseCase.ts    # ユーザー ビジネスロジック
│   └── __tests__/        # ユースケーステスト（86テスト・100%カバレッジ）
├── lib/              # 共通ライブラリ
│   ├── auth-middleware.ts # JWT認証ミドルウェア
│   ├── container.ts      # DIコンテナ
│   ├── jwt.ts           # JWT ユーティリティ
│   ├── response.ts      # API レスポンス ヘルパー
│   ├── validation.ts    # バリデーション スキーマ
│   └── __tests__/        # ライブラリテスト（100%カバレッジ）
└── types/            # TypeScript 型定義
```

### 設計原則

- **依存性の注入**: DIコンテナによる疎結合な設計とシングルトンパターン
- **レイヤー分離**: クリーンアーキテクチャに従った各層の責務分離
- **テスタビリティ**: モック可能な設計による95%以上の高テストカバレッジ
- **型安全性**: TypeScript 5.8.3による厳密な型チェック
- **品質保証**: 425テストケースによる包括的なテストスイート
- **モダンな開発環境**: Turbopack、HeroUI、Tailwind CSS 4の活用

## テストユーザー

データベース初期化時に以下のテストユーザーが作成されます：

- **admin** / **password** (role: 1 - Admin)
- **user1** / **password** (role: 4 - User)

## ポート設定

- **アプリケーション**: 3000
- **PostgreSQL**: 5431 (外部アクセス用)

## プロジェクト構成

```
next-todo/
├── src/                    # ソースコード
│   ├── app/               # Next.js App Router
│   │   ├── api/          # API エンドポイント
│   │   ├── globals.css   # グローバルスタイル（Tailwind CSS 4）
│   │   ├── hero.ts       # HeroUI プラグイン設定
│   │   ├── layout.tsx    # レイアウトコンポーネント
│   │   ├── page.tsx      # ホームページ
│   │   └── providers.tsx # HeroUI プロバイダー
│   ├── domain/           # ドメイン層
│   ├── features/         # フィーチャー層（UI コンポーネント）
│   ├── infrastructure/   # インフラ層
│   ├── usecases/        # ユースケース層
│   ├── lib/             # 共通ライブラリ
│   ├── types/           # 型定義
│   └── middleware.ts    # Next.js ミドルウェア（JWT認証）
├── postman/             # API テストコレクション
├── coverage/            # テストカバレッジレポート
├── public/              # 静的ファイル
├── biome.json          # Biome 設定
├── jest.config.ts      # Jest 設定
├── jest.setup.ts       # Jest セットアップ
├── compose.yml         # Docker Compose 設定
├── next.config.ts      # Next.js 設定
├── tsconfig.json       # TypeScript 設定
└── README.md           # このファイル
```

## 開発

### コード品質管理

```bash
# コードフォーマット
npm run format

# リント実行
npm run lint

# 型チェック、リント、フォーマットを一括実行
npm run check
```

### ビルド・デプロイ

```bash
# ビルド
npm run build

# 本番起動
npm start

# 開発サーバー起動（Turbopack使用）
npm run dev
```

## APIテストコレクション

Postmanコレクションが提供されています：
- `postman/next-todo.postman_collection.json`

このコレクションには全ての API エンドポイントのサンプルリクエストが含まれています。

## 品質指標

### テストカバレッジ（最新）

| カテゴリ | カバレッジ率 |
|----------|-------------|
| ステートメント | 95.06% |
| ブランチ | 90.57% |
| 関数 | 88.99% |
| ライン | 95.06% |

### テストスイート詳細

- **テストスイート数**: 24スイート
- **総テストケース**: 425テスト
- **成功率**: 100%（全テスト通過）
- **実行時間**: 約5.3秒

### 主要機能のテストカバレッジ

- **認証API**: 97%以上カバレッジ
- **Todo API**: 98%以上カバレッジ
- **ユーザー管理API**: 99%以上カバレッジ  
- **ビジネスロジック層（UseCases）**: 96%以上カバレッジ
- **データアクセス層（Repositories）**: 84%以上カバレッジ
- **共通ライブラリ**: 98%以上カバレッジ
- **認証ミドルウェア**: 100%カバレッジ
- **日時ユーティリティ**: 98%以上カバレッジ

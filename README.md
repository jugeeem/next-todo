# Next.js Todo API

JWT認証機能を持ったTodoアプリのAPI。クリーンアーキテクチャに従って実装され、包括的なテストカバレッジを提供します。

## 技術スタック

- **Framework**: Next.js 15.4.8 + Turbopack
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

### 4. VSCode Dev Containers での開発

**推奨**: このプロジェクトは VSCode の Dev Containers に対応しています。コンテナ内で完結した開発環境を構築できます。

#### 前提条件

以下のソフトウェアが事前にインストールされている必要があります:

1. **Visual Studio Code**
   - 公式サイト: https://code.visualstudio.com/
   - 最新の安定版を推奨

2. **Docker Desktop**
   - Windows: https://docs.docker.com/desktop/install/windows-install/
   - macOS: https://docs.docker.com/desktop/install/mac-install/
   - Linux: https://docs.docker.com/desktop/install/linux-install/
   - **重要**: Docker Desktop を起動してから作業を開始してください

3. **VSCode 拡張機能「Dev Containers」**
   - 拡張機能ID: `ms-vscode-remote.remote-containers`
   - VSCode の拡張機能マーケットプレイスからインストール
   - または、コマンドパレットから `Extensions: Install Extensions` で検索してインストール

#### 初期化手順（初回セットアップ）

##### ステップ 1: リポジトリのクローン

```bash
# リポジトリをクローン
git clone https://github.com/jugeeem/next-todo.git
cd next-todo
```

##### ステップ 2: 環境変数ファイルの作成

Dev Containers で使用する環境変数ファイルを作成します:

```bash
# .env.development.example をコピー
cp .env.development.example .env.development
```

`.env.development` の内容を必要に応じて編集してください（通常はデフォルト値で動作します）:

```env
# データベース設定
DB_HOST=db
DB_LOCAL_PORT=5431
DB_CONTAINER_PORT=5432
DB_NAME=next_todo
DB_USER=postgres
DB_PASSWORD=password

# JWT設定
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# 環境設定
NODE_ENV=development
```

**注意**: 
- `DB_HOST=db` はコンテナ間通信用のホスト名です（変更不要）
- `JWT_SECRET` は本番環境では必ず変更してください

##### ステップ 3: VSCode で Dev Container を起動

1. **VSCode でプロジェクトフォルダを開く**:
   ```bash
   code .
   ```
   または、VSCode のメニューから `File` → `Open Folder` でプロジェクトフォルダを選択

2. **コマンドパレットを開く**:
   - Windows/Linux: `Ctrl+Shift+P`
   - macOS: `Cmd+Shift+P`

3. **Dev Container で開く**:
   コマンドパレットに以下を入力して選択:
   ```
   Dev Containers: Reopen in Container
   ```

4. **初回ビルドの待機**:
   初回起動時は以下の処理が自動実行されます（5〜10分程度）:
   - ✅ Docker イメージのビルド（Node.js、PostgreSQL）
   - ✅ PostgreSQL コンテナの起動とデータベース初期化
   - ✅ `npm install` による依存関係のインストール（約3分）
   - ✅ VSCode 拡張機能のインストール（Biome、TypeScript など）
   - ✅ `npm run dev` による開発サーバーの自動起動

5. **進捗の確認**:
   - VSCode の右下に「Starting Dev Container」の通知が表示されます
   - 詳細ログを確認するには、通知の「show log」をクリック
   - ターミナルに `npm run dev` の出力が表示されれば起動完了です

6. **ブラウザでアクセス**:
   開発サーバーが起動したら、ブラウザで以下にアクセス:
   ```
   http://localhost:3000
   ```

##### ステップ 4: データベースの確認

Dev Container 起動時にデータベースが自動的に初期化され、テストユーザーが作成されます:

**テストユーザー**:
- 管理者: `admin` / `password` (role: 1)
- 一般ユーザー: `user1` / `password` (role: 4)

**データベース接続情報**:
- ホスト: `localhost`
- ポート: `5432`（コンテナ内）、`5431`（ホストから接続する場合）
- データベース名: `next_todo`
- ユーザー名: `postgres`
- パスワード: `password`

##### ステップ 5: 開発環境の確認

コンテナ内のターミナルで以下のコマンドを実行して、環境が正しくセットアップされているか確認します:

```bash
# Node.js のバージョン確認
node --version  # v20.19.9 以上

# npm のバージョン確認
npm --version   # 10.x 以上

# PostgreSQL への接続確認
psql -h db -U postgres -d next_todo -c "SELECT version();"

# テストの実行
npm test

# コード品質チェック
npm run check
```

#### Dev Containers の構成

このプロジェクトの Dev Containers 設定には以下が含まれています:

##### 自動インストールされる VSCode 拡張機能

- **biomejs.biome**: コードフォーマット＆リント
- **dbaeumer.vscode-eslint**: ESLint サポート
- **esbenp.prettier-vscode**: Prettier サポート
- **ms-azuretools.vscode-docker**: Docker サポート
- **GitHub.copilot**: GitHub Copilot（インストール済みの場合）
- **GitHub.copilot-chat**: GitHub Copilot Chat（インストール済みの場合）

##### 永続化されるデータ

以下のデータは Docker ボリュームで永続化されます:

- **PostgreSQL データベース**: `next-todo_db-data`
- **node_modules**: コンテナ再起動後も保持
- **ビルドキャッシュ**: Next.js のビルドキャッシュ

##### ポート転送

以下のポートが自動的にホストマシンに転送されます:

| サービス | コンテナポート | ホストポート | 説明 |
|---------|--------------|-------------|------|
| Next.js | 3000 | 3000 | 開発サーバー |
| PostgreSQL | 5432 | 5431 | データベース |

#### Dev Containers の特徴

- ✅ **完全自動セットアップ**: 依存関係とデータベースが自動的に構築されます
- ✅ **開発サーバー自動起動**: `npm run dev` が起動時に自動実行されます
- ✅ **VSCode 拡張機能**: Biome、TypeScript、ESLint などが事前設定済み
- ✅ **Git 設定継承**: ホストの `.gitconfig` と SSH キーが利用可能
- ✅ **データ永続化**: PostgreSQL データは Docker ボリュームで永続化されます
- ✅ **ポート転送**: Next.js (3000) と PostgreSQL (5432) が自動転送されます
- ✅ **ホットリロード**: ソースコードの変更が即座に反映されます
- ✅ **一貫した環境**: チーム全員が同じ開発環境を使用できます

#### 日常的な使い方

##### コンテナの起動・停止

```bash
# コンテナの停止（VSCode を閉じるか、コマンドパレットから）
Dev Containers: Reopen Folder Locally

# コンテナの再起動
Dev Containers: Rebuild Container
```

##### 開発サーバーの操作

```bash
# 開発サーバーの停止（ターミナルで Ctrl+C）
Ctrl+C

# 開発サーバーの手動起動
npm run dev

# 本番ビルド
npm run build

# 本番モードで起動
npm start
```

##### データベース操作

```bash
# PostgreSQL に接続
psql -h db -U postgres -d next_todo

# データベースのリセット（全データ削除＋再初期化）
psql -h db -U postgres -d next_todo -f nginx/init.sql

# テーブル一覧の確認
psql -h db -U postgres -d next_todo -c "\dt"
```

#### トラブルシューティング

##### 問題 1: 開発サーバーが起動しない

**症状**: `npm run dev` が実行されない、またはエラーが発生する

**解決方法**:

```bash
# ターミナルで手動起動を試す
npm run dev

# package-lock.json を削除して再インストール
rm package-lock.json
rm -rf node_modules
npm install
npm run dev
```

##### 問題 2: データベースに接続できない

**症状**: `Connection refused` や `database does not exist` エラー

**解決方法**:

```bash
# PostgreSQL コンテナの状態確認
docker ps | grep postgres

# データベースが存在するか確認
psql -h db -U postgres -c "\l"

# データベースを手動作成（存在しない場合）
psql -h db -U postgres -c "CREATE DATABASE next_todo;"

# 初期化スクリプトを再実行
psql -h db -U postgres -d next_todo -f nginx/init.sql
```

##### 問題 3: コンテナのビルドが失敗する

**症状**: `Error: Failed to start the container`

**解決方法**:

```bash
# Docker のクリーンアップ
docker system prune -a

# VSCode で「Rebuild Container」を実行
# コマンドパレット → Dev Containers: Rebuild Container

# または、compose.yml を使って手動ビルド
docker compose down -v
docker compose build --no-cache
docker compose up -d
```

##### 問題 4: npm install が失敗する

**症状**: 依存関係のインストール中にエラー

**解決方法**:

```bash
# npm キャッシュをクリア
npm cache clean --force

# node_modules を削除して再インストール
rm -rf node_modules package-lock.json
npm install

# Node.js のバージョン確認（20.19.9 以上が必要）
node --version
```

##### 問題 5: ポートが既に使用されている

**症状**: `Port 3000 is already in use` エラー

**解決方法**:

```bash
# ホストマシンで 3000 番ポートを使用しているプロセスを確認
# Windows
netstat -ano | findstr :3000

# macOS/Linux
lsof -i :3000

# 該当プロセスを停止してから再起動
```

##### 問題 6: 拡張機能が動作しない

**症状**: Biome や TypeScript の拡張機能が機能しない

**解決方法**:

```bash
# VSCode をリロード
# コマンドパレット → Developer: Reload Window

# 拡張機能を手動でインストール
# 拡張機能パネル → 「Biome」を検索 → インストール

# コンテナを再ビルド
# コマンドパレット → Dev Containers: Rebuild Container
```

##### 問題 7: Git が使えない

**症状**: Git コマンドが実行できない、または SSH キーが認識されない

**解決方法**:

```bash
# Git の設定確認
git config --list

# SSH エージェントの転送確認（ホストで SSH キーを使用している場合）
# .devcontainer/devcontainer.json の forwardAgent 設定を確認

# Git の認証情報をコンテナ内で設定
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

##### 問題 8: ボリュームのデータを完全にリセットしたい

**解決方法**:

```bash
# 全てのコンテナとボリュームを削除
docker compose down -v

# VSCode で「Rebuild Container」を実行
# コマンドパレット → Dev Containers: Rebuild Container
```

#### 参考リンク

- [VSCode Dev Containers 公式ドキュメント](https://code.visualstudio.com/docs/devcontainers/containers)
- [Docker Desktop 公式ドキュメント](https://docs.docker.com/desktop/)
- [Next.js 公式ドキュメント](https://nextjs.org/docs)

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

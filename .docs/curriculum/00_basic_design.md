# Todo アプリケーション 基本設計書

## 1. プロジェクト概要

### 1.1 目的
React + Next.js の初心者が、API との連携を学習するための Todo アプリケーションを段階的に構築する。

### 1.2 対象者
- React の基本概念を理解している初学者
- Next.js のルーティングと基本構造を理解している学習者
- API との通信を学びたい開発者

### 1.3 学習目標
- クライアントコンポーネントでの状態管理とAPIフェッチの理解
- サーバーコンポーネントとクライアントコンポーネントの使い分け
- UIライブラリ（HeroUI）を活用したモダンなUI構築
- コンポーネント設計とカスタムフックによるロジック分離

---

## 2. アプリケーション要件

### 2.1 機能要件

#### 認証機能
- ユーザー登録
- ログイン
- ログアウト
- 認証状態の保持（Cookie/JWT）

#### Todo管理機能
- Todo一覧表示（ページネーション、フィルタリング、ソート）
- Todo詳細表示
- Todo作成
- Todo更新
- Todo削除
- Todo完了/未完了の切り替え

#### ユーザー管理機能
- プロフィール表示
- プロフィール更新
- パスワード変更
- ユーザーのTodo統計表示

### 2.2 非機能要件
- レスポンシブデザイン（モバイル、タブレット、デスクトップ対応）
- アクセシビリティ対応
- エラーハンドリング
- ローディング状態の表示

---

## 3. 技術スタック

### 3.1 フロントエンド
- **フレームワーク**: Next.js 15.4.3 (App Router)
- **UI ライブラリ**: React 19.1.0
- **スタイリング**: Tailwind CSS 4.0, HeroUI 2.8.1
- **型定義**: TypeScript 5.8.3
- **状態管理**: React Hooks（useState, useEffect, etc.）

### 3.2 バックエンド（既存API）
- **認証**: JWT（JSON Web Token）
- **データベース**: PostgreSQL
- **バリデーション**: Zod

---

## 4. API エンドポイント一覧

### 4.1 認証API

#### POST /api/auth/register
- **概要**: 新規ユーザー登録
- **リクエスト**:
  ```json
  {
    "username": "string (必須, 1-50文字)",
    "password": "string (必須, 8文字以上)",
    "firstName": "string (任意)",
    "lastName": "string (任意)"
  }
  ```
- **レスポンス**: ユーザー情報 + JWT トークン

#### POST /api/auth/login
- **概要**: ログイン
- **リクエスト**:
  ```json
  {
    "username": "string (必須)",
    "password": "string (必須)"
  }
  ```
- **レスポンス**: ユーザー情報 + JWT トークン

#### POST /api/auth/logout
- **概要**: ログアウト
- **リクエスト**: なし
- **レスポンス**: 成功メッセージ

### 4.2 Todo API

#### GET /api/todos
- **概要**: Todo一覧取得（ページネーション、フィルタリング、ソート対応）
- **クエリパラメータ**:
  - `page`: ページ番号（デフォルト: 1）
  - `perPage`: 1ページあたりの件数（デフォルト: 20, 最大: 100）
  - `completedFilter`: 完了フィルタ（all/completed/incomplete）
  - `sortBy`: ソート基準（createdAt/updatedAt/title）
  - `sortOrder`: ソート順（asc/desc）
- **レスポンス**: Todo一覧 + ページネーション情報

#### GET /api/todos/[id]
- **概要**: Todo詳細取得
- **レスポンス**: Todo詳細情報

#### POST /api/todos
- **概要**: Todo作成
- **リクエスト**:
  ```json
  {
    "title": "string (必須, 1-32文字)",
    "descriptions": "string (任意, 128文字以下)"
  }
  ```
- **レスポンス**: 作成されたTodo

#### PUT /api/todos/[id]
- **概要**: Todo更新
- **リクエスト**:
  ```json
  {
    "title": "string (任意, 1-32文字)",
    "descriptions": "string (任意, 128文字以下)"
  }
  ```
- **レスポンス**: 更新されたTodo

#### DELETE /api/todos/[id]
- **概要**: Todo削除
- **レスポンス**: 成功メッセージ

### 4.3 ユーザーAPI

#### GET /api/users/me
- **概要**: 現在ログイン中のユーザー情報取得
- **レスポンス**: ユーザー情報

#### PATCH /api/users/me
- **概要**: プロフィール更新
- **リクエスト**:
  ```json
  {
    "firstName": "string (任意)",
    "lastName": "string (任意)",
    "firstNameRuby": "string (任意)",
    "lastNameRuby": "string (任意)"
  }
  ```
- **レスポンス**: 更新されたユーザー情報

#### GET /api/users/me/todos
- **概要**: ログインユーザーのTodo一覧取得
- **レスポンス**: Todo一覧

#### GET /api/users/me/todos/stats
- **概要**: ログインユーザーのTodo統計取得
- **レスポンス**:
  ```json
  {
    "totalTodos": "number",
    "completedTodos": "number",
    "pendingTodos": "number",
    "completionRate": "number"
  }
  ```

#### PUT /api/users/me/password
- **概要**: パスワード変更
- **リクエスト**:
  ```json
  {
    "currentPassword": "string (必須)",
    "newPassword": "string (必須, 8文字以上)"
  }
  ```
- **レスポンス**: 成功メッセージ

---

## 5. ディレクトリ構成

```
src/
├── app/                      # Next.js App Router
│   ├── layout.tsx            # ルートレイアウト
│   ├── page.tsx              # ホームページ
│   ├── api/                  # APIルート（既存）
│   ├── (auth)/               # 認証関連ページ
│   │   ├── login/
│   │   └── register/
│   └── (protected)/          # 認証必須ページ
│       ├── todos/
│       ├── profile/
│       └── settings/
├── features/                 # 機能別UIコンポーネント
│   ├── auth/                 # 認証機能
│   │   ├── components/       # UIコンポーネント（Step 4以降）
│   │   ├── hooks/            # カスタムフック（Step 5以降）
│   │   ├── LoginPage.tsx     # ログインページコンポーネント
│   │   └── RegisterPage.tsx  # 登録ページコンポーネント
│   ├── todos/                # Todo機能
│   │   ├── components/       # UIコンポーネント（Step 4以降）
│   │   ├── hooks/            # カスタムフック（Step 5以降）
│   │   ├── TodoListPage.tsx  # Todo一覧ページコンポーネント
│   │   └── TodoDetailPage.tsx # Todo詳細ページコンポーネント
│   └── profile/              # プロフィール機能
│       ├── components/       # UIコンポーネント（Step 4以降）
│       ├── hooks/            # カスタムフック（Step 5以降）
│       └── ProfilePage.tsx   # プロフィールページコンポーネント
├── lib/                      # ユーティリティ・共通ロジック（既存）
└── types/                    # 型定義（既存）
```

---

## 6. 学習ステップ概要

### Step 1: クライアントコンポーネントによる実装
- **目標**: APIとの基本的な通信を理解する
- **制約**: 
  - クライアントコンポーネントのみ使用
  - 1ページ = 1ファイル = 1コンポーネント
  - Tailwind CSS のみ使用（HeroUI 不可）
- **成果物**: 基本的な機能が動作するTodoアプリ

### Step 2: サーバーコンポーネントへのリプレイス
- **目標**: サーバーコンポーネントとクライアントコンポーネントの使い分けを理解する
- **作業**: データフェッチが不要な部分をサーバーコンポーネント化
- **成果物**: パフォーマンスが向上したTodoアプリ

### Step 3: UIライブラリを使用した画面のリプレイス
- **目標**: HeroUIを活用したモダンなUI構築を学ぶ
- **作業**: Tailwind CSSで実装したUIをHeroUIコンポーネントに置き換え
- **成果物**: 洗練されたUIのTodoアプリ

### Step 4: UIコンポーネントの分割
- **目標**: コンポーネント設計の基礎を学ぶ
- **作業**: 1ファイルで実装していたコンポーネントを適切な粒度に分割
- **成果物**: メンテナンス性の高いコンポーネント構成

### Step 5: カスタムフックの定義
- **目標**: ロジックとUIの分離を理解する
- **作業**: コンポーネントからビジネスロジックをカスタムフックに切り出し
- **成果物**: 再利用性とテスタビリティの高いコード

---

## 7. 共通設計方針

### 7.1 認証状態管理
- Cookie ベースの認証（JWT）
- ミドルウェアで認証チェック
- 未認証時はログインページへリダイレクト

### 7.2 エラーハンドリング
- API エラーは try-catch で捕捉
- ユーザーフレンドリーなエラーメッセージ表示
- ネットワークエラーの考慮

### 7.3 ローディング状態
- データフェッチ中はローディングインジケーター表示
- 楽観的更新（Optimistic Update）の活用

### 7.4 バリデーション
- クライアント側でも基本的なバリデーションを実施
- サーバー側のバリデーションエラーを適切に表示

---

## 8. 注意事項

### 8.1 学習者へのアドバイス
- 各ステップを順番に進めることを推奨
- 実装前に設計書を熟読し、全体像を把握すること
- わからない部分は公式ドキュメントを参照すること

### 8.2 実装時の留意点
- TypeScript の型定義を活用し、型安全性を確保
- コンソールエラーが出ないように実装
- アクセシビリティを意識したマークアップ

### 8.3 拡張性の考慮
- 将来的な機能追加を見据えた設計
- コンポーネントの再利用性を意識
- テストしやすいコード構造

---

## 9. 参考リソース

### 9.1 公式ドキュメント
- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [HeroUI Documentation](https://heroui.com)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

### 9.2 関連ツール
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Zod Documentation](https://zod.dev)

---

## 10. 各ステップの詳細設計書

各ステップの詳細な実装方針については、以下の個別設計書を参照してください。

- [Step 1: クライアントコンポーネントによる実装](./01_step1_client_component.md)
- [Step 2: サーバーコンポーネントへのリプレイス](./02_step2_server_component.md)
- [Step 3: UIライブラリを使用した画面のリプレイス](./03_step3_ui_library.md)
- [Step 4: UIコンポーネントの分割](./04_step4_component_division.md)
- [Step 5: カスタムフックの定義](./05_step5_custom_hooks.md)

---

**Document Version**: 1.0.0  
**Last Updated**: 2025-10-24  
**Author**: jugeeem

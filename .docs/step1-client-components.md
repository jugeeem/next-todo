# STEP 1: Next.js クライアントコンポーネント基礎実装カリキュラム

## 🎯 目標

Next.jsのクライアントコンポーネントを使用して、スタンダードなHTML要素とTailwind CSSのみで以下の画面を実装します：

1. **認証画面**
   - ログイン画面 (`/auth/login`)
   - ユーザー登録画面 (`/auth/register`)

2. **Todo管理画面**
   - Todo一覧・作成画面 (`/todos`)
   - Todo詳細・編集画面 (`/todos/[id]`)

3. **ユーザー管理画面**
   - ユーザー一覧画面 (`/users`)
   - ユーザー詳細画面 (`/users/[id]`)
   - プロフィール画面 (`/users/me`)

## 📋 実装ルール

### 基本ルール
- **1画面1ファイル**: コンポーネントの切り出しは禁止
- **クライアントコンポーネント**: 全ての画面を `'use client'` で実装
- **カスタムフック禁止**: 全てのロジックを `Index` コンポーネント内に記述
- **UIライブラリ禁止**: HeroUI等のUIライブラリは使用せず、素のHTML要素のみ使用
- **スタイリング**: Tailwind CSS のみ使用
- **型定義**: 各コンポーネントファイル内で型を定義

### 技術制約
- ❌ UIライブラリ（HeroUI、Material-UI等）
- ❌ アニメーションライブラリ（Framer Motion等）
- ❌ カスタムフック
- ❌ コンポーネント分離
- ✅ HTML標準要素（input, button, form, div等）
- ✅ Tailwind CSS
- ✅ React Hooks（useState, useEffect）
- ✅ TypeScript

### ファイル構成パターン
```
src/
├── app/
│   ├── auth/
│   │   ├── login/
│   │   │   └── page.tsx          # ログインページ
│   │   └── register/
│   │       └── page.tsx          # 登録ページ
│   ├── todos/
│   │   ├── page.tsx              # Todo一覧ページ
│   │   └── [id]/
│   │       └── page.tsx          # Todo詳細ページ
│   └── users/
│       ├── page.tsx              # ユーザー一覧ページ
│       ├── me/
│       │   └── page.tsx          # プロフィールページ
│       └── [id]/
│           └── page.tsx          # ユーザー詳細ページ
└── features/
    ├── auth/
    │   ├── login/
    │   │   └── components/
    │   │       └── Index.tsx     # ログインコンポーネント
    │   └── register/
    │       └── components/
    │           └── Index.tsx     # 登録コンポーネント
    ├── todos/
    │   └── components/
    │       ├── Index.tsx         # Todo一覧コンポーネント
    │       └── Detail.tsx        # Todo詳細コンポーネント
    └── users/
        └── components/
            ├── Index.tsx         # ユーザー一覧コンポーネント
            ├── Profile.tsx       # プロフィールコンポーネント
            └── Detail.tsx        # ユーザー詳細コンポーネント
```

## 🚀 実装手順

### Phase 1: 認証機能の実装

#### 1.1 ログイン画面の実装

**ファイル**: `src/features/auth/login/components/Index.tsx`

#### 設計概要
ログイン画面のクライアントコンポーネント実装

#### 機能要件
- ユーザー名・パスワードでのログイン認証
- 入力バリデーション（必須項目チェック）
- ローディング状態の表示
- エラーメッセージの表示
- 認証成功時のリダイレクト処理
- ユーザー登録画面への導線

#### 技術仕様

**型定義**
- `LoginForm`: フォーム入力値の型（username, password）
- `LoginResponse`: API レスポンス型（success, message, data）

**状態管理（useState）**
- `form`: ログインフォームの入力値
- `isLoading`: 認証処理中の状態
- `error`: エラーメッセージ

**主要関数**
- `handleSubmit`: フォーム送信処理
  - バリデーション実行
  - `/api/auth/login` API 呼び出し
  - 成功時：トークン保存 → `/todos` リダイレクト
  - 失敗時：エラーメッセージ表示
- `handleInputChange`: 入力値変更ハンドラー

**UI構成**
- センター配置のログインフォーム
- ページヘッダー（タイトル・説明文）
- 入力フィールド
  - ユーザー名（必須）
  - パスワード（必須）
- エラー表示エリア（条件付き表示）
- ログインボタン
  - ローディング中はスピナー表示
  - 入力未完了時は無効化
- ユーザー登録へのリンク

**スタイリング**
- Tailwind CSS でレスポンシブデザイン
- グレー基調の背景
- ホワイトカードレイアウト
- ブルー系のアクセントカラー
- フォーカス・ホバー状態のスタイリング

**バリデーション**
- クライアントサイド必須チェック
- リアルタイム入力バリデーション
- ボタン活性化制御

**エラーハンドリング**
- API エラーレスポンス処理
- ネットワークエラー処理
- ユーザーフレンドリーなメッセージ表示

**ファイル**: `src/app/auth/login/page.tsx`

```tsx
import LoginIndex from '@/features/auth/login/components/Index';

export default function LoginPage() {
  return <LoginIndex />;
}
```

#### 1.2 ユーザー登録画面の実装

**ファイル**: `src/features/auth/register/components/Index.tsx`

#### 設計概要
ユーザー登録画面のクライアントコンポーネント実装

#### 機能要件
- 新規ユーザーアカウント作成
- 複数フィールドでの登録情報入力
- パスワード確認機能
- ユーザーロール選択機能
- 入力バリデーション（必須項目・パスワード一致確認）
- ローディング状態の表示
- エラーメッセージの表示
- 登録成功時のリダイレクト処理
- ログイン画面への導線

#### 技術仕様

**型定義**
- `RegisterForm`: 登録フォーム入力値の型（username, firstName, lastName, password, confirmPassword, role）
- `RegisterResponse`: API レスポンス型（success, message, data）
- `USER_ROLES`: ユーザーロール定義配列（管理者:1, マネージャー:2, ユーザー:4, ゲスト:8）

**状態管理（useState）**
- `form`: 登録フォームの入力値（デフォルトロール: 4）
- `isLoading`: 登録処理中の状態
- `error`: エラーメッセージ

**主要関数**
- `handleSubmit`: フォーム送信処理
  - パスワード一致確認バリデーション
  - `/api/auth/register` API 呼び出し
  - 成功時：ログイン画面リダイレクト（成功メッセージ付き）
  - 失敗時：エラーメッセージ表示
- `handleInputChange`: 入力値変更ハンドラー（文字列・数値対応）

**UI構成**
- センター配置の登録フォーム
- ページヘッダー（タイトル・説明文）
- 入力フィールド
  - ユーザー名（必須、マーク表示）
  - 名前フィールド（グリッドレイアウト）
    - 名（任意）
    - 姓（任意）
  - ユーザーロール選択（セレクトボックス）
  - パスワード（必須、マーク表示）
  - パスワード確認（必須、マーク表示）
- エラー表示エリア（条件付き表示）
- 登録ボタン
  - ローディング中はスピナー表示
  - 必須項目未完了時は無効化
- ログインへのリンク

**スタイリング**
- Tailwind CSS でレスポンシブデザイン
- グレー基調の背景
- ホワイトカードレイアウト
- ブルー系のアクセントカラー
- 必須項目の赤色マーカー
- グリッドレイアウト（名前入力）
- フォーカス・ホバー状態のスタイリング

**バリデーション**
- クライアントサイド必須チェック
- パスワード一致確認（リアルタイム）
- ボタン活性化制御
- 型安全な入力値処理

**エラーハンドリング**
- パスワード不一致エラー
- API エラーレスポンス処理
- ネットワークエラー処理
- ユーザーフレンドリーなメッセージ表示

**ユーザーロール管理**
- 権限レベル定義（ビット演算値）
- デフォルト値設定（一般ユーザー）
- セレクトボックスでの選択UI

**ファイル**: `src/app/auth/register/page.tsx`

```tsx
import RegisterIndex from '@/features/auth/register/components/Index';

export default function RegisterPage() {
  return <RegisterIndex />;
}
```

### Phase 2: Todo管理機能の実装

#### 2.1 Todo一覧・作成画面の実装

**ファイル**: `src/features/todos/components/Index.tsx`

#### 設計概要
Todo一覧・作成画面のクライアントコンポーネント実装

#### 機能要件
- 認証済みユーザーのTodo一覧表示
- 新規Todo作成機能（モーダル形式）
- Todo詳細画面への遷移
- 認証状態確認とリダイレクト処理
- ユーザー情報表示（ヘッダー部）
- ログアウト機能
- プロフィール画面への導線
- ローディング状態の表示
- エラーメッセージの表示

#### 技術仕様

**型定義**
- `Todo`: Todo エンティティ型（id, title, descriptions, userId, createdAt, updatedAt）
- `TodoForm`: Todo作成フォーム型（title, descriptions）
- `TodoResponse`: Todo一覧取得 API レスポンス型（success, message, data）
- `CreateTodoResponse`: Todo作成 API レスポンス型（success, message, data）
- `User`: ユーザー情報型（id, username, firstName, lastName, role）

**状態管理（useState）**
- `todos`: Todo一覧データ（Todo[]）
- `form`: Todo作成フォーム入力値（TodoForm）
- `isLoading`: 初期データ読み込み状態
- `isSubmitting`: Todo作成処理中状態
- `error`: エラーメッセージ
- `user`: ログインユーザー情報
- `showModal`: Todo作成モーダル表示状態

**主要関数**
- `fetchTodos`: Todo一覧取得処理
  - `/api/todos` GET リクエスト
  - 認証トークン付きヘッダー送信
  - レスポンス結果の状態更新
- `handleSubmit`: Todo作成フォーム送信処理
  - `/api/todos` POST リクエスト
  - フォームデータのJSON送信
  - 作成成功時：一覧更新・フォームリセット・モーダル閉じ
- `handleInputChange`: フォーム入力値変更ハンドラー
- `handleLogout`: ログアウト処理（トークン削除・ログイン画面リダイレクト）
- `formatDate`: 日時フォーマット関数（日本語ロケール）

**UI構成**
- ページヘッダー
  - アプリケーションタイトル
  - ユーザー挨拶メッセージ
  - プロフィールリンク
  - ログアウトボタン
- メインコンテンツ
  - セクションヘッダー（Todo件数表示・作成ボタン）
  - エラー表示エリア（条件付き表示）
  - Todo一覧カード
    - Todo情報表示（タイトル・説明・作成/更新日時）
    - 詳細画面遷移（クリック）
    - ステータス表示（進行中バッジ）
  - 空状態表示（Todo未作成時）
- Todo作成モーダル
  - フォーム入力フィールド
    - タイトル（必須・32文字制限）
    - 説明（任意・128文字制限）
  - アクションボタン（キャンセル・作成）

**スタイリング**
- Tailwind CSS でレスポンシブデザイン
- グレー基調の背景（bg-gray-50）
- ホワイトカードレイアウト
- ブルー系のアクセントカラー
- シャドウとホバーエフェクト
- モーダルオーバーレイ（半透明背景）

**認証・セキュリティ**
- localStorage からのトークン・ユーザー情報取得
- 認証状態チェック（useEffect）
- 未認証時の自動リダイレクト
- API リクエストでの Bearer トークン送信

**エラーハンドリング**
- API エラーレスポンス処理
- ネットワークエラー処理
- ユーザーフレンドリーなメッセージ表示
- エラー状態の視覚的フィードバック

**ユーザビリティ**
- ローディング状態の表示
- ボタン無効化（処理中・入力不完全時）
- リアルタイムなUI状態更新
- 直感的な操作フロー

**ファイル**: `src/app/todos/page.tsx`

```tsx
import TodosIndex from '@/features/todos/components/Index';

export default function TodosPage() {
  return <TodosIndex />;
}
```

#### 2.2 Todo詳細・編集画面の実装

**ファイル**: `src/features/todos/components/Detail.tsx`

#### 設計概要
Todo詳細・編集・削除画面のクライアントコンポーネント実装

#### 機能要件
- 個別Todoの詳細情報表示
- Todo編集機能（モーダル形式）
- Todo削除機能（確認ダイアログ付き）
- Todo一覧画面への戻り導線
- 認証状態確認とリダイレクト処理
- 権限チェック（作成者本人のみ編集・削除可能）
- ローディング状態の表示
- エラーメッセージの表示
- 404エラー処理（Todo未存在時）

#### 技術仕様

**型定義**
- `Todo`: Todo エンティティ型（id, title, descriptions, userId, createdAt, updatedAt）
- `TodoForm`: Todo編集フォーム型（title, descriptions）
- `TodoResponse`: Todo詳細取得 API レスポンス型（success, message, data）
- `UpdateTodoResponse`: Todo更新 API レスポンス型（success, message, data）
- `User`: ユーザー情報型（id, username, firstName, lastName, role）
- `TodoDetailProps`: コンポーネントProps型（todoId）

**状態管理（useState）**
- `todo`: 表示中のTodo詳細データ（Todo | null）
- `form`: Todo編集フォーム入力値（TodoForm）
- `isLoading`: 初期データ読み込み状態
- `isSubmitting`: Todo更新処理中状態
- `isDeleting`: Todo削除処理中状態
- `error`: エラーメッセージ
- `user`: ログインユーザー情報
- `isEditOpen`: 編集モーダル表示状態
- `isDeleteOpen`: 削除確認モーダル表示状態

**主要関数**
- `fetchTodo`: Todo詳細取得処理
  - `/api/todos/${todoId}` GET リクエスト
  - 認証トークン付きヘッダー送信
  - 取得成功時：Todo表示・編集フォーム初期化
  - 取得失敗時：404エラー表示
- `handleUpdate`: Todo更新フォーム送信処理
  - `/api/todos/${todoId}` PUT リクエスト
  - フォームデータのJSON送信
  - 更新成功時：詳細表示更新・モーダル閉じ
- `handleDelete`: Todo削除処理
  - `/api/todos/${todoId}` DELETE リクエスト
  - 削除成功時：Todo一覧画面リダイレクト
- `handleInputChange`: フォーム入力値変更ハンドラー
- `formatDate`: 日時フォーマット関数（日本語ロケール・月名表示）

**UI構成**
- ページヘッダー
  - 戻るボタン（Todo一覧へ）
  - ページタイトル
  - アクションボタン（編集・削除）
- メインコンテンツ
  - エラー表示エリア（条件付き表示）
  - Todo詳細カード
    - Todo基本情報（タイトル・ステータスバッジ）
    - 説明文（改行保持表示・条件付き表示）
    - メタ情報（グリッドレイアウト）
      - 作成情報（作成日時・作成者）
      - 更新情報（最終更新日時・条件付き表示）
- ローディング状態表示
- 404エラー表示（Todo未存在時）
- 編集モーダル
  - フォーム入力フィールド
    - タイトル（必須・32文字制限）
    - 説明（任意・128文字制限）
  - アクションボタン（キャンセル・更新）
- 削除確認モーダル
  - 確認メッセージ
  - 注意事項（復元不可の警告）
  - アクションボタン（キャンセル・削除）

**スタイリング**
- Tailwind CSS でレスポンシブデザイン
- グレー基調の背景（bg-gray-50）
- ホワイトカードレイアウト
- カラー設定
  - プライマリー：ブルー系（編集ボタン・ステータス）
  - デンジャー：レッド系（削除ボタン・エラー表示）
- アニメーション効果（フェードイン・スライド）
- シャドウとホバーエフェクト
- モーダルオーバーレイ（半透明背景）

**認証・権限制御**
- localStorage からのトークン・ユーザー情報取得
- 認証状態チェック（useEffect）
- 未認証時の自動リダイレクト
- 作成者権限チェック（編集・削除ボタン表示制御）
- API リクエストでの Bearer トークン送信

**データフロー**
- URL パラメータからの todoId 取得
- 認証確認 → Todo詳細取得 → 表示
- 編集フロー：編集ボタン → モーダル表示 → フォーム送信 → 詳細更新
- 削除フロー：削除ボタン → 確認モーダル → 削除実行 → 一覧画面遷移

**エラーハンドリング**
- API エラーレスポンス処理
- ネットワークエラー処理
- 404エラー（Todo未存在）処理
- 認証エラー処理
- ユーザーフレンドリーなメッセージ表示

**ユーザビリティ**
- ローディング状態の表示
- ボタン無効化（処理中・入力不完全時）
- モーダルのフォーカス管理
- 直感的な操作フロー
- 確認ダイアログによる誤操作防止
- レスポンシブ対応（モバイル・タブレット・デスクトップ）

**ファイル**: `src/app/todos/[id]/page.tsx`

```tsx
import TodoDetail from '@/features/todos/components/Detail';

interface TodoDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function TodoDetailPage({ params }: TodoDetailPageProps) {
  const { id } = await params;
  
  return <TodoDetail todoId={id} />;
}
```

### Phase 3: ユーザー管理機能の実装

#### 3.1 ユーザー一覧画面の実装

**ファイル**: `src/features/users/components/Index.tsx`

#### 設計概要
ユーザー一覧画面のクライアントコンポーネント実装

#### 機能要件
- 全ユーザーの一覧表示
- ユーザー詳細画面への遷移
- ユーザー検索・フィルター機能
- 認証状態確認とリダイレクト処理
- ページネーション機能
- ユーザー情報表示（ヘッダー部）
- ログアウト機能
- プロフィール画面への導線
- ローディング状態の表示
- エラーメッセージの表示

#### 技術仕様

**型定義**
- `User`: ユーザーエンティティ型（id, username, firstName, lastName, role, createdAt, updatedAt）
- `UsersResponse`: ユーザー一覧取得 API レスポンス型（success, message, data, pagination）
- `UserRole`: ユーザーロール型（管理者:1, マネージャー:2, ユーザー:4, ゲスト:8）
- `SearchFilter`: 検索フィルター型（searchTerm, roleFilter）
- `Pagination`: ページネーション型（currentPage, totalPages, totalUsers, perPage）

**状態管理（useState）**
- `users`: ユーザー一覧データ（User[]）
- `filteredUsers`: フィルター済みユーザーデータ（User[]）
- `searchFilter`: 検索・フィルター条件（SearchFilter）
- `pagination`: ページネーション情報（Pagination）
- `isLoading`: 初期データ読み込み状態
- `error`: エラーメッセージ
- `currentUser`: ログインユーザー情報

**主要関数**
- `fetchUsers`: ユーザー一覧取得処理
  - `/api/users` GET リクエスト
  - 認証トークン付きヘッダー送信
  - ページネーション・検索パラメータ付き
  - レスポンス結果の状態更新
- `handleSearch`: 検索処理
  - クライアントサイドフィルタリング
  - リアルタイム検索（debounce実装）
- `handleRoleFilter`: ロールフィルター処理
- `handlePageChange`: ページ変更処理
- `getUserRoleName`: ロール値から表示名取得
- `formatDate`: 日時フォーマット関数（日本語ロケール）
- `handleLogout`: ログアウト処理

**UI構成**
- ページヘッダー
  - アプリケーションタイトル
  - ユーザー挨拶メッセージ
  - プロフィールリンク
  - ログアウトボタン
- 検索・フィルターセクション
  - 検索入力フィールド（ユーザー名・名前検索）
  - ロールフィルターセレクトボックス
  - 検索結果件数表示
- メインコンテンツ
  - エラー表示エリア（条件付き表示）
  - ユーザー一覧テーブル
    - ユーザー基本情報（ユーザー名・名前・ロール）
    - 登録日時・最終更新日時
    - 詳細画面遷移リンク
    - ロールバッジ表示
  - 空状態表示（ユーザー未存在・検索結果なし時）
- ページネーション
  - 前へ・次へボタン
  - ページ番号表示
  - 件数表示

**スタイリング**
- Tailwind CSS でレスポンシブデザイン
- グレー基調の背景（bg-gray-50）
- ホワイトカードレイアウト
- ロール別カラー設定
  - 管理者：レッド系（bg-red-100, text-red-800）
  - マネージャー：オレンジ系（bg-orange-100, text-orange-800）
  - ユーザー：ブルー系（bg-blue-100, text-blue-800）
  - ゲスト：グレー系（bg-gray-100, text-gray-800）
- テーブルレスポンシブ対応
- ホバーエフェクト・フォーカス状態

**検索・フィルター機能**
- リアルタイム検索（300ms debounce）
- ユーザー名・名前での部分一致検索
- ロール別フィルタリング
- 検索結果件数表示
- フィルター状態の永続化

**ページネーション**
- サーバーサイドページネーション
- 1ページあたり20件表示
- 前へ・次へナビゲーション
- 現在ページ・総ページ数表示

**認証・セキュリティ**
- localStorage からのトークン・ユーザー情報取得
- 認証状態チェック（useEffect）
- 未認証時の自動リダイレクト
- API リクエストでの Bearer トークン送信

**エラーハンドリング**
- API エラーレスポンス処理
- ネットワークエラー処理
- ユーザーフレンドリーなメッセージ表示
- エラー状態の視覚的フィードバック

**ファイル**: `src/app/users/page.tsx`

```tsx
import UsersIndex from '@/features/users/components/Index';

export default function UsersPage() {
  return <UsersIndex />;
}
```

#### 3.2 ユーザー詳細画面の実装

**ファイル**: `src/features/users/components/Detail.tsx`

#### 設計概要
ユーザー詳細画面のクライアントコンポーネント実装

#### 機能要件
- 個別ユーザーの詳細情報表示
- ユーザーのTodo一覧表示
- ユーザー編集機能（管理者権限・本人のみ）
- ユーザー一覧画面への戻り導線
- 認証状態確認とリダイレクト処理
- 権限チェック（管理者・本人のみ編集可能）
- ローディング状態の表示
- エラーメッセージの表示
- 404エラー処理（ユーザー未存在時）

#### 技術仕様

**型定義**
- `User`: ユーザーエンティティ型（id, username, firstName, lastName, role, createdAt, updatedAt）
- `Todo`: Todoエンティティ型（id, title, descriptions, userId, createdAt, updatedAt）
- `UserDetailResponse`: ユーザー詳細取得 API レスポンス型（success, message, data）
- `UserTodosResponse`: ユーザーTodo一覧 API レスポンス型（success, message, data）
- `UpdateUserResponse`: ユーザー更新 API レスポンス型（success, message, data）
- `UserForm`: ユーザー編集フォーム型（firstName, lastName, role）
- `UserDetailProps`: コンポーネントProps型（userId）

**状態管理（useState）**
- `user`: 表示中のユーザー詳細データ（User | null）
- `userTodos`: ユーザーのTodo一覧（Todo[]）
- `form`: ユーザー編集フォーム入力値（UserForm）
- `isLoading`: 初期データ読み込み状態
- `isSubmitting`: ユーザー更新処理中状態
- `error`: エラーメッセージ
- `currentUser`: ログインユーザー情報
- `isEditOpen`: 編集モーダル表示状態

**主要関数**
- `fetchUserDetail`: ユーザー詳細取得処理
  - `/api/users/${userId}` GET リクエスト
  - 認証トークン付きヘッダー送信
  - 取得成功時：ユーザー表示・編集フォーム初期化
  - 取得失敗時：404エラー表示
- `fetchUserTodos`: ユーザーTodo一覧取得処理
  - `/api/users/${userId}/todos` GET リクエスト
  - Todo一覧の状態更新
- `handleUpdate`: ユーザー更新フォーム送信処理
  - `/api/users/${userId}` PUT リクエスト
  - フォームデータのJSON送信
  - 更新成功時：詳細表示更新・モーダル閉じ
- `handleInputChange`: フォーム入力値変更ハンドラー
- `canEditUser`: 編集権限チェック（管理者・本人判定）
- `getUserRoleName`: ロール値から表示名取得
- `formatDate`: 日時フォーマット関数（日本語ロケール・月名表示）

**UI構成**
- ページヘッダー
  - 戻るボタン（ユーザー一覧へ）
  - ページタイトル
  - 編集ボタン（権限チェック後表示）
- メインコンテンツ
  - エラー表示エリア（条件付き表示）
  - ユーザー詳細カード
    - ユーザー基本情報（ユーザー名・ロールバッジ）
    - 名前情報（名・姓・条件付き表示）
    - メタ情報（グリッドレイアウト）
      - 登録情報（登録日時・ユーザーID）
      - 更新情報（最終更新日時・条件付き表示）
  - ユーザーTodoセクション
    - セクションヘッダー（Todo件数表示）
    - Todo一覧カード
      - Todo基本情報（タイトル・説明・日時）
      - Todo詳細画面遷移リンク
    - 空状態表示（Todo未作成時）
- ローディング状態表示
- 404エラー表示（ユーザー未存在時）
- 編集モーダル
  - フォーム入力フィールド
    - 名（任意）
    - 姓（任意）
    - ユーザーロール（管理者のみ変更可能）
  - アクションボタン（キャンセル・更新）

**スタイリング**
- Tailwind CSS でレスポンシブデザイン
- グレー基調の背景（bg-gray-50）
- ホワイトカードレイアウト
- ロール別バッジカラー
- グリッドレイアウト（情報表示）
- シャドウとホバーエフェクト
- モーダルオーバーレイ（半透明背景）

**認証・権限制御**
- localStorage からのトークン・ユーザー情報取得
- 認証状態チェック（useEffect）
- 未認証時の自動リダイレクト
- 編集権限チェック（管理者・本人のみ）
- ロール変更権限チェック（管理者のみ）
- API リクエストでの Bearer トークン送信

**データフロー**
- URL パラメータからの userId 取得
- 認証確認 → ユーザー詳細取得 → Todo一覧取得 → 表示
- 編集フロー：編集ボタン → モーダル表示 → フォーム送信 → 詳細更新

**エラーハンドリング**
- API エラーレスポンス処理
- ネットワークエラー処理
- 404エラー（ユーザー未存在）処理
- 認証エラー処理
- 権限エラー処理
- ユーザーフレンドリーなメッセージ表示

**ファイル**: `src/app/users/[id]/page.tsx`

```tsx
import UserDetail from '@/features/users/components/Detail';

interface UserDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const { id } = await params;
  
  return <UserDetail userId={id} />;
}
```

#### 3.3 プロフィール画面の実装

**ファイル**: `src/features/users/components/Profile.tsx`

#### 設計概要
ログインユーザーのプロフィール画面のクライアントコンポーネント実装

#### 機能要件
- ログインユーザーの詳細情報表示・編集
- パスワード変更機能
- アカウント削除機能（確認ダイアログ付き）
- ユーザーのTodo統計情報表示
- Todo一覧画面への導線
- 認証状態確認とリダイレクト処理
- ローディング状態の表示
- エラーメッセージの表示
- 成功メッセージの表示

#### 技術仕様

**型定義**
- `User`: ユーザーエンティティ型（id, username, firstName, lastName, role, createdAt, updatedAt）
- `ProfileForm`: プロフィール編集フォーム型（firstName, lastName）
- `PasswordForm`: パスワード変更フォーム型（currentPassword, newPassword, confirmPassword）
- `TodoStats`: Todo統計型（totalTodos, completedTodos, pendingTodos）
- `ProfileResponse`: プロフィール取得 API レスポンス型（success, message, data）
- `UpdateProfileResponse`: プロフィール更新 API レスポンス型（success, message, data）
- `ChangePasswordResponse`: パスワード変更 API レスポンス型（success, message, data）
- `TodoStatsResponse`: Todo統計取得 API レスポンス型（success, message, data）

**状態管理（useState）**
- `user`: ログインユーザー情報（User | null）
- `profileForm`: プロフィール編集フォーム入力値（ProfileForm）
- `passwordForm`: パスワード変更フォーム入力値（PasswordForm）
- `todoStats`: Todo統計情報（TodoStats | null）
- `isLoading`: 初期データ読み込み状態
- `isSubmittingProfile`: プロフィール更新処理中状態
- `isSubmittingPassword`: パスワード変更処理中状態
- `isDeleting`: アカウント削除処理中状態
- `error`: エラーメッセージ
- `successMessage`: 成功メッセージ
- `isProfileEditOpen`: プロフィール編集モーダル表示状態
- `isPasswordChangeOpen`: パスワード変更モーダル表示状態
- `isDeleteConfirmOpen`: アカウント削除確認モーダル表示状態

**主要関数**
- `fetchProfile`: プロフィール情報取得処理
  - `/api/users/me` GET リクエスト
  - 認証トークン付きヘッダー送信
  - 取得成功時：プロフィール表示・編集フォーム初期化
- `fetchTodoStats`: Todo統計取得処理
  - `/api/users/me/todos/stats` GET リクエスト
  - 統計情報の状態更新
- `handleProfileUpdate`: プロフィール更新フォーム送信処理
  - `/api/users/me` PUT リクエスト
  - フォームデータのJSON送信
  - 更新成功時：プロフィール表示更新・モーダル閉じ・成功メッセージ表示
- `handlePasswordChange`: パスワード変更フォーム送信処理
  - `/api/users/me/password` PUT リクエスト
  - パスワード一致確認バリデーション
  - 変更成功時：フォームリセット・モーダル閉じ・成功メッセージ表示
- `handleAccountDelete`: アカウント削除処理
  - `/api/users/me` DELETE リクエスト
  - 削除成功時：ログアウト処理・ログイン画面リダイレクト
- `handleInputChange`: フォーム入力値変更ハンドラー（プロフィール・パスワード）
- `validatePasswordForm`: パスワードフォームバリデーション
- `getUserRoleName`: ロール値から表示名取得
- `formatDate`: 日時フォーマット関数（日本語ロケール）

**UI構成**
- ページヘッダー
  - ページタイトル
  - Todo一覧へのリンク
- メインコンテンツ
  - エラー・成功メッセージ表示エリア（条件付き表示）
  - プロフィール情報カード
    - ユーザー基本情報（ユーザー名・ロールバッジ）
    - 名前情報（名・姓・未設定時の表示）
    - メタ情報（グリッドレイアウト）
      - 登録情報（登録日時・ユーザーID）
      - 最終更新日時
    - アクションボタン（プロフィール編集・パスワード変更）
  - Todo統計カード
    - 統計情報表示（グリッドレイアウト）
      - 総Todo数
      - 完了Todo数
      - 進行中Todo数
      - 完了率（パーセンテージ）
    - Todo一覧画面遷移ボタン
  - 危険な操作セクション
    - アカウント削除ボタン（危険色表示）
- プロフィール編集モーダル
  - フォーム入力フィールド
    - 名（任意）
    - 姓（任意）
  - アクションボタン（キャンセル・更新）
- パスワード変更モーダル
  - フォーム入力フィールド
    - 現在のパスワード（必須）
    - 新しいパスワード（必須）
    - パスワード確認（必須）
  - パスワード要件表示
  - アクションボタン（キャンセル・変更）
- アカウント削除確認モーダル
  - 警告メッセージ
  - 削除の影響説明（Todo等のデータも削除）
  - 確認チェックボックス
  - アクションボタン（キャンセル・削除）

**スタイリング**
- Tailwind CSS でレスポンシブデザイン
- グレー基調の背景（bg-gray-50）
- ホワイトカードレイアウト
- カラー設定
  - プライマリー：ブルー系（編集ボタン・統計）
  - 成功：グリーン系（成功メッセージ・完了率）
  - 警告：イエロー系（注意事項）
  - デンジャー：レッド系（削除ボタン・エラー表示）
- 統計カードのビジュアル表示
- グリッドレイアウト（情報・統計表示）
- モーダルオーバーレイ（半透明背景）

**認証・セキュリティ**
- localStorage からのトークン・ユーザー情報取得
- 認証状態チェック（useEffect）
- 未認証時の自動リダイレクト
- パスワード変更時の現在パスワード確認
- API リクエストでの Bearer トークン送信
- アカウント削除時の確認手順

**データフロー**
- 認証確認 → プロフィール取得 → Todo統計取得 → 表示
- プロフィール編集フロー：編集ボタン → モーダル表示 → フォーム送信 → プロフィール更新
- パスワード変更フロー：変更ボタン → モーダル表示 → バリデーション → API送信
- アカウント削除フロー：削除ボタン → 確認モーダル → 確認チェック → 削除実行

**バリデーション**
- プロフィール：必須項目なし（任意項目のみ）
- パスワード：現在パスワード必須、新パスワード一致確認
- アカウント削除：確認チェックボックス必須

**エラーハンドリング**
- API エラーレスポンス処理
- ネットワークエラー処理
- 認証エラー処理
- パスワード不一致エラー
- ユーザーフレンドリーなメッセージ表示

**ユーザビリティ**
- ローディング状態の表示
- ボタン無効化（処理中・入力不完全時）
- 成功・エラーメッセージの一時表示
- 確認ダイアログによる誤操作防止
- レスポンシブ対応

**ファイル**: `src/app/users/me/page.tsx`

```tsx
import UserProfile from '@/features/users/components/Profile';

export default function ProfilePage() {
  return <UserProfile />;
}
```

## 📚 学習ポイント

### 1. Next.js 15の基本機能
- **App Router**: ファイルベースルーティング
- **Client Components**: `'use client'`ディレクティブの理解
- **Dynamic Routes**: `[id]`パラメータの活用
- **Promise型params**: Next.js 15での新しいパラメータ取得方法

### 2. React Hooks の基礎
- **useState**: フォーム状態管理、ローディング状態、エラー処理
- **useEffect**: データ取得、認証チェック、副作用処理
- **依存配列**: 適切な依存関係の設定

### 3. TypeScript 型安全性
- **インターフェース定義**: API レスポンス型、フォーム型
- **オプショナルプロパティ**: 柔軟な型設計
- **型推論**: TypeScriptの型システム活用

### 4. 素のHTML + Tailwind CSS
- **HTML標準要素**: input、button、form、div等の適切な使用
- **セマンティクス**: 適切なHTML構造とアクセシビリティ
- **Tailwind CSS**: ユーティリティファーストCSS
- **レスポンシブデザイン**: グリッドレイアウト、モバイル対応
- **状態管理**: ローディング、エラー、フォーカス状態のスタイリング

### 5. 認証・認可の基本
- **JWT トークン**: ローカルストレージでの管理
- **API通信**: fetchによるHTTPリクエスト
- **ルートガード**: 未認証時のリダイレクト
- **エラーハンドリング**: 適切なユーザーフィードバック

### 6. フォーム処理とバリデーション
- **制御されたコンポーネント**: useState による状態管理
- **イベントハンドリング**: onChange、onSubmit
- **クライアントサイドバリデーション**: リアルタイム検証
- **ユーザーエクスペリエンス**: ローディング状態、エラー表示

## 🎓 次のステップ

STEP 1 完了後は以下に進んでください：

- **STEP 2**: サーバーサイドレンダリング最適化
- **STEP 3**: UIライブラリ（HeroUI + Framer Motion）の導入
- **STEP 4**: コンポーネント分離とリファクタリング
- **STEP 5**: 状態管理とカスタムフック
- **STEP 6**: ユニットテストの実装

## ✅ 完了チェックリスト

- [ ] ログイン画面の実装と動作確認（HTML+Tailwind CSS）
- [ ] ユーザー登録画面の実装と動作確認（HTML+Tailwind CSS）
- [ ] Todo一覧・作成画面の実装と動作確認（HTML+Tailwind CSS）
- [ ] Todo詳細・編集画面の実装と動作確認（HTML+Tailwind CSS）
- [ ] ユーザー一覧画面の実装と動作確認（HTML+Tailwind CSS）
- [ ] ユーザー詳細画面の実装と動作確認（HTML+Tailwind CSS）
- [ ] プロフィール画面の実装と動作確認（HTML+Tailwind CSS）
- [ ] 認証フローの動作確認
- [ ] 権限制御の動作確認（管理者・本人権限）
- [ ] レスポンシブデザインの確認
- [ ] エラーハンドリングの確認
- [ ] 型安全性の確認
- [ ] アクセシビリティの基本確認（ラベル、フォーカス等）
- [ ] セマンティックHTMLの確認

## 💡 重要なポイント

### 制約による学習効果
- **UIライブラリ禁止**: HTML/CSSの基礎理解を深める
- **コンポーネント分離禁止**: React Hooksの理解を促進
- **カスタムフック禁止**: 状態管理の基本を習得

### 段階的スキルアップ
- STEP 1で基礎を固める
- STEP 2でサーバーサイド最適化
- STEP 3でモダンUIライブラリの活用を学ぶ
- STEP 4以降で高度な設計パターンを習得

各実装が完了したら、実際にブラウザで動作確認を行い、すべての機能が正常に動作することを確認してください。特に、素のHTMLとTailwind CSSのみでの実装が制約通りに行われているかチェックしてください。

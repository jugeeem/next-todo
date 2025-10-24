# Step 1: クライアントコンポーネントによる実装

## 1. Step 1 の概要

### 1.1 目的
- クライアントコンポーネントの基本を理解する
- API との通信方法を学ぶ
- React Hooks（useState, useEffect）を使った状態管理を習得する

### 1.2 制約条件
- **クライアントコンポーネントのみ** を使用（`"use client"` ディレクティブ必須）
- **1ページ = 1ファイル = 1コンポーネント** の構成
- **Tailwind CSS のみ** を使用（HeroUI は使用不可）
- コンポーネントの分割は行わない（冗長でも1ファイルに記述）

### 1.3 完成イメージ
すべての機能が動作する基本的な Todo アプリケーション。UIは簡素だが、CRUD 操作がすべて実装されている状態。

---

## 2. 実装するページ一覧

### 2.1 認証ページ

#### `/login` - ログインページ
**ファイル**: `src/features/auth/LoginPage.tsx`

**主な機能**:
- ユーザー名とパスワードの入力フォーム
- バリデーション（クライアント側）
- ログインボタン押下時のAPI呼び出し
- エラーメッセージの表示
- ローディング状態の表示
- ログイン成功後のリダイレクト

**必要な状態管理**:
```typescript
const [username, setUsername] = useState<string>('')
const [password, setPassword] = useState<string>('')
const [error, setError] = useState<string>('')
const [isLoading, setIsLoading] = useState<boolean>(false)
```

**API エンドポイント**: `POST /api/auth/login`

**実装のポイント**:
- フォームの送信は `onSubmit` イベントで処理
- `fetch` API を使用してログインリクエスト
- レスポンスに含まれる JWT トークンは Cookie に自動保存される
- ログイン成功後は `/todos` にリダイレクト

---

#### `/register` - ユーザー登録ページ
**ファイル**: `src/features/auth/RegisterPage.tsx`

**主な機能**:
- ユーザー名、パスワード、名前（任意）の入力フォーム
- バリデーション（文字数チェック、必須チェック）
- 登録ボタン押下時のAPI呼び出し
- エラーメッセージの表示
- ローディング状態の表示
- 登録成功後のリダイレクト

**必要な状態管理**:
```typescript
const [username, setUsername] = useState<string>('')
const [password, setPassword] = useState<string>('')
const [firstName, setFirstName] = useState<string>('')
const [lastName, setLastName] = useState<string>('')
const [error, setError] = useState<string>('')
const [isLoading, setIsLoading] = useState<boolean>(false)
```

**API エンドポイント**: `POST /api/auth/register`

**実装のポイント**:
- パスワードは6文字以上の制限
- ユーザー名は1〜50文字の制限
- 登録成功後は `/todos` にリダイレクト

---

### 2.2 Todo 管理ページ

#### `/todos` - Todo 一覧ページ
**ファイル**: `src/features/todos/TodoListPage.tsx`

**主な機能**:
- Todo 一覧の表示
- ページネーション（前ページ/次ページボタン）
- フィルタリング（全て/完了済み/未完了）
- ソート機能（作成日時/更新日時/タイトル）
- Todo 作成フォーム
- Todo の完了/未完了切り替え
- Todo 削除
- Todo 詳細ページへのリンク

**必要な状態管理**:
```typescript
const [todos, setTodos] = useState<Todo[]>([])
const [page, setPage] = useState<number>(1)
const [totalPages, setTotalPages] = useState<number>(1)
const [completedFilter, setCompletedFilter] = useState<'all' | 'completed' | 'incomplete'>('all')
const [sortBy, setSortBy] = useState<'createdAt' | 'updatedAt' | 'title'>('createdAt')
const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
const [newTodoTitle, setNewTodoTitle] = useState<string>('')
const [newTodoDescription, setNewTodoDescription] = useState<string>('')
const [isLoading, setIsLoading] = useState<boolean>(false)
const [error, setError] = useState<string>('')
```

**API エンドポイント**:
- 取得: `GET /api/todos?page=1&perPage=20&completedFilter=all&sortBy=createdAt&sortOrder=asc`
- 作成: `POST /api/todos`
- 削除: `DELETE /api/todos/[id]`
- 更新: `PUT /api/todos/[id]` (完了状態の切り替え)

**実装のポイント**:
- `useEffect` でページ読み込み時と、ページ・フィルター・ソート変更時にデータ取得
- 作成・削除後は一覧を再取得して最新状態を反映
- ページネーション情報（総ページ数、現在ページ）を表示

---

#### `/todos/[id]` - Todo 詳細/編集ページ
**ファイル**: `src/features/todos/TodoDetailPage.tsx`

**主な機能**:
- Todo の詳細情報表示
- Todo の編集フォーム（タイトル、説明）
- 保存ボタン
- キャンセルボタン（一覧に戻る）
- 削除ボタン
- ローディング状態の表示
- エラーメッセージの表示

**必要な状態管理**:
```typescript
const [todo, setTodo] = useState<Todo | null>(null)
const [title, setTitle] = useState<string>('')
const [descriptions, setDescriptions] = useState<string>('')
const [isEditing, setIsEditing] = useState<boolean>(false)
const [isLoading, setIsLoading] = useState<boolean>(false)
const [error, setError] = useState<string>('')
```

**API エンドポイント**:
- 取得: `GET /api/todos/[id]`
- 更新: `PUT /api/todos/[id]`
- 削除: `DELETE /api/todos/[id]`

**実装のポイント**:
- URL パラメータから Todo ID を取得
- `useEffect` でページ読み込み時に Todo 詳細を取得
- 編集モードと表示モードを切り替え可能に
- 更新成功後は編集モードを解除して最新データを表示

---

### 2.3 ユーザー管理ページ

#### `/profile` - プロフィールページ
**ファイル**: `src/features/profile/ProfilePage.tsx`

**主な機能**:
- ユーザー情報の表示（名前、ユーザー名）
- ユーザー情報の編集フォーム
- Todo 統計情報の表示（総数、完了数、未完了数、完了率）
- 自分の Todo 一覧表示（簡易版）
- パスワード変更フォーム
- ログアウトボタン

**必要な状態管理**:
```typescript
const [user, setUser] = useState<User | null>(null)
const [firstName, setFirstName] = useState<string>('')
const [lastName, setLastName] = useState<string>('')
const [stats, setStats] = useState<TodoStats | null>(null)
const [todos, setTodos] = useState<Todo[]>([])
const [currentPassword, setCurrentPassword] = useState<string>('')
const [newPassword, setNewPassword] = useState<string>('')
const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false)
const [isChangingPassword, setIsChangingPassword] = useState<boolean>(false)
const [isLoading, setIsLoading] = useState<boolean>(false)
const [error, setError] = useState<string>('')
```

**API エンドポイント**:
- ユーザー情報取得: `GET /api/users/me`
- ユーザー情報更新: `PATCH /api/users/me`
- Todo 統計取得: `GET /api/users/me/todos/stats`
- Todo 一覧取得: `GET /api/users/me/todos`
- パスワード変更: `PUT /api/users/me/password`
- ログアウト: `POST /api/auth/logout`

**実装のポイント**:
- 初回レンダリング時に3つのAPIを並行して呼び出し
- プロフィール編集とパスワード変更は別々のセクションに分ける
- ログアウト後は `/login` にリダイレクト

---

## 3. 共通実装パターン

### 3.1 API 呼び出しパターン

```typescript
// GET リクエスト例
const fetchData = async () => {
  setIsLoading(true)
  setError('')
  
  try {
    const response = await fetch('/api/endpoint')
    
    if (!response.ok) {
      throw new Error('Failed to fetch data')
    }
    
    const data = await response.json()
    // データの状態更新
    setData(data.data)
  } catch (err) {
    setError(err instanceof Error ? err.message : 'An error occurred')
  } finally {
    setIsLoading(false)
  }
}

// POST リクエスト例
const createData = async (payload: any) => {
  setIsLoading(true)
  setError('')
  
  try {
    const response = await fetch('/api/endpoint', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Failed to create data')
    }
    
    const data = await response.json()
    // 成功時の処理
  } catch (err) {
    setError(err instanceof Error ? err.message : 'An error occurred')
  } finally {
    setIsLoading(false)
  }
}
```

### 3.2 フォームハンドリングパターン

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  
  // バリデーション
  if (!validateInput()) {
    return
  }
  
  // API 呼び出し
  await submitData()
}
```

### 3.3 ローディング表示パターン

```typescript
if (isLoading) {
  return <div>Loading...</div>
}
```

### 3.4 エラー表示パターン

```typescript
{error && (
  <div className="text-red-500 text-sm mt-2">
    {error}
  </div>
)}
```

---

## 4. Tailwind CSS スタイリングガイドライン

### 4.1 基本レイアウト
- コンテナ: `max-w-4xl mx-auto px-4 py-8`
- カード: `bg-white shadow-md rounded-lg p-6`
- グリッド: `grid grid-cols-1 md:grid-cols-2 gap-4`

### 4.2 フォーム要素
- 入力フィールド: `w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`
- ラベル: `block text-sm font-medium text-gray-700 mb-1`
- ボタン: `px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50`

### 4.3 Todo アイテム
- リスト: `space-y-2`
- アイテム: `flex items-center justify-between p-4 bg-gray-50 rounded-lg`
- 完了状態: `line-through text-gray-500`

### 4.4 レスポンシブデザイン
- モバイル: デフォルト
- タブレット: `md:` プレフィックス
- デスクトップ: `lg:` プレフィックス

---

## 5. ページルーティング設定

### 5.1 App Router の構成

```
src/app/
├── layout.tsx              # ルートレイアウト
├── page.tsx                # ホームページ（/）
├── login/
│   └── page.tsx            # ログインページ（/login）
├── register/
│   └── page.tsx            # 登録ページ（/register）
├── todos/
│   ├── page.tsx            # Todo一覧ページ（/todos）
│   └── [id]/
│       └── page.tsx        # Todo詳細ページ（/todos/[id]）
└── profile/
    └── page.tsx            # プロフィールページ（/profile）
```

### 5.2 各ページでの features コンポーネント読み込み

```typescript
// src/app/login/page.tsx
'use client'

import { LoginPage } from '@/features/auth/LoginPage'

export default function Page() {
  return <LoginPage />
}
```

---

## 6. エラーハンドリング方針

### 6.1 API エラー
- ネットワークエラー: 「ネットワークエラーが発生しました」
- 認証エラー (401): ログインページにリダイレクト
- バリデーションエラー (400): サーバーからのメッセージを表示
- サーバーエラー (500): 「サーバーエラーが発生しました」

### 6.2 クライアント側バリデーション
- 必須フィールド: 「〇〇は必須です」
- 文字数制限: 「〇〇は△文字以内で入力してください」
- 形式エラー: 「〇〇の形式が正しくありません」

---

## 7. ナビゲーション設計

### 7.1 未認証時
- ホーム (`/`) → ログイン (`/login`) へリダイレクト
- ログイン (`/login`)
- ユーザー登録 (`/register`)

### 7.2 認証後
- Todo 一覧 (`/todos`)
- Todo 詳細 (`/todos/[id]`)
- プロフィール (`/profile`)

### 7.3 ヘッダーナビゲーション（簡易版）
- Todo 一覧へのリンク
- プロフィールへのリンク
- ログアウトボタン

---

## 8. データ型定義

既存の型定義（`src/types/`）を活用します。

```typescript
// Todo 型（例）
interface Todo {
  id: string
  title: string
  descriptions?: string
  completed: boolean
  userId: string
  createdAt: string
  updatedAt: string
}

// User 型（例）
interface User {
  id: string
  username: string
  firstName?: string
  lastName?: string
  role: number
}

// Todo 統計型（例）
interface TodoStats {
  totalTodos: number
  completedTodos: number
  pendingTodos: number
  completionRate: number
}
```

---

## 9. 実装チェックリスト

### 9.1 認証機能
- [ ] ログインページの実装
- [ ] ユーザー登録ページの実装
- [ ] ログアウト機能の実装
- [ ] 認証状態による画面遷移制御

### 9.2 Todo 管理機能
- [ ] Todo 一覧表示
- [ ] Todo 作成
- [ ] Todo 更新
- [ ] Todo 削除
- [ ] Todo 完了/未完了切り替え
- [ ] ページネーション
- [ ] フィルタリング
- [ ] ソート機能

### 9.3 プロフィール機能
- [ ] ユーザー情報表示
- [ ] ユーザー情報更新
- [ ] パスワード変更
- [ ] Todo 統計表示
- [ ] 自分の Todo 一覧表示

### 9.4 共通機能
- [ ] ローディング状態の表示
- [ ] エラーメッセージの表示
- [ ] レスポンシブデザイン対応

---

## 10. 次のステップへの準備

Step 1 完了後、以下を確認してください。

- [ ] すべての機能が正常に動作する
- [ ] エラーハンドリングが適切に実装されている
- [ ] コードが1ファイルに収まっている（コンポーネント分割していない）
- [ ] Tailwind CSS のみでスタイリングされている

これらが完了したら、**Step 2: サーバーコンポーネントへのリプレイス** に進みましょう。

---

**Document Version**: 1.0.0  
**Last Updated**: 2025-10-24

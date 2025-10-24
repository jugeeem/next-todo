# Step 2: サーバーコンポーネントへのリプレイス

## 1. Step 2 の概要

### 1.1 目的
- サーバーコンポーネントとクライアントコンポーネントの違いを理解する
- Next.js App Router の特性を活かした最適化を学ぶ
- データフェッチのベストプラクティスを習得する

### 1.2 変更方針
Step 1 で実装したクライアントコンポーネントから、以下の部分をサーバーコンポーネントに変換します。

**サーバーコンポーネント化の対象**:
- 初期データフェッチのみを行う部分
- ユーザーインタラクションが不要な静的表示部分
- レイアウトやヘッダー・フッターなど

**クライアントコンポーネントとして残す対象**:
- フォーム（useState を使用）
- ボタンのクリックイベント（onClick）
- リアルタイム更新が必要な部分

### 1.3 制約条件
- **UI の変更は行わない**（Tailwind CSS のまま）
- **コンポーネントの分割は行わない**（Step 4 で実施）
- **カスタムフックの作成は行わない**（Step 5 で実施）

---

## 2. サーバーコンポーネント化の判断基準

### 2.1 サーバーコンポーネントにすべきもの

#### 条件
- データフェッチのみを行う
- ユーザーインタラクションがない
- useState, useEffect, onClick などを使用しない

#### メリット
- バンドルサイズの削減
- 初回レンダリングの高速化
- SEO の向上
- サーバー側でのデータフェッチによるパフォーマンス向上

#### 例
- レイアウトコンポーネント
- ヘッダー・フッター
- 初期データを表示するだけのページ

---

### 2.2 クライアントコンポーネントにすべきもの

#### 条件
- useState, useEffect などの React Hooks を使用
- ユーザーインタラクション（onClick, onChange など）がある
- ブラウザAPI（localStorage, window など）を使用

#### メリット
- インタラクティブな UI を実現
- クライアント側での状態管理が可能
- リアルタイムなデータ更新が可能

#### 例
- フォームコンポーネント
- モーダル、ドロップダウンなどのインタラクティブ UI
- リアルタイム更新が必要なリスト

---

## 3. ページ別のリプレイス方針

### 3.1 認証ページ

#### `/login` - ログインページ
**現状**: 完全にクライアントコンポーネント

**変更方針**:
- **クライアントコンポーネントのまま維持**
- 理由: フォーム入力と送信処理があるため

**構成**:
```typescript
// src/app/login/page.tsx
import { LoginPage } from '@/features/auth/LoginPage'

export default function Page() {
  return <LoginPage />
}

// src/features/auth/LoginPage.tsx
'use client' // クライアントコンポーネント

export function LoginPage() {
  // フォーム処理があるためクライアントコンポーネント
}
```

---

#### `/register` - ユーザー登録ページ
**現状**: 完全にクライアントコンポーネント

**変更方針**:
- **クライアントコンポーネントのまま維持**
- 理由: フォーム入力と送信処理があるため

---

### 3.2 Todo 管理ページ

#### `/todos` - Todo 一覧ページ
**現状**: 完全にクライアントコンポーネント

**変更方針**: **ハイブリッド構成に変更**

**サーバーコンポーネント部分**:
- ページコンポーネント（`src/app/todos/page.tsx`）
- 初期データフェッチを実施

**クライアントコンポーネント部分**:
- Todo 一覧表示 + インタラクション（`TodoListPage.tsx`）
- フィルタリング、ソート、ページネーション
- Todo 作成フォーム
- Todo 削除・完了切り替えボタン

**実装パターン**:
```typescript
// src/app/todos/page.tsx（サーバーコンポーネント）
export default async function Page() {
  // サーバー側でデータフェッチ
  const initialData = await fetchTodos()
  
  // クライアントコンポーネントに初期データを渡す
  return <TodoListPage initialData={initialData} />
}

// src/features/todos/TodoListPage.tsx（クライアントコンポーネント）
'use client'

interface Props {
  initialData: TodoListResponse
}

export function TodoListPage({ initialData }: Props) {
  // 初期データを state にセット
  const [todos, setTodos] = useState(initialData.data)
  
  // フィルタリング、ソートなどのインタラクション
}
```

**注意点**:
- サーバーコンポーネントで取得したデータはシリアライズ可能な形式である必要がある
- `Date` オブジェクトは文字列に変換する

---

#### `/todos/[id]` - Todo 詳細ページ
**現状**: 完全にクライアントコンポーネント

**変更方針**: **ハイブリッド構成に変更**

**サーバーコンポーネント部分**:
- ページコンポーネント（`src/app/todos/[id]/page.tsx`）
- 初期 Todo データフェッチを実施

**クライアントコンポーネント部分**:
- Todo 詳細表示 + 編集フォーム（`TodoDetailPage.tsx`）
- 編集、削除ボタン

**実装パターン**:
```typescript
// src/app/todos/[id]/page.tsx（サーバーコンポーネント）
export default async function Page({ params }: { params: { id: string } }) {
  const todo = await fetchTodoById(params.id)
  
  return <TodoDetailPage initialTodo={todo} />
}

// src/features/todos/TodoDetailPage.tsx（クライアントコンポーネント）
'use client'

interface Props {
  initialTodo: Todo
}

export function TodoDetailPage({ initialTodo }: Props) {
  const [todo, setTodo] = useState(initialTodo)
  // 編集、削除処理
}
```

---

### 3.3 ユーザー管理ページ

#### `/profile` - プロフィールページ
**現状**: 完全にクライアントコンポーネント

**変更方針**: **ハイブリッド構成に変更**

**サーバーコンポーネント部分**:
- ページコンポーネント（`src/app/profile/page.tsx`）
- 初期データフェッチ（ユーザー情報、統計、Todo 一覧）を並行実施

**クライアントコンポーネント部分**:
- プロフィール表示 + 編集フォーム（`ProfilePage.tsx`）
- パスワード変更フォーム
- ログアウトボタン

**実装パターン**:
```typescript
// src/app/profile/page.tsx（サーバーコンポーネント）
export default async function Page() {
  // 並行してデータ取得
  const [user, stats, todos] = await Promise.all([
    fetchCurrentUser(),
    fetchTodoStats(),
    fetchUserTodos(),
  ])
  
  return (
    <ProfilePage
      initialUser={user}
      initialStats={stats}
      initialTodos={todos}
    />
  )
}

// src/features/profile/ProfilePage.tsx（クライアントコンポーネント）
'use client'

interface Props {
  initialUser: User
  initialStats: TodoStats
  initialTodos: Todo[]
}

export function ProfilePage({ initialUser, initialStats, initialTodos }: Props) {
  const [user, setUser] = useState(initialUser)
  const [stats, setStats] = useState(initialStats)
  const [todos, setTodos] = useState(initialTodos)
  
  // 編集、パスワード変更、ログアウト処理
}
```

---

## 4. データフェッチ関数の作成

### 4.1 フェッチ関数の配置場所

**推奨**: `src/lib/api.ts` または `src/features/[feature]/api.ts`

### 4.2 フェッチ関数の実装例

```typescript
// src/lib/api.ts

/**
 * サーバーコンポーネント用のフェッチ関数
 */

// Todo 一覧取得
export async function fetchTodos(params?: {
  page?: number
  perPage?: number
  completedFilter?: 'all' | 'completed' | 'incomplete'
  sortBy?: 'createdAt' | 'updatedAt' | 'title'
  sortOrder?: 'asc' | 'desc'
}) {
  const searchParams = new URLSearchParams()
  if (params?.page) searchParams.set('page', params.page.toString())
  if (params?.perPage) searchParams.set('perPage', params.perPage.toString())
  if (params?.completedFilter) searchParams.set('completedFilter', params.completedFilter)
  if (params?.sortBy) searchParams.set('sortBy', params.sortBy)
  if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder)
  
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/todos?${searchParams.toString()}`,
    {
      cache: 'no-store', // 常に最新データを取得
    }
  )
  
  if (!response.ok) {
    throw new Error('Failed to fetch todos')
  }
  
  return response.json()
}

// Todo 詳細取得
export async function fetchTodoById(id: string) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/todos/${id}`,
    {
      cache: 'no-store',
    }
  )
  
  if (!response.ok) {
    throw new Error('Failed to fetch todo')
  }
  
  const result = await response.json()
  return result.data
}

// ユーザー情報取得
export async function fetchCurrentUser() {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/users/me`,
    {
      cache: 'no-store',
    }
  )
  
  if (!response.ok) {
    throw new Error('Failed to fetch user')
  }
  
  const result = await response.json()
  return result.data
}

// Todo 統計取得
export async function fetchTodoStats() {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/users/me/todos/stats`,
    {
      cache: 'no-store',
    }
  )
  
  if (!response.ok) {
    throw new Error('Failed to fetch stats')
  }
  
  const result = await response.json()
  return result.data
}

// ユーザーの Todo 一覧取得
export async function fetchUserTodos() {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/users/me/todos`,
    {
      cache: 'no-store',
    }
  )
  
  if (!response.ok) {
    throw new Error('Failed to fetch user todos')
  }
  
  const result = await response.json()
  return result.data
}
```

---

## 5. 認証の考慮事項

### 5.1 Cookie の取り扱い

サーバーコンポーネントでのデータフェッチ時、Cookie（JWT トークン）を含める必要があります。

```typescript
import { cookies } from 'next/headers'

export async function fetchTodos() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')
  
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/todos`, {
    headers: {
      Cookie: `auth-token=${token?.value}`,
    },
    cache: 'no-store',
  })
  
  // ...
}
```

### 5.2 認証エラー時のリダイレクト

```typescript
import { redirect } from 'next/navigation'

export async function fetchCurrentUser() {
  const response = await fetch(/* ... */)
  
  if (response.status === 401) {
    redirect('/login')
  }
  
  // ...
}
```

---

## 6. エラーハンドリング

### 6.1 サーバーコンポーネントでのエラーハンドリング

```typescript
// src/app/todos/page.tsx
export default async function Page() {
  try {
    const initialData = await fetchTodos()
    return <TodoListPage initialData={initialData} />
  } catch (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-red-500">
          データの取得に失敗しました。
        </div>
      </div>
    )
  }
}
```

### 6.2 Next.js の error.tsx を活用

```typescript
// src/app/todos/error.tsx
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold text-red-500">エラーが発生しました</h2>
      <p className="mt-4">{error.message}</p>
      <button
        onClick={reset}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md"
      >
        再試行
      </button>
    </div>
  )
}
```

---

## 7. ローディング状態の改善

### 7.1 loading.tsx の活用

```typescript
// src/app/todos/loading.tsx
export default function Loading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          <div className="h-16 bg-gray-200 rounded"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  )
}
```

---

## 8. パフォーマンスの最適化

### 8.1 データキャッシング戦略

**認証が必要なデータ**: `cache: 'no-store'`（常に最新データ）

```typescript
fetch(url, { cache: 'no-store' })
```

**静的データ**: `cache: 'force-cache'`（キャッシュを活用）

```typescript
fetch(url, { cache: 'force-cache' })
```

### 8.2 並行データフェッチ

```typescript
// 複数のデータを並行取得
const [user, stats, todos] = await Promise.all([
  fetchCurrentUser(),
  fetchTodoStats(),
  fetchUserTodos(),
])
```

---

## 9. 実装チェックリスト

### 9.1 サーバーコンポーネント化
- [ ] Todo 一覧ページのサーバーコンポーネント化
- [ ] Todo 詳細ページのサーバーコンポーネント化
- [ ] プロフィールページのサーバーコンポーネント化

### 9.2 データフェッチ関数
- [ ] Todo 一覧フェッチ関数の作成
- [ ] Todo 詳細フェッチ関数の作成
- [ ] ユーザー情報フェッチ関数の作成
- [ ] Todo 統計フェッチ関数の作成

### 9.3 エラーハンドリング
- [ ] サーバーコンポーネントのエラーハンドリング実装
- [ ] error.tsx の作成
- [ ] 認証エラー時のリダイレクト実装

### 9.4 ローディング状態
- [ ] loading.tsx の作成
- [ ] スケルトンスクリーンの実装

### 9.5 パフォーマンス
- [ ] キャッシング戦略の適用
- [ ] 並行データフェッチの実装

---

## 10. 動作確認項目

### 10.1 機能確認
- [ ] Todo 一覧が正常に表示される
- [ ] Todo 詳細が正常に表示される
- [ ] プロフィールが正常に表示される
- [ ] すべてのインタラクションが動作する

### 10.2 パフォーマンス確認
- [ ] 初回レンダリングが高速化されている
- [ ] ローディング状態が適切に表示される
- [ ] エラー時に適切なメッセージが表示される

---

## 11. 次のステップへの準備

Step 2 完了後、以下を確認してください。

- [ ] サーバーコンポーネントとクライアントコンポーネントが適切に分離されている
- [ ] データフェッチがサーバー側で実行されている
- [ ] すべての機能が正常に動作する
- [ ] パフォーマンスが向上している

これらが完了したら、**Step 3: UIライブラリを使用した画面のリプレイス** に進みましょう。

---

**Document Version**: 1.0.0  
**Last Updated**: 2025-10-24

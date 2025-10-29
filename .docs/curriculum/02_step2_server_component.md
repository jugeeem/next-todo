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
- 現在のユーザー情報取得（ロール情報を含む）
- URL検索パラメータ（`searchParams`）の取得と解析

**クライアントコンポーネント部分**:
- Todo 一覧表示 + インタラクション（`TodoListPage.tsx`）
- フィルタリング、ソート、ページネーション
- Todo 作成フォーム
- Todo 削除・完了切り替えボタン
- ヘッダーナビゲーション（ユーザー管理リンクを含む）

**実装パターン**:
```typescript
// src/app/todos/page.tsx（サーバーコンポーネント）
export default async function TodosServerPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string
    perPage?: string
    completedFilter?: 'all' | 'completed' | 'incomplete'
    sortBy?: 'createdAt' | 'updatedAt' | 'title'
    sortOrder?: 'asc' | 'desc'
  }>
}) {
  try {
    const params = await searchParams
    
    // パラメータの解析
    const page = Number(params.page) || 1
    const perPage = Number(params.perPage) || 20
    const completedFilter = params.completedFilter || 'all'
    const sortBy = params.sortBy || 'createdAt'
    const sortOrder = params.sortOrder || 'desc'
    
    // サーバー側でデータフェッチ
    const [initialData, currentUser] = await Promise.all([
      fetchTodos({ page, perPage, completedFilter, sortBy, sortOrder }),
      fetchCurrentUser(),
    ])
    
    // APIから取得したデータは既にシリアライズ済み（日時は文字列）
    // そのまま渡す
    return (
      <TodoListPage 
        initialData={initialData}
        currentUserRole={currentUser.role}
      />
    )
  } catch (error) {
    // 認証エラーの場合はログインページにリダイレクト
    if (error instanceof Error && error.message === 'Unauthorized') {
      redirect('/login')
    }
    // その他のエラーはエラーページにスロー
    throw error
  }
}

// src/features/todos/TodoListPage.tsx（クライアントコンポーネント）
'use client'

interface TodoListResponse {
  success: boolean
  data: {
    data: Todo[]
    total: number
    page: number
    perPage: number
    totalPages: number
  }
}

interface Props {
  initialData?: TodoListResponse
  currentUserRole?: number
}

export function TodoListPage({ initialData, currentUserRole: initialUserRole }: Props) {
  // 初期データを state にセット
  const [todos, setTodos] = useState<Todo[]>(initialData?.data?.data || [])
  const [page, setPage] = useState<number>(initialData?.data?.page || 1)
  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo | null>(
    initialData
      ? {
          currentPage: initialData.data.page,
          totalPages: initialData.data.totalPages,
          totalItems: initialData.data.total,
          itemsPerPage: initialData.data.perPage,
        }
      : null,
  )
  const [currentUserRole, setCurrentUserRole] = useState<number>(initialUserRole || 4)
  
  // ユーザー情報を取得してロールを設定（初期値がない場合のみ）
  useEffect(() => {
    if (initialUserRole !== undefined) {
      // サーバーから渡された場合はスキップ
      return
    }

    const fetchUserInfo = async () => {
      try {
        // Server Actionの呼び出し
        const result = await getUserInfo()
        if (result.success && result.data) {
          setCurrentUserRole(result.data.role)
        }
      } catch (err) {
        console.error('Failed to fetch current user:', err)
      }
    }

    fetchUserInfo()
  }, [initialUserRole])
  
  // Todo作成
  const handleCreateTodo = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    // ... バリデーション

    setIsCreating(true)

    try {
      // Server Actionの呼び出し
      const result = await createTodo({
        title: newTodoTitle,
        descriptions: newTodoDescription || undefined,
      })

      if (!result.success) {
        throw new Error(result.error || 'Todoの作成に失敗しました')
      }

      // フォームをリセット
      setNewTodoTitle('')
      setNewTodoDescription('')

      // 一覧を再取得
      await fetchTodos()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Todoの作成に失敗しました')
    } finally {
      setIsCreating(false)
    }
  }
  
  // Todo削除
  const handleDeleteTodo = async (id: string) => {
    if (!confirm('このTodoを削除してもよろしいですか?')) {
      return
    }

    try {
      // Server Actionの呼び出し
      const result = await deleteTodo(id)

      if (!result.success) {
        throw new Error(result.error || 'Todoの削除に失敗しました')
      }

      // 一覧を再取得
      await fetchTodos()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Todoの削除に失敗しました')
    }
  }
  
  // ログアウト
  const handleLogout = async () => {
    // Server Actionの呼び出し（リダイレクトも自動的に行われる）
    await logout()
  }
  
  // ヘッダーナビゲーション（権限に応じて表示）
  return (
    <div>
      <nav className="flex items-center gap-4">
        <Link href="/todos">Todo一覧</Link>
        <Link href="/profile">プロフィール</Link>
        {currentUserRole <= 2 && (
          <Link href="/users">ユーザー管理</Link>
        )}
        <button onClick={handleLogout}>ログアウト</button>
      </nav>
      {/* Todo一覧の表示 */}
    </div>
  )
}
```

**Server Actionsを使用した実装の変更点**:

1. **fetch()の削除**: `src/lib/api.ts`のServer Actionsを直接呼び出し
2. **エラーハンドリングの簡素化**: Server Actionsが統一された形式で結果を返す
3. **リダイレクトの自動化**: `logout()`内で`redirect('/login')`が実行されるため、クライアント側での処理不要
4. **useRouterの削除**: `window.location.href`またはServer Actions内の`redirect()`を使用
- Next.js 15 では `searchParams` が Promise 型なので `await searchParams` で取得
- サーバーコンポーネントで取得したデータはシリアライズ可能な形式である必要がある
- `Date` オブジェクトは文字列に変換する（API側で対応済み）
- クライアントコンポーネントでは初期データがない場合のフォールバックを実装

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
- ヘッダーナビゲーション（ユーザー管理リンクを含む）

**実装パターン**:
```typescript
// src/app/todos/[id]/page.tsx（サーバーコンポーネント）
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const todo = await fetchTodoById(id)
    
    // APIから取得したデータは既にシリアライズ済み（日時は文字列）
    return <TodoDetailPage initialTodo={todo} />
  } catch (error) {
    // 認証エラーの場合はログインページにリダイレクト
    if (error instanceof Error && error.message === 'Unauthorized') {
      redirect('/login')
    }
    // その他のエラーはエラーページにスロー
    throw error
  }
}

// src/features/todos/TodoDetailPage.tsx（クライアントコンポーネント）
'use client'

interface Props {
  initialTodo?: Todo
}

export function TodoDetailPage({ initialTodo }: Props) {
  const router = useRouter()
  const params = useParams()
  const todoId = params?.id as string

  const [todo, setTodo] = useState<Todo | null>(initialTodo || null)
  const [title, setTitle] = useState<string>(initialTodo?.title || '')
  const [descriptions, setDescriptions] = useState<string>(initialTodo?.descriptions || '')
  const [currentUserRole, setCurrentUserRole] = useState<number>(4) // デフォルトはUSER
  
  // 初回読み込み時にTodo詳細を取得（初期データがない場合のみ）
  useEffect(() => {
    if (!initialTodo && todoId) {
      fetchTodoDetail()
    }
    // 現在のユーザー情報を取得
    fetchCurrentUser()
  }, [todoId, fetchTodoDetail, initialTodo, fetchCurrentUser])
  
  // 編集、削除処理
}
```

**注意点**:
- Next.js 15 では `params` が Promise 型なので `await params` で取得
- クライアントコンポーネントでは初期データがない場合のフォールバックを実装

---

### 3.3 プロフィールページ

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
- ヘッダーナビゲーション（ユーザー管理リンクを含む）

**実装パターン**:
```typescript
// src/app/profile/page.tsx（サーバーコンポーネント）
export default async function Page() {
  try {
    // 並行してデータ取得
    const [user, stats, todos] = await Promise.all([
      fetchCurrentUser(),
      fetchTodoStats(),
      fetchUserTodos(),
    ])
    
    // APIから取得したデータは既にシリアライズ済み（日時は文字列）
    // そのまま渡す
    return (
      <ProfilePage
        initialUser={user}
        initialStats={stats}
        initialTodos={todos}
      />
    )
  } catch (error) {
    // 認証エラーの場合はログインページにリダイレクト
    if (error instanceof Error && error.message === 'Unauthorized') {
      redirect('/login')
    }
    // その他のエラーはエラーページにスロー
    throw error
  }
}

// src/features/profile/ProfilePage.tsx（クライアントコンポーネント）
'use client'

interface Props {
  initialUser?: User
  initialStats?: TodoStats
  initialTodos?: Todo[]
}

export function ProfilePage({ initialUser, initialStats, initialTodos }: Props) {
  const [user, setUser] = useState<User | null>(initialUser || null)
  const [firstName, setFirstName] = useState<string>(initialUser?.firstName || '')
  const [lastName, setLastName] = useState<string>(initialUser?.lastName || '')
  const [stats, setStats] = useState<TodoStats | null>(initialStats || null)
  const [todos, setTodos] = useState<Todo[]>(initialTodos || [])
  
  // 初回読み込み時に全データを取得（初期データがない場合のみ）
  useEffect(() => {
    if (initialUser && initialStats && initialTodos) {
      // サーバーから渡された場合はスキップ
      return
    }

    const fetchAllData = async () => {
      setIsLoading(true)
      await Promise.all([fetchUserInfo(), fetchTodoStats(), fetchTodos()])
      setIsLoading(false)
    }

    fetchAllData()
  }, [fetchTodoStats, fetchTodos, fetchUserInfo, initialUser, initialStats, initialTodos])
  
  // 編集、パスワード変更、ログアウト処理
}
```

---

### 3.4 ユーザー管理ページ（ADMIN・MANAGER専用）

#### `/users` - ユーザー一覧ページ
**現状**: 完全にクライアントコンポーネント

**変更方針**: **ハイブリッド構成に変更**

**サーバーコンポーネント部分**:
- ページコンポーネント（`src/app/users/page.tsx`）
- 初期ユーザー一覧データフェッチ
- 現在のユーザー情報取得（権限チェック）

**クライアントコンポーネント部分**:
- ユーザー一覧表示 + インタラクション（`UserListPage.tsx`）
- ページネーション、フィルタリング、ソート、検索
- ユーザー削除ボタン（ADMIN のみ）

**実装パターン**:
```typescript
// src/app/users/page.tsx（サーバーコンポーネント）
export default async function Page() {
  // 権限チェック
  const currentUser = await fetchCurrentUser()
  
  if (currentUser.role >= 3) {
    redirect('/todos') // 権限なしの場合リダイレクト
  }
  
  // 初期データ取得
  const initialData = await fetchUsers()
  
  return (
    <UserListPage 
      initialData={initialData}
      currentUserRole={currentUser.role}
      currentUserId={currentUser.id}
    />
  )
}

// src/features/users/UserListPage.tsx（クライアントコンポーネント）
'use client'

interface Props {
  initialData: UserListResponse
  currentUserRole: number
  currentUserId: string
}

export function UserListPage({ initialData, currentUserRole, currentUserId }: Props) {
  const [users, setUsers] = useState(initialData.data)
  
  // ページネーション、フィルタリング、ソートなどのインタラクション
}
```

---

#### `/users/[id]` - ユーザー詳細ページ
**現状**: 完全にクライアントコンポーネント

**変更方針**: **ハイブリッド構成に変更**

**サーバーコンポーネント部分**:
- ページコンポーネント（`src/app/users/[id]/page.tsx`）
- 初期ユーザーデータフェッチ
- ユーザーのTodo一覧取得
- 現在のユーザー情報取得（権限チェック）

**クライアントコンポーネント部分**:
- ユーザー詳細表示 + 編集フォーム（`UserDetailPage.tsx`）
- ユーザー情報編集（ADMIN のみ）
- ユーザー削除ボタン（ADMIN のみ、自分以外）

**実装パターン**:
```typescript
// src/app/users/[id]/page.tsx（サーバーコンポーネント）
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const currentUser = await fetchCurrentUser()
  
  if (currentUser.role >= 3) {
    redirect('/todos') // 権限なしの場合リダイレクト
  }
  
  // 並行してデータ取得
  const [user, todos] = await Promise.all([
    fetchUserById(id),
    fetchUserTodos(id),
  ])
  
  return (
    <UserDetailPage
      initialUser={user}
      initialTodos={todos}
      currentUserRole={currentUser.role}
      currentUserId={currentUser.id}
    />
  )
}

// src/features/users/UserDetailPage.tsx（クライアントコンポーネント）
'use client'

interface Props {
  initialUser: User
  initialTodos: Todo[]
  currentUserRole: number
  currentUserId: string
}

export function UserDetailPage({ initialUser, initialTodos, currentUserRole, currentUserId }: Props) {
  const [user, setUser] = useState(initialUser)
  const [todos, setTodos] = useState(initialTodos)
  
  // 編集、削除処理
}
```

---

#### `/users/create` - ユーザー作成ページ
**現状**: 完全にクライアントコンポーネント

**変更方針**: **ハイブリッド構成に変更**

**サーバーコンポーネント部分**:
- ページコンポーネント（`src/app/users/create/page.tsx`）
- 現在のユーザー情報取得（権限チェック）

**クライアントコンポーネント部分**:
- ユーザー作成フォーム（`CreateUserPage.tsx`）

**実装パターン**:
```typescript
// src/app/users/create/page.tsx（サーバーコンポーネント）
export default async function Page() {
  const currentUser = await fetchCurrentUser()
  
  if (currentUser.role >= 3) {
    redirect('/todos') // 権限なしの場合リダイレクト
  }
  
  return <CreateUserPage currentUserRole={currentUser.role} />
}

// src/features/users/CreateUserPage.tsx（クライアントコンポーネント）
'use client'

interface Props {
  currentUserRole: number
}

export function CreateUserPage({ currentUserRole }: Props) {
  // ユーザー作成フォーム
  // MANAGER は自分より上位のロール（ADMIN）を作成できない制約
}
```

---

## 4. データフェッチ関数の作成

### 4.1 フェッチ関数の配置場所

**推奨**: `src/lib/api.ts`

### 4.2 Server Actions と従来のフェッチ関数の使い分け

Step 2では、以下の2つのアプローチを組み合わせて実装します:

1. **サーバーコンポーネント専用のフェッチ関数** (`fetchXxx`形式)
   - サーバーコンポーネント内でのみ使用
   - 初期データ取得に利用
   
2. **Server Actions** (`getXxx/createXxx/updateXxx/deleteXxx`形式)
   - クライアントコンポーネントから呼び出し可能
   - ユーザーインタラクション時のデータ操作に利用
   - `'use server'` ディレクティブで定義

### 4.3 フェッチ関数の実装例

```typescript
// src/lib/api.ts
'use server'; // Server Actionsを有効化

/**
 * サーバーコンポーネント・Server Actions用のデータフェッチ関数
 *
 * このファイルには以下の2種類の関数を定義します:
 * 1. サーバーコンポーネント専用のフェッチ関数 (fetchXxx形式)
 * 2. クライアントコンポーネントから呼び出し可能なServer Actions (getXxx/createXxx/updateXxx/deleteXxx形式)
 */

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

/**
 * サーバー側でCookieとヘッダーを含めてフェッチを実行するヘルパー関数
 */
async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const cookieStore = await cookies();
  const authToken = cookieStore.get('auth_token');
  
  const requestHeaders = new Headers(options.headers);
  if (authToken) {
    requestHeaders.set('Cookie', `auth_token=${authToken.value}`);
  }
  
  return await fetch(url, {
    ...options,
    headers: requestHeaders,
    cache: 'no-store',
  });
}

// ========================================
// サーバーコンポーネント専用のフェッチ関数
// ========================================

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
  
  const response = await fetchWithAuth(
    `${API_URL}/api/todos?${searchParams.toString()}`
  )
  
  if (!response.ok) {
    if (response.status === 401) throw new Error('Unauthorized')
    throw new Error('Failed to fetch todos')
  }
  
  return response.json()
}

// ... その他のfetchXxx関数

// ========================================
// Server Actions (クライアントコンポーネントから呼び出し可能)
// ========================================

/**
 * ログイン (Server Action)
 * 
 * クライアントコンポーネント (LoginPage.tsx) から呼び出される
 */
export async function login(formData: { username: string; password: string }) {
  try {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: formData.username,
        password: formData.password,
      }),
      cache: 'no-store',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.message || 'ログインに失敗しました',
      };
    }
    
    return {
      success: true,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'ログインに失敗しました',
    };
  }
}

/**
 * ログアウト (Server Action)
 * 
 * クライアントコンポーネントから呼び出され、ログイン画面にリダイレクトする
 */
export async function logout() {
  try {
    await fetchWithAuth(`${API_URL}/api/auth/logout`, {
      method: 'POST',
    });
    
    redirect('/login');
  } catch (err) {
    console.error('Logout error:', err);
    redirect('/login');
  }
}

/**
 * ユーザー情報取得 (Server Action)
 * 
 * クライアントコンポーネントから呼び出される
 */
export async function getUserInfo() {
  try {
    const response = await fetchWithAuth(`${API_URL}/api/users/me`);
    
    if (response.status === 401) {
      redirect('/login');
    }
    
    if (!response.ok) {
      return {
        success: false,
        error: 'ユーザー情報の取得に失敗しました',
      };
    }
    
    const data = await response.json();
    return {
      success: true,
      data: data.data,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'ユーザー情報の取得に失敗しました',
    };
  }
}

/**
 * Todo一覧取得 (Server Action)
 */
export async function getTodoList(params?: {
  page?: number;
  perPage?: number;
  completedFilter?: 'all' | 'completed' | 'incomplete';
  sortBy?: 'createdAt' | 'updatedAt' | 'title';
  sortOrder?: 'asc' | 'desc';
}) {
  try {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.perPage) searchParams.set('perPage', params.perPage.toString());
    if (params?.completedFilter) searchParams.set('completedFilter', params.completedFilter);
    if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder);
    
    const response = await fetchWithAuth(
      `${API_URL}/api/todos?${searchParams.toString()}`
    );
    
    if (response.status === 401) {
      redirect('/login');
    }
    
    if (!response.ok) {
      return {
        success: false,
        error: 'Todoの取得に失敗しました',
      };
    }
    
    const data = await response.json();
    return {
      success: true,
      data: data.data,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Todoの取得に失敗しました',
    };
  }
}

/**
 * Todo作成 (Server Action)
 */
export async function createTodo(formData: { title: string; descriptions?: string }) {
  try {
    const response = await fetchWithAuth(`${API_URL}/api/todos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: formData.title,
        descriptions: formData.descriptions || undefined,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.message || 'Todoの作成に失敗しました',
      };
    }
    
    const data = await response.json();
    return {
      success: true,
      data: data.data,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Todoの作成に失敗しました',
    };
  }
}

// ... その他のServer Actions (updateTodo, deleteTodo, createUser, updateUser, deleteUser など)
```

**重要な実装ポイント**:

#### 1. `'use server'` ディレクティブ
- ファイル冒頭に追加してServer Actionsを有効化
- このディレクティブにより、すべての関数がサーバー側で実行される

#### 2. Server Actionsの戻り値形式
```typescript
{
  success: boolean;
  data?: any;      // 成功時のデータ
  error?: string;  // エラー時のメッセージ
}
```

#### 3. クライアントコンポーネントでの使用例
```typescript
// src/features/auth/LoginPage.tsx
'use client';

import { login } from '@/lib/api';

export function LoginPage() {
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Server Actionの呼び出し
    const result = await login({ username, password });
    
    if (!result.success) {
      setError(result.error || 'ログインに失敗しました');
      return;
    }
    
    // 成功時の処理
    router.push('/todos');
  };
  
  // ...
}
```

#### 4. `useRouter`から`window.location.href`への置き換え

Server Actions内で`redirect()`を使用するため、クライアントコンポーネントでは`useRouter`を削除し、必要に応じて`window.location.href`を使用します:

```typescript
// ❌ 従来の実装
import { useRouter } from 'next/navigation';

const router = useRouter();
router.push('/todos');

// ✅ 新しい実装
window.location.href = '/todos';

// または Server Action 内で redirect() を使用
export async function logout() {
  try {
    await fetchWithAuth(`${API_URL}/api/auth/logout`, { method: 'POST' });
    redirect('/login'); // サーバー側でリダイレクト
  } catch (err) {
    redirect('/login');
  }
}
```

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
export async function fetchUserTodos(userId?: string) {
  const endpoint = userId 
    ? `${process.env.NEXT_PUBLIC_API_URL}/api/users/${userId}/todos`
    : `${process.env.NEXT_PUBLIC_API_URL}/api/users/me/todos`
  
  const response = await fetch(endpoint, {
    cache: 'no-store',
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch user todos')
  }
  
  const result = await response.json()
  return result.data
}

// ユーザー一覧取得（ADMIN・MANAGER専用）
export async function fetchUsers(params?: {
  page?: number
  perPage?: number
  roleFilter?: number | 'all'
  sortBy?: 'createdAt' | 'updatedAt' | 'username'
  sortOrder?: 'asc' | 'desc'
  search?: string
}) {
  const searchParams = new URLSearchParams()
  if (params?.page) searchParams.set('page', params.page.toString())
  if (params?.perPage) searchParams.set('perPage', params.perPage.toString())
  if (params?.roleFilter && params.roleFilter !== 'all') {
    searchParams.set('roleFilter', params.roleFilter.toString())
  }
  if (params?.sortBy) searchParams.set('sortBy', params.sortBy)
  if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder)
  if (params?.search) searchParams.set('search', params.search)
  
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/users?${searchParams.toString()}`,
    {
      cache: 'no-store',
    }
  )
  
  if (!response.ok) {
    throw new Error('Failed to fetch users')
  }
  
  return response.json()
}

// ユーザー詳細取得（ADMIN・MANAGER専用）
export async function fetchUserById(id: string) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/users/${id}`,
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
```

---

## 5. 認証の考慮事項

### 5.1 Cookie の取り扱い

サーバーコンポーネントでのデータフェッチ時、Cookie（JWT トークン）を含める必要があります。

**推奨実装**: `fetchWithAuth` ヘルパー関数を使用

```typescript
// src/lib/api.ts
import { cookies } from 'next/headers'

/**
 * サーバー側でCookieとヘッダーを含めてフェッチを実行するヘルパー関数
 */
async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const cookieStore = await cookies()
  
  // 認証トークンのCookieのみを取得
  const authToken = cookieStore.get('auth_token')
  
  const requestHeaders = new Headers(options.headers)
  
  // 認証トークンがあればCookieヘッダーを設定
  if (authToken) {
    requestHeaders.set('Cookie', `auth_token=${authToken.value}`)
  }
  
  const response = await fetch(url, {
    ...options,
    headers: requestHeaders,
    cache: 'no-store', // サーバーコンポーネントでは常に最新データを取得
  })
  
  return response
}

// 使用例
export async function fetchTodos() {
  const response = await fetchWithAuth(`${API_URL}/api/todos`)
  
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized')
    }
    throw new Error('Failed to fetch todos')
  }
  
  return response.json()
}
```

**重要ポイント**:
- `cookies()` は Next.js 15 から Promise を返すため、`await cookies()` で取得
- Cookie 名は `auth_token`（プロジェクトの認証仕様に合わせる）
- `cache: 'no-store'` で常に最新データを取得

### 5.2 認証エラー時のリダイレクト

```typescript
import { redirect } from 'next/navigation'

export async function fetchCurrentUser() {
  const response = await fetchWithAuth(`${API_URL}/api/users/me`)
  
  if (response.status === 401) {
    throw new Error('Unauthorized')
  }
  
  if (!response.ok) {
    throw new Error('Failed to fetch user')
  }
  
  const result = await response.json()
  return result.data
}

// サーバーコンポーネントでの使用
export default async function Page() {
  try {
    const user = await fetchCurrentUser()
    return <ProfilePage initialUser={user} />
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      redirect('/login')
    }
    throw error
  }
}
```

### 5.3 権限チェック

ADMIN・MANAGER専用ページでは、サーバーコンポーネントで権限チェックを実施します。

```typescript
// src/app/users/page.tsx
export default async function Page() {
  const currentUser = await fetchCurrentUser()
  
  // 権限チェック（USER, GUEST は弾く）
  if (currentUser.role >= 3) {
    redirect('/todos') // 権限なしの場合はTodo一覧にリダイレクト
  }
  
  const initialData = await fetchUsers()
  
  return (
    <UserListPage
      initialData={initialData}
      currentUserRole={currentUser.role}
      currentUserId={currentUser.id}
    />
  )
}
```

---

## 6. エラーハンドリング

### 6.1 サーバーコンポーネントでのエラーハンドリング

**認証エラー時のリダイレクト**:

```typescript
// src/app/todos/page.tsx
import { redirect } from 'next/navigation'

export default async function TodosServerPage({ searchParams }: { searchParams: Promise<{...}> }) {
  try {
    const params = await searchParams
    const [initialData, currentUser] = await Promise.all([
      fetchTodos({ ...params }),
      fetchCurrentUser(),
    ])
    
    return <TodoListPage initialData={initialData} currentUserRole={currentUser.role} />
  } catch (error) {
    // 認証エラーの場合はログインページにリダイレクト
    if (error instanceof Error && error.message === 'Unauthorized') {
      redirect('/login')
    }
    // その他のエラーはエラーページにスロー
    throw error
  }
}
```

**重要**: 
- `fetchWithAuth` ヘルパー関数で401エラー時に `throw new Error('Unauthorized')` をスロー
- サーバーコンポーネントでキャッチして `/login` にリダイレクト
- その他のエラーは `error.tsx` で処理

### 6.2 Next.js の error.tsx を活用

#### `/todos/error.tsx` - Todo一覧のエラーページ

```typescript
// src/app/todos/error.tsx
'use client'

export default function TodosError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-red-600 mb-4">エラーが発生しました</h2>
        <p className="text-red-700 mb-4">
          {error.message || 'Todoの読み込み中にエラーが発生しました。'}
        </p>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={reset}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            再試行
          </button>
          <button
            type="button"
            onClick={() => {
              window.location.href = '/todos'
            }}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          >
            Todo一覧に戻る
          </button>
        </div>
      </div>
    </div>
  )
}
```

#### `/todos/[id]/error.tsx` - Todo詳細のエラーページ

```typescript
// src/app/todos/[id]/error.tsx
'use client'

export default function TodoDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-red-600 mb-4">エラーが発生しました</h2>
        <p className="text-red-700 mb-4">
          {error.message || 'Todo詳細の読み込み中にエラーが発生しました。'}
        </p>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={reset}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            再試行
          </button>
          <button
            type="button"
            onClick={() => {
              window.location.href = '/todos'
            }}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          >
            Todo一覧に戻る
          </button>
        </div>
      </div>
    </div>
  )
}
```

#### `/profile/error.tsx` - プロフィールのエラーページ

```typescript
// src/app/profile/error.tsx
'use client'

export default function ProfileError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-red-600 mb-4">エラーが発生しました</h2>
        <p className="text-red-700 mb-4">
          {error.message || 'プロフィール情報の読み込み中にエラーが発生しました。'}
        </p>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={reset}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            再試行
          </button>
          <button
            type="button"
            onClick={() => {
              window.location.href = '/todos'
            }}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          >
            Todo一覧に戻る
          </button>
        </div>
      </div>
    </div>
  )
}
```

---

## 7. ローディング状態の改善

### 7.1 loading.tsx の活用

#### `/todos/loading.tsx` - Todo一覧のローディング状態

```typescript
// src/app/todos/loading.tsx
export default function Loading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="animate-pulse">
        {/* ヘッダー部分 */}
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>

        {/* フィルター・ソート部分 */}
        <div className="flex gap-4 mb-6">
          <div className="h-10 bg-gray-200 rounded w-32"></div>
          <div className="h-10 bg-gray-200 rounded w-32"></div>
          <div className="h-10 bg-gray-200 rounded w-32"></div>
        </div>

        {/* Todo作成フォーム */}
        <div className="bg-gray-100 rounded-lg p-4 mb-6">
          <div className="h-10 bg-gray-200 rounded mb-3"></div>
          <div className="h-20 bg-gray-200 rounded mb-3"></div>
          <div className="h-10 bg-gray-200 rounded w-24"></div>
        </div>

        {/* Todo一覧 */}
        <div className="space-y-3">
          <div className="h-16 bg-gray-200 rounded"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
        </div>

        {/* ページネーション */}
        <div className="flex justify-center gap-4 mt-6">
          <div className="h-10 bg-gray-200 rounded w-24"></div>
          <div className="h-10 bg-gray-200 rounded w-24"></div>
        </div>
      </div>
    </div>
  )
}
```

#### `/todos/[id]/loading.tsx` - Todo詳細のローディング状態

```typescript
// src/app/todos/[id]/loading.tsx
export default function Loading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="animate-pulse">
        {/* ヘッダー部分 */}
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>

        {/* Todo詳細カード */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-10 bg-gray-200 rounded mb-4"></div>

          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-24 bg-gray-200 rounded mb-4"></div>

          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>

          <div className="flex gap-4 mt-6">
            <div className="h-10 bg-gray-200 rounded w-24"></div>
            <div className="h-10 bg-gray-200 rounded w-24"></div>
            <div className="h-10 bg-gray-200 rounded w-24"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
```

#### `/profile/loading.tsx` - プロフィールのローディング状態

```typescript
// src/app/profile/loading.tsx
export default function Loading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="animate-pulse">
        {/* ヘッダー部分 */}
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* プロフィール編集セクション */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="space-y-4">
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded w-24"></div>
            </div>
          </div>

          {/* パスワード変更セクション */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="space-y-4">
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded w-24"></div>
            </div>
          </div>
        </div>

        {/* Todo統計 */}
        <div className="mt-6 bg-white shadow-md rounded-lg p-6">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>

        {/* Todo一覧 */}
        <div className="mt-6 bg-white shadow-md rounded-lg p-6">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
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
- [ ] Todo 一覧ページのサーバーコンポーネント化（ユーザーロール情報含む）
- [ ] Todo 詳細ページのサーバーコンポーネント化
- [ ] プロフィールページのサーバーコンポーネント化
- [ ] ユーザー一覧ページのサーバーコンポーネント化（権限チェック含む）
- [ ] ユーザー詳細ページのサーバーコンポーネント化（権限チェック含む）
- [ ] ユーザー作成ページのサーバーコンポーネント化（権限チェック含む）

### 9.2 データフェッチ関数
- [ ] Todo 一覧フェッチ関数の作成
- [ ] Todo 詳細フェッチ関数の作成
- [ ] ユーザー情報フェッチ関数の作成
- [ ] Todo 統計フェッチ関数の作成
- [ ] ユーザー一覧フェッチ関数の作成
- [ ] ユーザー詳細フェッチ関数の作成
- [ ] ユーザーのTodo一覧フェッチ関数の作成（パラメータ対応）

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
- [ ] Todo 一覧のヘッダーナビゲーションが権限に応じて正しく表示される
- [ ] Todo 詳細が正常に表示される
- [ ] プロフィールが正常に表示される
- [ ] ユーザー一覧が正常に表示される（ADMIN・MANAGER のみ）
- [ ] ユーザー詳細が正常に表示される（ADMIN・MANAGER のみ）
- [ ] ユーザー作成が正常に動作する（ADMIN・MANAGER のみ）
- [ ] 権限のないユーザーがユーザー管理ページにアクセスできない
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

**Document Version**: 1.2.0  
**Last Updated**: 2025-10-28  
**Changes**:
- v1.2.0 (2025-10-28): Server Actionsの実装を追加
  - `'use server'` ディレクティブによるServer Actionsの有効化
  - `src/lib/api.ts`に Server Actions を追加（`getXxx/createXxx/updateXxx/deleteXxx`形式）
  - Server Actionsの統一された戻り値形式（`{ success, data?, error? }`）を採用
  - クライアントコンポーネントでのfetch()削除、Server Actions直接呼び出しに変更
  - `useRouter`の削除と`window.location.href`または`redirect()`への置き換え
  - 認証ページ（LoginPage、RegisterPage）でのServer Actions使用例を追加
  - TodoListPage、TodoDetailPage、ProfilePage、UserListPage、UserDetailPage、CreateUserPageでのServer Actions使用例を追加
- v1.1.0 (2025-10-27): 実装詳細を追加
  - サーバーコンポーネントでの `searchParams` の Promise 型対応を追記
  - `fetchWithAuth` ヘルパー関数の実装詳細を追加
  - 認証エラー時のリダイレクト処理を詳細化
  - `error.tsx` の実装例を各ページごとに追加（`/todos`、`/todos/[id]`、`/profile`）
  - `loading.tsx` の実装例を各ページごとに追加（`/todos`、`/todos/[id]`、`/profile`）
  - クライアントコンポーネントでの初期データがない場合のフォールバック処理を追加
  - Props のオプショナル型（`initialData?`, `currentUserRole?`, `initialUser?` など）を追加
  - `useEffect` での初期データ有無チェックのパターンを追加
  - 権限チェック（ユーザー管理ページ）の実装詳細を追加
- v1.0.0 (2025-10-24): 初版作成

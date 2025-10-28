# Step 5: カスタムフックの定義

## 1. Step 5 の概要

### 1.1 目的
- カスタムフックを使ったロジックの分離を学ぶ
- UI とビジネスロジックの分離によるメンテナンス性向上を理解する
- React Hooks の再利用性を習得する
- テスタビリティの向上を体験する

### 1.2 変更方針
Step 4 まででページコンポーネントに集中していたビジネスロジック（API 呼び出し、状態管理）を、カスタムフックに切り出します。

**カスタムフック化する対象**:
- API 呼び出しロジック
- 複雑な状態管理ロジック
- フォームの状態とバリデーション
- 認証状態の管理

**コンポーネントに残す対象**:
- UI の描画ロジック
- イベントハンドラーの定義（カスタムフックから返された関数を呼び出すだけ）

### 1.3 制約条件
- カスタムフックは `use` で始まる命名規則に従う
- カスタムフックは `hooks/` ディレクトリに配置する
- 1 つのカスタムフックは 1 つの責務を持つ

---

## 2. カスタムフックの基本

### 2.1 カスタムフックとは

カスタムフックは、React の組み込みフック（useState, useEffect など）を組み合わせて、ロジックを再利用可能な形にしたものです。

**このプロジェクトでの重要な方針**:
- **APIとの疎通は必ず `src/lib/api.ts` に定義されている Server Actions を使用する**
- カスタムフック内では `fetch()` を直接使用せず、Server Actions を呼び出す
- Server Actions は `'use server'` ディレクティブで定義されている
- カスタムフックは `'use client'` ディレクティブで定義する

**基本構造**:
```typescript
'use client'

import { useState, useEffect } from 'react'
import { getTodoList } from '@/lib/api' // Server Actionをインポート

function useCustomHook() {
  const [state, setState] = useState()
  
  useEffect(() => {
    // Server Actionを呼び出し
    const fetchData = async () => {
      const result = await getTodoList()
      if (result.success) {
        setState(result.data)
      }
    }
    fetchData()
  }, [])
  
  return {
    state,
    // その他の値や関数
  }
}
```

### 2.2 カスタムフックの命名規則

- **必ず `use` で始める**（例: `useTodos`, `useAuth`, `useForm`）
- **何をするフックか明確にする**（例: `useFetchTodos` ではなく `useTodos`）

### 2.3 カスタムフックを使うメリット

1. **ロジックの再利用**: 同じロジックを複数のコンポーネントで使用できる
2. **関心の分離**: UI とビジネスロジックを分離できる
3. **テストしやすい**: ロジック部分を独立してテストできる
4. **可読性向上**: コンポーネントが UI に集中できる
5. **Server Actionsの一元管理**: API呼び出しロジックを統一的に管理できる

### 2.4 useCallbackの重要性

**🚨 重要**: カスタムフック内で `useEffect` の依存配列に関数を含める場合は、**必ず `useCallback` を使用してください**。

#### なぜ useCallback が必要か

関数は通常、コンポーネントが再レンダリングされるたびに新しく生成されます。`useEffect` の依存配列に通常の関数を含めると、毎回新しい関数として認識され、無限ループが発生する可能性があります。

```typescript
// ❌ 悪い例: 無限ループの可能性
const fetchData = async () => {
  // データ取得処理
};

useEffect(() => {
  fetchData();
}, [fetchData]); // fetchDataが毎回新しい関数として認識される

// ✅ 良い例: useCallbackでメモ化
const fetchData = useCallback(async () => {
  // データ取得処理
}, [依存する値]); // 依存する値が変わらない限り同じ関数を再利用

useEffect(() => {
  fetchData();
}, [fetchData]); // fetchDataが安定している
```

#### useCallbackの基本パターン

```typescript
import { useCallback, useEffect, useState } from 'react';

export function useCustomHook(id: string) {
  const [data, setData] = useState(null);
  
  // useCallbackで関数をメモ化
  const fetchData = useCallback(async () => {
    const result = await getDataById(id);
    setData(result);
  }, [id]); // idが変更された時のみ関数を再生成
  
  useEffect(() => {
    fetchData();
  }, [fetchData]); // fetchDataは安定しているため安全
  
  return { data, refetch: fetchData };
}
```

#### useCallbackの依存配列のルール

1. **外部の値を参照する場合は依存配列に含める**
   ```typescript
   const fetchTodos = useCallback(async () => {
     const result = await getTodoList({ page, sortBy });
   }, [page, sortBy]); // pageとsortByを依存配列に含める
   ```

2. **stateのsetter関数は依存配列に含めない**
   ```typescript
   const fetchData = useCallback(async () => {
     setLoading(true); // setLoadingは安定しているため依存配列不要
     const result = await getData();
     setData(result);
   }, []); // setter関数は依存配列に含めない
   ```

3. **依存配列が空の場合はマウント時のみ実行**
   ```typescript
   const fetchProfile = useCallback(async () => {
     const result = await getUserInfo();
     setUser(result);
   }, []); // 空配列 = マウント時のみ実行
   ```

### 2.5 Server Actionsを使用する利点

1. **型安全性**: TypeScriptの型推論が効く
2. **エラーハンドリングの統一**: Server Actions側で一貫したエラー処理
3. **認証の自動処理**: Cookieの送信が自動的に行われる
4. **キャッシュ制御**: Server Actions側でキャッシュ戦略を管理
5. **コードの保守性**: API呼び出しロジックが一箇所に集約される

---

## 3. ディレクトリ構成

```
src/features/
├── auth/
│   ├── components/
│   │   ├── LoginForm.tsx
│   │   └── RegisterForm.tsx
│   ├── hooks/                    # 認証関連のカスタムフック
│   │   ├── useAuth.ts            # 認証状態管理
│   │   ├── useLogin.ts           # ログイン処理
│   │   └── useRegister.ts        # ユーザー登録処理
│   ├── LoginPage.tsx
│   └── RegisterPage.tsx
├── todos/
│   ├── components/
│   │   ├── TodoItem.tsx
│   │   ├── TodoList.tsx
│   │   ├── TodoCreateForm.tsx
│   │   └── ...
│   ├── hooks/                    # Todo 関連のカスタムフック
│   │   ├── useTodos.ts           # Todo 一覧取得・管理
│   │   ├── useTodoDetail.ts      # Todo 詳細取得・更新
│   │   ├── useCreateTodo.ts      # Todo 作成
│   │   ├── useUpdateTodo.ts      # Todo 更新
│   │   ├── useDeleteTodo.ts      # Todo 削除
│   │   └── useTodoFilters.ts     # フィルタリング・ソート
│   ├── TodoListPage.tsx
│   └── TodoDetailPage.tsx
├── profile/
│   ├── components/
│   │   ├── ProfileInfo.tsx
│   │   └── ...
│   ├── hooks/                    # プロフィール関連のカスタムフック
│   │   ├── useProfile.ts         # プロフィール取得・更新
│   │   ├── usePasswordChange.ts  # パスワード変更
│   │   ├── useTodoStats.ts       # Todo 統計取得
│   │   └── useUserTodos.ts       # ユーザーの Todo 一覧
│   └── ProfilePage.tsx
└── users/
    ├── components/
    │   ├── UserItem.tsx
    │   ├── UserList.tsx
    │   ├── UserCreateForm.tsx
    │   └── ...
    ├── hooks/                    # ユーザー管理関連のカスタムフック
    │   ├── useUsers.ts           # ユーザー一覧取得・管理
    │   ├── useUserDetail.ts      # ユーザー詳細取得
    │   ├── useCreateUser.ts      # ユーザー作成
    │   ├── useUpdateUser.ts      # ユーザー更新
    │   ├── useDeleteUser.ts      # ユーザー削除
    │   └── useUserTodoList.ts    # 特定ユーザーのTodo一覧取得
    ├── UserListPage.tsx
    └── UserDetailPage.tsx
```

---

## 4. カスタムフック設計パターン

### 4.1 データフェッチ用カスタムフック

**パターン**: Server Actionsを使用したデータ取得と状態管理

**重要**: このプロジェクトでは、APIとの疎通は **必ず** `src/lib/api.ts` に定義されている Server Actions を使用します。

**🚨 useCallbackの使用が必須**: データ取得関数を `useEffect` の依存配列に含める場合は、`useCallback` でメモ化してください。

```typescript
// src/features/todos/hooks/useTodos.ts
'use client'

import { useState, useEffect, useCallback } from 'react'
import { getTodoList } from '@/lib/api'
import type { Todo } from '@/types'

interface UseTodosOptions {
  page?: number
  perPage?: number
  completedFilter?: 'all' | 'completed' | 'incomplete'
  sortBy?: 'createdAt' | 'updatedAt' | 'title'
  sortOrder?: 'asc' | 'desc'
}

export function useTodos(options: UseTodosOptions = {}) {
  const [todos, setTodos] = useState<Todo[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')
  
  // ✅ useCallbackでメモ化（重要！）
  const fetchTodos = useCallback(async () => {
    setIsLoading(true)
    setError('')
    
    try {
      // Server Actionを呼び出し
      const result = await getTodoList({
        page: options.page,
        perPage: options.perPage,
        completedFilter: options.completedFilter,
        sortBy: options.sortBy,
        sortOrder: options.sortOrder,
      })
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch todos')
      }
      
      setTodos(result.data.data)
      setTotal(result.data.total)
      setTotalPages(result.data.totalPages)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [options.page, options.perPage, options.completedFilter, options.sortBy, options.sortOrder])
  // ☝️ 依存配列: optionsの各プロパティが変更された時に関数を再生成
  
  useEffect(() => {
    fetchTodos()
  }, [fetchTodos])
  // ☝️ fetchTodosはuseCallbackでメモ化されているため安全
  
  return {
    todos,
    total,
    totalPages,
    isLoading,
    error,
    refetch: fetchTodos,
  }
}
```

**使用例**:
```typescript
// src/features/todos/TodoListPage.tsx
'use client'

import { useState } from 'react'
import { useTodos } from './hooks/useTodos'

export function TodoListPage() {
  const [page, setPage] = useState(1)
  const [completedFilter, setCompletedFilter] = useState<'all' | 'completed' | 'incomplete'>('all')
  
  const { todos, totalPages, isLoading, error, refetch } = useTodos({
    page,
    completedFilter,
  })
  
  return (
    <div>
      {isLoading && <p>読み込み中...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {/* UI */}
    </div>
  )
}
```

---

### 4.2 ミューテーション用カスタムフック（作成・更新・削除）

**パターン**: Server Actionsを使用したデータの作成・更新・削除と状態管理

```typescript
// src/features/todos/hooks/useCreateTodo.ts
'use client'

import { useState } from 'react'
import { createTodo } from '@/lib/api'
import type { Todo } from '@/types'

export function useCreateTodo() {
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string>('')
  
  const create = async (title: string, descriptions?: string) => {
    setIsCreating(true)
    setError('')
    
    try {
      // Server Actionを呼び出し
      const result = await createTodo({ title, descriptions })
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create todo')
      }
      
      return result.data as Todo
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setIsCreating(false)
    }
  }
  
  return {
    createTodo: create,
    isCreating,
    error,
  }
}
```

**使用例**:
```typescript
'use client'

import { useCreateTodo } from './hooks/useCreateTodo'
import { useTodos } from './hooks/useTodos'

export function TodoListPage() {
  const { todos, refetch } = useTodos()
  const { createTodo, isCreating, error } = useCreateTodo()
  
  const handleCreate = async (title: string, descriptions?: string) => {
    try {
      await createTodo(title, descriptions)
      await refetch() // 一覧を再取得
    } catch (err) {
      // エラーハンドリングは useCreateTodo 内で完結
    }
  }
  
  return (
    <div>
      <TodoCreateForm onCreateTodo={handleCreate} isLoading={isCreating} />
      {error && <p className="text-red-500">{error}</p>}
      {/* ... */}
    </div>
  )
}
```

---

### 4.3 フォーム管理用カスタムフック

**パターン**: フォームの状態とバリデーション管理

**注意**: フォーム管理のカスタムフックは、Server Actionsを直接呼び出すのではなく、
フォームの状態とバリデーションのみを管理します。実際のAPI呼び出しは、
`useLogin` や `useRegister` などの専用カスタムフックで行います。

```typescript
// src/features/auth/hooks/useLoginForm.ts
'use client'

import { useState } from 'react'

interface LoginFormData {
  username: string
  password: string
}

interface ValidationErrors {
  username?: string
  password?: string
}

export function useLoginForm() {
  const [formData, setFormData] = useState<LoginFormData>({
    username: '',
    password: '',
  })
  const [errors, setErrors] = useState<ValidationErrors>({})
  
  const handleChange = (field: keyof LoginFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // エラーをクリア
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }
  
  const validate = (): boolean => {
    const newErrors: ValidationErrors = {}
    
    if (!formData.username) {
      newErrors.username = 'ユーザー名は必須です'
    }
    
    if (!formData.password) {
      newErrors.password = 'パスワードは必須です'
    } else if (formData.password.length < 6) {
      newErrors.password = 'パスワードは6文字以上である必要があります'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  const reset = () => {
    setFormData({ username: '', password: '' })
    setErrors({})
  }
  
  return {
    formData,
    errors,
    handleChange,
    validate,
    reset,
  }
}
```

**使用例**:
```typescript
'use client'

import { useLoginForm } from '../hooks/useLoginForm'
import { useLogin } from '../hooks/useLogin'

export function LoginForm() {
  const { formData, errors, handleChange, validate } = useLoginForm()
  const { login, isLoading, error } = useLogin()
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validate()) {
      return
    }
    
    // Server Actionを使用したログイン処理
    await login(formData.username, formData.password)
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <Input
        value={formData.username}
        onChange={(e) => handleChange('username', e.target.value)}
        errorMessage={errors.username}
      />
      {/* ... */}
    </form>
  )
}
```

---

### 4.4 認証状態管理用カスタムフック

**パターン**: Server Actionsを使用したグローバルな認証状態の管理

**🚨 useCallbackの使用**: 認証チェック関数を `useEffect` 内で定義する場合、依存配列を空にするか、関数を外部に定義して `useCallback` でメモ化してください。

```typescript
// src/features/auth/hooks/useAuth.ts
'use client'

import { useState, useEffect, useCallback } from 'react'
import { getUserInfo, logout as logoutAction } from '@/lib/api'
import type { User } from '@/types'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  // ✅ useCallbackでメモ化（初回のみ実行）
  const checkAuth = useCallback(async () => {
    try {
      // Server Actionを呼び出し
      const result = await getUserInfo()
      
      if (result.success && result.data) {
        setUser(result.data)
        setIsAuthenticated(true)
      }
    } catch (err) {
      console.error('Auth check failed:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])
  // ☝️ 空の依存配列 = マウント時のみ実行される関数
  
  useEffect(() => {
    // 初回レンダリング時に認証状態を確認
    checkAuth()
  }, [checkAuth])
  // ☝️ checkAuthはuseCallbackでメモ化されているため安全
  
  const logout = async () => {
    try {
      // Server Actionを呼び出し
      await logoutAction()
      setUser(null)
      setIsAuthenticated(false)
    } catch (err) {
      console.error('Logout failed:', err)
    }
  }
  
  return {
    user,
    isAuthenticated,
    isLoading,
    logout,
  }
}
```

**代替パターン**: useEffect内で直接定義する場合

```typescript
export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    // ✅ useEffect内で直接定義し、依存配列を空にする
    const checkAuth = async () => {
      try {
        const result = await getUserInfo()
        if (result.success && result.data) {
          setUser(result.data)
          setIsAuthenticated(true)
        }
      } catch (err) {
        console.error('Auth check failed:', err)
      } finally {
        setIsLoading(false)
      }
    }
    
    checkAuth()
  }, [])
  // ☝️ 空の依存配列 = マウント時のみ実行
  
  const logout = async () => {
    // ...
  }
  
  return { user, isAuthenticated, isLoading, logout }
}
```

---

## 5. 主要カスタムフック一覧

### 5.1 認証関連

| カスタムフック | 責務 | 返り値 |
|---|---|---|
| `useAuth` | 認証状態管理 | `{ user, isAuthenticated, isLoading, logout }` |
| `useLogin` | ログイン処理 | `{ login, isLoading, error }` |
| `useRegister` | ユーザー登録処理 | `{ register, isLoading, error }` |
| `useLoginForm` | ログインフォーム管理 | `{ formData, errors, handleChange, validate, reset }` |
| `useRegisterForm` | 登録フォーム管理 | `{ formData, errors, handleChange, validate, reset }` |

---

### 5.2 Todo 関連

| カスタムフック | 責務 | 返り値 |
|---|---|---|
| `useTodos` | Todo 一覧取得・管理 | `{ todos, total, totalPages, isLoading, error, refetch }` |
| `useTodoDetail` | Todo 詳細取得 | `{ todo, isLoading, error, refetch }` |
| `useCreateTodo` | Todo 作成 | `{ createTodo, isCreating, error }` |
| `useUpdateTodo` | Todo 更新 | `{ updateTodo, isUpdating, error }` |
| `useDeleteTodo` | Todo 削除 | `{ deleteTodo, isDeleting, error }` |
| `useTodoFilters` | フィルタリング・ソート管理 | `{ completedFilter, sortBy, sortOrder, setCompletedFilter, setSortBy, setSortOrder }` |
| `useTodoPagination` | ページネーション管理 | `{ page, setPage }` |

---

### 5.3 プロフィール関連

| カスタムフック | 責務 | 返り値 |
|---|---|---|
| `useProfile` | プロフィール取得・更新 | `{ user, updateProfile, isLoading, error }` |
| `usePasswordChange` | パスワード変更 | `{ changePassword, isChanging, error }` |
| `useTodoStats` | Todo 統計取得 | `{ stats, isLoading, error }` |
| `useUserTodos` | ユーザーの Todo 一覧 | `{ todos, isLoading, error }` |

---

### 5.4 ユーザー管理関連（ADMIN・MANAGER専用）

| カスタムフック | 責務 | 返り値 |
|---|---|---|
| `useUsers` | ユーザー一覧取得・管理 | `{ users, total, totalPages, isLoading, error, refetch }` |
| `useUserDetail` | ユーザー詳細取得 | `{ user, isLoading, error, refetch }` |
| `useCreateUser` | ユーザー作成 | `{ createUser, isCreating, error }` |
| `useUpdateUser` | ユーザー更新 | `{ updateUser, isUpdating, error }` |
| `useDeleteUser` | ユーザー削除 | `{ deleteUser, isDeleting, error }` |
| `useUserTodoList` | 特定ユーザーのTodo一覧取得 | `{ todos, total, totalPages, isLoading, error, refetch }` |
| `useUserCreateForm` | ユーザー作成フォーム管理 | `{ formData, errors, handleChange, validate, reset }` |
| `useUserEditForm` | ユーザー編集フォーム管理 | `{ formData, errors, handleChange, validate, reset }` |

---

## 6. カスタムフック実装の指針

このセクションでは、各カスタムフックで **何を実装すべきか** を説明します。
具体的なコードは、これまで学んだパターンを参考に **自分で実装してください**。

### 6.1 useTodoDetail

**ファイルパス**: `src/features/todos/hooks/useTodoDetail.ts`

**目的**: 指定されたIDのTodo詳細を取得・管理する

**必要な機能**:
- パラメータ: `id: string` (Todo ID)
- 状態管理:
  - `todo`: 取得したTodoデータ (初期値: `null`)
  - `isLoading`: ローディング状態 (初期値: `true`)
  - `error`: エラーメッセージ (初期値: `''`)
- Server Actionの使用:
  - `getTodoDetail(id)` を呼び出してTodo詳細を取得
  - 返り値の `success` プロパティをチェック
  - 成功時: `todo` 状態を更新
  - 失敗時: `error` 状態を更新
- useEffectの活用:
  - `id` が変更されたときにTodoを再取得
- 返り値:
  - `todo`: Todoデータまたはnull
  - `isLoading`: ローディング状態
  - `error`: エラーメッセージ
  - `refetch`: 手動で再取得する関数

**実装のヒント**:
- `'use client'` ディレクティブを忘れずに追加
- `getTodoDetail` をインポート
- エラーハンドリングを適切に行う
- `finally` ブロックで必ず `isLoading` を `false` に設定
- **🚨 useCallbackの使用**: データ取得関数は `useCallback` でメモ化すること（依存配列: `[id]`）

---

### 6.2 useUpdateTodo

**ファイルパス**: `src/features/todos/hooks/useUpdateTodo.ts`

**目的**: Todoを更新する

**必要な機能**:
- 状態管理:
  - `isUpdating`: 更新処理中かどうか (初期値: `false`)
  - `error`: エラーメッセージ (初期値: `''`)
- 更新関数:
  - パラメータ:
    - `id: string` (Todo ID)
    - `updates: { title: string; descriptions?: string; completed: boolean }`
  - Server Actionの使用:
    - `updateTodo(id, updates)` を呼び出し
    - 返り値の `success` プロパティをチェック
  - 成功時: 更新されたTodoデータを返す
  - 失敗時: エラーをスロー
- 返り値:
  - `updateTodo`: 更新関数
  - `isUpdating`: 更新処理中かどうか
  - `error`: エラーメッセージ

**実装のヒント**:
- `'use client'` ディレクティブを追加
- `updateTodo` Server Actionをインポート
- 更新前に `isUpdating` を `true` に設定
- `finally` ブロックで `isUpdating` を `false` に戻す

---

### 6.3 useProfile

**ファイルパス**: `src/features/profile/hooks/useProfile.ts`

**目的**: ユーザープロフィールの取得と更新を管理する

**必要な機能**:
- 状態管理:
  - `user`: ユーザー情報 (初期値: `null`)
  - `isLoading`: ローディング状態 (初期値: `true`)
  - `error`: エラーメッセージ (初期値: `''`)
- プロフィール取得関数:
  - `getUserInfo()` Server Actionを呼び出し
  - 成功時: `user` 状態を更新
- プロフィール更新関数:
  - パラメータ: `updates: { firstName?: string; lastName?: string }`
  - `updateProfile(updates)` Server Actionを呼び出し
  - 更新成功後、プロフィールを再取得
- useEffectの活用:
  - コンポーネントマウント時にプロフィールを取得
- 返り値:
  - `user`: ユーザー情報
  - `updateProfile`: 更新関数
  - `isLoading`: ローディング状態
  - `error`: エラーメッセージ
  - `refetch`: 手動で再取得する関数

**実装のヒント**:
- `getUserInfo` と `updateProfile` をインポート
- 更新成功後は必ず `refetch` を呼び出す
- **🚨 useCallbackの使用**: データ取得関数は `useCallback` でメモ化すること（依存配列: `[]`）

---

### 6.4 useLogin

**ファイルパス**: `src/features/auth/hooks/useLogin.ts`

**目的**: ログイン処理を管理する

**必要な機能**:
- 状態管理:
  - `isLoading`: ログイン処理中かどうか
  - `error`: エラーメッセージ
- ログイン関数:
  - パラメータ: `username: string`, `password: string`
  - `login({ username, password })` Server Actionを呼び出し
  - 成功時: `/todos` ページへリダイレクト
- 返り値:
  - `login`: ログイン関数
  - `isLoading`: 処理中かどうか
  - `error`: エラーメッセージ

**実装のヒント**:
- `useRouter` from `next/navigation` を使用してリダイレクト
- ログイン処理中はボタンを無効化できるように `isLoading` を提供

---

### 6.5 useRegister

**ファイルパス**: `src/features/auth/hooks/useRegister.ts`

**目的**: ユーザー登録処理を管理する

**必要な機能**:
- 状態管理:
  - `isLoading`: 登録処理中かどうか
  - `error`: エラーメッセージ
- 登録関数:
  - パラメータ: `{ username, password, firstName?, lastName?, role? }`
  - `register(formData)` Server Actionを呼び出し
  - 成功時: `/login` ページへリダイレクト
- 返り値:
  - `register`: 登録関数
  - `isLoading`: 処理中かどうか
  - `error`: エラーメッセージ

---

### 6.6 useDeleteTodo

**ファイルパス**: `src/features/todos/hooks/useDeleteTodo.ts`

**目的**: Todoを削除する

**必要な機能**:
- 状態管理:
  - `isDeleting`: 削除処理中かどうか
  - `error`: エラーメッセージ
- 削除関数:
  - パラメータ: `id: string`
  - `deleteTodo(id)` Server Actionを呼び出し
- 返り値:
  - `deleteTodo`: 削除関数
  - `isDeleting`: 処理中かどうか
  - `error`: エラーメッセージ

---

### 6.7 usePasswordChange

**ファイルパス**: `src/features/profile/hooks/usePasswordChange.ts`

**目的**: パスワード変更処理を管理する

**必要な機能**:
- 状態管理:
  - `isChanging`: 変更処理中かどうか
  - `error`: エラーメッセージ
- パスワード変更関数:
  - パラメータ: `{ currentPassword, newPassword, confirmPassword }`
  - `changePassword(formData)` Server Actionを呼び出し
- 返り値:
  - `changePassword`: 変更関数
  - `isChanging`: 処理中かどうか
  - `error`: エラーメッセージ

---

### 6.8 useTodoStats

**ファイルパス**: `src/features/profile/hooks/useTodoStats.ts`

**目的**: Todo統計情報を取得・管理する

**必要な機能**:
- 状態管理:
  - `stats`: 統計データ `{ total, completed, incomplete }`
  - `isLoading`: ローディング状態
  - `error`: エラーメッセージ
- `getTodoStats()` Server Actionを呼び出し
- useEffectでマウント時に統計を取得
- 返り値:
  - `stats`: 統計データ
  - `isLoading`: ローディング状態
  - `error`: エラーメッセージ
  - `refetch`: 手動で再取得する関数

**実装のヒント**:
- **🚨 useCallbackの使用**: データ取得関数は `useCallback` でメモ化すること（依存配列: `[]`）

---

### 6.9 useUserTodos

**ファイルパス**: `src/features/profile/hooks/useUserTodos.ts`

**目的**: 現在のユーザーのTodo一覧を取得・管理する

**必要な機能**:
- 状態管理:
  - `todos`: Todo配列
  - `isLoading`: ローディング状態
  - `error`: エラーメッセージ
- `getUserTodos()` Server Actionを呼び出し
- useEffectでマウント時にTodo一覧を取得
- 返り値:
  - `todos`: Todo配列
  - `isLoading`: ローディング状態
  - `error`: エラーメッセージ
  - `refetch`: 手動で再取得する関数

**実装のヒント**:
- **🚨 useCallbackの使用**: データ取得関数は `useCallback` でメモ化すること（依存配列: `[]`）

---

### 6.10 useUsers

**ファイルパス**: `src/features/users/hooks/useUsers.ts`

**目的**: ユーザー一覧を取得・管理する（ADMIN・MANAGER専用）

**必要な機能**:
- パラメータ: `{ page?, perPage?, role?, sortBy?, sortOrder?, username? }`
- 状態管理:
  - `users`: ユーザー配列
  - `total`: 総件数
  - `totalPages`: 総ページ数
  - `isLoading`: ローディング状態
  - `error`: エラーメッセージ
- `getUserList(options)` Server Actionを呼び出し
- useEffectでオプション変更時に再取得
- 返り値:
  - `users`, `total`, `totalPages`, `isLoading`, `error`, `refetch`

**実装のヒント**:
- **🚨 useCallbackの使用**: データ取得関数は `useCallback` でメモ化すること（依存配列: `[options.page, options.perPage, options.role, options.sortBy, options.sortOrder, options.username]`）

---

### 6.11 useUserDetail

**ファイルパス**: `src/features/users/hooks/useUserDetail.ts`

**目的**: 特定ユーザーの詳細情報を取得・管理する

**必要な機能**:
- パラメータ: `id: string`
- 状態管理:
  - `user`: ユーザー情報
  - `isLoading`: ローディング状態
  - `error`: エラーメッセージ
- `getUserDetail(id)` Server Actionを呼び出し
- useEffectで `id` 変更時に再取得
- 返り値:
  - `user`, `isLoading`, `error`, `refetch`

**実装のヒント**:
- **🚨 useCallbackの使用**: データ取得関数は `useCallback` でメモ化すること（依存配列: `[id]`）

---

### 6.12 useCreateUser

**ファイルパス**: `src/features/users/hooks/useCreateUser.ts`

**目的**: 新規ユーザーを作成する

**必要な機能**:
- 状態管理:
  - `isCreating`: 作成処理中かどうか
  - `error`: エラーメッセージ
- 作成関数:
  - パラメータ: `{ username, password, firstName?, lastName?, role }`
  - `createUser(formData)` Server Actionを呼び出し
  - 成功時: 作成されたユーザーデータを返す
- 返り値:
  - `createUser`, `isCreating`, `error`

---

### 6.13 useUpdateUser

**ファイルパス**: `src/features/users/hooks/useUpdateUser.ts`

**目的**: ユーザー情報を更新する

**必要な機能**:
- 状態管理:
  - `isUpdating`: 更新処理中かどうか
  - `error`: エラーメッセージ
- 更新関数:
  - パラメータ: `id: string`, `updates: { firstName?, lastName?, role? }`
  - `updateUser(id, updates)` Server Actionを呼び出し
- 返り値:
  - `updateUser`, `isUpdating`, `error`

---

### 6.14 useDeleteUser

**ファイルパス**: `src/features/users/hooks/useDeleteUser.ts`

**目的**: ユーザーを削除する

**必要な機能**:
- 状態管理:
  - `isDeleting`: 削除処理中かどうか
  - `error`: エラーメッセージ
- 削除関数:
  - パラメータ: `id: string`
  - `deleteUser(id)` Server Actionを呼び出し
- 返り値:
  - `deleteUser`, `isDeleting`, `error`

---

### 6.15 useUserTodoList

**ファイルパス**: `src/features/users/hooks/useUserTodoList.ts`

**目的**: 特定ユーザーのTodo一覧を取得・管理する

**必要な機能**:
- パラメータ: `{ userId: string, page?, perPage? }`
- 状態管理:
  - `todos`: Todo配列
  - `total`: 総件数
  - `totalPages`: 総ページ数
  - `isLoading`: ローディング状態
  - `error`: エラーメッセージ
- `getUserTodoList(userId, { page, perPage })` Server Actionを呼び出し
- useEffectでパラメータ変更時に再取得
- 返り値:
  - `todos`, `total`, `totalPages`, `isLoading`, `error`, `refetch`

**実装のヒント**:
- **🚨 useCallbackの使用**: データ取得関数は `useCallback` でメモ化すること（依存配列: `[userId, options.page, options.perPage]`）

---

### 6.16 useUserCreateForm

**ファイルパス**: `src/features/users/hooks/useUserCreateForm.ts`

**目的**: ユーザー作成フォームの状態とバリデーションを管理する

**必要な機能**:
- 状態管理:
  - `formData`: `{ username, password, confirmPassword, firstName, lastName, role }`
  - `errors`: 各フィールドのエラーメッセージ
- バリデーション:
  - ユーザー名: 必須、3文字以上
  - パスワード: 必須、6文字以上
  - パスワード確認: パスワードと一致
  - 名・姓: 必須
- 返り値:
  - `formData`, `errors`, `handleChange`, `validate`, `reset`

**実装のヒント**:
- Server Actionsは呼び出さない（フォーム管理のみ）
- バリデーションロジックを `validate` 関数に実装

---

### 6.17 useUserEditForm

**ファイルパス**: `src/features/users/hooks/useUserEditForm.ts`

**目的**: ユーザー編集フォームの状態とバリデーションを管理する

**必要な機能**:
- パラメータ: `user: User | null`
- 状態管理:
  - `formData`: `{ firstName, lastName, role }`
  - `errors`: 各フィールドのエラーメッセージ
- useEffectでユーザー情報をフォームに反映
- バリデーション:
  - 名・姓: 必須
- 返り値:
  - `formData`, `errors`, `handleChange`, `validate`, `reset`

---

### 6.18 useRegisterForm

**ファイルパス**: `src/features/auth/hooks/useRegisterForm.ts`

**目的**: ユーザー登録フォームの状態とバリデーションを管理する

**必要な機能**:
- 状態管理:
  - `formData`: `{ username, password, confirmPassword, firstName, lastName }`
  - `errors`: 各フィールドのエラーメッセージ
- バリデーション:
  - ユーザー名: 必須、3文字以上
  - パスワード: 必須、6文字以上
  - パスワード確認: パスワードと一致
  - 名・姓: 必須
- 返り値:
  - `formData`, `errors`, `handleChange`, `validate`, `reset`

**実装のヒント**:
- `useUserCreateForm` と似た構造だが、`role` フィールドは不要
- 一般ユーザー登録用のため、ロールは自動的に `4` (USER) になる

---

## 7. ページコンポーネントでの使用例

### 7.1 Todo 一覧ページ（完全版）

```typescript
// src/features/todos/TodoListPage.tsx
'use client'

import { useState } from 'react'
import { useTodos } from './hooks/useTodos'
import { useCreateTodo } from './hooks/useCreateTodo'
import { useDeleteTodo } from './hooks/useDeleteTodo'
import { useUpdateTodo } from './hooks/useUpdateTodo'
import { TodoCreateForm } from './components/TodoCreateForm'
import { TodoFilter } from './components/TodoFilter'
import { TodoSort } from './components/TodoSort'
import { TodoList } from './components/TodoList'
import { TodoPagination } from './components/TodoPagination'

export function TodoListPage() {
  const [page, setPage] = useState(1)
  const [completedFilter, setCompletedFilter] = useState<'all' | 'completed' | 'incomplete'>('all')
  const [sortBy, setSortBy] = useState<'createdAt' | 'updatedAt' | 'title'>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  
  const { todos, totalPages, isLoading, refetch } = useTodos({
    page,
    completedFilter,
    sortBy,
    sortOrder,
  })
  
  const { createTodo, isCreating } = useCreateTodo()
  const { deleteTodo } = useDeleteTodo()
  const { updateTodo } = useUpdateTodo()
  
  const handleCreateTodo = async (title: string, descriptions?: string) => {
    await createTodo(title, descriptions)
    await refetch()
  }
  
  const handleDeleteTodo = async (id: string) => {
    await deleteTodo(id)
    await refetch()
  }
  
  const handleToggleComplete = async (id: string, completed: boolean) => {
    await updateTodo(id, { completed })
    await refetch()
  }
  
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Todo 一覧</h1>
      
      <TodoCreateForm onCreateTodo={handleCreateTodo} isLoading={isCreating} />
      
      <div className="flex gap-4 my-6">
        <TodoFilter value={completedFilter} onChange={setCompletedFilter} />
        <TodoSort
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortByChange={setSortBy}
          onSortOrderChange={setSortOrder}
        />
      </div>
      
      <TodoList
        todos={todos}
        onDelete={handleDeleteTodo}
        onToggleComplete={handleToggleComplete}
        isLoading={isLoading}
      />
      
      <TodoPagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  )
}
```

---

### 7.2 ユーザー一覧ページ（完全版）

```typescript
// src/features/users/UserListPage.tsx
'use client'

import { useState } from 'react'
import { useUsers } from './hooks/useUsers'
import { useCreateUser } from './hooks/useCreateUser'
import { useDeleteUser } from './hooks/useDeleteUser'
import { UserCreateForm } from './components/UserCreateForm'
import { UserFilter } from './components/UserFilter'
import { UserSort } from './components/UserSort'
import { UserList } from './components/UserList'
import { UserPagination } from './components/UserPagination'

export function UserListPage() {
  const [page, setPage] = useState(1)
  const [roleFilter, setRoleFilter] = useState<number | undefined>(undefined)
  const [sortBy, setSortBy] = useState<'createdAt' | 'username' | 'firstName' | 'lastName' | 'role'>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [searchUsername, setSearchUsername] = useState('')
  
  const { users, totalPages, isLoading, refetch } = useUsers({
    page,
    role: roleFilter,
    sortBy,
    sortOrder,
    username: searchUsername,
  })
  
  const { createUser, isCreating } = useCreateUser()
  const { deleteUser } = useDeleteUser()
  
  const handleCreateUser = async (formData: {
    username: string
    password: string
    firstName?: string
    lastName?: string
    role: number
  }) => {
    await createUser(formData)
    await refetch()
  }
  
  const handleDeleteUser = async (id: string) => {
    await deleteUser(id)
    await refetch()
  }
  
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">ユーザー管理</h1>
      
      <UserCreateForm onCreateUser={handleCreateUser} isLoading={isCreating} />
      
      <div className="flex gap-4 my-6">
        <UserFilter value={roleFilter} onChange={setRoleFilter} />
        <UserSort
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortByChange={setSortBy}
          onSortOrderChange={setSortOrder}
        />
        <input
          type="text"
          placeholder="ユーザー名で検索..."
          value={searchUsername}
          onChange={(e) => setSearchUsername(e.target.value)}
          className="border rounded px-4 py-2"
        />
      </div>
      
      <UserList
        users={users}
        onDelete={handleDeleteUser}
        isLoading={isLoading}
      />
      
      <UserPagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  )
}
```

---

### 7.3 ユーザー詳細ページ（完全版）

```typescript
// src/features/users/UserDetailPage.tsx
'use client'

import { useState } from 'react'
import { useUserDetail } from './hooks/useUserDetail'
import { useUpdateUser } from './hooks/useUpdateUser'
import { useUserTodoList } from './hooks/useUserTodoList'
import { UserInfo } from './components/UserInfo'
import { UserEditForm } from './components/UserEditForm'
import { TodoList } from '../todos/components/TodoList'

interface UserDetailPageProps {
  userId: string
}

export function UserDetailPage({ userId }: UserDetailPageProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [todoPage, setTodoPage] = useState(1)
  
  const { user, isLoading: isLoadingUser, refetch } = useUserDetail(userId)
  const { updateUser, isUpdating } = useUpdateUser()
  const { 
    todos, 
    totalPages: todoTotalPages, 
    isLoading: isLoadingTodos 
  } = useUserTodoList({ 
    userId, 
    page: todoPage,
    perPage: 10 
  })
  
  const handleUpdateUser = async (updates: {
    firstName?: string
    lastName?: string
    role?: number
  }) => {
    await updateUser(userId, updates)
    await refetch()
    setIsEditing(false)
  }
  
  if (isLoadingUser) {
    return <div>読み込み中...</div>
  }
  
  if (!user) {
    return <div>ユーザーが見つかりません</div>
  }
  
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">ユーザー詳細</h1>
      
      {isEditing ? (
        <UserEditForm
          user={user}
          onUpdate={handleUpdateUser}
          onCancel={() => setIsEditing(false)}
          isLoading={isUpdating}
        />
      ) : (
        <UserInfo
          user={user}
          onEdit={() => setIsEditing(true)}
        />
      )}
      
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">ユーザーのTodo一覧</h2>
        <TodoList
          todos={todos}
          isLoading={isLoadingTodos}
          readOnly={true}
        />
        
        {todoTotalPages > 1 && (
          <div className="mt-4">
            <button
              onClick={() => setTodoPage(prev => Math.max(1, prev - 1))}
              disabled={todoPage === 1}
              className="px-4 py-2 border rounded mr-2"
            >
              前へ
            </button>
            <span className="mx-4">
              {todoPage} / {todoTotalPages}
            </span>
            <button
              onClick={() => setTodoPage(prev => Math.min(todoTotalPages, prev + 1))}
              disabled={todoPage === todoTotalPages}
              className="px-4 py-2 border rounded ml-2"
            >
              次へ
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
```

---

## 8. Server Actionsを使用する際の重要な注意事項

### 8.1 必須ルール

#### ✅ やるべきこと

1. **Server Actionsの使用**
   ```typescript
   // ✅ 正しい: Server Actionを使用
   import { getTodoList } from '@/lib/api'
   const result = await getTodoList()
   ```

2. **'use client' ディレクティブの追加**
   ```typescript
   // ✅ カスタムフックの先頭に追加
   'use client'
   
   import { useState } from 'react'
   // ...
   ```

3. **エラーハンドリング**
   ```typescript
   // ✅ Server Actionの返り値をチェック
   const result = await getTodoList()
   if (!result.success) {
     throw new Error(result.error || 'Failed to fetch')
   }
   ```

#### ❌ やってはいけないこと

1. **fetch()の直接使用**
   ```typescript
   // ❌ 間違い: fetch()を直接使用
   const response = await fetch('/api/todos')
   ```

2. **Server Actionsを呼び出さない**
   ```typescript
   // ❌ 間違い: APIエンドポイントを直接呼び出し
   const response = await fetch(`${API_URL}/api/todos`)
   ```

### 8.2 Server Actionsの命名規則

`src/lib/api.ts` に定義されているServer Actions:

| Server Action | 用途 | 返り値 |
|---|---|---|
| `getUserInfo()` | ユーザー情報取得 | `{ success, data?, error? }` |
| `getTodoStats()` | Todo統計取得 | `{ success, data?, error? }` |
| `getUserTodos()` | ユーザーのTodo一覧 | `{ success, data?, error? }` |
| `updateProfile()` | プロフィール更新 | `{ success, error? }` |
| `changePassword()` | パスワード変更 | `{ success, error? }` |
| `logout()` | ログアウト | リダイレクト |
| `login()` | ログイン | `{ success, error? }` |
| `register()` | ユーザー登録 | `{ success, error? }` |
| `getTodoList()` | Todo一覧取得 | `{ success, data?, error? }` |
| `getTodoDetail()` | Todo詳細取得 | `{ success, data?, error? }` |
| `createTodo()` | Todo作成 | `{ success, data?, error? }` |
| `updateTodo()` | Todo更新 | `{ success, data?, error? }` |
| `deleteTodo()` | Todo削除 | `{ success, error? }` |
| `getUserList()` | ユーザー一覧取得 | `{ success, data?, error? }` |
| `getUserDetail()` | ユーザー詳細取得 | `{ success, data?, error? }` |
| `getUserTodoList()` | ユーザーのTodo一覧 | `{ success, data?, error? }` |
| `createUser()` | ユーザー作成 | `{ success, data?, error? }` |
| `updateUser()` | ユーザー更新 | `{ success, error? }` |
| `deleteUser()` | ユーザー削除 | `{ success, error? }` |

### 8.3 返り値の型定義

すべてのServer Actionsは以下の形式で返り値を返します:

```typescript
// 成功時
{
  success: true,
  data: T  // データ型は操作によって異なる
}

// 失敗時
{
  success: false,
  error: string  // エラーメッセージ
}
```

### 8.4 カスタムフック実装のテンプレート

**🚨 重要**: データ取得関数は必ず `useCallback` でメモ化してください。

```typescript
'use client'

import { useState, useEffect, useCallback } from 'react'
import { getServerAction } from '@/lib/api'
import type { DataType } from '@/types'

export function useCustomHook(param?: string) {
  const [data, setData] = useState<DataType | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')
  
  // ✅ useCallbackでメモ化（依存配列にparamを含める）
  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError('')
    
    try {
      // Server Actionを呼び出し
      const result = await getServerAction(param)
      
      // 返り値のチェック
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch data')
      }
      
      setData(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [param])
  // ☝️ paramが変更されたときのみfetchDataが再作成される
  
  useEffect(() => {
    fetchData()
  }, [fetchData])
  // ☝️ fetchDataはuseCallbackでメモ化されているため安全
  
  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  }
}
```

**依存配列の決め方**:
- `useCallback` の依存配列: データ取得に必要な外部の値をすべて含める（`param`, `options.page`, `id` など）
- `useEffect` の依存配列: メモ化された関数 (`fetchData`) のみを含める

---

## 9. 実装チェックリスト

### 9.1 認証関連カスタムフック
- [ ] useAuth の実装（getUserInfo, logout を使用）
- [ ] useLogin の実装（login を使用）
- [ ] useRegister の実装（register を使用）
- [ ] useLoginForm の実装（フォーム状態管理のみ）
- [ ] useRegisterForm の実装（フォーム状態管理のみ）

### 9.2 Todo 関連カスタムフック
- [ ] useTodos の実装（getTodoList を使用）
- [ ] useTodoDetail の実装（getTodoDetail を使用）
- [ ] useCreateTodo の実装（createTodo を使用）
- [ ] useUpdateTodo の実装（updateTodo を使用）
- [ ] useDeleteTodo の実装（deleteTodo を使用）

### 9.3 プロフィール関連カスタムフック
- [ ] useProfile の実装（getUserInfo, updateProfile を使用）
- [ ] usePasswordChange の実装（changePassword を使用）
- [ ] useTodoStats の実装（getTodoStats を使用）
- [ ] useUserTodos の実装（getUserTodos を使用）

### 9.4 ユーザー管理関連カスタムフック（ADMIN・MANAGER専用）
- [ ] useUsers の実装（getUserList を使用）
- [ ] useUserDetail の実装（getUserDetail を使用）
- [ ] useCreateUser の実装（createUser を使用）
- [ ] useUpdateUser の実装（updateUser を使用）
- [ ] useDeleteUser の実装（deleteUser を使用）
- [ ] useUserTodoList の実装（getUserTodoList を使用）
- [ ] useUserCreateForm の実装（フォーム状態管理のみ）
- [ ] useUserEditForm の実装（フォーム状態管理のみ）

### 9.5 Server Actions使用の確認
- [ ] すべてのカスタムフックで Server Actions を使用している
- [ ] fetch() を直接使用していない
- [ ] Server Actions の返り値を適切にチェックしている
- [ ] エラーハンドリングが統一されている
- [ ] **データ取得関数を useCallback でメモ化している**
- [ ] **useCallback の依存配列が正しく設定されている**

### 9.6 リファクタリング
- [ ] ページコンポーネントからロジックをカスタムフックに移行
- [ ] コンポーネントが UI に集中できるようになっている
- [ ] カスタムフックの命名規則が統一されている
- [ ] カスタムフックが適切に再利用可能な設計になっている
- [ ] すべてのカスタムフックに 'use client' ディレクティブが付いている

---

## 10. 動作確認項目

### 10.1 機能確認
- [ ] すべての機能が正常に動作する
- [ ] カスタムフックが適切にデータを返す
- [ ] エラーハンドリングが適切に動作する
- [ ] ローディング状態が適切に管理されている
- [ ] Server Actions が正しく呼び出されている

### 10.2 コード品質
- [ ] ロジックが UI から分離されている
- [ ] カスタムフックが再利用可能
- [ ] コンポーネントが簡潔で読みやすい
- [ ] 型定義が明確
- [ ] fetch() を直接使用していない
- [ ] すべてのカスタムフックに 'use client' ディレクティブがある

---

## 11. 完成後の確認事項

Step 5 完了後、以下を確認してください。

- [ ] すべてのビジネスロジックがカスタムフックに分離されている
- [ ] ページコンポーネントが UI の描画に集中できている
- [ ] カスタムフックが適切に再利用可能な設計になっている
- [ ] すべての機能が正常に動作する
- [ ] エラーハンドリングとローディング状態が適切に管理されている
- [ ] **すべてのAPI呼び出しが Server Actions を使用している**
- [ ] **fetch() を直接使用していない**
- [ ] **すべてのカスタムフックに 'use client' ディレクティブが付いている**

---

## 12. 学習の振り返り

### 12.1 Step 1〜5 で学んだこと

1. **Step 1**: クライアントコンポーネントでの基本的な API 連携
2. **Step 2**: サーバーコンポーネントとクライアントコンポーネントの使い分け
3. **Step 3**: UI ライブラリを活用したモダンな UI 構築
4. **Step 4**: コンポーネント分割による設計改善
5. **Step 5**: 
   - カスタムフックによるロジックの分離
   - **Server Actionsを使用したAPI呼び出しパターンの習得**
   - **UIとビジネスロジックの完全な分離**

### 12.2 Server Actionsを使用するメリット

このステップで習得したServer Actionsを使用したカスタムフックパターンには、以下のメリットがあります:

1. **型安全性の向上**: TypeScriptの型推論がフルに活用できる
2. **認証処理の簡素化**: Cookieの自動送信により認証処理が簡潔に
3. **エラーハンドリングの統一**: Server Actions側で一貫したエラー処理
4. **保守性の向上**: API呼び出しロジックが一箇所に集約
5. **テストの容易性**: モックやスタブが簡単に作成可能

### 12.3 今後の発展

- **テストの追加**: カスタムフックや コンポーネントのユニットテスト
- **状態管理ライブラリの導入**: Zustand, Jotai, Recoil など
- **パフォーマンス最適化**: React.memo, useMemo, useCallback の活用
- **エラーバウンダリの実装**: より堅牢なエラーハンドリング

---

**Document Version**: 1.0.0  
**Last Updated**: 2025-10-24  
**Congratulations!** これで Todo アプリの基本設計が完成しました!

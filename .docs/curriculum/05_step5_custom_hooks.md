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

**基本構造**:
```typescript
import { useState, useEffect } from 'react'

function useCustomHook() {
  const [state, setState] = useState()
  
  useEffect(() => {
    // 副作用処理
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
└── profile/
    ├── components/
    │   ├── ProfileInfo.tsx
    │   └── ...
    ├── hooks/                    # プロフィール関連のカスタムフック
    │   ├── useProfile.ts         # プロフィール取得・更新
    │   ├── usePasswordChange.ts  # パスワード変更
    │   ├── useTodoStats.ts       # Todo 統計取得
    │   └── useUserTodos.ts       # ユーザーの Todo 一覧
    └── ProfilePage.tsx
```

---

## 4. カスタムフック設計パターン

### 4.1 データフェッチ用カスタムフック

**パターン**: API からのデータ取得と状態管理

```typescript
// src/features/todos/hooks/useTodos.ts
import { useState, useEffect } from 'react'
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
  
  const fetchTodos = async () => {
    setIsLoading(true)
    setError('')
    
    try {
      const params = new URLSearchParams()
      if (options.page) params.set('page', options.page.toString())
      if (options.perPage) params.set('perPage', options.perPage.toString())
      if (options.completedFilter) params.set('completedFilter', options.completedFilter)
      if (options.sortBy) params.set('sortBy', options.sortBy)
      if (options.sortOrder) params.set('sortOrder', options.sortOrder)
      
      const response = await fetch(`/api/todos?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch todos')
      }
      
      const result = await response.json()
      setTodos(result.data.data)
      setTotal(result.data.total)
      setTotalPages(result.data.totalPages)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }
  
  useEffect(() => {
    fetchTodos()
  }, [options.page, options.completedFilter, options.sortBy, options.sortOrder])
  
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

**パターン**: データの作成・更新・削除と状態管理

```typescript
// src/features/todos/hooks/useCreateTodo.ts
import { useState } from 'react'
import type { Todo } from '@/types'

export function useCreateTodo() {
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string>('')
  
  const createTodo = async (title: string, descriptions?: string) => {
    setIsCreating(true)
    setError('')
    
    try {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, descriptions }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to create todo')
      }
      
      const result = await response.json()
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
    createTodo,
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

```typescript
// src/features/auth/hooks/useLoginForm.ts
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

**パターン**: グローバルな認証状態の管理

```typescript
// src/features/auth/hooks/useAuth.ts
import { useState, useEffect } from 'react'
import type { User } from '@/types'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    // 初回レンダリング時に認証状態を確認
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/users/me')
        
        if (response.ok) {
          const result = await response.json()
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
  
  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
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

## 6. カスタムフック実装例

### 6.1 useTodoDetail

```typescript
// src/features/todos/hooks/useTodoDetail.ts
import { useState, useEffect } from 'react'
import type { Todo } from '@/types'

export function useTodoDetail(id: string) {
  const [todo, setTodo] = useState<Todo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')
  
  const fetchTodo = async () => {
    setIsLoading(true)
    setError('')
    
    try {
      const response = await fetch(`/api/todos/${id}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch todo')
      }
      
      const result = await response.json()
      setTodo(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }
  
  useEffect(() => {
    if (id) {
      fetchTodo()
    }
  }, [id])
  
  return {
    todo,
    isLoading,
    error,
    refetch: fetchTodo,
  }
}
```

---

### 6.2 useUpdateTodo

```typescript
// src/features/todos/hooks/useUpdateTodo.ts
import { useState } from 'react'
import type { Todo } from '@/types'

export function useUpdateTodo() {
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string>('')
  
  const updateTodo = async (id: string, updates: Partial<Todo>) => {
    setIsUpdating(true)
    setError('')
    
    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to update todo')
      }
      
      const result = await response.json()
      return result.data as Todo
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setIsUpdating(false)
    }
  }
  
  return {
    updateTodo,
    isUpdating,
    error,
  }
}
```

---

### 6.3 useProfile

```typescript
// src/features/profile/hooks/useProfile.ts
import { useState, useEffect } from 'react'
import type { User } from '@/types'

export function useProfile() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')
  
  const fetchProfile = async () => {
    setIsLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/users/me')
      
      if (!response.ok) {
        throw new Error('Failed to fetch profile')
      }
      
      const result = await response.json()
      setUser(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }
  
  const updateProfile = async (updates: Partial<User>) => {
    setError('')
    
    try {
      const response = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to update profile')
      }
      
      const result = await response.json()
      setUser(result.data)
      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      throw err
    }
  }
  
  useEffect(() => {
    fetchProfile()
  }, [])
  
  return {
    user,
    updateProfile,
    isLoading,
    error,
    refetch: fetchProfile,
  }
}
```

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

## 8. 実装チェックリスト

### 8.1 認証関連カスタムフック
- [ ] useAuth の実装
- [ ] useLogin の実装
- [ ] useRegister の実装
- [ ] useLoginForm の実装
- [ ] useRegisterForm の実装

### 8.2 Todo 関連カスタムフック
- [ ] useTodos の実装
- [ ] useTodoDetail の実装
- [ ] useCreateTodo の実装
- [ ] useUpdateTodo の実装
- [ ] useDeleteTodo の実装

### 8.3 プロフィール関連カスタムフック
- [ ] useProfile の実装
- [ ] usePasswordChange の実装
- [ ] useTodoStats の実装
- [ ] useUserTodos の実装

### 8.4 リファクタリング
- [ ] ページコンポーネントからロジックをカスタムフックに移行
- [ ] コンポーネントが UI に集中できるようになっている
- [ ] カスタムフックの命名規則が統一されている
- [ ] カスタムフックが適切に再利用可能な設計になっている

---

## 9. 動作確認項目

### 9.1 機能確認
- [ ] すべての機能が正常に動作する
- [ ] カスタムフックが適切にデータを返す
- [ ] エラーハンドリングが適切に動作する
- [ ] ローディング状態が適切に管理されている

### 9.2 コード品質
- [ ] ロジックが UI から分離されている
- [ ] カスタムフックが再利用可能
- [ ] コンポーネントが簡潔で読みやすい
- [ ] 型定義が明確

---

## 10. 完成後の確認事項

Step 5 完了後、以下を確認してください。

- [ ] すべてのビジネスロジックがカスタムフックに分離されている
- [ ] ページコンポーネントが UI の描画に集中できている
- [ ] カスタムフックが適切に再利用可能な設計になっている
- [ ] すべての機能が正常に動作する
- [ ] エラーハンドリングとローディング状態が適切に管理されている

---

## 11. 学習の振り返り

### 11.1 Step 1〜5 で学んだこと

1. **Step 1**: クライアントコンポーネントでの基本的な API 連携
2. **Step 2**: サーバーコンポーネントとクライアントコンポーネントの使い分け
3. **Step 3**: UI ライブラリを活用したモダンな UI 構築
4. **Step 4**: コンポーネント分割による設計改善
5. **Step 5**: カスタムフックによるロジックの分離

### 11.2 今後の発展

- **テストの追加**: カスタムフックや コンポーネントのユニットテスト
- **状態管理ライブラリの導入**: Zustand, Jotai, Recoil など
- **パフォーマンス最適化**: React.memo, useMemo, useCallback の活用
- **エラーバウンダリの実装**: より堅牢なエラーハンドリング

---

**Document Version**: 1.0.0  
**Last Updated**: 2025-10-24  
**Congratulations!** これで Todo アプリの基本設計が完成しました!

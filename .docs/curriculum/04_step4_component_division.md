# Step 4: UIコンポーネントの分割

## 1. Step 4 の概要

### 1.1 目的
- コンポーネント設計の基礎を学ぶ
- 適切な粒度でのコンポーネント分割を習得する
- 再利用可能なコンポーネントの設計方法を理解する
- Props による親子コンポーネント間のデータ受け渡しを学ぶ

### 1.2 変更方針
Step 1〜3 で 1 ファイルに実装していたコンポーネントを、適切な粒度に分割します。

**分割の基準**:
- 単一責任の原則（1 つのコンポーネントは 1 つの責務を持つ）
- 再利用可能性（複数箇所で使われる可能性がある部分）
- 可読性とメンテナンス性（ファイルサイズが大きすぎる場合）

### 1.3 制約条件
- **カスタムフックの作成は行わない**（Step 5 で実施）
- **ロジックの分離は最小限に**（状態管理は主にページコンポーネントに残す）

---

## 2. コンポーネント分割の基本原則

### 2.1 単一責任の原則（Single Responsibility Principle）

1 つのコンポーネントは 1 つの明確な責務を持つべきです。

**悪い例**:
```typescript
// 1つのコンポーネントで Todo の表示、編集、削除を全て担当
function TodoItem() {
  // 表示、編集、削除のロジックが混在
}
```

**良い例**:
```typescript
// 表示専用
function TodoDisplay({ todo }: { todo: Todo }) { }

// 編集専用
function TodoEditForm({ todo, onSave }: { todo: Todo, onSave: (todo: Todo) => void }) { }

// 削除ボタン
function TodoDeleteButton({ onDelete }: { onDelete: () => void }) { }
```

---

### 2.2 Props による親子コンポーネント間のデータフロー

**親コンポーネント**: 状態を管理し、子コンポーネントにデータと関数を渡す

**子コンポーネント**: Props で受け取ったデータを表示し、イベントを親に通知する

```typescript
// 親コンポーネント
function TodoListPage() {
  const [todos, setTodos] = useState<Todo[]>([])
  
  const handleDelete = (id: string) => {
    // 削除処理
  }
  
  return (
    <div>
      {todos.map(todo => (
        <TodoItem key={todo.id} todo={todo} onDelete={handleDelete} />
      ))}
    </div>
  )
}

// 子コンポーネント
function TodoItem({ todo, onDelete }: { todo: Todo, onDelete: (id: string) => void }) {
  return (
    <div>
      <span>{todo.title}</span>
      <button onClick={() => onDelete(todo.id)}>削除</button>
    </div>
  )
}
```

---

### 2.3 再利用可能性の考慮

複数の場所で使われる可能性のある UI は、独立したコンポーネントとして切り出します。

**例**:
- フォーム入力フィールド
- ボタン（特定のアクション用）
- カード
- モーダル

---

## 3. ディレクトリ構成

### 3.1 推奨ディレクトリ構成

```
src/features/
├── auth/
│   ├── components/              # 認証関連の UI コンポーネント
│   │   ├── LoginForm.tsx        # ログインフォーム
│   │   └── RegisterForm.tsx     # 登録フォーム
│   ├── LoginPage.tsx            # ログインページ（親コンポーネント）
│   └── RegisterPage.tsx         # 登録ページ（親コンポーネント）
├── todos/
│   ├── components/
│   │   ├── TodoItem.tsx         # Todo アイテム表示
│   │   ├── TodoList.tsx         # Todo リスト
│   │   ├── TodoCreateForm.tsx   # Todo 作成フォーム
│   │   ├── TodoEditForm.tsx     # Todo 編集フォーム
│   │   ├── TodoFilter.tsx       # フィルタリング UI
│   │   ├── TodoSort.tsx         # ソート UI
│   │   └── TodoPagination.tsx   # ページネーション UI
│   ├── TodoListPage.tsx         # Todo 一覧ページ（親コンポーネント）
│   └── TodoDetailPage.tsx       # Todo 詳細ページ（親コンポーネント）
└── profile/
    ├── components/
    │   ├── ProfileInfo.tsx      # プロフィール情報表示
    │   ├── ProfileEditForm.tsx  # プロフィール編集フォーム
    │   ├── PasswordChangeForm.tsx # パスワード変更フォーム
    │   ├── TodoStats.tsx        # Todo 統計表示
    │   └── UserTodoList.tsx     # ユーザーの Todo 一覧
    └── ProfilePage.tsx          # プロフィールページ（親コンポーネント）
```

---

## 4. ページ別コンポーネント分割ガイド

### 4.1 ログインページ

#### 分割前
```typescript
// src/features/auth/LoginPage.tsx（1ファイル）
'use client'

export function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  const handleSubmit = async (e: React.FormEvent) => {
    // ログイン処理
  }
  
  return (
    <div>
      <h1>ログイン</h1>
      <form onSubmit={handleSubmit}>
        <Input value={username} onChange={(e) => setUsername(e.target.value)} />
        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <Button type="submit" isLoading={isLoading}>ログイン</Button>
        {error && <p>{error}</p>}
      </form>
    </div>
  )
}
```

#### 分割後

**親コンポーネント（ページ）**:
```typescript
// src/features/auth/LoginPage.tsx
'use client'

import { LoginForm } from './components/LoginForm'

export function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full">
        <h1 className="text-3xl font-bold text-center mb-8">ログイン</h1>
        <LoginForm />
      </div>
    </div>
  )
}
```

**子コンポーネント（フォーム）**:
```typescript
// src/features/auth/components/LoginForm.tsx
'use client'

import { useState } from 'react'
import { Input, Button, Card, CardBody } from '@heroui/react'
import { useRouter } from 'next/navigation'

export function LoginForm() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'ログインに失敗しました')
      }
      
      router.push('/todos')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <Card>
      <CardBody>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="ユーザー名"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            isRequired
          />
          <Input
            label="パスワード"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            isRequired
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Button
            type="submit"
            color="primary"
            className="w-full"
            isLoading={isLoading}
          >
            ログイン
          </Button>
        </form>
      </CardBody>
    </Card>
  )
}
```

---

### 4.2 Todo 一覧ページ

#### 分割する子コンポーネント

1. **TodoCreateForm**: Todo 作成フォーム
2. **TodoFilter**: フィルタリング UI（全て/完了済み/未完了）
3. **TodoSort**: ソート UI（作成日時/更新日時/タイトル）
4. **TodoList**: Todo リスト全体
5. **TodoItem**: 個別の Todo アイテム
6. **TodoPagination**: ページネーション

#### 親コンポーネント（ページ）

```typescript
// src/features/todos/TodoListPage.tsx
'use client'

import { useState, useEffect } from 'react'
import { TodoCreateForm } from './components/TodoCreateForm'
import { TodoFilter } from './components/TodoFilter'
import { TodoSort } from './components/TodoSort'
import { TodoList } from './components/TodoList'
import { TodoPagination } from './components/TodoPagination'
import type { Todo } from '@/types'

interface Props {
  initialData?: {
    data: Todo[]
    total: number
    page: number
    perPage: number
    totalPages: number
  }
}

export function TodoListPage({ initialData }: Props) {
  const [todos, setTodos] = useState<Todo[]>(initialData?.data || [])
  const [page, setPage] = useState(initialData?.page || 1)
  const [totalPages, setTotalPages] = useState(initialData?.totalPages || 1)
  const [completedFilter, setCompletedFilter] = useState<'all' | 'completed' | 'incomplete'>('all')
  const [sortBy, setSortBy] = useState<'createdAt' | 'updatedAt' | 'title'>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [isLoading, setIsLoading] = useState(false)
  
  // データ取得処理
  const fetchTodos = async () => {
    // ...
  }
  
  // Todo 作成処理
  const handleCreateTodo = async (title: string, descriptions?: string) => {
    // ...
  }
  
  // Todo 削除処理
  const handleDeleteTodo = async (id: string) => {
    // ...
  }
  
  // Todo 完了切り替え処理
  const handleToggleComplete = async (id: string, completed: boolean) => {
    // ...
  }
  
  useEffect(() => {
    fetchTodos()
  }, [page, completedFilter, sortBy, sortOrder])
  
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Todo 一覧</h1>
      
      <TodoCreateForm onCreateTodo={handleCreateTodo} />
      
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

#### 子コンポーネント例

**TodoItem.tsx**:
```typescript
// src/features/todos/components/TodoItem.tsx
'use client'

import { Card, CardBody, Checkbox, Button } from '@heroui/react'
import Link from 'next/link'
import type { Todo } from '@/types'

interface Props {
  todo: Todo
  onDelete: (id: string) => void
  onToggleComplete: (id: string, completed: boolean) => void
}

export function TodoItem({ todo, onDelete, onToggleComplete }: Props) {
  return (
    <Card>
      <CardBody className="flex flex-row items-center justify-between">
        <Checkbox
          isSelected={todo.completed}
          onValueChange={(checked) => onToggleComplete(todo.id, checked)}
        >
          <Link href={`/todos/${todo.id}`}>
            <span className={todo.completed ? 'line-through text-gray-500' : ''}>
              {todo.title}
            </span>
          </Link>
        </Checkbox>
        
        <Button
          color="danger"
          size="sm"
          onPress={() => onDelete(todo.id)}
        >
          削除
        </Button>
      </CardBody>
    </Card>
  )
}
```

**TodoList.tsx**:
```typescript
// src/features/todos/components/TodoList.tsx
'use client'

import { TodoItem } from './TodoItem'
import type { Todo } from '@/types'

interface Props {
  todos: Todo[]
  onDelete: (id: string) => void
  onToggleComplete: (id: string, completed: boolean) => void
  isLoading: boolean
}

export function TodoList({ todos, onDelete, onToggleComplete, isLoading }: Props) {
  if (isLoading) {
    return <div className="text-center py-8">読み込み中...</div>
  }
  
  if (todos.length === 0) {
    return <div className="text-center py-8 text-gray-500">Todo がありません</div>
  }
  
  return (
    <div className="space-y-4">
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onDelete={onDelete}
          onToggleComplete={onToggleComplete}
        />
      ))}
    </div>
  )
}
```

**TodoFilter.tsx**:
```typescript
// src/features/todos/components/TodoFilter.tsx
'use client'

import { Select, SelectItem } from '@heroui/react'

interface Props {
  value: 'all' | 'completed' | 'incomplete'
  onChange: (value: 'all' | 'completed' | 'incomplete') => void
}

export function TodoFilter({ value, onChange }: Props) {
  return (
    <Select
      label="フィルター"
      selectedKeys={[value]}
      onChange={(e) => onChange(e.target.value as 'all' | 'completed' | 'incomplete')}
      className="max-w-xs"
    >
      <SelectItem key="all" value="all">すべて</SelectItem>
      <SelectItem key="completed" value="completed">完了済み</SelectItem>
      <SelectItem key="incomplete" value="incomplete">未完了</SelectItem>
    </Select>
  )
}
```

---

### 4.3 Todo 詳細ページ

#### 分割する子コンポーネント

1. **TodoDisplay**: Todo 情報の表示
2. **TodoEditForm**: Todo 編集フォーム

#### 親コンポーネント（ページ）

```typescript
// src/features/todos/TodoDetailPage.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@heroui/react'
import { TodoDisplay } from './components/TodoDisplay'
import { TodoEditForm } from './components/TodoEditForm'
import type { Todo } from '@/types'

interface Props {
  initialTodo: Todo
}

export function TodoDetailPage({ initialTodo }: Props) {
  const router = useRouter()
  const [todo, setTodo] = useState<Todo>(initialTodo)
  const [isEditing, setIsEditing] = useState(false)
  
  const handleSave = async (updatedTodo: Partial<Todo>) => {
    // 保存処理
  }
  
  const handleDelete = async () => {
    // 削除処理
  }
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-3xl font-bold">Todo 詳細</h1>
        <Button onPress={() => router.back()}>戻る</Button>
      </div>
      
      {isEditing ? (
        <TodoEditForm
          todo={todo}
          onSave={handleSave}
          onCancel={() => setIsEditing(false)}
        />
      ) : (
        <TodoDisplay
          todo={todo}
          onEdit={() => setIsEditing(true)}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}
```

---

### 4.4 プロフィールページ

#### 分割する子コンポーネント

1. **ProfileInfo**: プロフィール情報表示
2. **ProfileEditForm**: プロフィール編集フォーム
3. **PasswordChangeForm**: パスワード変更フォーム
4. **TodoStats**: Todo 統計表示
5. **UserTodoList**: ユーザーの Todo 一覧（簡易版）

#### 親コンポーネント（ページ）

```typescript
// src/features/profile/ProfilePage.tsx
'use client'

import { useState } from 'react'
import { ProfileInfo } from './components/ProfileInfo'
import { ProfileEditForm } from './components/ProfileEditForm'
import { PasswordChangeForm } from './components/PasswordChangeForm'
import { TodoStats } from './components/TodoStats'
import { UserTodoList } from './components/UserTodoList'
import type { User, Todo, TodoStats as TodoStatsType } from '@/types'

interface Props {
  initialUser: User
  initialStats: TodoStatsType
  initialTodos: Todo[]
}

export function ProfilePage({ initialUser, initialStats, initialTodos }: Props) {
  const [user, setUser] = useState<User>(initialUser)
  const [stats, setStats] = useState<TodoStatsType>(initialStats)
  const [todos, setTodos] = useState<Todo[]>(initialTodos)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  
  const handleUpdateProfile = async (updatedUser: Partial<User>) => {
    // プロフィール更新処理
  }
  
  const handleChangePassword = async (currentPassword: string, newPassword: string) => {
    // パスワード変更処理
  }
  
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">プロフィール</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          {isEditingProfile ? (
            <ProfileEditForm
              user={user}
              onSave={handleUpdateProfile}
              onCancel={() => setIsEditingProfile(false)}
            />
          ) : (
            <ProfileInfo
              user={user}
              onEdit={() => setIsEditingProfile(true)}
            />
          )}
          
          <PasswordChangeForm onChangePassword={handleChangePassword} />
        </div>
        
        <div className="space-y-6">
          <TodoStats stats={stats} />
          <UserTodoList todos={todos} />
        </div>
      </div>
    </div>
  )
}
```

---

## 5. コンポーネント設計のベストプラクティス

### 5.1 Props の型定義

```typescript
// Props インターフェースを明示的に定義
interface TodoItemProps {
  todo: Todo
  onDelete: (id: string) => void
  onToggleComplete: (id: string, completed: boolean) => void
}

export function TodoItem({ todo, onDelete, onToggleComplete }: TodoItemProps) {
  // ...
}
```

### 5.2 デフォルト Props

```typescript
interface TodoListProps {
  todos: Todo[]
  isLoading?: boolean // optional
}

export function TodoList({ todos, isLoading = false }: TodoListProps) {
  // ...
}
```

### 5.3 子コンポーネントへのイベントハンドラー命名規則

- **親コンポーネント**: `handle〇〇`
- **子コンポーネントの Props**: `on〇〇`

```typescript
// 親
const handleDelete = (id: string) => { }

// 子に渡す
<TodoItem onDelete={handleDelete} />

// 子で受け取る
interface Props {
  onDelete: (id: string) => void
}
```

---

## 6. 実装チェックリスト

### 6.1 認証ページ
- [ ] LoginForm コンポーネントの作成
- [ ] RegisterForm コンポーネントの作成

### 6.2 Todo 管理ページ
- [ ] TodoCreateForm コンポーネントの作成
- [ ] TodoFilter コンポーネントの作成
- [ ] TodoSort コンポーネントの作成
- [ ] TodoList コンポーネントの作成
- [ ] TodoItem コンポーネントの作成
- [ ] TodoPagination コンポーネントの作成
- [ ] TodoDisplay コンポーネントの作成
- [ ] TodoEditForm コンポーネントの作成

### 6.3 プロフィールページ
- [ ] ProfileInfo コンポーネントの作成
- [ ] ProfileEditForm コンポーネントの作成
- [ ] PasswordChangeForm コンポーネントの作成
- [ ] TodoStats コンポーネントの作成
- [ ] UserTodoList コンポーネントの作成

### 6.4 Props の設計
- [ ] すべてのコンポーネントで Props の型定義が明確
- [ ] イベントハンドラーの命名規則が統一されている
- [ ] 必要に応じてデフォルト Props が設定されている

---

## 7. 動作確認項目

### 7.1 機能確認
- [ ] すべての機能が正常に動作する
- [ ] 親子間のデータフローが適切
- [ ] イベントハンドラーが正しく動作する

### 7.2 コード品質
- [ ] コンポーネントが適切な粒度に分割されている
- [ ] 各コンポーネントが単一責任を持っている
- [ ] Props の型定義が明確
- [ ] 再利用可能なコンポーネントが適切に設計されている

---

## 8. 次のステップへの準備

Step 4 完了後、以下を確認してください。

- [ ] すべてのページコンポーネントが適切に分割されている
- [ ] 子コンポーネントが再利用可能な設計になっている
- [ ] Props の型定義が明確
- [ ] すべての機能が正常に動作する

これらが完了したら、**Step 5: カスタムフックの定義** に進みましょう。

---

**Document Version**: 1.0.0  
**Last Updated**: 2025-10-24

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

### 2.4 表示・編集の一体型コンポーネント

シンプルな表示・編集の切り替えが必要な場合、内部状態で管理する**一体型コンポーネント**が有効です。

**一体型コンポーネントが適している場合**:
- 編集対象が1つのエンティティ（ユーザー情報、プロフィールなど）
- 編集項目が少ない（3〜5項目程度）
- キャンセル時に元の状態に戻す必要がある
- 親コンポーネントでの状態管理を最小限にしたい

**メリット**:
- 状態管理がコンポーネント内で完結
- キャンセル処理が簡単（ローカル状態を元に戻すだけ）
- Props の受け渡しが最小限

**デメリット**:
- コンポーネントが肥大化する可能性
- 複雑な編集フローには不向き

**実装例（ProfileInfo）**:
```typescript
export function ProfileInfo({ user, onUpdate }: ProfileInfoProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [firstName, setFirstName] = useState(user.firstName || '')
  const [lastName, setLastName] = useState(user.lastName || '')
  
  const handleCancel = () => {
    setIsEditing(false)
    // ローカル状態を元に戻す
    setFirstName(user.firstName || '')
    setLastName(user.lastName || '')
  }
  
  return (
    <Card>
      {isEditing ? (
        <form onSubmit={handleSubmit}>
          {/* 編集フォーム */}
        </form>
      ) : (
        <div>
          {/* 表示モード */}
        </div>
      )}
    </Card>
  )
}
```

**分離型コンポーネントが適している場合**:
- 編集項目が多い（6項目以上）
- 複数ステップのフォーム
- バリデーションが複雑
- 編集フォームを複数箇所で再利用する

**実装例（分離型）**:
```typescript
// 親コンポーネント
const [isEditing, setIsEditing] = useState(false)

return (
  <div>
    {isEditing ? (
      <UserEditForm user={user} onSave={handleSave} onCancel={() => setIsEditing(false)} />
    ) : (
      <UserDisplay user={user} onEdit={() => setIsEditing(true)} />
    )}
  </div>
)
```

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
│   │   ├── types.ts             # Todo関連の型定義
│   │   ├── TodoItem.tsx         # Todo アイテム表示
│   │   ├── TodoList.tsx         # Todo リスト
│   │   ├── TodoCreateForm.tsx   # Todo 作成フォーム
│   │   ├── TodoEditForm.tsx     # Todo 編集フォーム
│   │   ├── TodoDisplay.tsx      # Todo 詳細表示
│   │   ├── TodoListControls.tsx # フィルター・ソート統合UI
│   │   └── TodoPagination.tsx   # ページネーション UI
│   ├── TodoListPage.tsx         # Todo 一覧ページ（親コンポーネント）
│   └── TodoDetailPage.tsx       # Todo 詳細ページ（親コンポーネント）
├── profile/
│   ├── components/
│   │   ├── types.ts             # プロフィール関連の型定義
│   │   ├── ProfileInfo.tsx      # プロフィール情報表示・編集（一体型）
│   │   ├── PasswordChangeForm.tsx # パスワード変更フォーム
│   │   ├── TodoStatsDisplay.tsx # Todo 統計表示
│   │   └── UserTodoList.tsx     # ユーザーの Todo 一覧
│   └── ProfilePage.tsx          # プロフィールページ（親コンポーネント）
└── users/
    ├── components/
    │   ├── types.ts             # ユーザー管理関連の型定義とユーティリティ
    │   ├── UserCreateForm.tsx   # ユーザー作成フォーム
    │   ├── UserInfoDisplay.tsx  # ユーザー情報表示
    │   ├── UserInfoEditForm.tsx # ユーザー情報編集フォーム
    │   ├── UserTodoList.tsx     # ユーザーのTodo一覧（簡易版）
    │   ├── UserListControls.tsx # 検索・フィルター・ソート統合UI
    │   ├── UserListItem.tsx     # ユーザーリスト項目
    │   ├── UserList.tsx         # ユーザーリスト全体
    │   └── UserPagination.tsx   # ページネーション
    ├── CreateUserPage.tsx       # ユーザー作成ページ（親コンポーネント）
    ├── UserDetailPage.tsx       # ユーザー詳細ページ（親コンポーネント）
    └── UserListPage.tsx         # ユーザー一覧ページ(親コンポーネント)
```

### 3.2 共通コンポーネントのディレクトリ構成

複数のページで共通して使用されるヘッダー、フッター、ナビゲーションなどのコンポーネントは、`src/components/` 配下に配置します。

```
src/
├── app/
│   ├── layout.tsx               # ルートレイアウト（サーバーコンポーネント）
│   └── providers.tsx            # HeroUI プロバイダー
├── components/
│   ├── Header.tsx               # 共通ヘッダー（クライアントコンポーネント）
│   ├── Footer.tsx               # 共通フッター（クライアントコンポーネント）
│   └── Navigation.tsx           # ナビゲーションメニュー（クライアントコンポーネント）
└── features/
    └── ...
```

**配置の原則**:
- **サーバーコンポーネント**: `app/` 配下（`layout.tsx`, `page.tsx`）
- **クライアントコンポーネント**: `components/` または `features/*/components/` 配下
- **共通UI**: `components/` 配下
- **機能固有のUI**: `features/*/components/` 配下
- **機能固有の型定義**: `features/*/components/types.ts` 配下

#### 3.3 型定義ファイル（types.ts）の役割

各機能ディレクトリの `components/types.ts` は、その機能で使用される**ローカルな型定義**を集約します。

**配置場所と役割の違い**:

| ファイル | 役割 | 使用範囲 |
|---------|------|---------|
| `src/types/` | グローバルな型定義（API レスポンス、共通エンティティ等） | プロジェクト全体 |
| `src/features/*/components/types.ts` | 機能固有のローカル型定義 | 特定の機能内のコンポーネント |

**types.ts に含めるべき内容**:
- コンポーネント固有の型定義
- Props の型定義（複数コンポーネントで共有される場合）
- ユーティリティ関数（その機能専用のヘルパー関数）
- ローカルな定数やマッピング

**例: users/components/types.ts**:
```typescript
/**
 * ユーザー管理関連の型定義
 */

export interface User {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  role: number;
  createdAt: string;
  updatedAt: string;
}

export interface TodoStats {
  totalTodos: number;
  completedTodos: number;
  pendingTodos: number;
  completionRate: number;
}

export interface UserWithStats extends User {
  stats?: TodoStats;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

/**
 * ロールラベルのマッピング
 */
export const roleLabels: Record<number, string> = {
  1: 'ADMIN',
  2: 'MANAGER',
  3: 'USER',
  4: 'GUEST',
};

/**
 * ロール別のバッジクラス名を取得
 */
export const getRoleBadgeClass = (role: number): string => {
  switch (role) {
    case 1:
      return 'px-2 py-1 text-xs font-semibold rounded bg-red-100 text-red-800';
    case 2:
      return 'px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800';
    case 3:
      return 'px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-800';
    case 4:
      return 'px-2 py-1 text-xs font-semibold rounded bg-gray-100 text-gray-800';
    default:
      return 'px-2 py-1 text-xs font-semibold rounded bg-gray-100 text-gray-800';
  }
};
```

**例: todos/components/types.ts**:
```typescript
/**
 * Todo関連の型定義
 */

export interface Todo {
  id: string;
  title: string;
  descriptions?: string;
  completed: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}
```

**例: profile/components/types.ts**:
```typescript
/**
 * プロフィール関連の型定義
 */

export interface User {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  role: number;
}

export interface TodoStats {
  totalTodos: number;
  completedTodos: number;
  pendingTodos: number;
  completionRate: number;
}

export interface Todo {
  id: string;
  title: string;
  descriptions?: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}
```

**メリット**:
- コンポーネントファイルの見通しが良くなる
- 型定義の一元管理
- 機能内での型の再利用が容易
- ユーティリティ関数の共有

---

## 4. ページ別コンポーネント分割ガイド
```

---

## 4. ページ別コンポーネント分割ガイド

### 4.0 共通ヘッダーコンポーネントの実装

#### 4.0.1 設計方針

各ページで重複していたヘッダー（Navbar）部分を共通コンポーネントとして切り出し、`layout.tsx` で全ページに適用します。

**メリット**:
- コードの重複を削減
- ヘッダーの変更が一箇所で完結
- メンテナンス性の向上
- 一貫したユーザー体験

#### 4.0.2 実装アーキテクチャ

```
app/layout.tsx (サーバーコンポーネント)
    ↓ children として渡す
components/Header.tsx (クライアントコンポーネント)
    ↓ Props でデータを渡す
features/*/Page.tsx (各ページコンポーネント)
```

#### 4.0.3 ルートレイアウトの実装

**`src/app/layout.tsx`** (サーバーコンポーネント):

```typescript
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Header } from '@/components/Header';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Next Todo',
  description: 'Next.js を用いた Todo アプリケーション',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  );
}
```

**ポイント**:
- `layout.tsx` はサーバーコンポーネントのまま
- `<Header />` を `children` の前に配置
- HeroUI の `Providers` で全体をラップ

#### 4.0.4 共通ヘッダーコンポーネントの実装

**`src/components/Header.tsx`** (クライアントコンポーネント):

```typescript
'use client';

import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Button,
} from '@heroui/react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<number>(4); // GENERAL (デフォルト)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // 認証状態をチェック
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/users/me');
        
        if (response.ok) {
          const data = await response.json();
          setIsAuthenticated(true);
          setUserRole(data.data.role);
        } else {
          setIsAuthenticated(false);
        }
      } catch (err) {
        setIsAuthenticated(false);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    // 認証不要なページではチェックをスキップ
    if (pathname === '/login' || pathname === '/register') {
      setIsAuthenticated(false);
      setIsCheckingAuth(false);
      return;
    }

    checkAuth();
  }, [pathname]);

  // ログアウト処理
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
      setIsAuthenticated(false);
      router.push('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // 認証チェック中は何も表示しない
  if (isCheckingAuth) {
    return null;
  }

  // 未認証時（ログイン・登録ページ）はヘッダーを表示しない
  if (!isAuthenticated) {
    return null;
  }

  return (
    <Navbar>
      <NavbarBrand>
        <Link href="/todos" className="text-2xl font-bold">
          Todo アプリ
        </Link>
      </NavbarBrand>

      <NavbarContent className="hidden sm:flex gap-4" justify="center">
        <NavbarItem>
          <Link
            href="/todos"
            className={
              pathname.startsWith('/todos')
                ? 'text-blue-500 font-medium'
                : 'text-gray-700 hover:text-blue-500 font-medium'
            }
          >
            Todo一覧
          </Link>
        </NavbarItem>

        <NavbarItem>
          <Link
            href="/profile"
            className={
              pathname === '/profile'
                ? 'text-blue-500 font-medium'
                : 'text-gray-700 hover:text-blue-500 font-medium'
            }
          >
            プロフィール
          </Link>
        </NavbarItem>

        {/* ADMIN・MANAGER のみアクセス可能 */}
        {userRole <= 2 && (
          <NavbarItem>
            <Link
              href="/users"
              className={
                pathname.startsWith('/users')
                  ? 'text-blue-500 font-medium'
                  : 'text-gray-700 hover:text-blue-500 font-medium'
              }
            >
              ユーザー管理
            </Link>
          </NavbarItem>
        )}
      </NavbarContent>

      <NavbarContent justify="end">
        <NavbarItem>
          <Button color="default" variant="flat" onPress={handleLogout}>
            ログアウト
          </Button>
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  );
}
```

**実装のポイント**:

1. **`'use client'` ディレクティブ**
   - クライアントコンポーネントとして宣言
   - `useRouter`, `useState`, `useEffect` などの React Hooks を使用するため必須

2. **認証状態の管理**
   - `/api/users/me` を呼び出して現在のユーザー情報を取得
   - ログイン・登録ページではヘッダーを非表示

3. **パスに応じたアクティブ状態**
   - `usePathname()` でアクティブページを判定
   - アクティブなリンクに `text-blue-500` を適用

4. **ロールベースの表示制御**
   - `userRole <= 2` (ADMIN, MANAGER) のみユーザー管理メニューを表示

5. **ログアウト処理**
   - `/api/auth/logout` を呼び出し
   - ログイン画面にリダイレクト

#### 4.0.5 各ページコンポーネントからの変更点

共通ヘッダーを導入することで、各ページコンポーネントから以下を削除できます:

**削除する要素**:
```typescript
// ❌ 削除: Navbar 関連のインポート
import { Navbar, NavbarBrand, NavbarContent, NavbarItem } from '@heroui/react';

// ❌ 削除: ヘッダー部分の JSX
<Navbar>
  <NavbarBrand>
    <h1 className="text-2xl font-bold">Todo アプリ</h1>
  </NavbarBrand>
  {/* ... */}
</Navbar>

// ❌ 削除: ログアウト処理（Header に移動）
const handleLogout = async () => { /* ... */ };
```

**変更後のページコンポーネント**:
```typescript
// ✅ シンプルな構造
export function TodoListPage() {
  // ビジネスロジックに集中
  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Todo 一覧</h1>
      {/* ページ固有のコンテンツ */}
    </main>
  );
}
```

#### 4.0.6 実装チェックリスト

- [ ] `src/components/Header.tsx` を作成
- [ ] `src/app/layout.tsx` に `<Header />` を追加
- [ ] 各ページコンポーネントから Navbar 部分を削除
- [ ] 認証状態に応じたヘッダー表示を確認
- [ ] ロールに応じたメニュー表示を確認
- [ ] パスに応じたアクティブ状態を確認
- [ ] ログアウト処理が正常に動作することを確認

---

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
2. **TodoListControls**: フィルター・ソート統合UI（完了状態フィルター、ソート項目、ソート順序）
3. **TodoList**: Todo リスト全体
4. **TodoItem**: 個別の Todo アイテム
5. **TodoPagination**: ページネーション

**設計の特記事項**:
- `TodoListControls` コンポーネントは、フィルタリングとソートを一体的に管理するコントロールパネルとして実装
- フィルター（完了/未完了）とソート（作成日時/更新日時/タイトル、昇順/降順）は機能的に密接で、同じUI領域に配置されるため統合
- 状態管理とイベントハンドラーを共通化することで、保守性と再利用性が向上

#### 親コンポーネント（ページ）

```typescript
// src/features/todos/TodoListPage.tsx
'use client'

import { useState, useEffect } from 'react'
import { TodoCreateForm } from './components/TodoCreateForm'
import { TodoListControls } from './components/TodoListControls'
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
      
      <TodoListControls
        completedFilter={completedFilter}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onCompletedFilterChange={setCompletedFilter}
        onSortByChange={setSortBy}
        onSortOrderChange={setSortOrder}
      />
      
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

**TodoListControls.tsx**:
```typescript
// src/features/todos/components/TodoListControls.tsx
'use client'

import { Select, SelectItem } from '@heroui/react'

interface Props {
  completedFilter: 'all' | 'completed' | 'incomplete'
  sortBy: 'createdAt' | 'updatedAt' | 'title'
  sortOrder: 'asc' | 'desc'
  onCompletedFilterChange: (value: 'all' | 'completed' | 'incomplete') => void
  onSortByChange: (value: 'createdAt' | 'updatedAt' | 'title') => void
  onSortOrderChange: (value: 'asc' | 'desc') => void
}

export function TodoListControls({
  completedFilter,
  sortBy,
  sortOrder,
  onCompletedFilterChange,
  onSortByChange,
  onSortOrderChange,
}: Props) {
  return (
    <div className="flex gap-4 my-6">
      <Select
        label="フィルター"
        selectedKeys={[completedFilter]}
        onChange={(e) => onCompletedFilterChange(e.target.value as 'all' | 'completed' | 'incomplete')}
        className="max-w-xs"
      >
        <SelectItem key="all" value="all">すべて</SelectItem>
        <SelectItem key="completed" value="completed">完了済み</SelectItem>
        <SelectItem key="incomplete" value="incomplete">未完了</SelectItem>
      </Select>
      
      <Select
        label="ソート項目"
        selectedKeys={[sortBy]}
        onChange={(e) => onSortByChange(e.target.value as 'createdAt' | 'updatedAt' | 'title')}
        className="max-w-xs"
      >
        <SelectItem key="createdAt" value="createdAt">作成日時</SelectItem>
        <SelectItem key="updatedAt" value="updatedAt">更新日時</SelectItem>
        <SelectItem key="title" value="title">タイトル</SelectItem>
      </Select>
      
      <Select
        label="ソート順"
        selectedKeys={[sortOrder]}
        onChange={(e) => onSortOrderChange(e.target.value as 'asc' | 'desc')}
        className="max-w-xs"
      >
        <SelectItem key="asc" value="asc">昇順</SelectItem>
        <SelectItem key="desc" value="desc">降順</SelectItem>
      </Select>
    </div>
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

1. **ProfileInfo**: プロフィール情報表示・編集（一体型コンポーネント）
2. **PasswordChangeForm**: パスワード変更フォーム
3. **TodoStatsDisplay**: Todo 統計表示
4. **UserTodoList**: ユーザーの Todo 一覧（簡易版）

**設計の特記事項**:
- `ProfileInfo` コンポーネントは、表示モードと編集モードを内部的に切り替える**一体型コンポーネント**として実装
- `ProfileEditForm` は独立したコンポーネントとして切り出さず、`ProfileInfo` 内で編集状態を管理
- これにより、編集時の状態管理がシンプルになり、キャンセル時の処理が容易

#### 親コンポーネント（ページ）

```typescript
// src/features/profile/ProfilePage.tsx
'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ProfileInfo } from './components/ProfileInfo'
import { PasswordChangeForm } from './components/PasswordChangeForm'
import { TodoStatsDisplay } from './components/TodoStatsDisplay'
import { UserTodoList } from './components/UserTodoList'
import type { User, Todo, TodoStats } from './components/types'

interface Props {
  initialUser?: User
  initialStats?: TodoStats
  initialTodos?: Todo[]
}

export function ProfilePage({ initialUser, initialStats, initialTodos }: Props) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(initialUser || null)
  const [stats, setStats] = useState<TodoStats | null>(initialStats || null)
  const [todos, setTodos] = useState<Todo[]>(initialTodos || [])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [successMessage, setSuccessMessage] = useState<string>('')
  
  // ユーザー情報を取得
  const fetchUserInfo = useCallback(async () => {
    // ...
  }, [router])
  
  // Todo統計を取得
  const fetchTodoStats = useCallback(async () => {
    // ...
  }, [])
  
  // Todo一覧を取得
  const fetchTodos = useCallback(async () => {
    // ...
  }, [])
  
  // 初回読み込み時に全データを取得（初期データがない場合のみ）
  useEffect(() => {
    if (initialUser && initialStats && initialTodos) {
      return
    }
    
    const fetchAllData = async () => {
      setIsLoading(true)
      await Promise.all([fetchUserInfo(), fetchTodoStats(), fetchTodos()])
      setIsLoading(false)
    }
    
    fetchAllData()
  }, [fetchTodoStats, fetchTodos, fetchUserInfo, initialUser, initialStats, initialTodos])
  
  // プロフィール更新
  const handleUpdateProfile = async (firstName?: string, lastName?: string) => {
    const response = await fetch('/api/users/me', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        firstName,
        lastName,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'プロフィールの更新に失敗しました')
    }

    await fetchUserInfo()
    setSuccessMessage('プロフィールを更新しました')
    setTimeout(() => setSuccessMessage(''), 3000)
  }
  
  // パスワード変更
  const handleChangePassword = async (
    currentPassword: string, 
    newPassword: string,
    confirmPassword: string
  ) => {
    const response = await fetch('/api/users/me/password', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        currentPassword,
        newPassword,
        confirmPassword,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'パスワードの変更に失敗しました')
    }

    setSuccessMessage('パスワードを変更しました')
    setTimeout(() => setSuccessMessage(''), 3000)
  }
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-100">
      <main className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">プロフィール</h1>
        
        {/* 成功メッセージ */}
        {successMessage && (
          <div className="text-green-600 text-sm bg-green-50 border border-green-200 rounded-md p-3 mb-4">
            {successMessage}
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 左カラム: ユーザー情報とパスワード変更 */}
          <div className="space-y-8">
            {user && <ProfileInfo user={user} onUpdate={handleUpdateProfile} />}
            <PasswordChangeForm onChangePassword={handleChangePassword} />
          </div>
          
          {/* 右カラム: Todo統計と一覧 */}
          <div className="space-y-8">
            <TodoStatsDisplay stats={stats} />
            <UserTodoList todos={todos} />
          </div>
        </div>
      </main>
    </div>
  )
}
```

#### 子コンポーネント例

**ProfileInfo.tsx**（表示・編集一体型）:
```typescript
// src/features/profile/components/ProfileInfo.tsx
'use client'

import { Button, Card, CardBody, CardHeader, Input } from '@heroui/react'
import { type FormEvent, useState } from 'react'
import type { User } from './types'

interface ProfileInfoProps {
  user: User
  onUpdate: (firstName?: string, lastName?: string) => Promise<void>
}

/**
 * プロフィール情報コンポーネント（表示・編集一体型）
 */
export function ProfileInfo({ user, onUpdate }: ProfileInfoProps) {
  const [firstName, setFirstName] = useState<string>(user.firstName || '')
  const [lastName, setLastName] = useState<string>(user.lastName || '')
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [isSaving, setIsSaving] = useState<boolean>(false)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setIsSaving(true)

    try {
      await onUpdate(firstName || undefined, lastName || undefined)
      setIsEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'プロフィールの更新に失敗しました')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setFirstName(user.firstName || '')
    setLastName(user.lastName || '')
    setError('')
  }

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">プロフィール</h2>
        {!isEditing && (
          <Button color="primary" onPress={() => setIsEditing(true)}>
            編集
          </Button>
        )}
      </CardHeader>
      <CardBody>
        {error && (
          <div className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-md p-3 mb-4">
            {error}
          </div>
        )}

        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="text"
              label="ユーザー名"
              value={user.username}
              isDisabled
              description="ユーザー名は変更できません"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                type="text"
                label="姓"
                placeholder="姓"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                isDisabled={isSaving}
              />

              <Input
                type="text"
                label="名"
                placeholder="名"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                isDisabled={isSaving}
              />
            </div>

            <div className="flex items-center gap-4 pt-4">
              <Button type="submit" color="primary" isLoading={isSaving}>
                保存
              </Button>
              <Button
                color="default"
                variant="flat"
                onPress={handleCancel}
                isDisabled={isSaving}
              >
                キャンセル
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-1">ユーザー名</h3>
              <p className="text-gray-900">{user.username}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-1">姓</h3>
                <p className="text-gray-900">{user.lastName || '未設定'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-1">名</h3>
                <p className="text-gray-900">{user.firstName || '未設定'}</p>
              </div>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  )
}
```

**設計のポイント**:
- **一体型コンポーネント**: `isEditing` 状態で表示・編集を切り替え
- **状態のローカル管理**: 編集中のデータは `firstName`, `lastName` でローカル管理
- **キャンセル処理**: 元の値に戻すロジックが単純化
- **エラーハンドリング**: コンポーネント内でエラー表示を完結

---

### 4.5 ユーザー管理ページ

#### 分割する子コンポーネント

**ユーザー作成ページ**:
1. **UserCreateForm**: ユーザー作成フォーム

**ユーザー詳細ページ**:
1. **UserInfoDisplay**: ユーザー情報表示
2. **UserInfoEditForm**: ユーザー情報編集フォーム
3. **UserTodoList**: ユーザーのTodo一覧（簡易版）

**ユーザー一覧ページ**:
1. **UserListControls**: 検索・フィルター・ソート統合UI（ユーザー名検索、ロールフィルター、ソート項目、ソート順序）
2. **UserList**: ユーザーリスト全体
3. **UserListItem**: 個別のユーザーアイテム
4. **UserPagination**: ページネーション

**設計の特記事項**:
- `UserListControls` コンポーネントは、検索、フィルタリング、ソートを一体的に管理するコントロールパネルとして実装
- 検索・フィルター・ソートは機能的に密接で、同じUI領域に配置されるため統合
- 状態管理とイベントハンドラーを共通化することで、保守性と再利用性が向上

#### 親コンポーネント（ユーザー作成ページ）

```typescript
// src/features/users/CreateUserPage.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar, NavbarBrand, NavbarContent, NavbarItem, Button } from '@heroui/react'
import Link from 'next/link'
import { UserCreateForm } from './components/UserCreateForm'

export function CreateUserPage() {
  const router = useRouter()
  const [currentUserRole, setCurrentUserRole] = useState<number>(4)
  const [hasPermission, setHasPermission] = useState<boolean>(false)
  const [isCheckingPermission, setIsCheckingPermission] = useState<boolean>(true)

  // 権限チェックと初期化処理
  // ...

  const handleCreateUser = async (userData: {
    username: string
    password: string
    firstName: string
    lastName: string
    role: number
  }) => {
    // ユーザー作成処理
  }

  const handleLogout = async () => {
    // ログアウト処理
  }

  if (isCheckingPermission || !hasPermission) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* ヘッダー */}
      <Navbar>
        <NavbarBrand>
          <h1 className="text-2xl font-bold">Todo アプリ</h1>
        </NavbarBrand>
        <NavbarContent className="hidden sm:flex gap-4" justify="center">
          <NavbarItem>
            <Link href="/todos" className="text-gray-700 hover:text-blue-500 font-medium">
              Todo一覧
            </Link>
          </NavbarItem>
          <NavbarItem>
            <Link href="/profile" className="text-gray-700 hover:text-blue-500 font-medium">
              プロフィール
            </Link>
          </NavbarItem>
          {currentUserRole <= 2 && (
            <NavbarItem>
              <Link href="/users" className="text-blue-500 font-medium">
                ユーザー管理
              </Link>
            </NavbarItem>
          )}
        </NavbarContent>
        <NavbarContent justify="end">
          <NavbarItem>
            <Button color="default" variant="flat" onPress={handleLogout}>
              ログアウト
            </Button>
          </NavbarItem>
        </NavbarContent>
      </Navbar>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-4">
          <Link href="/users" className="text-blue-500 hover:text-blue-600 font-medium">
            ← ユーザー一覧に戻る
          </Link>
        </div>

        <h2 className="text-3xl font-bold text-gray-900 mb-8">新規ユーザー作成</h2>

        <UserCreateForm onCreateUser={handleCreateUser} />
      </main>
    </div>
  )
}
```

#### 親コンポーネント（ユーザー詳細ページ）

```typescript
// src/features/users/UserDetailPage.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar, NavbarBrand, NavbarContent, NavbarItem, Button, useDisclosure } from '@heroui/react'
import Link from 'next/link'
import { UserInfoDisplay } from './components/UserInfoDisplay'
import { UserInfoEditForm } from './components/UserInfoEditForm'
import { UserTodoList } from './components/UserTodoList'
import type { User, Todo } from './components/types'

interface Props {
  userId: string
}

export function UserDetailPage({ userId }: Props) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [todos, setTodos] = useState<Todo[]>([])
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [successMessage, setSuccessMessage] = useState<string>('')
  const [currentUserRole, setCurrentUserRole] = useState<number>(4)
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [hasPermission, setHasPermission] = useState<boolean>(false)

  // 権限チェック、データ取得処理
  // ...

  const handleUpdateUser = async (updatedData: {
    firstName?: string
    lastName?: string
    role: number
  }) => {
    // ユーザー情報更新処理
  }

  const handleDeleteUser = async () => {
    // ユーザー削除処理
  }

  const handleLogout = async () => {
    // ログアウト処理
  }

  if (isLoading || !hasPermission) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* ヘッダー */}
      <Navbar>
        {/* ... */}
      </Navbar>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-4">
          <Link href="/users" className="text-blue-500 hover:text-blue-600 font-medium">
            ← ユーザー一覧に戻る
          </Link>
        </div>

        {successMessage && (
          <div className="text-green-600 text-sm bg-green-50 border border-green-200 rounded-md p-3 mb-4">
            {successMessage}
          </div>
        )}

        {error && (
          <div className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-md p-3 mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 左カラム: ユーザー情報 */}
          <div className="space-y-8">
            {isEditing ? (
              <UserInfoEditForm
                user={user!}
                onSave={handleUpdateUser}
                onCancel={() => setIsEditing(false)}
                currentUserRole={currentUserRole}
              />
            ) : (
              <UserInfoDisplay
                user={user!}
                onEdit={() => setIsEditing(true)}
                onDelete={handleDeleteUser}
                currentUserRole={currentUserRole}
                currentUserId={currentUserId}
              />
            )}
          </div>

          {/* 右カラム: Todo一覧 */}
          <div className="space-y-8">
            <UserTodoList todos={todos} />
          </div>
        </div>
      </main>
    </div>
  )
}
```

#### 親コンポーネント（ユーザー一覧ページ）

```typescript
// src/features/users/UserListPage.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar, NavbarBrand, NavbarContent, NavbarItem, Button, useDisclosure } from '@heroui/react'
import Link from 'next/link'
import { UserListControls } from './components/UserListControls'
import { UserList } from './components/UserList'
import { UserPagination } from './components/UserPagination'
import type { UserWithStats, PaginationInfo } from './components/types'

export function UserListPage() {
  const router = useRouter()
  const [users, setUsers] = useState<UserWithStats[]>([])
  const [page, setPage] = useState<number>(1)
  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo | null>(null)
  const [roleFilter, setRoleFilter] = useState<number | 'all'>('all')
  const [sortBy, setSortBy] = useState<'created_at' | 'username' | 'first_name' | 'last_name' | 'role'>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [currentUserRole, setCurrentUserRole] = useState<number>(4)
  const [hasPermission, setHasPermission] = useState<boolean>(false)

  // 権限チェック、データ取得処理
  // ...

  const fetchUsers = useCallback(async () => {
    // ユーザー一覧取得処理
  }, [page, roleFilter, sortBy, sortOrder, searchQuery, router])

  const handleDeleteUser = async (userId: string, username: string) => {
    // ユーザー削除処理
  }

  const handleLogout = async () => {
    // ログアウト処理
  }

  if (!hasPermission) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* ヘッダー */}
      <Navbar>
        {/* ... */}
      </Navbar>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-gray-900">ユーザー管理</h2>
          <Button as={Link} href="/users/create" color="primary">
            新規ユーザー作成
          </Button>
        </div>

        {/* 検索・フィルター・ソート */}
        <UserListControls
          searchQuery={searchQuery}
          roleFilter={roleFilter}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSearchChange={(query) => {
            setSearchQuery(query)
            setPage(1)
          }}
          onRoleFilterChange={(role) => {
            setRoleFilter(role)
            setPage(1)
          }}
          onSortByChange={setSortBy}
          onSortOrderChange={setSortOrder}
        />

        {error && (
          <div className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-md p-3 mb-4">
            {error}
          </div>
        )}

        {/* ユーザー一覧 */}
        <UserList
          users={users}
          isLoading={isLoading}
          currentUserRole={currentUserRole}
          currentUserId={currentUserId}
          onDeleteUser={handleDeleteUser}
          paginationInfo={paginationInfo}
        />

        {/* ページネーション */}
        {paginationInfo && paginationInfo.totalPages > 1 && (
          <UserPagination
            currentPage={page}
            totalPages={paginationInfo.totalPages}
            onPageChange={setPage}
          />
        )}
      </main>
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

### 6.0 共通コンポーネント
- [ ] Header コンポーネントの作成
- [ ] layout.tsx への Header コンポーネントの統合
- [ ] 認証状態に応じた表示制御の実装
- [ ] ロールベースのメニュー表示の実装
- [ ] パスに応じたアクティブ状態の実装

### 6.1 認証ページ
- [ ] LoginForm コンポーネントの作成
- [ ] RegisterForm コンポーネントの作成

### 6.2 Todo 管理ページ
- [ ] types.ts の作成（型定義）
- [ ] TodoCreateForm コンポーネントの作成
- [ ] TodoListControls コンポーネントの作成（フィルター・ソート統合）
- [ ] TodoList コンポーネントの作成
- [ ] TodoItem コンポーネントの作成
- [ ] TodoPagination コンポーネントの作成
- [ ] TodoDisplay コンポーネントの作成
- [ ] TodoEditForm コンポーネントの作成

### 6.3 プロフィールページ
- [ ] types.ts の作成（型定義）
- [ ] ProfileInfo コンポーネントの作成（表示・編集一体型）
- [ ] PasswordChangeForm コンポーネントの作成
- [ ] TodoStatsDisplay コンポーネントの作成
- [ ] UserTodoList コンポーネントの作成

### 6.4 ユーザー管理ページ
- [ ] types.ts の作成（型定義とユーティリティ関数）
- [ ] UserCreateForm コンポーネントの作成
- [ ] UserInfoDisplay コンポーネントの作成
- [ ] UserInfoEditForm コンポーネントの作成
- [ ] UserTodoList コンポーネントの作成
- [ ] UserListControls コンポーネントの作成（検索・フィルター・ソート統合）
- [ ] UserListItem コンポーネントの作成
- [ ] UserList コンポーネントの作成
- [ ] UserPagination コンポーネントの作成

### 6.5 Props の設計
- [ ] すべてのコンポーネントで Props の型定義が明確
- [ ] イベントハンドラーの命名規則が統一されている
- [ ] 必要に応じてデフォルト Props が設定されている

### 6.6 型定義ファイル（types.ts）
- [ ] 各機能ディレクトリに types.ts を作成
- [ ] コンポーネント固有の型定義を集約
- [ ] ユーティリティ関数が適切に定義されている（必要に応じて）
- [ ] グローバル型定義との重複がない

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

## 9. 実装状況の分析と基本設計

### 9.1 現在の達成状況

#### ✅ 実装済み（95%）

| カテゴリ | 達成度 | 詳細 |
|---------|--------|------|
| 認証 | 100% | LoginForm, RegisterForm |
| Todo 管理 | 100% | 全コンポーネント実装済み |
| プロフィール | 100% | ProfileInfo（一体型）含む |
| ユーザー管理 | 100% | 全コンポーネント実装済み |
| 型定義 | 100% | types.ts 完備 |
| 共通コンポーネント | 0% | Header 未実装 |

#### 実装済みコンポーネント一覧

**認証機能（auth/）**:
- ✅ `LoginForm.tsx` - ログインフォーム
- ✅ `RegisterForm.tsx` - 登録フォーム
- ✅ `LoginPage.tsx` - ログインページ（親コンポーネント）
- ✅ `RegisterPage.tsx` - 登録ページ（親コンポーネント）

**Todo 管理機能（todos/）**:
- ✅ `types.ts` - Todo 関連の型定義
- ✅ `TodoCreateForm.tsx` - Todo 作成フォーム
- ✅ `TodoDisplay.tsx` - Todo 詳細表示
- ✅ `TodoEditForm.tsx` - Todo 編集フォーム
- ✅ `TodoListControls.tsx` - フィルター・ソート統合UI
- ✅ `TodoItem.tsx` - 個別の Todo アイテム
- ✅ `TodoList.tsx` - Todo リスト全体
- ✅ `TodoPagination.tsx` - ページネーション

**プロフィール機能（profile/）**:
- ✅ `types.ts` - プロフィール関連の型定義
- ✅ `ProfileInfo.tsx` - プロフィール情報表示・編集（一体型）
- ✅ `PasswordChangeForm.tsx` - パスワード変更フォーム
- ✅ `TodoStatsDisplay.tsx` - Todo 統計表示
- ✅ `UserTodoList.tsx` - ユーザーの Todo 一覧

**ユーザー管理機能（users/）**:
- ✅ `types.ts` - ユーザー管理関連の型定義とユーティリティ
- ✅ `UserCreateForm.tsx` - ユーザー作成フォーム
- ✅ `UserInfoDisplay.tsx` - ユーザー情報表示
- ✅ `UserInfoEditForm.tsx` - ユーザー情報編集フォーム
- ✅ `UserTodoList.tsx` - ユーザーの Todo 一覧
- ✅ `UserListControls.tsx` - 検索・フィルター・ソート統合UI
- ✅ `UserListItem.tsx` - ユーザーリスト項目
- ✅ `UserList.tsx` - ユーザーリスト全体
- ✅ `UserPagination.tsx` - ページネーション

### 9.2 実装の特徴

#### Server Actions の統一使用

すべてのフォームコンポーネントで Server Actions を直接使用しています：

```typescript
// 例: TodoCreateForm.tsx
import { createTodo } from '@/lib/api';

export function TodoCreateForm({ onSuccess }: TodoCreateFormProps) {
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    // Server Action を直接呼び出し
    const result = await createTodo({
      title: newTodoTitle,
      descriptions: newTodoDescription || undefined,
    });

    if (!result.success) {
      throw new Error(result.error || 'Todoの作成に失敗しました');
    }

    // 成功コールバック
    if (onSuccess) {
      onSuccess();
    }
  };
}
```

**メリット**:
- Props の数が減り、シンプルになった
- エラーハンドリングがコンポーネント内で完結
- 親コンポーネントは成功時のコールバックのみ提供

#### モーダルによる削除確認

HeroUI の Modal コンポーネントを使用して、削除確認を実装：

```typescript
// 例: TodoItem.tsx
import { useDisclosure } from '@heroui/react';

export function TodoItem({ todo, onUpdate }: TodoItemProps) {
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();

  return (
    <>
      <Button onPress={onDeleteOpen}>削除</Button>
      
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose}>
        <ModalContent>
          <ModalHeader>確認</ModalHeader>
          <ModalBody>
            <p>このTodoを削除してもよろしいですか?</p>
          </ModalBody>
          <ModalFooter>
            <Button onPress={onDeleteClose}>キャンセル</Button>
            <Button color="danger" onPress={handleDelete}>削除</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
```

#### 一体型コンポーネントの採用

ProfileInfo コンポーネントは、表示・編集を内部で切り替える一体型として実装：

```typescript
// ProfileInfo.tsx
export function ProfileInfo({ user, onUpdate }: ProfileInfoProps) {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [firstName, setFirstName] = useState<string>(user.firstName || '');
  const [lastName, setLastName] = useState<string>(user.lastName || '');

  return (
    <Card>
      {isEditing ? (
        <form onSubmit={handleSubmit}>
          {/* 編集フォーム */}
        </form>
      ) : (
        <div>
          {/* 表示モード */}
        </div>
      )}
    </Card>
  );
}
```

**適用理由**:
- 編集項目が少ない（姓・名の2項目）
- キャンセル時に元の状態に戻す処理がシンプル
- 親コンポーネントの状態管理が最小限

### 9.3 未実装項目と実装計画

#### ❌ Header コンポーネント（優先度: 🔴 高）

**現状の問題点**:
- 全ページで Navbar のコードが重複
- ヘッダーの変更時に複数ファイルの修正が必要
- メンテナンス性の低下

**影響を受けているファイル**:
- `TodoListPage.tsx`
- `TodoDetailPage.tsx`
- `ProfilePage.tsx`
- `CreateUserPage.tsx`
- `UserDetailPage.tsx`
- `UserListPage.tsx`

**実装方針**:

1. **Header コンポーネントの作成**

```typescript
// src/components/Header.tsx
'use client';

import { Navbar, NavbarBrand, NavbarContent, NavbarItem, Button } from '@heroui/react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<number>(4);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // 認証状態をチェック
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/users/me');
        
        if (response.ok) {
          const data = await response.json();
          setIsAuthenticated(true);
          setUserRole(data.data.role);
        } else {
          setIsAuthenticated(false);
        }
      } catch (err) {
        setIsAuthenticated(false);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    // 認証不要なページではチェックをスキップ
    if (pathname === '/login' || pathname === '/register') {
      setIsAuthenticated(false);
      setIsCheckingAuth(false);
      return;
    }

    checkAuth();
  }, [pathname]);

  // ログアウト処理
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
      setIsAuthenticated(false);
      router.push('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // 認証チェック中は何も表示しない
  if (isCheckingAuth) {
    return null;
  }

  // 未認証時（ログイン・登録ページ）はヘッダーを表示しない
  if (!isAuthenticated) {
    return null;
  }

  return (
    <Navbar>
      <NavbarBrand>
        <Link href="/todos" className="text-2xl font-bold">
          Todo アプリ
        </Link>
      </NavbarBrand>

      <NavbarContent className="hidden sm:flex gap-4" justify="center">
        <NavbarItem>
          <Link
            href="/todos"
            className={
              pathname.startsWith('/todos')
                ? 'text-blue-500 font-medium'
                : 'text-gray-700 hover:text-blue-500 font-medium'
            }
          >
            Todo一覧
          </Link>
        </NavbarItem>

        <NavbarItem>
          <Link
            href="/profile"
            className={
              pathname === '/profile'
                ? 'text-blue-500 font-medium'
                : 'text-gray-700 hover:text-blue-500 font-medium'
            }
          >
            プロフィール
          </Link>
        </NavbarItem>

        {/* ADMIN・MANAGER のみアクセス可能 */}
        {userRole <= 2 && (
          <NavbarItem>
            <Link
              href="/users"
              className={
                pathname.startsWith('/users')
                  ? 'text-blue-500 font-medium'
                  : 'text-gray-700 hover:text-blue-500 font-medium'
              }
            >
              ユーザー管理
            </Link>
          </NavbarItem>
        )}
      </NavbarContent>

      <NavbarContent justify="end">
        <NavbarItem>
          <Button color="default" variant="flat" onPress={handleLogout}>
            ログアウト
          </Button>
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  );
}
```

2. **layout.tsx への統合**

```typescript
// src/app/layout.tsx
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Header } from '@/components/Header'; // ✅ 追加

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          <Header /> {/* ✅ 追加 */}
          {children}
        </Providers>
      </body>
    </html>
  );
}
```

3. **各ページコンポーネントのリファクタリング**

以下のコードを各ページから削除：

```typescript
// ❌ 削除対象
<header className="bg-white shadow-sm">
  <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
    <h1 className="text-2xl font-bold text-gray-900">Todo アプリ</h1>
    <nav className="flex items-center gap-4">
      {/* ... */}
    </nav>
  </div>
</header>
```

### 9.4 実装チェックリスト

#### Phase 1: Header コンポーネントの作成

- [ ] `src/components/Header.tsx` を作成
- [ ] 認証状態の管理機能を実装
- [ ] ロールベースのメニュー表示を実装
- [ ] パスに応じたアクティブ状態を実装
- [ ] ログアウト処理を実装

#### Phase 2: layout.tsx への統合

- [ ] `src/app/layout.tsx` に `<Header />` を追加
- [ ] 動作確認

#### Phase 3: 各ページコンポーネントのリファクタリング

- [ ] `TodoListPage.tsx` からヘッダーを削除
- [ ] `TodoDetailPage.tsx` からヘッダーを削除
- [ ] `ProfilePage.tsx` からヘッダーを削除
- [ ] `CreateUserPage.tsx` からヘッダーを削除
- [ ] `UserDetailPage.tsx` からヘッダーを削除
- [ ] `UserListPage.tsx` からヘッダーを削除

#### Phase 4: 動作確認

- [ ] 全ページでヘッダーが正しく表示される
- [ ] 認証状態に応じてヘッダーが表示/非表示される
- [ ] ロールに応じたメニューが表示される
- [ ] アクティブ状態が正しく反映される
- [ ] ログアウトが正常に動作する

### 9.5 品質保証計画

#### コンポーネント設計
- [ ] すべてのコンポーネントが単一責任を持つ
- [ ] Props の型定義が明確
- [ ] イベントハンドラーの命名規則が統一されている
- [ ] 再利用可能なコンポーネントが適切に設計されている

#### コード品質
- [ ] Biome のリント・フォーマットに準拠
- [ ] TypeScript の型チェックに合格
- [ ] エラーハンドリングが適切
- [ ] ローディング状態の管理が適切

#### 機能確認
- [ ] すべての機能が正常に動作する
- [ ] 親子間のデータフローが適切
- [ ] Server Actions が正しく使用されている

#### Header コンポーネント
- [ ] 認証済みユーザーにヘッダーが表示される
- [ ] 未認証ユーザーにヘッダーが表示されない
- [ ] ログイン・登録ページでヘッダーが表示されない
- [ ] ロールに応じたメニューが表示される
- [ ] アクティブページのリンクが正しくハイライトされる
- [ ] ログアウトボタンが正常に動作する

#### ページコンポーネント
- [ ] ヘッダー削除後も機能が正常に動作する
- [ ] レイアウトが崩れていない
- [ ] すべてのナビゲーションが機能する

#### パフォーマンス
- [ ] 初回ロード時間が許容範囲内
- [ ] ページ遷移がスムーズ
- [ ] 不要な再レンダリングが発生していない

---

**Document Version**: 1.3.0  
**Last Updated**: 2025-10-28  
**Changes**: 
- 型定義ファイル（types.ts）に関するセクションを追加
- ProfileInfo コンポーネントの一体型実装パターンを追加
- TodoStatsDisplay の命名を正確に反映
- 表示・編集の一体型コンポーネントに関する設計原則を追加
- 実装チェックリストを更新
- **実装状況の分析と基本設計セクションを追加**（9.1〜9.5）
- 達成状況の評価と未実装項目の特定
- Header コンポーネント実装計画の詳細化
- 品質保証計画の追加

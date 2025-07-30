# STEP 3: UIライブラリ実装

## 🎯 目標

STEP 2で実装したサーバーサイドレンダリング対応TODOアプリのUIを、HeroUIコンポーネントライブラリで置き換えて、モダンで美しいUIに改善します。

## 📋 学習成果

このSTEPを完了すると、以下のスキルが身につきます：

- **STEP2の既存コンポーネントの完全置き換え**
- **統一されたデザインシステムの適用**

## 🔄 STEP 2からの変更ポイント

### 置き換え対象ファイル

以下のSTEP 2で実装したファイルを全てHeroUI対応に置き換えます：

#### Server Components（置き換え対象）
- `src/app/todos/page.tsx` → HeroUI Cardsでレイアウト改善
- `src/app/todos/[id]/page.tsx` → HeroUI詳細表示
- `src/app/auth/login/page.tsx` → HeroUIログインフォーム
- `src/app/users/page.tsx` → HeroUIユーザー管理画面
- `src/app/users/me/page.tsx` → HeroUIプロフィール画面
- `src/app/users/[id]/page.tsx` → HeroUIユーザー詳細

#### Client Components（置き換え対象）
- `src/features/todos/components/TodoList.tsx` → HeroUI Todo一覧
- `src/features/todos/components/TodoDetail.tsx` → HeroUI Todo詳細
- `src/features/todos/components/TodoForm.tsx` → HeroUIフォーム
- `src/features/auth/login/components/LoginForm.tsx` → HeroUIログインフォーム
- `src/features/auth/register/components/RegisterForm.tsx` → HeroUI登録フォーム
- `src/features/users/components/UserList.tsx` → HeroUIユーザー一覧
- `src/features/users/components/UserProfile.tsx` → HeroUIプロフィール
- `src/features/users/components/UserDetail.tsx` → HeroUIユーザー詳細

#### Helper Files（そのまま流用）
- `src/lib/server-auth.ts` → 変更なし（認証ロジックは流用）
- `src/lib/data-fetchers.ts` → 変更なし（データ取得は流用）
- `src/lib/metadata.ts` → 変更なし（メタデータ生成は流用）

### 変更パターン例

#### 変更前（STEP 2）
```tsx
<div className="bg-white border rounded-lg p-4 shadow">
  <h3 className="font-bold">{todo.title}</h3>
  <p className="text-gray-600">{todo.content}</p>
  <button className="bg-blue-500 text-white px-4 py-2 rounded">
    編集
  </button>
</div>
```

#### 変更後（STEP 3）
```tsx
import { Card, CardHeader, CardBody, Button } from "@heroui/react";

<Card>
  <CardHeader>
    <h3>{todo.title}</h3>
  </CardHeader>
  <CardBody>
    <p>{todo.content}</p>
    <Button color="primary">編集</Button>
  </CardBody>
</Card>
```

## 🏗️ 技術スタック

### STEP2で実装済み（流用）
- `@/lib/server-auth` - サーバーサイド認証
- `@/lib/data-fetchers` - データ取得
- `@/lib/metadata` - メタデータ生成
- `@/domain/entities` - ドメインエンティティ
- `@/usecases` - ビジネスロジック

## 🚀 実装手順

### Server Components の置き換え

#### Todo一覧ページ
**ファイル**: `src/app/todos/page.tsx`

STEP2で実装したServer Component構造を維持しつつ、Client ComponentにHeroUIプロパティを渡すように変更：

```typescript
import { Metadata } from 'next';
import { Suspense } from 'react';
import { requireAuth } from '@/lib/server-auth';
import { getTodosByUserId } from '@/lib/data-fetchers';
import { generatePageMetadata } from '@/lib/metadata';
import TodoList from '@/features/todos/components/TodoList';

export const metadata: Metadata = generatePageMetadata({
  title: 'Todo一覧',
  description: 'あなたのTodoを管理できます',
});

export default async function TodosPage() {
  const { user } = await requireAuth();
  const initialTodos = await getTodosByUserId(user.id);

  return (
    <div className="container mx-auto py-8">
      <Suspense fallback={<div>Loading...</div>}>
        <TodoList initialTodos={initialTodos} user={user} />
      </Suspense>
    </div>
  );
}
```

#### ログインページ
**ファイル**: `src/app/auth/login/page.tsx`

```typescript
import { Metadata } from 'next';
import { redirectIfAuthenticated } from '@/lib/server-auth';
import { generatePageMetadata } from '@/lib/metadata';
import LoginForm from '@/features/auth/login/components/LoginForm';

export const metadata: Metadata = generatePageMetadata({
  title: 'ログイン',
  description: 'アカウントにログインしてください',
});

export default async function LoginPage() {
  await redirectIfAuthenticated();

  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoginForm />
    </div>
  );
}
```

#### Todo詳細ページ
**ファイル**: `src/app/todos/[id]/page.tsx`

```typescript
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requireAuth } from '@/lib/server-auth';
import { getTodoById } from '@/lib/data-fetchers';
import { generateTodoMetadata } from '@/lib/metadata';
import TodoDetail from '@/features/todos/components/TodoDetail';

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { user } = await requireAuth();
  const todo = await getTodoById(params.id, user.id);
  
  if (!todo) {
    return { title: 'Todo not found' };
  }
  
  return generateTodoMetadata(todo);
}

export default async function TodoDetailPage({ params }: Props) {
  const { user } = await requireAuth();
  const todo = await getTodoById(params.id, user.id);

  if (!todo) {
    notFound();
  }

  return (
    <div className="container mx-auto py-8">
      <TodoDetail initialTodo={todo} user={user} />
    </div>
  );
}
```

#### ユーザー一覧ページ（管理者専用）
**ファイル**: `src/app/users/page.tsx`

```typescript
import { Metadata } from 'next';
import { requireAdminAuth } from '@/lib/server-auth';
import { getAllUsers } from '@/lib/data-fetchers';
import { generatePageMetadata } from '@/lib/metadata';
import UserList from '@/features/users/components/UserList';

export const metadata: Metadata = generatePageMetadata({
  title: 'ユーザー管理',
  description: '管理者専用ユーザー管理画面',
});

export default async function UsersPage() {
  const { user } = await requireAdminAuth();
  const users = await getAllUsers();

  return (
    <div className="container mx-auto py-8">
      <UserList users={users} currentUser={user} />
    </div>
  );
}
```

#### プロフィールページ（ユーザー専用）
**ファイル**: `src/app/users/me/page.tsx`

```typescript
import { Metadata } from 'next';
import { requireAuth } from '@/lib/server-auth';
import { getUserById } from '@/lib/data-fetchers';
import { generateUserMetadata } from '@/lib/metadata';
import UserProfile from '@/features/users/components/UserProfile';

export const metadata: Metadata = generateUserMetadata({
  title: 'プロフィール',
  description: 'あなたのプロフィール情報',
});

export default async function ProfilePage() {
  const { user } = await requireAuth();
  const profileData = await getUserById(user.id);

  return (
    <div className="container mx-auto py-8">
      <UserProfile user={profileData} />
    </div>
  );
}
```

#### ユーザー詳細ページ（Dynamic Routes）
**ファイル**: `src/app/users/[id]/page.tsx`

```typescript
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requireAuth } from '@/lib/server-auth';
import { getUserById } from '@/lib/data-fetchers';
import { generateUserMetadata } from '@/lib/metadata';
import UserDetail from '@/features/users/components/UserDetail';

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { user } = await requireAuth();
  const targetUser = await getUserById(params.id);
  
  if (!targetUser) {
    return { title: 'User not found' };
  }
  
  return generateUserMetadata(targetUser);
}

export default async function UserDetailPage({ params }: Props) {
  const { user } = await requireAuth();
  const targetUser = await getUserById(params.id);

  if (!targetUser) {
    notFound();
  }

  // 権限チェック: 管理者または本人のみアクセス可能
  if (user.role !== 'admin' && user.id !== targetUser.id) {
    notFound();
  }

  return (
    <div className="container mx-auto py-8">
      <UserDetail 
        user={targetUser} 
        currentUser={user} 
        canEdit={user.role === 'admin' || user.id === targetUser.id}
      />
    </div>
  );
}
```

#### 登録ページ
**ファイル**: `src/app/auth/register/page.tsx`

```typescript
import { Metadata } from 'next';
import { redirectIfAuthenticated } from '@/lib/server-auth';
import { generatePageMetadata } from '@/lib/metadata';
import RegisterForm from '@/features/auth/register/components/RegisterForm';

export const metadata: Metadata = generatePageMetadata({
  title: 'アカウント登録',
  description: '新しいアカウントを作成してください',
});

export default async function RegisterPage() {
  await redirectIfAuthenticated();

  return (
    <div className="min-h-screen flex items-center justify-center">
      <RegisterForm />
    </div>
  );
}
```

#### Todo一覧ローディングページ
**ファイル**: `src/app/todos/loading.tsx`

```typescript
import { Card, CardHeader, CardBody, Skeleton } from "@heroui/react";

export default function TodosLoading() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <Skeleton className="h-8 w-32 rounded-lg" />
        <Skeleton className="h-10 w-40 rounded-lg" />
      </div>

      <div className="grid gap-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4 rounded-lg" />
            </CardHeader>
            <CardBody>
              <Skeleton className="h-4 w-full rounded-lg mb-2" />
              <Skeleton className="h-4 w-2/3 rounded-lg mb-4" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-16 rounded-lg" />
                <Skeleton className="h-8 w-16 rounded-lg" />
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

#### ユーザー詳細ローディングページ
**ファイル**: `src/app/users/[id]/loading.tsx`

```typescript
import { Card, CardHeader, CardBody, Skeleton, Avatar } from "@heroui/react";

export default function UserDetailLoading() {
  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="flex gap-3">
          <Avatar className="w-20 h-20" />
          <div className="flex flex-col gap-1 flex-1">
            <Skeleton className="h-8 w-48 rounded-lg" />
            <Skeleton className="h-6 w-32 rounded-lg" />
            <Skeleton className="h-4 w-24 rounded-lg" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-16 rounded-lg" />
            <Skeleton className="h-8 w-16 rounded-lg" />
          </div>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            <div>
              <Skeleton className="h-6 w-24 rounded-lg mb-2" />
              <Skeleton className="h-4 w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4 rounded-lg" />
            </div>
            <div>
              <Skeleton className="h-6 w-32 rounded-lg mb-2" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-16 rounded-lg" />
                <Skeleton className="h-16 rounded-lg" />
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
```

### Client Components の完全置き換え

#### Todo一覧コンポーネント
**ファイル**: `src/features/todos/components/TodoList.tsx`

STEP2の機能をHeroUIで完全に置き換え：

```typescript
"use client";

import { useState, useOptimistic } from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Textarea,
  useDisclosure,
} from "@heroui/react";
import { Todo } from '@/domain/entities/Todo';
import { User } from '@/domain/entities/User';

interface TodoListProps {
  initialTodos: Todo[];
  user: User;
}

export default function TodoList({ initialTodos, user }: TodoListProps) {
  const [todos, setTodos] = useState(initialTodos);
  const [optimisticTodos, addOptimisticTodo] = useOptimistic(
    todos,
    (currentTodos: Todo[], newTodo: Todo) => [...currentTodos, newTodo]
  );
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [newTodo, setNewTodo] = useState({ title: '', content: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.title.trim()) return;

    setIsLoading(true);
    
    const optimisticTodo: Todo = {
      id: Date.now().toString(),
      title: newTodo.title,
      content: newTodo.content,
      completed: false,
      userId: user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    addOptimisticTodo(optimisticTodo);

    try {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTodo),
      });

      if (response.ok) {
        const createdTodo = await response.json();
        setTodos(prev => [...prev, createdTodo]);
        setNewTodo({ title: '', content: '' });
        onClose();
      }
    } catch (error) {
      console.error('Todo作成エラー:', error);
    }
    
    setIsLoading(false);
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Todo一覧</h1>
        <Button color="primary" onPress={onOpen}>
          新しいTodoを作成
        </Button>
      </div>

      <div className="grid gap-4">
        {optimisticTodos.length === 0 ? (
          <Card>
            <CardBody className="text-center py-8">
              <p className="text-gray-500">まだTodoがありません</p>
              <Button color="primary" onPress={onOpen} className="mt-4">
                最初のTodoを作成
              </Button>
            </CardBody>
          </Card>
        ) : (
          optimisticTodos.map((todo) => (
            <Card key={todo.id}>
              <CardHeader>
                <h3 className="text-lg font-semibold">{todo.title}</h3>
              </CardHeader>
              <CardBody>
                <p className="text-gray-600">{todo.content}</p>
                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant="bordered">
                    編集
                  </Button>
                  <Button size="sm" color="danger" variant="bordered">
                    削除
                  </Button>
                </div>
              </CardBody>
            </Card>
          ))
        )}
      </div>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <form onSubmit={handleSubmit}>
            <ModalHeader>新しいTodoを作成</ModalHeader>
            <ModalBody>
              <Input
                label="タイトル"
                placeholder="Todoのタイトルを入力"
                value={newTodo.title}
                onChange={(e) => setNewTodo(prev => ({ ...prev, title: e.target.value }))}
                required
              />
              <Textarea
                label="内容"
                placeholder="Todoの詳細を入力"
                value={newTodo.content}
                onChange={(e) => setNewTodo(prev => ({ ...prev, content: e.target.value }))}
              />
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onClose}>
                キャンセル
              </Button>
              <Button 
                color="primary" 
                type="submit" 
                isLoading={isLoading}
              >
                作成
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </>
  );
}
```

#### ログインフォーム
**ファイル**: `src/features/auth/login/components/LoginForm.tsx`

```typescript
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardHeader,
  CardBody,
  Input,
  Button,
  Link,
} from "@heroui/react";

export default function LoginForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push('/todos');
      } else {
        setError('ログインに失敗しました');
      }
    } catch (error) {
      setError('ネットワークエラーが発生しました');
    }
    
    setIsLoading(false);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="flex flex-col gap-3">
        <h1 className="text-2xl font-bold">ログイン</h1>
      </CardHeader>
      <CardBody>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            label="メールアドレス"
            placeholder="email@example.com"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            required
          />
          <Input
            type="password"
            label="パスワード"
            placeholder="パスワードを入力"
            value={formData.password}
            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
            required
          />
          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}
          <Button 
            type="submit" 
            color="primary" 
            className="w-full"
            isLoading={isLoading}
          >
            ログイン
          </Button>
        </form>
        <div className="text-center mt-4">
          <Link href="/auth/register">
            アカウントをお持ちでない方はこちら
          </Link>
        </div>
      </CardBody>
    </Card>
  );
}
```

#### Todo詳細コンポーネント
**ファイル**: `src/features/todos/components/TodoDetail.tsx`

```typescript
"use client";

import { useState, useOptimistic } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Input,
  Textarea,
  Chip,
} from "@heroui/react";
import { Todo } from '@/domain/entities/Todo';
import { User } from '@/domain/entities/User';

interface TodoDetailProps {
  initialTodo: Todo;
  user: User;
}

export default function TodoDetail({ initialTodo, user }: TodoDetailProps) {
  const router = useRouter();
  const [todo, setTodo] = useState(initialTodo);
  const [optimisticTodo, updateOptimisticTodo] = useOptimistic(
    todo,
    (currentTodo: Todo, updates: Partial<Todo>) => ({ ...currentTodo, ...updates })
  );
  
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: todo.title,
    content: todo.content,
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    updateOptimisticTodo(editData);

    try {
      const response = await fetch(`/api/todos/${todo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      });

      if (response.ok) {
        const updatedTodo = await response.json();
        setTodo(updatedTodo);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Todo更新エラー:', error);
    }
    
    setIsLoading(false);
  };

  const handleDelete = async () => {
    if (!confirm('このTodoを削除しますか？')) return;

    setIsLoading(true);

    try {
      const response = await fetch(`/api/todos/${todo.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/todos');
      }
    } catch (error) {
      console.error('Todo削除エラー:', error);
    }
    
    setIsLoading(false);
  };

  const toggleStatus = async () => {
    const newStatus = !optimisticTodo.completed;
    updateOptimisticTodo({ completed: newStatus });

    try {
      const response = await fetch(`/api/todos/${todo.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: newStatus }),
      });

      if (response.ok) {
        const updatedTodo = await response.json();
        setTodo(updatedTodo);
      }
    } catch (error) {
      console.error('ステータス更新エラー:', error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader className="flex justify-between">
          <div>
            {isEditing ? (
              <Input
                value={editData.title}
                onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                className="text-2xl font-bold"
              />
            ) : (
              <h1 className="text-2xl font-bold">{optimisticTodo.title}</h1>
            )}
            <Chip 
              color={optimisticTodo.completed ? "success" : "default"}
              variant="flat"
              className="mt-2"
            >
              {optimisticTodo.completed ? "完了" : "未完了"}
            </Chip>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              color={optimisticTodo.completed ? "default" : "success"}
              variant="bordered"
              onClick={toggleStatus}
            >
              {optimisticTodo.completed ? "未完了にする" : "完了にする"}
            </Button>
            {isEditing ? (
              <>
                <Button
                  size="sm"
                  color="primary"
                  onClick={handleUpdate}
                  isLoading={isLoading}
                >
                  保存
                </Button>
                <Button
                  size="sm"
                  variant="light"
                  onClick={() => setIsEditing(false)}
                >
                  キャンセル
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="bordered"
                  onClick={() => setIsEditing(true)}
                >
                  編集
                </Button>
                <Button
                  size="sm"
                  color="danger"
                  variant="bordered"
                  onClick={handleDelete}
                  isLoading={isLoading}
                >
                  削除
                </Button>
              </>
            )}
          </div>
        </CardHeader>
        <CardBody>
          {isEditing ? (
            <form onSubmit={handleUpdate}>
              <Textarea
                label="内容"
                value={editData.content}
                onChange={(e) => setEditData(prev => ({ ...prev, content: e.target.value }))}
                rows={6}
              />
            </form>
          ) : (
            <p className="text-gray-700 whitespace-pre-wrap">
              {optimisticTodo.content || '内容が設定されていません'}
            </p>
          )}
          
          <div className="mt-6 text-sm text-gray-500">
            <p>作成日: {new Date(optimisticTodo.createdAt).toLocaleString('ja-JP')}</p>
            <p>更新日: {new Date(optimisticTodo.updatedAt).toLocaleString('ja-JP')}</p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
```

#### ユーザー一覧コンポーネント
**ファイル**: `src/features/users/components/UserList.tsx`

```typescript
"use client";

import { useState } from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  Chip,
} from "@heroui/react";
import { User } from '@/domain/entities/User';

interface UserListProps {
  users: User[];
  currentUser: User;
}

export default function UserList({ users, currentUser }: UserListProps) {
  const [userList, setUserList] = useState(users);
  const [isLoading, setIsLoading] = useState(false);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUserList(prev => 
          prev.map(user => user.id === userId ? updatedUser : user)
        );
      }
    } catch (error) {
      console.error('権限変更エラー:', error);
    }
    
    setIsLoading(false);
  };

  return (
    <div>
      <Card>
        <CardHeader>
          <h1 className="text-2xl font-bold">ユーザー管理</h1>
        </CardHeader>
        <CardBody>
          <Table aria-label="ユーザー一覧">
            <TableHeader>
              <TableColumn>名前</TableColumn>
              <TableColumn>メールアドレス</TableColumn>
              <TableColumn>権限</TableColumn>
              <TableColumn>登録日</TableColumn>
              <TableColumn>操作</TableColumn>
            </TableHeader>
            <TableBody>
              {userList.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip color={user.role === 'admin' ? 'warning' : 'default'}>
                      {user.role === 'admin' ? '管理者' : '一般ユーザー'}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    {new Date(user.createdAt).toLocaleDateString('ja-JP')}
                  </TableCell>
                  <TableCell>
                    {user.id !== currentUser.id && (
                      <Button
                        size="sm"
                        variant="bordered"
                        onClick={() => 
                          handleRoleChange(
                            user.id, 
                            user.role === 'admin' ? 'user' : 'admin'
                          )
                        }
                        isLoading={isLoading}
                      >
                        {user.role === 'admin' ? '一般ユーザーにする' : '管理者にする'}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>
    </div>
  );
}
```

#### 登録フォーム
**ファイル**: `src/features/auth/register/components/RegisterForm.tsx`

```typescript
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardHeader,
  CardBody,
  Input,
  Button,
  Link,
} from "@heroui/react";

export default function RegisterForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('パスワードが一致しません');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      if (response.ok) {
        router.push('/auth/login');
      } else {
        setError('登録に失敗しました');
      }
    } catch (error) {
      setError('ネットワークエラーが発生しました');
    }
    
    setIsLoading(false);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="flex flex-col gap-3">
        <h1 className="text-2xl font-bold">アカウント登録</h1>
      </CardHeader>
      <CardBody>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="名前"
            placeholder="山田太郎"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
          />
          <Input
            type="email"
            label="メールアドレス"
            placeholder="email@example.com"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            required
          />
          <Input
            type="password"
            label="パスワード"
            placeholder="パスワードを入力"
            value={formData.password}
            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
            required
          />
          <Input
            type="password"
            label="パスワード確認"
            placeholder="パスワードを再入力"
            value={formData.confirmPassword}
            onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
            required
          />
          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}
          <Button 
            type="submit" 
            color="primary" 
            className="w-full"
            isLoading={isLoading}
          >
            登録
          </Button>
        </form>
        <div className="text-center mt-4">
          <Link href="/auth/login">
            既にアカウントをお持ちの方はこちら
          </Link>
        </div>
      </CardBody>
    </Card>
  );
}
```

#### Todoフォーム
**ファイル**: `src/features/todos/components/TodoForm.tsx`

```typescript
"use client";

import { useState } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Textarea,
  Button,
  Select,
  SelectItem,
} from "@heroui/react";
import { Todo } from '@/domain/entities/Todo';

interface TodoFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TodoFormData) => Promise<void>;
  initialData?: Partial<Todo>;
  mode: 'create' | 'edit';
}

interface TodoFormData {
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
}

const priorityOptions = [
  { key: 'low', label: '低' },
  { key: 'medium', label: '中' },
  { key: 'high', label: '高' },
];

export default function TodoForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode,
}: TodoFormProps) {
  const [formData, setFormData] = useState<TodoFormData>({
    title: initialData?.title || '',
    content: initialData?.content || '',
    priority: 'medium',
    dueDate: initialData?.dueDate ? new Date(initialData.dueDate).toISOString().split('T')[0] : '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<TodoFormData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<TodoFormData> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'タイトルは必須です';
    } else if (formData.title.length > 100) {
      newErrors.title = 'タイトルは100文字以内で入力してください';
    }

    if (formData.content.length > 1000) {
      newErrors.content = '内容は1000文字以内で入力してください';
    }

    if (formData.dueDate && new Date(formData.dueDate) < new Date()) {
      newErrors.dueDate = '期日は現在以降の日時を設定してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      await onSubmit(formData);
      setFormData({
        title: '',
        content: '',
        priority: 'medium',
        dueDate: '',
      });
      onClose();
    } catch (error) {
      console.error('フォーム送信エラー:', error);
    }
    
    setIsLoading(false);
  };

  const handleClose = () => {
    setFormData({
      title: '',
      content: '',
      priority: 'medium',
      dueDate: '',
    });
    setErrors({});
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <ModalContent>
        <form onSubmit={handleSubmit}>
          <ModalHeader>
            {mode === 'create' ? '新しいTodoを作成' : 'Todoを編集'}
          </ModalHeader>
          <ModalBody className="space-y-4">
            <Input
              label="タイトル"
              placeholder="Todoのタイトルを入力"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              isInvalid={!!errors.title}
              errorMessage={errors.title}
              required
            />
            <Textarea
              label="内容"
              placeholder="Todoの詳細を入力"
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              rows={4}
              isInvalid={!!errors.content}
              errorMessage={errors.content}
            />
            <Select
              label="優先度"
              placeholder="優先度を選択"
              selectedKeys={[formData.priority]}
              onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as 'low' | 'medium' | 'high' }))}
            >
              {priorityOptions.map((option) => (
                <SelectItem key={option.key} value={option.key}>
                  {option.label}
                </SelectItem>
              ))}
            </Select>
            <Input
              type="date"
              label="期日"
              value={formData.dueDate}
              onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
              isInvalid={!!errors.dueDate}
              errorMessage={errors.dueDate}
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={handleClose}>
              キャンセル
            </Button>
            <Button 
              color="primary" 
              type="submit" 
              isLoading={isLoading}
            >
              {mode === 'create' ? '作成' : '更新'}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
```

#### ユーザープロフィール
**ファイル**: `src/features/users/components/UserProfile.tsx`

```typescript
"use client";

import { useState } from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Input,
  Textarea,
  Avatar,
  Chip,
} from "@heroui/react";
import { User } from '@/domain/entities/User';

interface UserProfileProps {
  user: User;
}

export default function UserProfile({ user }: UserProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: user.name,
    bio: user.bio || '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/users/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      });

      if (response.ok) {
        setIsEditing(false);
        // 必要に応じてページを更新
        window.location.reload();
      }
    } catch (error) {
      console.error('プロフィール更新エラー:', error);
    }
    
    setIsLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader className="flex justify-between">
          <div className="flex gap-3">
            <Avatar
              src={user.avatar}
              name={user.name}
              size="lg"
            />
            <div>
              {isEditing ? (
                <Input
                  value={editData.name}
                  onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                  className="text-xl font-bold"
                  placeholder="名前を入力"
                />
              ) : (
                <h1 className="text-xl font-bold">{user.name}</h1>
              )}
              <p className="text-gray-600">{user.email}</p>
              <Chip 
                color={user.role === 'admin' ? 'warning' : 'default'}
                size="sm"
                className="mt-1"
              >
                {user.role === 'admin' ? '管理者' : '一般ユーザー'}
              </Chip>
            </div>
          </div>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button
                  color="primary"
                  onClick={handleUpdate}
                  isLoading={isLoading}
                >
                  保存
                </Button>
                <Button
                  variant="light"
                  onClick={() => setIsEditing(false)}
                >
                  キャンセル
                </Button>
              </>
            ) : (
              <Button
                variant="bordered"
                onClick={() => setIsEditing(true)}
              >
                編集
              </Button>
            )}
          </div>
        </CardHeader>
        <CardBody>
          {isEditing ? (
            <form onSubmit={handleUpdate}>
              <Textarea
                label="自己紹介"
                placeholder="自己紹介を入力してください"
                value={editData.bio}
                onChange={(e) => setEditData(prev => ({ ...prev, bio: e.target.value }))}
                rows={4}
              />
            </form>
          ) : (
            <div>
              <h3 className="font-semibold mb-2">自己紹介</h3>
              <p className="text-gray-700 whitespace-pre-wrap">
                {user.bio || '自己紹介が設定されていません'}
              </p>
            </div>
          )}
          
          <div className="mt-6">
            <h3 className="font-semibold mb-2">アカウント情報</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>登録日: {new Date(user.createdAt).toLocaleDateString('ja-JP')}</p>
              <p>最終更新: {new Date(user.updatedAt).toLocaleDateString('ja-JP')}</p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* 活動統計 */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">活動統計</h2>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">-</p>
              <p className="text-sm text-gray-600">作成したTodo</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">-</p>
              <p className="text-sm text-gray-600">完了したTodo</p>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
```

#### ユーザー詳細コンポーネント
**ファイル**: `src/features/users/components/UserDetail.tsx`

```typescript
"use client";

import { useState } from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Avatar,
  Chip,
  Divider,
} from "@heroui/react";
import { User } from '@/domain/entities/User';

interface UserDetailProps {
  user: User;
  currentUser: User;
  canEdit: boolean;
}

export default function UserDetail({ user, currentUser, canEdit }: UserDetailProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleRoleChange = async () => {
    if (!confirm(`${user.name}の権限を変更しますか？`)) return;

    setIsLoading(true);
    const newRole = user.role === 'admin' ? 'user' : 'admin';

    try {
      const response = await fetch(`/api/users/${user.id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        window.location.reload();
      }
    } catch (error) {
      console.error('権限変更エラー:', error);
    }
    
    setIsLoading(false);
  };

  const handleDeleteUser = async () => {
    if (!confirm(`${user.name}のアカウントを削除しますか？この操作は取り消せません。`)) return;

    setIsLoading(true);

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        window.location.href = '/users';
      }
    } catch (error) {
      console.error('ユーザー削除エラー:', error);
    }
    
    setIsLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader className="flex justify-between">
          <div className="flex gap-3">
            <Avatar
              src={user.avatar}
              name={user.name}
              size="lg"
            />
            <div>
              <h1 className="text-xl font-bold">{user.name}</h1>
              <p className="text-gray-600">{user.email}</p>
              <Chip 
                color={user.role === 'admin' ? 'warning' : 'default'}
                size="sm"
                className="mt-1"
              >
                {user.role === 'admin' ? '管理者' : '一般ユーザー'}
              </Chip>
            </div>
          </div>
          
          {canEdit && currentUser.role === 'admin' && currentUser.id !== user.id && (
            <div className="flex gap-2">
              <Button
                variant="bordered"
                onClick={handleRoleChange}
                isLoading={isLoading}
              >
                {user.role === 'admin' ? '一般ユーザーにする' : '管理者にする'}
              </Button>
              <Button
                color="danger"
                variant="bordered"
                onClick={handleDeleteUser}
                isLoading={isLoading}
              >
                削除
              </Button>
            </div>
          )}
        </CardHeader>
        <CardBody>
          <div>
            <h3 className="font-semibold mb-2">自己紹介</h3>
            <p className="text-gray-700 whitespace-pre-wrap">
              {user.bio || '自己紹介が設定されていません'}
            </p>
          </div>
          
          <Divider className="my-4" />
          
          <div>
            <h3 className="font-semibold mb-2">アカウント情報</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>ユーザーID: {user.id}</p>
              <p>登録日: {new Date(user.createdAt).toLocaleDateString('ja-JP')}</p>
              <p>最終更新: {new Date(user.updatedAt).toLocaleDateString('ja-JP')}</p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* 活動統計 */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">活動統計</h2>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">-</p>
              <p className="text-sm text-gray-600">作成したTodo</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">-</p>
              <p className="text-sm text-gray-600">完了したTodo</p>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
```

## 🎨 HeroUIの基本的な使い方

### よく使うコンポーネント

#### Button（ボタン）
```typescript
// 基本的なボタン
<Button>クリック</Button>

// カラーバリエーション
<Button color="primary">プライマリ</Button>
<Button color="secondary">セカンダリ</Button>
<Button color="success">成功</Button>
<Button color="warning">警告</Button>
<Button color="danger">危険</Button>

// サイズ
<Button size="sm">小</Button>
<Button size="md">中</Button>
<Button size="lg">大</Button>
```

#### Input（入力フィールド）
```typescript
// 基本的な入力フィールド
<Input label="ラベル" placeholder="プレースホルダー" />

// バリエーション
<Input variant="flat" label="フラット" />
<Input variant="bordered" label="ボーダー" />
<Input variant="underlined" label="アンダーライン" />

// 入力タイプ
<Input type="email" label="メールアドレス" />
<Input type="password" label="パスワード" />
```

#### Card（カード）
```typescript
// 基本的なカード
<Card>
  <CardHeader>
    <h3>タイトル</h3>
  </CardHeader>
  <CardBody>
    <p>コンテンツ</p>
  </CardBody>
</Card>

// シャドウ付きカード
<Card shadow="md">
  <CardBody>
    <p>シャドウ付きコンテンツ</p>
  </CardBody>
</Card>
```

## ✅ 完了チェックリスト

STEP 3を完了するために、以下の項目をチェックしてください：

- [ ] STEP2の全てのServer Componentsを更新した
- [ ] STEP2の全てのClient ComponentsをHeroUI対応に置き換えた
- [ ] Todo一覧・詳細・作成機能がHeroUIで動作する
- [ ] ログイン・登録フォームがHeroUIで動作する
- [ ] ユーザー管理画面がHeroUIで動作する

## 🎯 次のステップ

STEP 3が完了したら、次は以下を学習できます：

- データベース連携の実装
- 認証システムの強化
- テスト実装
- デプロイメント

## 📚 参考資料

- [HeroUI公式ドキュメント](https://heroui.dev/)
- [HeroUIコンポーネント一覧](https://heroui.dev/components)
- [Next.js公式ドキュメント](https://nextjs.org/docs)

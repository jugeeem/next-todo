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
- 登録成功後は `/login` にリダイレクト
- **エラーレスポンス**: APIレスポンスの `error` フィールドからエラーメッセージを取得
  ```typescript
  const errorData = await response.json();
  throw new Error(errorData.error || 'ユーザー登録に失敗しました');
  ```
- **ユーザーロール**: 登録時に `role: 4` を自動設定

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
- ヘッダーナビゲーション（ユーザー管理リンクを含む）

**必要な状態管理**:
```typescript
const [todos, setTodos] = useState<Todo[]>([])
const [page, setPage] = useState<number>(1)
const [paginationInfo, setPaginationInfo] = useState<PaginationInfo | null>(null) // ページネーション情報
const [completedFilter, setCompletedFilter] = useState<'all' | 'completed' | 'incomplete'>('all')
const [sortBy, setSortBy] = useState<'createdAt' | 'updatedAt' | 'title'>('createdAt')
const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc') // デフォルトは降順
const [newTodoTitle, setNewTodoTitle] = useState<string>('')
const [newTodoDescription, setNewTodoDescription] = useState<string>('')
const [isLoading, setIsLoading] = useState<boolean>(false)
const [isCreating, setIsCreating] = useState<boolean>(false) // Todo作成中フラグ
const [error, setError] = useState<string>('')
const [currentUserRole, setCurrentUserRole] = useState<number>(4) // 現在のユーザーのロール
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
- **APIレスポンス構造**: レスポンスは入れ子構造になっている
  ```typescript
  // APIレスポンス: { success: true, data: { data: [...], total, page, perPage, totalPages } }
  const responseData = data.data;
  setTodos(responseData.data || []);
  setPaginationInfo({
    currentPage: responseData.page,
    totalPages: responseData.totalPages,
    totalItems: responseData.total,
    itemsPerPage: responseData.perPage,
  });
  ```
- **ページネーション情報型**: `PaginationInfo` インターフェースを定義
  ```typescript
  interface PaginationInfo {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  }
  ```
- **フィルター変更時**: ページを1にリセット
- **認証エラー処理**: 401レスポンスの場合はログインページにリダイレクト
- **ソート順デフォルト**: `desc`（降順）に設定し、新しいTodoが上に表示されるようにする
- **ユーザーロール取得**: ページ読み込み時に現在のユーザー情報を取得してロールを設定
  ```typescript
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await fetch('/api/users/me');
        if (response.ok) {
          const data = await response.json();
          setCurrentUserRole(data.data.role);
        }
      } catch (err) {
        console.error('Failed to fetch user info:', err);
      }
    };
    
    fetchUserInfo();
  }, []);
  ```
- **ヘッダーナビゲーション**: ADMIN・MANAGER（role <= 2）の場合のみユーザー管理リンクを表示
  ```typescript
  <nav className="flex items-center gap-4">
    <Link href="/todos">Todo一覧</Link>
    <Link href="/profile">プロフィール</Link>
    {currentUserRole <= 2 && (
      <Link href="/users">ユーザー管理</Link>
    )}
    <button onClick={handleLogout}>ログアウト</button>
  </nav>
  ```

---

#### `/todos/[id]` - Todo 詳細/編集ページ
**ファイル**: `src/features/todos/TodoDetailPage.tsx`

**主な機能**:
- Todo の詳細情報表示
- Todo の編集フォーム（タイトル、説明）
- 保存ボタン
- キャンセルボタン（一覧に戻る）
- 削除ボタン
- ヘッダーナビゲーション（ユーザー管理リンクを含む）
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
const [currentUserRole, setCurrentUserRole] = useState<number>(4) // 現在のユーザーのロール
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
- **ユーザーロール取得**: ページ読み込み時に現在のユーザー情報を取得してロールを設定
  ```typescript
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch('/api/users/me');
        if (response.ok) {
          const data = await response.json();
          setCurrentUserRole(data.data.role);
        }
      } catch (err) {
        console.error('Failed to fetch current user:', err);
      }
    };
    
    fetchCurrentUser();
  }, []);
  ```
- **ヘッダーナビゲーション**: ADMIN・MANAGER（role <= 2）の場合のみユーザー管理リンクを表示
  ```typescript
  <nav className="flex items-center gap-4">
    <Link href="/todos">Todo一覧</Link>
    <Link href="/profile">プロフィール</Link>
    {currentUserRole <= 2 && (
      <Link href="/users">ユーザー管理</Link>
    )}
    <button onClick={handleLogout}>ログアウト</button>
  </nav>
  ```

---

### 2.3 プロフィールページ

#### `/profile` - プロフィールページ
**ファイル**: `src/features/profile/ProfilePage.tsx`

**主な機能**:
- ユーザー情報の表示（名前、ユーザー名）
- ユーザー情報の編集フォーム
- Todo 統計情報の表示（総数、完了数、未完了数、完了率）
- 自分の Todo 一覧表示（簡易版）
- パスワード変更フォーム
- ヘッダーナビゲーション（ユーザー管理リンクを含む）
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
const [confirmPassword, setConfirmPassword] = useState<string>('') // パスワード確認用
const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false)
const [isChangingPassword, setIsChangingPassword] = useState<boolean>(false)
const [isLoading, setIsLoading] = useState<boolean>(false)
const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false) // プロフィール保存中フラグ
const [isSavingPassword, setIsSavingPassword] = useState<boolean>(false) // パスワード保存中フラグ
const [error, setError] = useState<string>('')
const [passwordError, setPasswordError] = useState<string>('') // パスワード変更用エラー
const [successMessage, setSuccessMessage] = useState<string>('') // 成功メッセージ
```

**API エンドポイント**:
- ユーザー情報取得: `GET /api/users/me`
- ユーザー情報更新: `PATCH /api/users/me` (HTTPメソッドは `PATCH`)
- Todo 統計取得: `GET /api/users/me/todos/stats`
- Todo 一覧取得: `GET /api/users/me/todos`
- パスワード変更: `PUT /api/users/me/password`
- ログアウト: `POST /api/auth/logout`

**実装のポイント**:
- 初回レンダリング時に3つのAPIを並行して呼び出し (`Promise.all` を使用)
- プロフィール編集とパスワード変更は別々のセクションに分ける
- ログアウト後は `/login` にリダイレクト
- **パスワード変更**: 新しいパスワードと確認用パスワードの一致をチェック
  ```typescript
  if (newPassword !== confirmPassword) {
    setPasswordError('新しいパスワードとパスワード確認が一致しません');
    return;
  }
  ```
- **成功メッセージ**: 更新成功時は3秒後に自動的にメッセージを消去
- **Todo統計のフィールド名**: `totalTodos`, `completedTodos`, `pendingTodos`, `completionRate`
- **エラー分離**: プロフィール編集とパスワード変更でエラー状態を分離 (`error` と `passwordError`)
- **ローディング状態の分離**: 全体、プロフィール、パスワードでローディング状態を分離
- **認証エラー処理**: 401レスポンスの場合はログインページにリダイレクト
- **ヘッダーナビゲーション**: ADMIN・MANAGER（role <= 2）の場合のみユーザー管理リンクを表示
  ```typescript
  <nav className="flex items-center gap-4">
    <Link href="/todos">Todo一覧</Link>
    <Link href="/profile">プロフィール</Link>
    {user && user.role <= 2 && (
      <Link href="/users">ユーザー管理</Link>
    )}
    <button onClick={handleLogout}>ログアウト</button>
  </nav>
  ```

---

### 2.4 管理者機能ページ（ADMIN・MANAGER専用）

#### `/users` - ユーザー一覧ページ
**ファイル**: `src/features/users/UserListPage.tsx`

**アクセス権限**: `role >= 2` (ADMIN: 1, MANAGER: 2 のみアクセス可能)

**主な機能**:
- 全ユーザーの一覧表示
- ページネーション（前ページ/次ページボタン）
- ロールフィルタリング(全て/ADMIN/MANAGER/USER/GUEST)
- ソート機能(作成日時/更新日時/ユーザー名)
- ユーザー検索(ユーザー名、名前での検索)
- ユーザー詳細ページへのリンク
- ユーザー削除(ADMIN のみ、自分自身は削除不可)

**必要な状態管理**:
```typescript
const [users, setUsers] = useState<User[]>([])
const [page, setPage] = useState<number>(1)
const [paginationInfo, setPaginationInfo] = useState<PaginationInfo | null>(null)
const [roleFilter, setRoleFilter] = useState<number | 'all'>('all')
const [sortBy, setSortBy] = useState<'createdAt' | 'username' | 'firstName' | 'lastName' | 'role'>('createdAt');
const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
const [searchQuery, setSearchQuery] = useState<string>('')
const [isLoading, setIsLoading] = useState<boolean>(false)
const [error, setError] = useState<string>('')
const [currentUserRole, setCurrentUserRole] = useState<number>(4) // 現在のユーザーのロール
const [currentUserId, setCurrentUserId] = useState<string>('') // 現在のユーザーのID
```

**API エンドポイント**:
- 一覧取得: `GET /api/users?page=1&perPage=20&roleFilter=all&sortBy=createdAt&sortOrder=desc&search=`
- 削除: `DELETE /api/users/[id]` (ADMIN のみ)

**実装のポイント**:
- ページアクセス時に現在のユーザー情報を取得し、`role < 2` の場合は `/todos` にリダイレクト
- ADMIN (role: 1) のみ削除ボタンを表示
- 自分自身のユーザーは削除ボタンを非表示
- ユーザー検索は API 側でのフィルタリング(部分一致検索)
- ロールは数値と文字列の対応表示
  ```typescript
  const roleLabels: Record<number, string> = {
    1: 'ADMIN',
    2: 'MANAGER',
    3: 'USER',
    4: 'GUEST',
  }
  ```
- **権限チェック**: ページ表示前に権限確認
  ```typescript
  useEffect(() => {
    const checkPermission = async () => {
      const response = await fetch('/api/users/me');
      const data = await response.json();
      if (data.data.role >= 3) {
        router.push('/todos'); // 権限なしの場合リダイレクト
        return;
      }
      setCurrentUserRole(data.data.role);
      setCurrentUserId(data.data.id);
    };
    checkPermission();
  }, []);
  ```

---

#### `/users/[id]` - ユーザー詳細ページ
**ファイル**: `src/features/users/UserDetailPage.tsx`

**アクセス権限**: `role >= 2` (ADMIN・MANAGER のみアクセス可能)

**主な機能**:
- ユーザーの詳細情報表示(ユーザー名、名前、ロール)
- ユーザー情報の編集フォーム(ADMIN のみ、ロール変更可能)
- ユーザーの Todo 一覧表示
- ユーザー削除(ADMIN のみ、自分自身は削除不可)
- パスワードリセット機能(将来実装)
- ローディング状態の表示
- エラーメッセージの表示

**必要な状態管理**:
```typescript
const [user, setUser] = useState<User | null>(null)
const [firstName, setFirstName] = useState<string>('')
  const [lastName, setLastName] = useState<string>('')
  const [role, setRole] = useState<number>(4)
  const [todos, setTodos] = useState<Todo[]>([])
  const [isEditing, setIsEditing] = useState<boolean>(false)
const [isLoading, setIsLoading] = useState<boolean>(false)
const [isSaving, setIsSaving] = useState<boolean>(false)
const [error, setError] = useState<string>('')
const [successMessage, setSuccessMessage] = useState<string>('')
const [currentUserRole, setCurrentUserRole] = useState<number>(4) // 現在のユーザーのロール
const [currentUserId, setCurrentUserId] = useState<string>('') // 現在のユーザーのID
```

**API エンドポイント**:
- ユーザー情報取得: `GET /api/users/[id]`
- ユーザー情報更新: `PATCH /api/users/[id]` (ADMIN のみ)
- ユーザー削除: `DELETE /api/users/[id]` (ADMIN のみ)
- Todo 一覧取得: `GET /api/users/[id]/todos?page=1&perPage=10`

**実装のポイント**:
- 初回レンダリング時に権限チェックと2つのAPIを並行して呼び出し
- ADMIN (role: 1) のみ編集・削除ボタンを表示
- MANAGER (role: 2) は閲覧のみ可能
- 自分自身のユーザーは削除ボタンを非表示
- ロール変更は ADMIN のみ可能
- **権限別の表示制御**:
  ```typescript
  // 編集ボタン: ADMIN のみ
  {currentUserRole === 1 && !isEditing && (
    <button onClick={() => setIsEditing(true)}>編集</button>
  )}
  
  // 削除ボタン: ADMIN のみ、かつ自分自身でない
  {currentUserRole === 1 && user?.id !== currentUserId && (
    <button onClick={() => handleDelete()}>削除</button>
  )}
  ```
- **ロール選択フォーム**: ADMIN のみ表示
  ```typescript
  {currentUserRole === 1 && isEditing && (
    <select value={role} onChange={(e) => setRole(Number(e.target.value))}>
      <option value={1}>ADMIN</option>
      <option value={2}>MANAGER</option>
      <option value={3}>USER</option>
      <option value={4}>GUEST</option>
    </select>
  )}
  ```
- 更新成功後は編集モードを解除して最新データを表示
- 削除成功後はユーザー一覧ページにリダイレクト

---

#### `/users/create` - ユーザー作成ページ（オプション）
**ファイル**: `src/features/users/CreateUserPage.tsx`

**アクセス権限**: `role >= 2` (ADMIN・MANAGER のみアクセス可能)

**主な機能**:
- 新規ユーザーの作成フォーム
- ユーザー名、パスワード、名前、ロールの入力
- バリデーション（重複チェック、文字数チェック）
- 作成ボタン
- キャンセルボタン（一覧に戻る）
- ローディング状態の表示
- エラーメッセージの表示

**必要な状態管理**:
```typescript
const [username, setUsername] = useState<string>('')
const [password, setPassword] = useState<string>('')
const [confirmPassword, setConfirmPassword] = useState<string>('')
const [firstName, setFirstName] = useState<string>('')
const [lastName, setLastName] = useState<string>('')
const [role, setRole] = useState<number>(4)
const [isCreating, setIsCreating] = useState<boolean>(false)
const [error, setError] = useState<string>('')
const [currentUserRole, setCurrentUserRole] = useState<number>(4)
```

**API エンドポイント**:
- ユーザー作成: `POST /api/users` (ADMIN・MANAGER のみ)

**実装のポイント**:
- ページアクセス時に権限チェック
- パスワードと確認用パスワードの一致をチェック
- ロール選択は現在のユーザーのロール以下のみ選択可能
  - ADMIN (role: 1): すべてのロールを選択可能
  - MANAGER (role: 2): MANAGER、USER、GUEST のみ選択可能
- ユーザー名の重複チェックはサーバー側で実施
- 作成成功後はユーザー一覧ページにリダイレクト
- **ロール制約**:
  ```typescript
  // MANAGER は自分より上位のロール（ADMIN）を作成できない
  const availableRoles = currentUserRole === 1 
    ? [1, 2, 3, 4] 
    : [2, 3, 4];
  ```

---

## 3. 共通実装パターン

### 3.1 API 呼び出しパターン

**重要**: エラーレスポンスの構造に注意
- 成功レスポンス: `{ success: true, data: T, message?: string }`
- エラーレスポンス: `{ success: false, error: string }` ※ `error` フィールドを使用
- ページネーション付きレスポンス: `{ success: true, data: { data: [...], total, page, perPage, totalPages } }`

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
      // 注意: エラーメッセージは errorData.error から取得
      throw new Error(errorData.error || 'Failed to create data')
    }
    
    const data = await response.json()
    // 成功時の処理
  } catch (err) {
    setError(err instanceof Error ? err.message : 'An error occurred')
  } finally {
    setIsLoading(false)
  }
}

// ページネーション付きAPIの例
const fetchPaginatedData = async (page: number) => {
  try {
    const response = await fetch(`/api/todos?page=${page}&perPage=20`)
    const data = await response.json()
    
    // レスポンスは入れ子構造: { success: true, data: { data: [...], total, page, perPage, totalPages } }
    const responseData = data.data
    setItems(responseData.data || [])
    setPaginationInfo({
      currentPage: responseData.page,
      totalPages: responseData.totalPages,
      totalItems: responseData.total,
      itemsPerPage: responseData.perPage,
    })
  } catch (err) {
    setError(err instanceof Error ? err.message : 'An error occurred')
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

### 3.5 権限チェックパターン

```typescript
// ページコンポーネント内での権限チェック
const [hasPermission, setHasPermission] = useState<boolean>(false)
const [isCheckingPermission, setIsCheckingPermission] = useState<boolean>(true)

useEffect(() => {
  const checkPermission = async () => {
    try {
      const response = await fetch('/api/users/me')
      
      if (response.status === 401) {
        router.push('/login')
        return
      }
      
      const data = await response.json()
      const userRole = data.data.role
      
      // ADMIN・MANAGER のみアクセス可能
      if (userRole >= 3) {
        router.push('/todos') // 権限なしの場合リダイレクト
        return
      }
      
      setHasPermission(true)
    } catch (err) {
      console.error('Permission check error:', err)
      router.push('/login')
    } finally {
      setIsCheckingPermission(false)
    }
  }
  
  checkPermission()
}, [router])

// ページレンダリング
if (isCheckingPermission) {
  return <div>権限を確認中...</div>
}

if (!hasPermission) {
  return null // リダイレクト中は何も表示しない
}

// 権限がある場合のみページ内容を表示
return (
  <div>
    {/* ページコンテンツ */}
  </div>
)
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

### 4.5 管理者機能用スタイル
- ユーザーリストアイテム: `flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 transition-colors`
- ロールバッジ:
  - ADMIN: `px-2 py-1 text-xs font-semibold rounded bg-red-100 text-red-800`
  - MANAGER: `px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800`
  - USER: `px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-800`
  - GUEST: `px-2 py-1 text-xs font-semibold rounded bg-gray-100 text-gray-800`
- 統計情報カード: `bg-gray-50 rounded-lg p-3 text-center`
- 危険な操作ボタン（削除）: `px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors`

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
├── profile/
    └── page.tsx            # プロフィールページ（/profile）
└── users/
    ├── page.tsx            # ユーザー一覧ページ（/users）※ADMIN・MANAGER専用
    ├── create/
    │   └── page.tsx        # ユーザー作成ページ（/users/create）※ADMIN・MANAGER専用
    └── [id]/
        └── page.tsx        # ユーザー詳細ページ（/users/[id]）※ADMIN・MANAGER専用
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

### 6.3 権限エラー
- アクセス権限なし (403): 「この機能にアクセスする権限がありません」と表示し、`/todos` にリダイレクト
- ページアクセス時の権限チェック:
  ```typescript
  useEffect(() => {
    const checkPermission = async () => {
      const response = await fetch('/api/users/me');
      if (!response.ok) {
        router.push('/login');
        return;
      }
      const data = await response.json();
      if (data.data.role >= 3) {
        // 権限不足の場合
        router.push('/todos');
        return;
      }
    };
    checkPermission();
  }, []);
  ```

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
- **ユーザー管理へのリンク** (ADMIN・MANAGER のみ表示)
- ログアウトボタン

**権限別ナビゲーション表示**:
```typescript
// ヘッダーコンポーネント内（TodoListPage.tsx を含むすべてのページ）
const [currentUserRole, setCurrentUserRole] = useState<number>(4);

useEffect(() => {
  const fetchUserInfo = async () => {
    try {
      const response = await fetch('/api/users/me');
      if (response.ok) {
        const data = await response.json();
        setCurrentUserRole(data.data.role);
      }
    } catch (err) {
      console.error('Failed to fetch user info:', err);
    }
  };
  
  fetchUserInfo();
}, []);

// ナビゲーション表示（Tailwind CSS でスタイリング）
<nav className="flex items-center gap-4">
  <Link href="/todos" className="text-gray-700 hover:text-blue-500 font-medium">
    Todo一覧
  </Link>
  <Link href="/profile" className="text-gray-700 hover:text-blue-500 font-medium">
    プロフィール
  </Link>
  {currentUserRole <= 2 && (
    <Link href="/users" className="text-gray-700 hover:text-blue-500 font-medium">
      ユーザー管理
    </Link>
  )}
  <button
    type="button"
    onClick={handleLogout}
    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
  >
    ログアウト
  </button>
</nav>
```

**実装のポイント**:
- `currentUserRole` は初期値を `4` (GUEST) に設定し、API取得成功時に更新
- `currentUserRole <= 2` の条件で ADMIN (role: 1) と MANAGER (role: 2) のみユーザー管理リンクを表示
- ユーザーロール情報の取得はページごとに実施（認証状態が変わる可能性があるため）
- API取得に失敗した場合はコンソールにエラーログを出力し、デフォルト値（GUEST）のまま継続

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
  role: number       // 1: ADMIN, 2: MANAGER, 3: USER, 4: GUEST
  createdAt: string
  updatedAt: string
}

// ロール定義
enum UserRole {
  ADMIN = 1,    // 全権限（すべての操作が可能）
  MANAGER = 2,  // ユーザー閲覧・作成権限
  USER = 3,     // 一般ユーザー
  GUEST = 4,    // ゲストユーザー（制限あり）
}

// ロールラベル
const roleLabels: Record<number, string> = {
  1: 'ADMIN',
  2: 'MANAGER',
  3: 'USER',
  4: 'GUEST',
}

// Todo 統計型（例）
interface TodoStats {
  totalTodos: number      // 総Todo数
  completedTodos: number  // 完了済みTodo数
  pendingTodos: number    // 未完了Todo数
  completionRate: number  // 完了率（パーセンテージ）
}

// ページネーション情報型
interface PaginationInfo {
  currentPage: number   // 現在のページ番号
  totalPages: number    // 総ページ数
  totalItems: number    // 総アイテム数
  itemsPerPage: number  // 1ページあたりのアイテム数
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

### 9.4 管理者機能（ADMIN・MANAGER専用）
- [ ] ユーザー一覧表示
- [ ] ユーザー検索・フィルタリング
- [ ] ユーザー詳細表示
- [ ] ユーザー情報編集（ADMIN のみ）
- [ ] ユーザー削除（ADMIN のみ、自分以外）
- [ ] 新規ユーザー作成
- [ ] 権限別の表示制御
- [ ] ページネーション
- [ ] ソート機能
- [ ] 各ユーザーの Todo 統計表示

### 9.5 共通機能
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

**Document Version**: 1.3.0  
**Last Updated**: 2025-10-27  
**Changes**:
- v1.3.0 (2025-10-27): TodoDetailPage と ProfilePage のヘッダーナビゲーションにユーザー管理リンクの実装詳細を追加
- v1.2.0 (2025-10-26): TodoListPageのヘッダーナビゲーションにユーザー管理リンクの実装詳細を追加
- v1.1.0 (2025-10-26): ADMIN・MANAGER向けユーザー管理機能の基本設計を追加
- v1.0.0 (2025-10-24): 初版作成

# STEP 5: 状態管理とカスタムフック カリキュラム

## 🎯 目標

STEP 4で構築したコンポーネント設計を基盤として、Reactの基本的な状態管理パターンを学びます。useState から始まり、カスタムフック、Context API の基本的な使い方を習得し、プロップドリリングを解決して、より保守性の高いコンポーネント間のデータ共有を実現します。

## 📋 学習成果

このSTEPを完了すると、以下のスキルが身につきます：

- **カスタムフックによる状態ロジックの再利用**
- **Context APIを使ったグローバル状態の基本的な管理**
- **プロップドリリング問題の理解と解決方法**
- **useState、useEffect の効果的な使い方**
- **簡単なAPI呼び出しと状態管理の連携**
- **基本的なエラーハンドリングとローディング状態管理**

## 🔄 STEP 4からの変更ポイント

### 変更前（STEP 4）
- 各コンポーネント内での個別のuseState使用
- propsによる状態の受け渡し（プロップドリリング）
- コンポーネント内での直接的なAPI呼び出し
- 重複したロジックの散在

### 変更後（STEP 5）
- カスタムフックによる状態ロジックの共通化
- Context APIによる認証状態のグローバル管理
- 簡潔なAPI呼び出しパターンの確立
- 基本的なエラーハンドリングの統一化

## 🏗️ 基本設計原則

### 1. シンプルな責任分離
各フックとコンテキストは1つの明確な目的を持つ

### 2. 段階的な複雑性
useState → カスタムフック → Context API の順で学習

### 3. 実用的なパターン
実際の開発でよく使われる基本パターンに焦点

### 4. 理解しやすい構造
過度な抽象化を避け、直感的に理解できる設計

## 🚀 実装手順

### Phase 1: 基本的なカスタムフックの作成

#### 1.1 Todo管理用カスタムフック

**ファイル:** `src/hooks/useTodos.ts`

**学習ポイント:**
- useState と useEffect の基本的な組み合わせ
- カスタムフックによる状態ロジックの分離
- 配列状態の基本的な操作パターン

**主要機能:**
- Todo一覧の状態管理（todos配列）
- 基本的なCRUD操作（add, toggle, delete）
- ローディング状態とエラー状態の管理
- API呼び出しとの連携

**実装内容:**
```typescript
// シンプルな状態管理
const [todos, setTodos] = useState([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

// 基本的なCRUD操作
const addTodo = (text) => { ... };
const toggleTodo = (id) => { ... };
const deleteTodo = (id) => { ... };
```

#### 1.2 フォーム管理用カスタムフック

**ファイル:** `src/hooks/useForm.ts`

**学習ポイント:**
- フォーム状態の効率的な管理方法
- バリデーションの基本的な実装
- イベントハンドラーの抽象化

**主要機能:**
- フォーム値の状態管理（values, errors）
- 入力フィールドの変更ハンドリング
- 基本的なバリデーション機能
- フォームリセット機能

**実装内容:**
```typescript
// シンプルなフォーム管理
const [values, setValues] = useState(initialValues);
const [errors, setErrors] = useState({});

// 基本的なイベントハンドラー
const handleChange = (e) => { ... };
const handleSubmit = (callback) => { ... };
const reset = () => { ... };
```

#### 1.3 User管理用カスタムフック

**ファイル:** `src/hooks/useUsers.ts`

**学習ポイント:**
- ユーザー情報の状態管理パターン
- 認証状態との連携方法
- プロフィール更新の基本的な実装

**主要機能:**
- ユーザー一覧の状態管理（users配列）
- 現在のユーザー情報管理（currentUser）
- 基本的なCRUD操作（fetchUser, updateUser, deleteUser）
- ローディング状態とエラー状態の管理

**実装内容:**
```typescript
// シンプルなユーザー状態管理
const [users, setUsers] = useState([]);
const [currentUser, setCurrentUser] = useState(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

// 基本的なCRUD操作
const fetchUser = (id) => { ... };
const updateUser = (id, userData) => { ... };
const deleteUser = (id) => { ... };
const fetchUsers = () => { ... };
```

#### 1.4 ユーザープロフィール管理用カスタムフック

**ファイル:** `src/hooks/useUserProfile.ts`

**学習ポイント:**
- 認証されたユーザーのプロフィール管理
- プロフィール編集状態の管理
- 画像アップロード等の拡張機能への対応

**主要機能:**
- プロフィール情報の状態管理（profile, isEditing）
- プロフィール編集モードの切り替え
- プロフィール更新機能
- 変更確認とキャンセル機能

**実装内容:**
```typescript
// プロフィール管理
const [profile, setProfile] = useState(null);
const [isEditing, setIsEditing] = useState(false);
const [originalProfile, setOriginalProfile] = useState(null);

// 編集機能
const startEditing = () => { ... };
const cancelEditing = () => { ... };
const saveProfile = (profileData) => { ... };
```

### Phase 2: 認証Context の基本実装

#### 2.1 認証状態の型定義

**ファイル:** `src/contexts/AuthContext.tsx`

**学習ポイント:**
- Context API の基本的な使い方
- TypeScript との組み合わせ
- Provider パターンの理解

**主要機能:**
- ユーザー情報の状態管理（user, isAuthenticated）
- ログイン・ログアウト機能
- 認証状態のグローバル共有
- ローカルストレージとの連携

**実装内容:**
```typescript
// シンプルな認証状態
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
}

// 基本的なContext作成
const AuthContext = createContext<AuthState | undefined>(undefined);
```

#### 2.2 AuthProvider の実装

**学習ポイント:**
- Provider コンポーネントの作成方法
- Context 値の提供パターン
- 子コンポーネントへの状態共有

**主要機能:**
- 認証状態の初期化
- ログイン・ログアウト関数の提供
- ローカルストレージからの状態復元
- useAuth カスタムフックによるアクセス

**実装内容:**
```typescript
// シンプルなProvider実装
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = async (credentials) => { ... };
  const logout = () => { ... };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
```

### Phase 3: 実際のコンポーネントでの使用

#### 3.1 Todoリストコンポーネントの更新

**ファイル:** `src/components/TodoList.tsx`

**学習ポイント:**
- カスタムフックの実際の使用方法
- コンポーネントの簡潔化
- 状態管理ロジックの分離効果

**実装例:**
```typescript
function TodoList() {
  const { todos, loading, addTodo, toggleTodo, deleteTodo } = useTodos();
  
  if (loading) return <div>読み込み中...</div>;
  
  return (
    <div>
      {todos.map(todo => (
        <TodoItem 
          key={todo.id}
          todo={todo}
          onToggle={toggleTodo}
          onDelete={deleteTodo}
        />
      ))}
    </div>
  );
}
```

#### 3.2 ログインフォームコンポーネント

**ファイル:** `src/components/LoginForm.tsx`

**学習ポイント:**
- 複数のカスタムフックの組み合わせ
- Context から状態を取得する方法
- フォームとAPI呼び出しの連携

**実装例:**
```typescript
function LoginForm() {
  const { login } = useAuth();
  const { values, errors, handleChange, handleSubmit } = useForm({
    username: '',
    password: ''
  });

  const onSubmit = async () => {
    try {
      await login(values);
    } catch (error) {
      // エラーハンドリング
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* フォームフィールド */}
    </form>
  );
}
```

#### 3.3 ユーザー一覧コンポーネント

**ファイル:** `src/components/UserList.tsx`

**学習ポイント:**
- useUsersフックの実際の使用方法
- ユーザー管理画面での状態管理
- 管理者権限での操作実装

**実装例:**
```typescript
function UserList() {
  const { users, loading, fetchUsers, deleteUser } = useUsers();
  const { user: currentUser } = useAuth();
  
  useEffect(() => {
    fetchUsers();
  }, []);
  
  if (loading) return <div>ユーザー読み込み中...</div>;
  
  return (
    <div>
      {users.map(user => (
        <UserCard 
          key={user.id}
          user={user}
          onDelete={currentUser?.role === 'admin' ? deleteUser : undefined}
          showTodoCount
        />
      ))}
    </div>
  );
}
```

#### 3.4 ユーザープロフィールコンポーネント

**ファイル:** `src/components/UserProfile.tsx`

**学習ポイント:**
- useUserProfileフックとuseAuthの組み合わせ
- 編集モードの状態管理
- プロフィール更新機能の実装

**実装例:**
```typescript
function UserProfile() {
  const { user } = useAuth();
  const { 
    profile, 
    isEditing, 
    startEditing, 
    cancelEditing, 
    saveProfile 
  } = useUserProfile(user?.id);
  
  const { values, handleChange, handleSubmit } = useForm(profile);

  const onSave = async () => {
    try {
      await saveProfile(values);
    } catch (error) {
      // エラーハンドリング
    }
  };

  if (!profile) return <div>プロフィール読み込み中...</div>;

  return (
    <div>
      {isEditing ? (
        <form onSubmit={handleSubmit(onSave)}>
          {/* 編集フォーム */}
          <button type="button" onClick={cancelEditing}>
            キャンセル
          </button>
          <button type="submit">保存</button>
        </form>
      ) : (
        <div>
          {/* プロフィール表示 */}
          <button onClick={startEditing}>編集</button>
        </div>
      )}
    </div>
  );
}
```

### Phase 4: アプリケーション全体への適用

#### 4.1 プロバイダーの統合

**ファイル:** `src/app/layout.tsx`

**学習ポイント:**
- 複数のProviderの組み合わせ方
- アプリケーション全体への状態管理適用
- Next.js App Router との連携

**実装例:**
```typescript
export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

## ✅ 完了チェックリスト

### 基盤実装
- [ ] **useTodos**: Todo管理カスタムフック実装
- [ ] **useForm**: 基本的なフォーム状態管理フック実装
- [ ] **useUsers**: User管理カスタムフック実装
- [ ] **useUserProfile**: ユーザープロフィール管理カスタムフック実装
- [ ] **AuthContext**: 認証状態管理コンテキスト実装
- [ ] **useAuth**: 認証状態アクセス用カスタムフック実装

### コンポーネント更新
- [ ] **TodoList**: useTodosフックを使用した一覧表示
- [ ] **LoginForm**: useAuthとuseFormを組み合わせた認証フォーム
- [ ] **UserList**: useUsersフックを使用したユーザー一覧表示
- [ ] **UserProfile**: useUserProfileとuseAuthを組み合わせたプロフィール管理
- [ ] **Layout**: AuthProviderの適用
- [ ] **基本的なエラーハンドリング**: try-catch文の実装

### 学習確認
- [ ] **useState/useEffect**: 基本的なフックの理解と使用
- [ ] **カスタムフック**: 状態ロジックの分離と再利用
- [ ] **Context API**: グローバル状態の基本的な管理
- [ ] **Props vs Context**: 使い分けの理解
- [ ] **ドメイン分離**: Todo/Userドメインでの状態管理の使い分け
- [ ] **認証状態連携**: ユーザー状態と認証状態の適切な連携

## 🚀 次のステップ（STEP 6への準備）

このSTEPの完了により、以下の基盤が整います：

1. **テスト可能な構造**: カスタムフックとコンポーネントの分離
2. **基本的な状態管理**: Context APIの基本的な使用パターン
3. **再利用可能なロジック**: カスタムフックによるコードの共通化
4. **ドメイン別状態管理**: Todo/Userドメインの効率的な状態管理
5. **エラーハンドリング**: 基本的なエラー処理パターン

## 📝 学習ポイント

### 重要概念
1. **カスタムフック**: 状態ロジックの再利用可能な分離
2. **Context API**: プロップドリリングの解決
3. **関心の分離**: UIとロジックの明確な分離
4. **ドメイン分離**: Todo/Userドメインの独立した状態管理
5. **基本的なパターン**: React の基本的な設計パターン

### ベストプラクティス
1. **シンプルな状態管理**: 過度に複雑にせず、理解しやすい構造
2. **段階的な学習**: useState → カスタムフック → Context の順序
3. **実用的なパターン**: 実際の開発でよく使われる基本パターン
4. **ドメイン別設計**: 機能領域ごとのフック分離
5. **認証状態の活用**: ユーザー操作での権限チェック
6. **エラーハンドリング**: 基本的なtry-catch パターンの習得

### 避けるべき落とし穴
1. **過度な最適化**: 初期段階では理解を優先
2. **複雑すぎる抽象化**: シンプルで直感的な実装を心がける
3. **useReducer の早期導入**: まずは useState で基本を固める
4. **パフォーマンス最適化**: 機能実装を優先し、最適化は後回し
5. **認証状態の過度な依存**: ユーザー状態管理で認証に依存しすぎない設計
6. **プライバシー情報の不適切な管理**: ユーザー情報の適切な取り扱い

---

**作成日**: 2025年7月30日  
**対象**: React/Next.js 初心者〜中級者  
**前提知識**: STEP 4（コンポーネント設計）完了  
**推定学習時間**: 6-8時間

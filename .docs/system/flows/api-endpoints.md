# APIエンドポイント フロー図

## 概要

このドキュメントでは、Next.js TODOアプリケーションのAPIエンドポイント構造とその関連性を図示します。

## 全体構造図

```mermaid
graph TB
    subgraph "認証 API"
        Auth["/api/auth"]
        Login["/api/auth/login<br/>POST"]
        Register["/api/auth/register<br/>POST"]
        Logout["/api/auth/logout<br/>POST"]
    end

    subgraph "TODO API"
        Todos["/api/todos"]
        TodosList["/api/todos<br/>GET: 一覧取得<br/>POST: 新規作成"]
        TodoDetail["/api/todos/[id]<br/>GET: 詳細取得<br/>PUT: 更新<br/>DELETE: 削除"]
    end

    subgraph "ユーザー API"
        Users["/api/users"]
        UsersList["/api/users<br/>GET: 一覧取得（管理者）<br/>POST: 新規作成（管理者）"]
        UserDetail["/api/users/[id]<br/>GET: 詳細取得<br/>PATCH: 更新<br/>DELETE: 削除（管理者）"]
        UserTodos["/api/users/[id]/todos<br/>GET: ユーザーのTODO一覧"]
        
        subgraph "現在ユーザー API"
            Me["/api/users/me"]
            MeInfo["/api/users/me<br/>GET: 自分の情報取得<br/>PATCH: 自分の情報更新"]
            MePassword["/api/users/me/password<br/>PUT: パスワード変更"]
            MeTodos["/api/users/me/todos<br/>GET: 自分のTODO一覧"]
            MeTodoStats["/api/users/me/todos/stats<br/>GET: TODO統計情報"]
        end
    end

    subgraph "ヘルスチェック"
        Health["/api/health<br/>GET"]
    end

    Auth --> Login
    Auth --> Register
    Auth --> Logout
    
    Todos --> TodosList
    Todos --> TodoDetail
    
    Users --> UsersList
    Users --> UserDetail
    Users --> UserTodos
    Users --> Me
    
    Me --> MeInfo
    Me --> MePassword
    Me --> MeTodos
    Me --> MeTodoStats

    style Auth fill:#e1f5ff
    style Todos fill:#fff4e1
    style Users fill:#e8f5e9
    style Me fill:#f3e5f5
    style Health fill:#fce4ec
```

## 認証フロー

```mermaid
sequenceDiagram
    participant Client as クライアント
    participant Auth as 認証API
    participant JWT as JWTトークン
    participant Cookie as Cookie

    rect rgb(230, 245, 255)
        Note over Client,Cookie: ユーザー登録
        Client->>Auth: POST /api/auth/register
        Auth->>Auth: ユーザー作成
        Auth->>JWT: JWTトークン生成
        Auth->>Cookie: 認証Cookieセット
        Auth-->>Client: 登録成功 + トークン
    end

    rect rgb(255, 245, 230)
        Note over Client,Cookie: ログイン
        Client->>Auth: POST /api/auth/login
        Auth->>Auth: 認証情報検証
        Auth->>JWT: JWTトークン生成
        Auth->>Cookie: 認証Cookieセット
        Auth-->>Client: ログイン成功 + トークン
    end

    rect rgb(255, 230, 230)
        Note over Client,Cookie: ログアウト
        Client->>Auth: POST /api/auth/logout
        Auth->>Cookie: 認証Cookie削除
        Auth-->>Client: ログアウト成功
    end
```

## TODO操作フロー

```mermaid
sequenceDiagram
    participant Client as クライアント
    participant Middleware as 認証ミドルウェア
    participant TodoAPI as TODO API
    participant UseCase as TodoUseCase
    participant Repo as TodoRepository
    participant DB as データベース

    rect rgb(230, 255, 230)
        Note over Client,DB: TODO一覧取得
        Client->>TodoAPI: GET /api/todos
        TodoAPI->>Middleware: 認証チェック
        Middleware-->>TodoAPI: ユーザーID
        TodoAPI->>UseCase: getTodosByUserIdWithOptions()
        UseCase->>Repo: findByUserId()
        Repo->>DB: SELECT FROM todos
        DB-->>Repo: TODOデータ
        Repo-->>UseCase: TODOリスト
        UseCase-->>TodoAPI: ページネーション済みデータ
        TodoAPI-->>Client: TODO一覧レスポンス
    end

    rect rgb(255, 245, 230)
        Note over Client,DB: TODO作成
        Client->>TodoAPI: POST /api/todos
        TodoAPI->>Middleware: 認証チェック
        Middleware-->>TodoAPI: ユーザーID
        TodoAPI->>UseCase: createTodo()
        UseCase->>Repo: create()
        Repo->>DB: INSERT INTO todos
        DB-->>Repo: 作成完了
        Repo-->>UseCase: 作成されたTODO
        UseCase-->>TodoAPI: TODOデータ
        TodoAPI-->>Client: 作成成功レスポンス
    end

    rect rgb(230, 230, 255)
        Note over Client,DB: TODO更新
        Client->>TodoAPI: PUT /api/todos/[id]
        TodoAPI->>Middleware: 認証チェック
        Middleware-->>TodoAPI: ユーザーID
        TodoAPI->>UseCase: getTodoById()
        UseCase->>Repo: findById()
        Repo-->>UseCase: 既存TODO
        UseCase-->>TodoAPI: 所有権チェック
        TodoAPI->>UseCase: updateTodo()
        UseCase->>Repo: update()
        Repo->>DB: UPDATE todos
        DB-->>Repo: 更新完了
        Repo-->>UseCase: 更新されたTODO
        UseCase-->>TodoAPI: TODOデータ
        TodoAPI-->>Client: 更新成功レスポンス
    end

    rect rgb(255, 230, 230)
        Note over Client,DB: TODO削除
        Client->>TodoAPI: DELETE /api/todos/[id]
        TodoAPI->>Middleware: 認証チェック
        Middleware-->>TodoAPI: ユーザーID
        TodoAPI->>UseCase: getTodoById()
        UseCase-->>TodoAPI: 所有権チェック
        TodoAPI->>UseCase: deleteTodo()
        UseCase->>Repo: delete()
        Repo->>DB: DELETE FROM todos
        DB-->>Repo: 削除完了
        Repo-->>UseCase: 成功フラグ
        UseCase-->>TodoAPI: 削除結果
        TodoAPI-->>Client: 削除成功レスポンス
    end
```

## ユーザー管理フロー

```mermaid
sequenceDiagram
    participant Client as クライアント
    participant Middleware as 認証ミドルウェア
    participant UserAPI as ユーザーAPI
    participant UseCase as UserUseCase
    participant Repo as UserRepository
    participant DB as データベース

    rect rgb(230, 255, 230)
        Note over Client,DB: 現在ユーザー情報取得
        Client->>UserAPI: GET /api/users/me
        UserAPI->>Middleware: 認証チェック
        Middleware-->>UserAPI: ユーザーID
        UserAPI->>UseCase: getUserById()
        UseCase->>Repo: findById()
        Repo->>DB: SELECT FROM users
        DB-->>Repo: ユーザーデータ
        Repo-->>UseCase: ユーザー情報
        UseCase-->>UserAPI: ユーザーデータ（パスワード除外）
        UserAPI-->>Client: ユーザー情報レスポンス
    end

    rect rgb(255, 245, 230)
        Note over Client,DB: プロフィール更新
        Client->>UserAPI: PATCH /api/users/me
        UserAPI->>Middleware: 認証チェック
        Middleware-->>UserAPI: ユーザーID + ロール
        UserAPI->>UseCase: updateUser()
        UseCase->>Repo: update()
        Repo->>DB: UPDATE users
        DB-->>Repo: 更新完了
        Repo-->>UseCase: 更新されたユーザー
        UseCase-->>UserAPI: ユーザーデータ
        UserAPI-->>Client: 更新成功レスポンス
    end

    rect rgb(230, 230, 255)
        Note over Client,DB: パスワード変更
        Client->>UserAPI: PUT /api/users/me/password
        UserAPI->>Middleware: 認証チェック
        Middleware-->>UserAPI: ユーザーID
        UserAPI->>UseCase: changePassword()
        UseCase->>Repo: findById()
        Repo-->>UseCase: 現在のユーザー情報
        UseCase->>UseCase: 現在のパスワード検証
        UseCase->>UseCase: 新しいパスワードハッシュ化
        UseCase->>Repo: update()
        Repo->>DB: UPDATE users
        DB-->>Repo: 更新完了
        Repo-->>UseCase: 成功フラグ
        UseCase-->>UserAPI: 変更結果
        UserAPI-->>Client: 変更成功レスポンス
    end
```

## ユーザーとTODOの関連フロー

```mermaid
graph TB
    subgraph "ユーザー関連エンドポイント"
        A[現在ユーザー]
        B[特定ユーザー]
    end

    subgraph "TODO取得方法"
        C["/api/users/me/todos<br/>自分のTODO一覧"]
        D["/api/users/me/todos/stats<br/>自分のTODO統計"]
        E["/api/users/[id]/todos<br/>特定ユーザーのTODO一覧"]
        F["/api/todos<br/>全TODO操作"]
    end

    subgraph "権限チェック"
        G{認証済み?}
        H{管理者 or 本人?}
    end

    A --> C
    A --> D
    B --> E
    
    C --> G
    D --> G
    E --> H
    F --> G

    G -->|Yes| I[データ取得]
    G -->|No| J[401 Unauthorized]
    H -->|Yes| I
    H -->|No| K[403 Forbidden]

    style A fill:#e1f5ff
    style B fill:#fff4e1
    style C fill:#e8f5e9
    style D fill:#e8f5e9
    style E fill:#e8f5e9
    style F fill:#fff4e1
    style G fill:#ffebee
    style H fill:#ffebee
```

## エンドポイント一覧表

### 認証エンドポイント

| メソッド | エンドポイント | 説明 | 認証 |
|---------|---------------|------|------|
| POST | `/api/auth/login` | ログイン | 不要 |
| POST | `/api/auth/register` | ユーザー登録 | 不要 |
| POST | `/api/auth/logout` | ログアウト | 不要 |

### TODOエンドポイント

| メソッド | エンドポイント | 説明 | 認証 | 権限 |
|---------|---------------|------|------|------|
| GET | `/api/todos` | TODO一覧取得（ページネーション、フィルタ、ソート対応） | 必要 | 本人のみ |
| POST | `/api/todos` | TODO作成 | 必要 | - |
| GET | `/api/todos/[id]` | TODO詳細取得 | 必要 | 本人のみ |
| PUT | `/api/todos/[id]` | TODO更新 | 必要 | 本人のみ |
| DELETE | `/api/todos/[id]` | TODO削除 | 必要 | 本人のみ |

### ユーザーエンドポイント

| メソッド | エンドポイント | 説明 | 認証 | 権限 |
|---------|---------------|------|------|------|
| GET | `/api/users` | ユーザー一覧取得 | 必要 | 管理者/マネージャー |
| POST | `/api/users` | ユーザー作成 | 必要 | 管理者/マネージャー |
| GET | `/api/users/[id]` | ユーザー詳細取得 | 必要 | 管理者/マネージャー or 本人 |
| PATCH | `/api/users/[id]` | ユーザー情報更新 | 必要 | 管理者/マネージャー or 本人 |
| DELETE | `/api/users/[id]` | ユーザー削除 | 必要 | 管理者/マネージャー |
| GET | `/api/users/[id]/todos` | 特定ユーザーのTODO一覧 | 必要 | 管理者 or 本人 |

### 現在ユーザーエンドポイント

| メソッド | エンドポイント | 説明 | 認証 | 権限 |
|---------|---------------|------|------|------|
| GET | `/api/users/me` | 自分の情報取得 | 必要 | - |
| PATCH | `/api/users/me` | 自分の情報更新 | 必要 | - |
| PUT | `/api/users/me/password` | パスワード変更 | 必要 | - |
| GET | `/api/users/me/todos` | 自分のTODO一覧 | 必要 | - |
| GET | `/api/users/me/todos/stats` | 自分のTODO統計 | 必要 | - |

### その他

| メソッド | エンドポイント | 説明 | 認証 |
|---------|---------------|------|------|
| GET | `/api/health` | ヘルスチェック | 不要 |

## 権限レベル

```mermaid
graph LR
    A[ADMIN = 1<br/>システム管理者] --> B[MANAGER = 2<br/>マネージャー]
    B --> C[USER = 8<br/>一般ユーザー]
    
    A -.全ての操作が可能.-> D[全ユーザー管理]
    A -.全ての操作が可能.-> E[全TODO閲覧]
    
    B -.ユーザー管理可能.-> D
    B -.自分のTODOのみ.-> F[自分のTODO]
    
    C -.自分の情報のみ.-> G[自分の情報]
    C -.自分のTODOのみ.-> F

    style A fill:#ff6b6b
    style B fill:#ffa94d
    style C fill:#51cf66
```

## データフロー概要

```mermaid
graph TD
    Client[クライアント]
    
    subgraph "APIレイヤー"
        Auth[認証API]
        Todo[TODO API]
        User[ユーザーAPI]
    end
    
    subgraph "ミドルウェア"
        AuthMW[認証ミドルウェア<br/>JWT検証]
    end
    
    subgraph "ビジネスロジック層"
        AuthUC[AuthUseCase]
        TodoUC[TodoUseCase]
        UserUC[UserUseCase]
    end
    
    subgraph "データアクセス層"
        TodoRepo[TodoRepository]
        UserRepo[UserRepository]
    end
    
    subgraph "データベース"
        DB[(PostgreSQL)]
    end
    
    Client -->|リクエスト| Auth
    Client -->|リクエスト| Todo
    Client -->|リクエスト| User
    
    Auth --> AuthUC
    
    Todo --> AuthMW
    User --> AuthMW
    
    AuthMW -->|認証済み| Todo
    AuthMW -->|認証済み| User
    
    Todo --> TodoUC
    User --> UserUC
    
    AuthUC --> UserRepo
    TodoUC --> TodoRepo
    UserUC --> UserRepo
    
    TodoRepo --> DB
    UserRepo --> DB
    
    DB -->|データ| UserRepo
    DB -->|データ| TodoRepo
    
    UserRepo -->|ユーザー情報| UserUC
    UserRepo -->|ユーザー情報| AuthUC
    TodoRepo -->|TODOデータ| TodoUC
    
    AuthUC -->|JWTトークン| Auth
    TodoUC -->|TODOデータ| Todo
    UserUC -->|ユーザーデータ| User
    
    Auth -->|レスポンス| Client
    Todo -->|レスポンス| Client
    User -->|レスポンス| Client

    style Client fill:#e3f2fd
    style Auth fill:#fff3e0
    style Todo fill:#e8f5e9
    style User fill:#f3e5f5
    style AuthMW fill:#ffebee
    style DB fill:#fce4ec
```

## エラーハンドリングフロー

```mermaid
graph TB
    Request[APIリクエスト]
    
    Auth{認証チェック}
    Validation{入力検証}
    Permission{権限チェック}
    Existence{リソース存在確認}
    Business{ビジネスロジック実行}
    
    Success[200 OK<br/>成功レスポンス]
    BadRequest[400 Bad Request<br/>入力エラー]
    Unauthorized[401 Unauthorized<br/>認証エラー]
    Forbidden[403 Forbidden<br/>権限エラー]
    NotFound[404 Not Found<br/>リソース未発見]
    Conflict[409 Conflict<br/>競合エラー]
    Internal[500 Internal Server Error<br/>サーバーエラー]
    
    Request --> Auth
    Auth -->|認証失敗| Unauthorized
    Auth -->|認証成功| Validation
    
    Validation -->|検証失敗| BadRequest
    Validation -->|検証成功| Permission
    
    Permission -->|権限なし| Forbidden
    Permission -->|権限あり| Existence
    
    Existence -->|存在しない| NotFound
    Existence -->|存在する| Business
    
    Business -->|成功| Success
    Business -->|重複エラー| Conflict
    Business -->|予期せぬエラー| Internal
    
    style Success fill:#c8e6c9
    style BadRequest fill:#ffccbc
    style Unauthorized fill:#ffccbc
    style Forbidden fill:#ffccbc
    style NotFound fill:#ffccbc
    style Conflict fill:#ffccbc
    style Internal fill:#ef9a9a
```

## まとめ

このAPIは以下の特徴を持っています:

1. **RESTful設計**: リソース指向のURL設計とHTTPメソッドの適切な使用
2. **認証・認可**: JWT認証とロールベースアクセス制御（RBAC）
3. **階層的な権限管理**: ADMIN → MANAGER → USER の3段階
4. **セキュアな設計**: パスワードのハッシュ化、所有権チェック、機密情報の除外
5. **包括的なエラーハンドリング**: 適切なHTTPステータスコードとエラーメッセージ
6. **ページネーション対応**: 大量データの効率的な取得
7. **フィルタリング・ソート機能**: 柔軟なデータ検索
8. **統計情報提供**: TODO完了率などのダッシュボード機能

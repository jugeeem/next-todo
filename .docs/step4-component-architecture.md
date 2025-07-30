# STEP 4: コンポーネント設計入門

## 🎯 目標

STEP 3で作成したTodoアプリケーションのコンポーネントを、もっと使いやすく整理します。大きなコンポーネントを小さく分けて、再利用しやすくします。

## 📋 学習成果

このSTEPを完了すると、以下のことができるようになります：

- **コンポーネントを適切な大きさに分割する**
- **TypeScriptで型安全なProps設計をする**
- **再利用可能なコンポーネントを作る**
- **コンポーネント間でデータを受け渡しする**

## 🔄 STEP 3からの変更ポイント

### 変更前（STEP 3）
- 1つのファイルに全ての機能が詰まっている
- 同じようなコードが何度も書かれている
- 型定義がバラバラに散らばっている

### 変更後（STEP 4）
- 機能ごとに小さなコンポーネントに分割
- 共通する部分は再利用できるコンポーネントに
- 型定義をまとめて管理

## 🏗️ 基本的な考え方

### 1. 1つのコンポーネントは1つの役割
各コンポーネントは1つのことだけをする

### 2. 小さなコンポーネントを組み合わせる
小さな部品を組み合わせて大きな機能を作る

### 3. 型を使って間違いを防ぐ
TypeScriptの型を使ってバグを事前に防ぐ

## 🚀 実装手順

### Phase 1: 基本的な型定義を作る

#### 1.1 共通で使う型をまとめる

**ファイル**: `src/types/components.ts`

##### なぜ型定義をまとめるのか？

同じような型定義を何度も書くのは大変です。共通で使う型を1つのファイルにまとめることで：

- 同じ型を使い回せる
- 間違いが減る
- 変更するときに1箇所だけ直せばいい

##### 基本的な型定義

```typescript
// 全てのコンポーネントが共通で使うプロパティ
export interface BaseComponentProps {
  children?: React.ReactNode;  // 子要素
  className?: string;         // CSSクラス
  testId?: string;           // テスト用ID
}

// ローディング状態を表す型
export interface LoadingState {
  isLoading?: boolean;
  loadingText?: string;
}

// エラー状態を表す型
export interface ErrorState {
  error?: string;
  isInvalid?: boolean;
}

// ボタンのクリックイベント
export type ClickHandler = () => void;

// フォームの送信イベント
export type SubmitHandler<T> = (data: T) => void;
```

#### 1.2 Todoアプリ専用の型を作る

**ファイル**: `src/types/todo-components.ts`

##### Todoドメインで使う型定義

```typescript
import { Todo } from '../domain/entities';
import { BaseComponentProps, ErrorState, SubmitHandler } from './components';

// Todoアイテムを表示するコンポーネントの型
export interface TodoItemProps extends BaseComponentProps {
  todo: Todo;
  onEdit?: (todo: Todo) => void;      // 編集ボタンが押された時
  onDelete?: (id: string) => void;    // 削除ボタンが押された時
  onToggle?: (id: string) => void;    // 完了/未完了を切り替える時
}

// Todoフォームで使うデータの型
export interface TodoFormData {
  title: string;
  description?: string;
}

// Todoフォームコンポーネントの型
export interface TodoFormProps extends BaseComponentProps, ErrorState {
  initialData?: Partial<TodoFormData>; // 初期値（編集時に使用）
  onSubmit: SubmitHandler<TodoFormData>; // フォーム送信時
  submitButtonText?: string; // ボタンのテキスト
}
```

#### 1.3 Userドメイン専用の型を作る

**ファイル**: `src/types/user-components.ts`

##### Userドメインで使う型定義

```typescript
import { User } from '../domain/entities';
import { BaseComponentProps, ErrorState, SubmitHandler } from './components';

// ユーザー表示コンポーネントの型
export interface UserAvatarProps extends BaseComponentProps {
  user: User;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
}

// ユーザープロフィール表示コンポーネントの型
export interface UserProfileProps extends BaseComponentProps {
  user: User;
  showEmail?: boolean;
  showCreatedAt?: boolean;
  editable?: boolean;
  onEdit?: (user: User) => void;
}

// ユーザーフォームで使うデータの型
export interface UserFormData {
  name: string;
  email: string;
  password?: string; // 新規作成時のみ必要
}

// ユーザーフォームコンポーネントの型
export interface UserFormProps extends BaseComponentProps, ErrorState {
  initialData?: Partial<UserFormData>; // 初期値（編集時に使用）
  onSubmit: SubmitHandler<UserFormData>; // フォーム送信時
  submitButtonText?: string; // ボタンのテキスト
  isEditMode?: boolean; // 編集モードかどうか
}

// ユーザーカードコンポーネントの型
export interface UserCardProps extends BaseComponentProps {
  user: User;
  compact?: boolean; // コンパクト表示かどうか
  onClick?: (user: User) => void;
  showTodoCount?: boolean; // Todo数を表示するかどうか
  todoCount?: number;
}
```

##### なぜ型定義を分離するのか？

ドメインごとに型定義を分離することで：

- **関心の分離**: TodoとUserの型定義が混在しない
- **メンテナンス性向上**: 各ドメインの変更が他に影響しない
- **再利用性向上**: 必要な型定義のみをインポートできる
- **可読性向上**: ファイルの責務が明確になる

### Phase 2: 基本的なコンポーネントを作る

#### 2.1 テキスト表示コンポーネント

**ファイル**: `src/components/atoms/Text/Text.tsx`

##### なぜテキストコンポーネントを作るのか？

アプリ全体で統一されたテキストスタイルを使うために、専用のコンポーネントを作ります。

##### 基本的な実装

```typescript
import { BaseComponentProps } from '../../../types/components';

interface TextProps extends BaseComponentProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'default' | 'muted' | 'primary' | 'danger';
  weight?: 'normal' | 'medium' | 'bold';
  as?: 'p' | 'span' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

export const Text: React.FC<TextProps> = ({
  children,
  size = 'md',
  color = 'default',
  weight = 'normal',
  as: Component = 'p',
  className,
  testId,
  ...props
}) => {
  // サイズに応じたCSSクラスを決める
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  // 色に応じたCSSクラスを決める
  const colorClasses = {
    default: 'text-gray-900',
    muted: 'text-gray-500',
    primary: 'text-blue-600',
    danger: 'text-red-600'
  };

  // フォントウェイトに応じたCSSクラスを決める
  const weightClasses = {
    normal: 'font-normal',
    medium: 'font-medium',
    bold: 'font-bold'
  };

  const classes = [
    sizeClasses[size],
    colorClasses[color],
    weightClasses[weight],
    className
  ].filter(Boolean).join(' ');

  return (
    <Component 
      className={classes}
      data-testid={testId}
      {...props}
    >
      {children}
    </Component>
  );
};
```

##### 使い方の例

```typescript
// 基本的な使い方
<Text>これは普通のテキストです</Text>

// 見出しとして使う
<Text as="h1" size="xl" weight="bold">
  ページタイトル
</Text>

// エラーメッセージ
<Text color="danger" size="sm">
  エラーが発生しました
</Text>
```

#### 2.2 ボタンコンポーネント

**ファイル**: `src/components/atoms/Button/Button.tsx`

##### 基本的な実装

```typescript
import { BaseComponentProps, ClickHandler } from '../../../types/components';

interface ButtonProps extends BaseComponentProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: ClickHandler;
  type?: 'button' | 'submit' | 'reset';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  className,
  testId,
  ...props
}) => {
  // バリアントに応じたスタイル
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700'
  };

  // サイズに応じたスタイル
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  const baseClasses = 'rounded font-medium focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const classes = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    disabled && 'opacity-50 cursor-not-allowed',
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={classes}
      data-testid={testId}
      {...props}
    >
      {loading ? 'Loading...' : children}
    </button>
  );
};
```

### Phase 3: 組み合わせコンポーネントを作る

#### 3.1 フォームフィールドコンポーネント

**ファイル**: `src/components/molecules/FormField/FormField.tsx`

##### なぜフォームフィールドコンポーネントを作るのか？

入力フィールドには、ラベル、入力欄、エラーメッセージなど、いつもセットで必要な要素があります。これらをまとめたコンポーネントを作ることで、フォームを簡単に作れます。

##### 基本的な実装

```typescript
import { Input } from '@heroui/react';
import { Text } from '../../atoms/Text/Text';
import { BaseComponentProps, ErrorState } from '../../../types/components';

interface FormFieldProps extends BaseComponentProps, ErrorState {
  label: string;
  placeholder?: string;
  type?: 'text' | 'email' | 'password';
  required?: boolean;
  description?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  placeholder,
  type = 'text',
  required = false,
  description,
  error,
  isInvalid,
  className,
  testId,
  ...inputProps
}) => {
  return (
    <div className={`space-y-2 ${className || ''}`}>
      {/* ラベル */}
      <Text as="label" weight="medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Text>

      {/* 説明テキスト */}
      {description && (
        <Text size="sm" color="muted">
          {description}
        </Text>
      )}

      {/* 入力フィールド */}
      <Input
        type={type}
        placeholder={placeholder}
        isRequired={required}
        isInvalid={isInvalid || !!error}
        errorMessage={error}
        data-testid={testId}
        {...inputProps}
      />
    </div>
  );
};
```

##### 使い方の例

```typescript
// 基本的な使い方
<FormField
  label="ユーザー名"
  placeholder="ユーザー名を入力してください"
  required
/>

// エラー表示
<FormField
  label="メールアドレス"
  type="email"
  error="正しいメールアドレスを入力してください"
  isInvalid
/>

// 説明付き
<FormField
  label="パスワード"
  type="password"
  description="8文字以上で入力してください"
  required
/>
```

#### 3.2 Todoアイテムコンポーネント

**ファイル**: `src/components/molecules/TodoItem/TodoItem.tsx`

##### 基本的な実装

```typescript
import { Card, CardBody, Button, Checkbox } from '@heroui/react';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Text } from '../../atoms/Text/Text';
import { TodoItemProps } from '../../../types/todo-components';

export const TodoItem: React.FC<TodoItemProps> = ({
  todo,
  onEdit,
  onDelete,
  onToggle,
  testId
}) => {
  return (
    <Card className="w-full" data-testid={testId}>
      <CardBody className="flex flex-row items-start gap-3">
        {/* 完了チェックボックス */}
        <Checkbox
          isSelected={todo.completed}
          onValueChange={() => onToggle?.(todo.id)}
          aria-label={`${todo.title}を${todo.completed ? '未完了' : '完了'}にする`}
        />

        {/* Todo内容 */}
        <div className="flex-1">
          <Text 
            weight="medium"
            className={todo.completed ? 'line-through text-gray-500' : ''}
          >
            {todo.title}
          </Text>
          
          {todo.description && (
            <Text 
              size="sm" 
              color="muted"
              className={todo.completed ? 'line-through' : ''}
            >
              {todo.description}
            </Text>
          )}
        </div>

        {/* アクションボタン */}
        <div className="flex gap-2">
          <Button
            isIconOnly
            size="sm"
            variant="light"
            onClick={() => onEdit?.(todo)}
            aria-label={`${todo.title}を編集`}
          >
            <PencilIcon className="h-4 w-4" />
          </Button>
          
          <Button
            isIconOnly
            size="sm"
            variant="light"
            color="danger"
            onClick={() => onDelete?.(todo.id)}
            aria-label={`${todo.title}を削除`}
          >
            <TrashIcon className="h-4 w-4" />
          </Button>
        </div>
      </CardBody>
    </Card>
  );
};
```

#### 3.3 ユーザーアバターコンポーネント

**ファイル**: `src/components/molecules/UserAvatar/UserAvatar.tsx`

##### なぜユーザーアバターコンポーネントを作るのか？

ユーザー情報を表示する場面は多くあります（ナビゲーション、Todo作成者表示、プロフィールページなど）。統一されたユーザー表示コンポーネントを作ることで、デザインの一貫性を保てます。

##### 基本的な実装

```typescript
import { Avatar, Chip } from '@heroui/react';
import { UserIcon } from '@heroicons/react/24/outline';
import { Text } from '../../atoms/Text/Text';
import { UserAvatarProps } from '../../../types/user-components';

export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  size = 'md',
  showName = true,
  className,
  testId
}) => {
  // サイズに応じたアバターサイズを決める
  const avatarSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  // サイズに応じたテキストサイズを決める
  const textSizes = {
    sm: 'sm' as const,
    md: 'md' as const,
    lg: 'lg' as const
  };

  return (
    <div 
      className={`flex items-center gap-2 ${className || ''}`}
      data-testid={testId}
    >
      {/* アバター画像 */}
      <Avatar
        size={size}
        name={user.name}
        classNames={{
          base: avatarSizes[size]
        }}
        fallback={<UserIcon className="w-1/2 h-1/2" />}
      />

      {/* ユーザー名 */}
      {showName && (
        <Text size={textSizes[size]} weight="medium">
          {user.name}
        </Text>
      )}
    </div>
  );
};
```

##### 使い方の例

```typescript
// 基本的な使い方
<UserAvatar user={currentUser} />

// サイズを変更
<UserAvatar user={currentUser} size="lg" />

// 名前を非表示
<UserAvatar user={currentUser} showName={false} />
```

#### 3.4 ユーザーカードコンポーネント

**ファイル**: `src/components/molecules/UserCard/UserCard.tsx`

##### 基本的な実装

```typescript
import { Card, CardBody, Chip } from '@heroui/react';
import { CalendarIcon } from '@heroicons/react/24/outline';
import { UserAvatar } from '../UserAvatar/UserAvatar';
import { Text } from '../../atoms/Text/Text';
import { UserCardProps } from '../../../types/user-components';

export const UserCard: React.FC<UserCardProps> = ({
  user,
  compact = false,
  onClick,
  showTodoCount = false,
  todoCount = 0,
  className,
  testId
}) => {
  const handleClick = () => {
    onClick?.(user);
  };

  return (
    <Card 
      className={`w-full ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''} ${className || ''}`}
      isPressable={!!onClick}
      onPress={handleClick}
      data-testid={testId}
    >
      <CardBody className={compact ? 'p-3' : 'p-4'}>
        <div className="flex items-start justify-between">
          {/* ユーザー情報 */}
          <div className="flex-1">
            <UserAvatar 
              user={user} 
              size={compact ? 'sm' : 'md'}
            />
            
            {!compact && (
              <div className="mt-2 space-y-1">
                <Text size="sm" color="muted">
                  {user.email}
                </Text>
                
                <div className="flex items-center gap-1">
                  <CalendarIcon className="w-3 h-3 text-gray-400" />
                  <Text size="sm" color="muted">
                    {new Date(user.createdAt).toLocaleDateString('ja-JP')}に参加
                  </Text>
                </div>
              </div>
            )}
          </div>

          {/* Todo数表示 */}
          {showTodoCount && (
            <Chip size="sm" variant="flat" color="primary">
              {todoCount} Todo
            </Chip>
          )}
        </div>
      </CardBody>
    </Card>
  );
};
```

##### Userコンポーネントの使い方の例

```typescript
// 基本的なユーザーアバター
<UserAvatar user={currentUser} />

// サイズを変更したアバター
<UserAvatar user={currentUser} size="lg" />

// 名前を非表示にしたアバター
<UserAvatar user={currentUser} showName={false} />

// コンパクトなユーザーカード
<UserCard 
  user={user} 
  compact 
  onClick={(user) => console.log('クリックされました:', user.name)}
/>

// Todo数付きのユーザーカード
<UserCard 
  user={user} 
  showTodoCount 
  todoCount={5}
  onClick={handleUserClick}
/>

// 編集可能なユーザープロフィール
<UserProfile 
  user={currentUser} 
  editable 
  onEdit={handleEditUser}
/>

// ユーザー登録フォーム
<UserForm 
  onSubmit={handleUserCreate}
  submitButtonText="アカウント作成"
/>

// ユーザー編集フォーム
<UserForm 
  initialData={selectedUser}
  onSubmit={handleUserUpdate}
  submitButtonText="更新"
  isEditMode
/>
```
- アイコンとメッセージの水平配置
- 危険色（danger）による視覚的警告
- アニメーション対応のコンテナー
- 長いエラーメッセージでの改行対応

**アニメーション設計**

**Framer Motion Integration**: アニメーションライブラリ統合
- `AnimatePresence` による要素の出現・消失制御
- `mode="wait"` による前の要素完全消失後の表示
- エラー状態変更時のスムーズな切り替え
- パフォーマンス最適化されたアニメーション

**Error Animation**: エラーメッセージアニメーション
- `initial: { opacity: 0, y: -10 }` による上からのフェードイン
- `animate: { opacity: 1, y: 0 }` による最終位置への移動
- `exit: { opacity: 0, y: -10 }` による上へのフェードアウト
- `duration: 0.2` による適切な速度設定

**Transition Control**: トランジション制御
- 0.2秒の適切なアニメーション時間
- ユーザビリティを損なわない速度設定
- CPUパフォーマンスへの配慮
- アクセシビリティ設定での動作制御

**状態管理設計**

**Error State Management**: エラー状態の統合管理
- `error` と `isInvalid` の両方対応
- `errorMessage` プロパティでの上書き可能
- `Boolean()` による確実な真偽値変換
- 複数エラー源の統一処理

**ID State Management**: ID状態の管理
- `useId` による自動生成ID
- `fieldId` プロパティでの手動設定対応
- 説明・エラー用IDの派生生成
- undefined値の適切な処理

**Required State**: 必須状態の管理
- `isRequired = false` のデフォルト設定
- 視覚的マークの条件付き表示
- HeroUIコンポーネントへの伝播
- アクセシビリティ属性との連携

**HeroUI統合設計**

### Phase 4: ページコンポーネントを作る

#### 4.1 Todoフォームコンポーネント

**ファイル**: `src/components/organisms/TodoForm/TodoForm.tsx`

##### 基本的な実装

```typescript
import { useState } from 'react';
import { Button } from '@heroui/react';
import { FormField } from '../../molecules/FormField/FormField';
import { TodoFormProps, TodoFormData } from '../../../types/todo-components';

export const TodoForm: React.FC<TodoFormProps> = ({
  initialData,
  onSubmit,
  submitButtonText = '保存',
  error,
  testId
}) => {
  const [formData, setFormData] = useState<TodoFormData>({
    title: initialData?.title || '',
    description: initialData?.description || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field: keyof TodoFormData) => (value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" data-testid={testId}>
      <FormField
        label="タイトル"
        placeholder="Todoのタイトルを入力"
        value={formData.title}
        onValueChange={handleChange('title')}
        required
      />

      <FormField
        label="説明"
        placeholder="詳細な説明（任意）"
        value={formData.description}
        onValueChange={handleChange('description')}
      />

      {error && (
        <div className="text-red-500 text-sm">
          {error}
        </div>
      )}

      <Button
        type="submit"
        color="primary"
        className="w-full"
      >
        {submitButtonText}
      </Button>
    </form>
  );
};
```

#### 4.2 Todo一覧コンポーネント

**ファイル**: `src/components/organisms/TodoList/TodoList.tsx`

##### 基本的な実装

```typescript
import { TodoItem } from '../../molecules/TodoItem/TodoItem';
import { Text } from '../../atoms/Text/Text';
import { Todo } from '../../../domain/entities';
import { BaseComponentProps } from '../../../types/components';

interface TodoListProps extends BaseComponentProps {
  todos: Todo[];
  onEdit?: (todo: Todo) => void;
  onDelete?: (id: string) => void;
  onToggle?: (id: string) => void;
  emptyMessage?: string;
}

export const TodoList: React.FC<TodoListProps> = ({
  todos,
  onEdit,
  onDelete,
  onToggle,
  emptyMessage = 'Todoがありません',
  testId
}) => {
  if (todos.length === 0) {
    return (
      <div className="text-center py-8" data-testid={testId}>
        <Text color="muted">{emptyMessage}</Text>
      </div>
    );
  }

  return (
    <div className="space-y-3" data-testid={testId}>
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggle={onToggle}
        />
      ))}
    </div>
  );
};
```

#### 4.3 ユーザーフォームコンポーネント

**ファイル**: `src/components/organisms/UserForm/UserForm.tsx`

##### なぜユーザーフォームコンポーネントを作るのか？

ユーザー登録や編集で使うフォームを、再利用可能なコンポーネントとして作ります。新規登録と編集の両方で使えるように設計します。

##### 基本的な実装

```typescript
import { useState } from 'react';
import { Button } from '@heroui/react';
import { FormField } from '../../molecules/FormField/FormField';
import { UserFormProps, UserFormData } from '../../../types/user-components';

export const UserForm: React.FC<UserFormProps> = ({
  initialData,
  onSubmit,
  submitButtonText = '保存',
  isEditMode = false,
  error,
  testId
}) => {
  const [formData, setFormData] = useState<UserFormData>({
    name: initialData?.name || '',
    email: initialData?.email || '',
    password: initialData?.password || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field: keyof UserFormData) => (value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" data-testid={testId}>
      <FormField
        label="ユーザー名"
        placeholder="ユーザー名を入力してください"
        value={formData.name}
        onValueChange={handleChange('name')}
        required
      />

      <FormField
        label="メールアドレス"
        type="email"
        placeholder="メールアドレスを入力してください"
        value={formData.email}
        onValueChange={handleChange('email')}
        required
      />

      {/* 編集モードでない場合のみパスワードフィールドを表示 */}
      {!isEditMode && (
        <FormField
          label="パスワード"
          type="password"
          placeholder="パスワードを入力してください"
          description="8文字以上で入力してください"
          value={formData.password}
          onValueChange={handleChange('password')}
          required
        />
      )}

      {error && (
        <div className="text-red-500 text-sm">
          {error}
        </div>
      )}

      <Button
        type="submit"
        color="primary"
        className="w-full"
      >
        {submitButtonText}
      </Button>
    </form>
  );
};
```

#### 4.4 ユーザープロフィールコンポーネント

**ファイル**: `src/components/organisms/UserProfile/UserProfile.tsx`

##### 基本的な実装

```typescript
import { Card, CardBody, Button, Divider } from '@heroui/react';
import { PencilIcon, CalendarIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { UserAvatar } from '../../molecules/UserAvatar/UserAvatar';
import { Text } from '../../atoms/Text/Text';
import { UserProfileProps } from '../../../types/user-components';

export const UserProfile: React.FC<UserProfileProps> = ({
  user,
  showEmail = true,
  showCreatedAt = true,
  editable = false,
  onEdit,
  className,
  testId
}) => {
  return (
    <Card className={`w-full ${className || ''}`} data-testid={testId}>
      <CardBody className="p-6">
        {/* ヘッダー部分 */}
        <div className="flex items-start justify-between mb-4">
          <UserAvatar user={user} size="lg" showName={false} />
          
          {editable && (
            <Button
              size="sm"
              variant="light"
              startContent={<PencilIcon className="h-4 w-4" />}
              onClick={() => onEdit?.(user)}
            >
              編集
            </Button>
          )}
        </div>

        {/* ユーザー名 */}
        <Text size="xl" weight="bold" className="mb-2">
          {user.name}
        </Text>

        <Divider className="my-4" />

        {/* 詳細情報 */}
        <div className="space-y-3">
          {showEmail && (
            <div className="flex items-center gap-2">
              <EnvelopeIcon className="w-4 h-4 text-gray-400" />
              <Text size="sm" color="muted">
                {user.email}
              </Text>
            </div>
          )}

          {showCreatedAt && (
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-gray-400" />
              <Text size="sm" color="muted">
                {new Date(user.createdAt).toLocaleDateString('ja-JP')}に参加
              </Text>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
};
```

#### 4.5 ユーザー一覧コンポーネント

**ファイル**: `src/components/organisms/UserList/UserList.tsx`

##### 基本的な実装

```typescript
import { UserCard } from '../../molecules/UserCard/UserCard';
import { Text } from '../../atoms/Text/Text';
import { User } from '../../../domain/entities';
import { BaseComponentProps } from '../../../types/components';

interface UserListProps extends BaseComponentProps {
  users: User[];
  onUserClick?: (user: User) => void;
  showTodoCount?: boolean;
  todoCountMap?: Record<string, number>; // ユーザーIDをキーにしたTodo数のマップ
  compact?: boolean;
  emptyMessage?: string;
}

export const UserList: React.FC<UserListProps> = ({
  users,
  onUserClick,
  showTodoCount = false,
  todoCountMap = {},
  compact = false,
  emptyMessage = 'ユーザーがいません',
  testId
}) => {
  if (users.length === 0) {
    return (
      <div className="text-center py-8" data-testid={testId}>
        <Text color="muted">{emptyMessage}</Text>
      </div>
    );
  }

  return (
    <div className="space-y-3" data-testid={testId}>
      {users.map((user) => (
        <UserCard
          key={user.id}
          user={user}
          compact={compact}
          onClick={onUserClick}
          showTodoCount={showTodoCount}
          todoCount={todoCountMap[user.id] || 0}
        />
      ))}
    </div>
  );
};
```

## 📝 実装チェックリスト

### Phase 1: 型定義
- [ ] `src/types/components.ts` を作成
- [ ] `src/types/todo-components.ts` を作成
- [ ] `src/types/user-components.ts` を作成
- [ ] 基本的な型定義を実装
- [ ] Todoドメインの型定義を実装
- [ ] Userドメインの型定義を実装

### Phase 2: アトミックコンポーネント
- [ ] `src/components/atoms/Text/Text.tsx` を作成
- [ ] `src/components/atoms/Button/Button.tsx` を作成
- [ ] 基本的なスタイリングを実装

### Phase 3: 分子コンポーネント
- [ ] `src/components/molecules/FormField/FormField.tsx` を作成
- [ ] `src/components/molecules/TodoItem/TodoItem.tsx` を作成
- [ ] `src/components/molecules/UserAvatar/UserAvatar.tsx` を作成
- [ ] `src/components/molecules/UserCard/UserCard.tsx` を作成
- [ ] コンポーネント間の連携を確認

### Phase 4: 生物コンポーネント
- [ ] `src/components/organisms/TodoForm/TodoForm.tsx` を作成
- [ ] `src/components/organisms/TodoList/TodoList.tsx` を作成
- [ ] `src/components/organisms/UserForm/UserForm.tsx` を作成
- [ ] `src/components/organisms/UserProfile/UserProfile.tsx` を作成
- [ ] `src/components/organisms/UserList/UserList.tsx` を作成
- [ ] 全体の動作を確認

## 🎯 次のステップ

この STEP 4 を完了したら、STEP 5 で状態管理（Redux Toolkit や Zustand）を学習し、コンポーネント間でのデータのやり取りをより効率的に行えるようになります。

## 💡 学習のポイント

1. **小さく始める**: 一度にすべてを実装しようとせず、一つずつ確実に
2. **型を活用する**: TypeScriptの型システムを使って間違いを防ぐ
3. **再利用を意識する**: 同じようなコードを書くときは、コンポーネントにできないか考える
4. **テストしながら進める**: 作ったコンポーネントが正しく動くか確認しながら進める
5. **ドメイン分離**: 関連する型定義はドメインごとにファイルを分ける

### ファイル構成とドメイン分離

**型定義ファイルの分離**: ドメインごとの責務分担
- `components.ts`: 全コンポーネント共通の基本型
- `todo-components.ts`: Todoドメイン専用の型定義
- `user-components.ts`: Userドメイン専用の型定義
- 将来的な拡張（例：`project-components.ts`）への対応

**メンテナンス性の向上**: 変更影響の局所化
- Todoドメインの変更がUserドメインに影響しない
- 型定義の変更箇所が明確
- 不要なimportの削減
- ファイルサイズの適切な管理

### Userドメインコンポーネントの特徴

**ユーザーアバター**: 一貫性のあるユーザー表示
- サイズ変更可能な統一デザイン
- アクセシビリティに配慮したフォールバック
- 表示オプションの細かい制御
- 複数箇所での再利用を前提とした設計

**ユーザーカード**: 柔軟な情報表示
- コンパクト表示と詳細表示の切り替え
- クリック可能なインタラクション
- Todo数など追加情報の表示対応
- レスポンシブデザインへの対応

**ユーザーフォーム**: 新規・編集両対応
- 新規登録と編集モードの使い分け
- パスワードフィールドの条件付き表示
- バリデーション結果の適切な表示
- フォーム送信後の状態管理

**ユーザープロフィール**: 情報の体系的表示
- 編集可能・不可能の状態管理
- 階層的な情報構造の表現
- アイコンを使った視覚的分類
- プライバシー配慮の表示制御

### コンポーネント設計の実践的ポイント

**Props設計**: 使いやすいAPI設計
- オプションプロパティの適切な初期値
- 機能の段階的な有効化
- 型安全性を保ったprop-types定義
- コンポーネント間の依存関係の最小化

**状態管理**: 適切な責任分散
- コンポーネント内部状態vs外部状態の判断
- イベントハンドリングの委譲パターン
- フォームデータの効率的な管理
- エラー状態の一元的な処理

**パフォーマンス**: 実用的な最適化
- 大量フィールドでのパフォーマンス確保
- メモリ効率的な実装

**ID Generation Optimization**: ID生成最適化
- `useId` による効率的な一意ID生成
- 不要な再生成の防止
- SSRとCSRでの一貫性確保
- ハイドレーション問題の回避

**Animation Performance**: アニメーション最適化
- GPU加速によるスムーズなアニメーション
- レイアウトシフトの最小化
- 60FPSでの滑らかな動作
- バッテリー効率の考慮

**保守性向上**

**Single Responsibility**: 単一責任原則
- フォームフィールドの統合表示に特化
- 入力検証ロジックの外部化
- ビジネスロジックとの適切な分離
- UIコンポーネントとしての責務明確化

**Type Safety**: 型安全性確保
- 全プロパティの型定義
- HeroUIとの型互換性確保
- 実行時エラーの事前防止
- IDE支援による開発効率向上

**Testing Support**: テスト対応
- `data-testid` による要素特定
- アクセシビリティテストの容易化
- 単体テストでの分離実行
- E2Eテストでの安定した要素選択

**Documentation**: ドキュメント化
- 使用パターンの明文化
- アクセシビリティガイドライン
- HeroUI統合ベストプラクティス
- カスタマイズ方法の説明

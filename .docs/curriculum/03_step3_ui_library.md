# Step 3: UIライブラリを使用した画面のリプレイス

## 1. Step 3 の概要

### 1.1 目的
- HeroUI コンポーネントライブラリの使い方を学ぶ
- モダンで洗練された UI を構築する
- UIライブラリを活用した効率的な開発手法を習得する

### 1.2 変更方針
Step 1・Step 2 で Tailwind CSS のみで実装していた UI を、HeroUI のコンポーネントに置き換えます。

**置き換え対象**:
- フォーム要素（Input, Textarea, Button）
- カード（Card）
- モーダル（Modal）
- テーブル・リスト表示
- ナビゲーション（Navbar）
- ドロップダウン（Select, Dropdown）

### 1.3 制約条件
- **コンポーネントの分割は行わない**（Step 4 で実施）
- **カスタムフックの作成は行わない**（Step 5 で実施）
- **ファイル構成は変更しない**

---

## 2. HeroUI の基本

### 2.1 HeroUI とは
HeroUI は React ベースの UI コンポーネントライブラリで、Next.js との統合がスムーズに行えます。

**特徴**:
- Tailwind CSS ベース
- アクセシビリティ対応
- ダークモード対応
- TypeScript サポート
- カスタマイズ性が高い

### 2.2 セットアップ確認

プロジェクトには既に HeroUI がインストールされています（`package.json` 確認済み）。

**Provider の設定**:
```typescript
// src/app/providers.tsx
'use client'

import { HeroUIProvider } from '@heroui/react'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <HeroUIProvider>
      {children}
    </HeroUIProvider>
  )
}
```

**ルートレイアウトでの使用**:
```typescript
// src/app/layout.tsx
import { Providers } from './providers'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

---

## 3. コンポーネント別リプレイスガイド

### 3.1 フォーム要素

#### Input（テキスト入力）

**Before (Tailwind CSS)**:
```typescript
<input
  type="text"
  value={username}
  onChange={(e) => setUsername(e.target.value)}
  className="w-full px-3 py-2 border border-gray-300 rounded-md"
  placeholder="ユーザー名"
/>
```

**After (HeroUI)**:
```typescript
import { Input } from '@heroui/react'

<Input
  type="text"
  label="ユーザー名"
  placeholder="ユーザー名を入力"
  value={username}
  onChange={(e) => setUsername(e.target.value)}
  isRequired
/>
```

**ポイント**:
- `label` プロパティでラベルを設定
- `isRequired` で必須マークを表示
- `errorMessage` でエラーメッセージを設定可能

---

#### Textarea（複数行テキスト）

**Before (Tailwind CSS)**:
```typescript
<textarea
  value={descriptions}
  onChange={(e) => setDescriptions(e.target.value)}
  className="w-full px-3 py-2 border border-gray-300 rounded-md"
  placeholder="説明"
  rows={4}
/>
```

**After (HeroUI)**:
```typescript
import { Textarea } from '@heroui/react'

<Textarea
  label="説明"
  placeholder="説明を入力"
  value={descriptions}
  onChange={(e) => setDescriptions(e.target.value)}
  minRows={4}
/>
```

---

#### Button（ボタン）

**Before (Tailwind CSS)**:
```typescript
<button
  onClick={handleSubmit}
  disabled={isLoading}
  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
>
  {isLoading ? '送信中...' : '送信'}
</button>
```

**After (HeroUI)**:
```typescript
import { Button } from '@heroui/react'

<Button
  color="primary"
  onPress={handleSubmit}
  isLoading={isLoading}
>
  送信
</Button>
```

**カラーバリエーション**:
- `primary`: プライマリカラー（青系）
- `secondary`: セカンダリカラー（紫系）
- `success`: 成功（緑系）
- `warning`: 警告（黄系）
- `danger`: 危険（赤系）

**サイズバリエーション**:
- `sm`: 小
- `md`: 中（デフォルト）
- `lg`: 大

---

### 3.2 カード

**Before (Tailwind CSS)**:
```typescript
<div className="bg-white shadow-md rounded-lg p-6">
  <h2 className="text-xl font-bold mb-4">タイトル</h2>
  <p>コンテンツ</p>
</div>
```

**After (HeroUI)**:
```typescript
import { Card, CardHeader, CardBody, CardFooter } from '@heroui/react'

<Card>
  <CardHeader>
    <h2 className="text-xl font-bold">タイトル</h2>
  </CardHeader>
  <CardBody>
    <p>コンテンツ</p>
  </CardBody>
  <CardFooter>
    {/* フッター要素 */}
  </CardFooter>
</Card>
```

---

### 3.3 モーダル

**Before (Tailwind CSS)**:
```typescript
{isModalOpen && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
    <div className="bg-white rounded-lg p-6 max-w-md w-full">
      <h2>モーダルタイトル</h2>
      <p>モーダルコンテンツ</p>
      <button onClick={() => setIsModalOpen(false)}>閉じる</button>
    </div>
  </div>
)}
```

**After (HeroUI)**:
```typescript
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@heroui/react'

const { isOpen, onOpen, onClose } = useDisclosure()

<>
  <Button onPress={onOpen}>モーダルを開く</Button>
  
  <Modal isOpen={isOpen} onClose={onClose}>
    <ModalContent>
      <ModalHeader>モーダルタイトル</ModalHeader>
      <ModalBody>
        <p>モーダルコンテンツ</p>
      </ModalBody>
      <ModalFooter>
        <Button color="danger" variant="light" onPress={onClose}>
          キャンセル
        </Button>
        <Button color="primary" onPress={onClose}>
          OK
        </Button>
      </ModalFooter>
    </ModalContent>
  </Modal>
</>
```

---

### 3.4 ナビゲーション

**Before (Tailwind CSS)**:
```typescript
<nav className="bg-gray-800 text-white p-4">
  <div className="max-w-7xl mx-auto flex justify-between items-center">
    <div className="text-xl font-bold">Todo App</div>
    <div className="space-x-4">
      <a href="/todos" className="hover:text-gray-300">Todos</a>
      <a href="/profile" className="hover:text-gray-300">Profile</a>
    </div>
  </div>
</nav>
```

**After (HeroUI)**:
```typescript
import { Navbar, NavbarBrand, NavbarContent, NavbarItem, Link } from '@heroui/react'

<Navbar>
  <NavbarBrand>
    <p className="font-bold text-inherit">Todo App</p>
  </NavbarBrand>
  <NavbarContent className="hidden sm:flex gap-4" justify="center">
    <NavbarItem>
      <Link color="foreground" href="/todos">
        Todos
      </Link>
    </NavbarItem>
    <NavbarItem>
      <Link color="foreground" href="/profile">
        Profile
      </Link>
    </NavbarItem>
  </NavbarContent>
  <NavbarContent justify="end">
    <NavbarItem>
      <Button as={Link} color="primary" href="/login" variant="flat">
        Login
      </Button>
    </NavbarItem>
  </NavbarContent>
</Navbar>
```

---

### 3.5 Select（ドロップダウン）

**Before (Tailwind CSS)**:
```typescript
<select
  value={completedFilter}
  onChange={(e) => setCompletedFilter(e.target.value)}
  className="px-3 py-2 border border-gray-300 rounded-md"
>
  <option value="all">すべて</option>
  <option value="completed">完了済み</option>
  <option value="incomplete">未完了</option>
</select>
```

**After (HeroUI)**:
```typescript
import { Select, SelectItem } from '@heroui/react'

<Select
  label="フィルター"
  selectedKeys={[completedFilter]}
  onChange={(e) => setCompletedFilter(e.target.value)}
>
  <SelectItem key="all" value="all">すべて</SelectItem>
  <SelectItem key="completed" value="completed">完了済み</SelectItem>
  <SelectItem key="incomplete" value="incomplete">未完了</SelectItem>
</Select>
```

---

### 3.6 Checkbox

**Before (Tailwind CSS)**:
```typescript
<input
  type="checkbox"
  checked={todo.completed}
  onChange={() => handleToggleComplete(todo.id)}
  className="mr-2"
/>
```

**After (HeroUI)**:
```typescript
import { Checkbox } from '@heroui/react'

<Checkbox
  isSelected={todo.completed}
  onValueChange={() => handleToggleComplete(todo.id)}
>
  {todo.title}
</Checkbox>
```

---

### 3.7 Table（テーブル）

**Before (Tailwind CSS)**:
```typescript
<table className="min-w-full divide-y divide-gray-200">
  <thead className="bg-gray-50">
    <tr>
      <th className="px-6 py-3 text-left">タイトル</th>
      <th className="px-6 py-3 text-left">状態</th>
    </tr>
  </thead>
  <tbody className="bg-white divide-y divide-gray-200">
    {todos.map((todo) => (
      <tr key={todo.id}>
        <td className="px-6 py-4">{todo.title}</td>
        <td className="px-6 py-4">{todo.completed ? '完了' : '未完了'}</td>
      </tr>
    ))}
  </tbody>
</table>
```

**After (HeroUI)**:
```typescript
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from '@heroui/react'

<Table aria-label="Todo一覧">
  <TableHeader>
    <TableColumn>タイトル</TableColumn>
    <TableColumn>状態</TableColumn>
  </TableHeader>
  <TableBody>
    {todos.map((todo) => (
      <TableRow key={todo.id}>
        <TableCell>{todo.title}</TableCell>
        <TableCell>{todo.completed ? '完了' : '未完了'}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

---

## 4. ページ別リプレイスガイド

### 4.1 ログインページ

**リプレイス対象**:
- Input（ユーザー名、パスワード）
- Button（ログイン、登録ページへのリンク）
- Card（ログインフォーム全体）

**実装のポイント**:
- フォーム全体を `Card` で囲む
- `Input` の `type="password"` でパスワード入力
- エラーメッセージは `Input` の `errorMessage` プロパティを使用

---

### 4.2 ユーザー登録ページ

**リプレイス対象**:
- Input（ユーザー名、パスワード、名前）
- Button（登録、ログインページへのリンク）
- Card（登録フォーム全体）

---

### 4.3 Todo 一覧ページ

**リプレイス対象**:
- Input（Todo タイトル）
- Textarea（Todo 説明）
- Button（作成、削除、ページネーション）
- Select（フィルター、ソート）
- Card（各 Todo アイテム）
- Checkbox（完了/未完了切り替え）

**実装のポイント**:
- Todo アイテムは `Card` で表現
- フィルタリングとソートは `Select` を使用
- ページネーションは `Button` の組み合わせで実装

---

### 4.4 Todo 詳細ページ

**リプレイス対象**:
- Input（タイトル編集）
- Textarea（説明編集）
- Button（保存、削除、キャンセル）
- Card（Todo 詳細全体）

**実装のポイント**:
- 編集モードと表示モードの切り替えを `Button` で制御
- 削除確認は `Modal` を使用

---

### 4.5 プロフィールページ

**リプレイス対象**:
- Input（名前編集）
- Input（パスワード変更用）
- Button（保存、キャンセル、ログアウト）
- Card（プロフィール情報、統計情報、Todo一覧）

**実装のポイント**:
- 複数の `Card` でセクションを分ける
- 統計情報は `Card` + テキスト表示
- パスワード変更は別の `Card` で実装

---

## 5. スタイリングのベストプラクティス

### 5.1 レスポンシブデザイン

HeroUI は Tailwind CSS ベースなので、Tailwind のレスポンシブクラスがそのまま使えます。

```typescript
<Card className="w-full sm:w-96 md:w-[500px]">
  {/* コンテンツ */}
</Card>
```

### 5.2 カラーテーマの統一

```typescript
// プライマリアクション
<Button color="primary">保存</Button>

// 危険なアクション
<Button color="danger">削除</Button>

// セカンダリアクション
<Button color="default" variant="flat">キャンセル</Button>
```

### 5.3 スペーシングの統一

```typescript
<div className="space-y-4">
  <Input {...props} />
  <Textarea {...props} />
  <Button {...props} />
</div>
```

---

## 6. アクセシビリティの考慮

### 6.1 aria-label の設定

```typescript
<Button aria-label="Todoを削除" onPress={handleDelete}>
  <TrashIcon />
</Button>
```

### 6.2 キーボードナビゲーション

HeroUI のコンポーネントは自動的にキーボードナビゲーションに対応していますが、カスタムハンドラーを追加する場合は考慮が必要です。

---

## 7. 実装チェックリスト

### 8.1 コンポーネント置き換え
- [ ] Input コンポーネントの置き換え
- [ ] Textarea コンポーネントの置き換え
- [ ] Button コンポーネントの置き換え
- [ ] Card コンポーネントの置き換え
- [ ] Modal コンポーネントの置き換え
- [ ] Select コンポーネントの置き換え
- [ ] Checkbox コンポーネントの置き換え
- [ ] Navbar コンポーネントの置き換え

### 8.2 ページごとの確認
- [ ] ログインページの UI 更新
- [ ] ユーザー登録ページの UI 更新
- [ ] Todo 一覧ページの UI 更新
- [ ] Todo 詳細ページの UI 更新
- [ ] プロフィールページの UI 更新

### 8.3 スタイリング
- [ ] レスポンシブデザインの確認
- [ ] カラーテーマの統一
- [ ] スペーシングの統一

### 8.4 アクセシビリティ
- [ ] aria-label の設定
- [ ] キーボードナビゲーションの確認

---

## 8. 動作確認項目

### 8.1 機能確認
- [ ] すべてのフォームが正常に動作する
- [ ] すべてのボタンが正常に動作する
- [ ] モーダルが正常に開閉する
- [ ] ドロップダウンが正常に動作する

### 8.2 UI/UX 確認
- [ ] デザインが統一されている
- [ ] レスポンシブデザインが適切に動作する
- [ ] ローディング状態が適切に表示される
- [ ] エラーメッセージが適切に表示される

---

## 9. 次のステップへの準備

Step 3 完了後、以下を確認してください。

- [ ] すべての UI が HeroUI コンポーネントに置き換えられている
- [ ] デザインが統一され、モダンな見た目になっている
- [ ] すべての機能が正常に動作する
- [ ] アクセシビリティが確保されている

これらが完了したら、**Step 4: UIコンポーネントの分割** に進みましょう。

---

**Document Version**: 1.0.0  
**Last Updated**: 2025-10-24

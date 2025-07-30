# Next.js React 開発カリキュラム

このディレクトリには、Next.js と React を活用したプロジェクト開発のステップバイステップカリキュラムが含まれています。

## 📚 カリキュラム構成

### STEP 1: クライアントコンポーネント基礎実装
**ファイル**: `step1-client-components.md`

**目標**: Next.jsのクライアントコンポーネントをスタンダードなHTML + Tailwind CSSで実装

**学習内容**:
- `'use client'`ディレクティブの使用
- React Hooks（useState, useEffect）の実践
- フォームハンドリングとバリデーション
- APIクライアント（fetch）の実装
- スタンダードHTML + Tailwind CSS によるシンプルなUI設計
- JWT認証フローの実装
- ローカルストレージを使った状態管理

**実装対象**:
- 🔐 認証機能（ログイン・ユーザー登録）
- 📝 Todo管理機能（一覧・作成・詳細・編集・削除）
- 👤 ユーザー管理機能（一覧・詳細・プロフィール）

**特徴**:
- 1画面1ファイルの制約
- カスタムフック禁止
- コンポーネント切り出し禁止
- UIライブラリ使用禁止（素のHTML + Tailwind CSS）
- 型定義をコンポーネント内で完結

---

### STEP 2: サーバーサイドレンダリング最適化
**ファイル**: `step2-server-side-rendering.md`

**目標**: Server Components を活用したパフォーマンス最適化

**学習内容**:
- Server Components vs Client Components の使い分け
- 初期データのサーバーサイド取得
- SEO最適化とメタデータ管理
- ストリーミングとSuspense
- 静的生成（SSG）
- 認証状態を考慮したSSR実装
- Optimistic Updatesによるユーザーエクスペリエンス向上

**実装対象**:
- 🔐 サーバーサイド認証ヘルパー
- 📊 初期データ取得の最適化
- 🎯 SEOメタデータの動的生成
- ⚡ Suspense境界とローディング最適化

---

### STEP 3: UIライブラリを使用した実装
**ファイル**: `step3-ui-library-implementation.md`

**目標**: HeroUI等のUIライブラリを活用したモダンなUI実装

**学習内容**:
- HeroUI + Framer Motion による高度なUI設計
- デザインシステムの構築基礎
- アニメーションとマイクロインタラクション
- アクセシビリティ対応
- レスポンシブデザインの最適化
- コンポーネントライブラリの効果的な活用

**実装対象**:
- 🎨 統一されたデザインシステム
- 🎭 Framer Motionアニメーション
- 🧱 再利用可能なUIコンポーネント
- ♿ アクセシビリティ対応UI

---

### STEP 4: コンポーネント設計とリファクタリング
**ファイル**: `step4-component-architecture.md`

**目標**: 保守性の高いコンポーネント設計への移行

**学習内容**:
- 責務分離とコンポーネント切り出し（アトミックデザイン）
- TypeScriptを活用した堅牢なProps設計
- ポリモーフィックコンポーネントパターン
- 複合コンポーネントパターンと合成可能性
- React.memo、useMemo、useCallbackによるパフォーマンス最適化
- 楽観的更新とエラーハンドリング

**実装対象**:
- 🧱 アトミック・分子・生物レベルコンポーネント
- 🎯 型安全で再利用可能なコンポーネントライブラリ
- ⚡ 最適化されたレンダリングパフォーマンス
- 🧪 テスタブルなアーキテクチャ設計

---

### STEP 5: 状態管理とカスタムフック
**ファイル**: `step5-state-management.md`

**目標**: 効率的な状態管理の実装

**学習内容**:
- カスタムフックによるロジック分離
- Context API による全体状態管理
- useReducer を使った複雑な状態管理
- 非同期処理の抽象化とエラーハンドリング
- パフォーマンス最適化された状態管理

**実装対象**:
- 🔗 統合されたContext API アーキテクチャ
- 🎣 再利用可能なカスタムフック群
- 📊 useReducerによる複雑な状態管理
- ⚡ 最適化されたレンダリング制御

---

### STEP 6: テスト実装とQA（予定）
**ファイル**: `step6-testing-qa.md`（計画中）

**目標**: 包括的なテスト戦略とQA工程の実装

**学習内容**:
- Unit Testing（Jest + React Testing Library）
- Integration Testing（API ルートテスト）
- E2E Testing（Playwright）
- カバレッジ測定とQA指標

## 🎯 学習の進め方

### 前提条件
- Node.js 18.17以上
- TypeScript基礎知識
- React基礎知識

### 推奨学習順序
1. **STEP 1**: 基礎実装（HTML + Tailwind CSS）
2. **STEP 2**: サーバーサイドレンダリング最適化
3. **STEP 3**: UIライブラリ導入（HeroUI + Framer Motion）
4. **STEP 4**: コンポーネント設計とリファクタリング
5. **STEP 5**: 状態管理とカスタムフック
6. **STEP 6**: テスト実装とQA（予定）
7. 各STEPの完了チェックリストを確認
8. 実際にブラウザで動作確認
9. コードレビューと改善

### プロジェクト環境
```bash
# 開発サーバー起動
npm run dev

# テスト実行
npm test

# コード品質チェック
npm run check

# ビルド
npm run build
```

## 🛠️ 技術スタック

### フロントエンド
- **Framework**: Next.js 15.4.3 (App Router)
- **UI Library**: React 19.1.0
- **Type System**: TypeScript 5.8.3
- **Styling**: Tailwind CSS 4
- **UI Components**: HeroUI 2.8.1 + ToastProvider
- **Animation**: Framer Motion 12.23.7 (STEP3で導入)
- **State Management**: Context API + useReducer (STEP5で実装)

### バックエンド
- **API**: Next.js API Routes
- **Database**: PostgreSQL 16
- **ORM**: カスタムリポジトリパターン
- **Authentication**: JWT + JOSE 6.0.12
- **Validation**: Zod 3.22.4
- **Password**: bcryptjs 2.4.3

### 開発ツール
- **Build Tool**: Turbopack（Next.js標準）
- **Testing**: Jest 30.0.5 + React Testing Library 16.3.0
- **Code Quality**: Biome 2.1.2（Linter + Formatter）
- **Container**: Docker + Docker Compose
- **Package Manager**: npm（Node.js 18.17+）

## 📖 参考リソース

### 公式ドキュメント
- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [HeroUI Documentation](https://heroui.com/)
- [Framer Motion Guide](https://www.framer.com/motion/)
- [Biome Documentation](https://biomejs.dev/)

### 既存実装
- **プロジェクトREADME**: `../README.md`
- **Claude開発ガイド**: `../CLAUDE.md`
- **API仕様**: Postmanコレクション (`../postman/`)
- **テストカバレッジ**: `../coverage/`

## 🎓 学習成果

各STEPを完了することで、以下のスキルが身につきます：

1. **基礎的なReact開発手法（STEP1）**
2. **TypeScriptによる型安全な開発（STEP1）**
3. **Next.js 15の最新機能活用（STEP2）**
4. **モダンなUI/UX設計（STEP3）**
5. **認証・認可の実装（STEP1-2）**
6. **RESTful API設計と実装（STEP1-2）**
7. **コンポーネント設計とアーキテクチャ（STEP4）**
8. **状態管理とパフォーマンス最適化（STEP5）**
9. **テスト駆動開発とQA工程（STEP6予定）**

## 🔍 現在の実装状況

### 完了済み（2025年7月30日現在）
- ✅ **STEP 1-4**: 基礎実装からコンポーネント設計まで
- ✅ **STEP 5**: 状態管理とカスタムフック実装
- ✅ **HeroUI + Framer Motion**: UIライブラリ統合
- ✅ **Context API**: グローバル状態管理
- ✅ **依存性注入**: コンテナパターン実装
- ✅ **包括的テスト**: Jest + React Testing Library

### 実装中・予定
- 🔄 **カリキュラム拡張**: STEP6以降の追加
- 🔄 **ドキュメント更新**: 実装に合わせた内容更新

## 📞 サポート

質問や問題がある場合は、以下を参照してください：

1. **エラーログ**: ブラウザの開発者ツールを確認
2. **API仕様**: Postmanコレクションで動作確認
3. **既存実装**: `src/`ディレクトリの参考実装

---

**作成日**: 2025年7月29日  
**最終更新**: 2025年7月30日  
**対象**: Next.js + React 学習者  
**レベル**: 初級〜上級（段階的スキルアップ）  
**実装状況**: STEP1-5完了、STEP6以降計画中

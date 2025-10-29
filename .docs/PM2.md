# PM2 運用ガイド

このドキュメントは、Next.js アプリケーションを PM2 で本番環境稼働させるためのガイドです。

## 📋 目次

1. [PM2 とは](#pm2-とは)
2. [セットアップ](#セットアップ)
3. [基本的な使い方](#基本的な使い方)
4. [環境変数の設定](#環境変数の設定)
5. [ログ管理](#ログ管理)
6. [モニタリング](#モニタリング)
7. [トラブルシューティング](#トラブルシューティング)

---

## PM2 とは

**PM2 (Process Manager 2)** は、Node.js アプリケーション向けのプロセスマネージャーです。

### 主な機能

- **プロセス管理**: アプリケーションの起動・停止・再起動
- **クラスタモード**: マルチコアCPUを活用した負荷分散
- **自動再起動**: クラッシュ時の自動復旧
- **ログ管理**: エラーログと標準出力の管理
- **モニタリング**: リアルタイムでのリソース監視
- **デーモン化**: バックグラウンドでの常駐実行

---

## セットアップ

### 1. PM2 のインストール

```bash
# 既にインストール済み（package.json に含まれています）
npm install
```

### 2. アプリケーションのビルド

本番環境で実行する前に、必ずビルドを行います。

```bash
npm run build
```

### 3. 環境変数の設定

`.env` ファイルを作成し、必要な環境変数を設定します。

```bash
# .env.example をコピー
cp .env.example .env

# 必要な値を設定
# - DATABASE_URL
# - JWT_SECRET
# など
```

---

## 基本的な使い方

### アプリケーションの起動

#### 本番環境で起動

```bash
# ecosystem.config.js を使用して起動
pm2 start ecosystem.config.js --env production

# または、package.json のスクリプトを使用
npm run pm2:start
```

#### 開発環境で起動

```bash
pm2 start ecosystem.config.js --env development

# または
npm run pm2:dev
```

### アプリケーションの停止

```bash
# アプリケーション名を指定して停止
pm2 stop next-todo

# または
npm run pm2:stop
```

### アプリケーションの再起動

```bash
# 再起動（ダウンタイムなし）
pm2 restart next-todo

# または
npm run pm2:restart

# リロード（ゼロダウンタイム再起動）
pm2 reload next-todo
```

### アプリケーションの削除

```bash
# PM2 管理リストから削除
pm2 delete next-todo

# または
npm run pm2:delete
```

### すべてのプロセスを管理

```bash
# すべてのアプリを停止
pm2 stop all

# すべてのアプリを再起動
pm2 restart all

# すべてのアプリを削除
pm2 delete all
```

---

## ステータス確認

### プロセス一覧の表示

```bash
# 実行中のプロセス一覧
pm2 list

# または
pm2 status

# または
npm run pm2:status
```

**表示される情報**:
- アプリケーション名
- プロセスID
- ステータス（online/stopped/errored）
- CPU使用率
- メモリ使用量
- 再起動回数
- 稼働時間

### 詳細情報の表示

```bash
# アプリケーションの詳細情報
pm2 show next-todo

# JSON形式で出力
pm2 jlist
```

---

## ログ管理

### ログの確認

```bash
# リアルタイムでログを表示
pm2 logs next-todo

# または
npm run pm2:logs

# すべてのアプリのログ
pm2 logs

# エラーログのみ表示
pm2 logs next-todo --err

# 標準出力のみ表示
pm2 logs next-todo --out

# 最新100行のログを表示
pm2 logs next-todo --lines 100
```

### ログファイルの場所

- **エラーログ**: `./logs/pm2-error.log`
- **標準出力ログ**: `./logs/pm2-out.log`

### ログのクリア

```bash
# ログファイルを空にする
pm2 flush

# 特定のアプリのログをクリア
pm2 flush next-todo
```

### ログローテーション

PM2 のログローテーションモジュールを使用して、ログファイルのサイズを管理できます。

```bash
# pm2-logrotate をインストール
pm2 install pm2-logrotate

# 設定の確認
pm2 conf pm2-logrotate

# ローテーション設定（例: 最大10MB、最大10ファイル保持）
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 10
pm2 set pm2-logrotate:compress true
```

---

## モニタリング

### リアルタイムモニタリング

```bash
# ターミナルでのモニタリングUI
pm2 monit

# または
npm run pm2:monit
```

**表示される情報**:
- CPU使用率
- メモリ使用量
- リアルタイムログ
- ネットワーク統計

### Web ダッシュボード（オプション）

PM2 Plus（旧 Keymetrics）を使用すると、Webベースのダッシュボードでモニタリングできます。

```bash
# PM2 Plus に接続
pm2 link <secret_key> <public_key>
```

---

## 環境変数の設定

### ecosystem.config.js での設定

`ecosystem.config.js` ファイルで環境変数を定義できます。

```javascript
module.exports = {
  apps: [
    {
      name: 'next-todo',
      // ...
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
};
```

### .env ファイルの使用

より機密性の高い情報は `.env` ファイルで管理します。

```bash
# .env
DATABASE_URL=postgresql://user:password@localhost:5432/next_todo
JWT_SECRET=your-super-secret-key
```

PM2 は自動的に `.env` ファイルを読み込みます。

---

## 自動起動の設定

サーバー再起動時に自動的にアプリケーションを起動するように設定できます。

### 1. スタートアップスクリプトの生成

```bash
# システムのスタートアップに PM2 を登録
pm2 startup

# 表示されたコマンドを実行（sudo権限が必要）
# 例: sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u username --hp /home/username
```

### 2. 現在のプロセスリストを保存

```bash
# 現在実行中のアプリケーションを保存
pm2 save

# または、特定のアプリを保存
pm2 save --force
```

### 3. 自動起動の解除

```bash
# スタートアップから削除
pm2 unstartup
```

---

## クラスタモードの活用

`ecosystem.config.js` では、クラスタモードが有効になっています。

```javascript
{
  instances: 'max',  // CPUコア数に応じて自動調整
  exec_mode: 'cluster',  // クラスターモード
}
```

### クラスタモードのメリット

- **負荷分散**: 複数のCPUコアを活用
- **高可用性**: 1つのインスタンスがクラッシュしても他が稼働
- **ゼロダウンタイム**: リロード時に順次再起動

### インスタンス数の調整

```bash
# インスタンス数を増やす
pm2 scale next-todo 4

# インスタンス数を減らす
pm2 scale next-todo 2

# 自動調整に戻す
pm2 scale next-todo max
```

---

## トラブルシューティング

### アプリケーションが起動しない

**原因と対処法**:

1. **ビルドが完了していない**
   ```bash
   npm run build
   ```

2. **環境変数が設定されていない**
   ```bash
   # .env ファイルを確認
   cat .env
   ```

3. **ポートが既に使用されている**
   ```bash
   # ポート3000を使用しているプロセスを確認
   lsof -i :3000  # macOS/Linux
   netstat -ano | findstr :3000  # Windows
   ```

4. **ログを確認**
   ```bash
   pm2 logs next-todo --err
   ```

### メモリ不足でクラッシュする

`ecosystem.config.js` でメモリ制限を調整します。

```javascript
{
  max_memory_restart: '2G',  // 1G から 2G に増やす
}
```

### 再起動が頻繁に発生する

```bash
# 再起動回数を確認
pm2 list

# ログを確認してエラーを特定
pm2 logs next-todo --err --lines 100
```

### PM2 が応答しない

```bash
# PM2 デーモンを再起動
pm2 kill
pm2 resurrect
```

---

## ベストプラクティス

### 1. 本番環境では必ずビルドする

```bash
npm run build
pm2 start ecosystem.config.js --env production
```

### 2. 環境変数を適切に管理

- `.env` ファイルをバージョン管理に含めない
- `.env.example` をテンプレートとして用意

### 3. ログローテーションを設定

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
```

### 4. 定期的なヘルスチェック

```bash
# cron で定期的にステータス確認
0 * * * * pm2 status >> /var/log/pm2-health.log
```

### 5. ゼロダウンタイムデプロイ

```bash
# reload を使用（restart ではなく）
pm2 reload next-todo
```

---

## よく使うコマンド一覧

| コマンド | 説明 |
|---------|------|
| `npm run pm2:start` | 本番環境で起動 |
| `npm run pm2:dev` | 開発環境で起動 |
| `npm run pm2:stop` | アプリを停止 |
| `npm run pm2:restart` | アプリを再起動 |
| `npm run pm2:logs` | ログを表示 |
| `npm run pm2:status` | ステータス確認 |
| `npm run pm2:monit` | モニタリングUI |
| `pm2 reload next-todo` | ゼロダウンタイム再起動 |
| `pm2 save` | 現在の状態を保存 |
| `pm2 resurrect` | 保存した状態を復元 |

---

## 参考リンク

- [PM2 公式ドキュメント](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Next.js デプロイメントガイド](https://nextjs.org/docs/deployment)
- [PM2 GitHub リポジトリ](https://github.com/Unitech/pm2)

---

**最終更新**: 2025年10月29日  
**バージョン**: 1.0.0  
**メンテナー**: jugeeem

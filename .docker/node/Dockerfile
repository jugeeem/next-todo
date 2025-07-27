FROM node:20-alpine

WORKDIR /app

# パッケージマネージャーの設定
COPY package*.json ./

# 全ての依存関係のインストール（ビルド時にTypeScriptが必要）
RUN npm ci

# アプリケーションのソースコードをコピー
COPY . .

# Next.jsアプリケーションをビルド
RUN npm run build

# キャッシュをクリーンアップ（devDependenciesは保持）
RUN npm cache clean --force

# ポート3000を公開
EXPOSE 3000

# アプリケーションを起動
CMD ["npm", "start"]

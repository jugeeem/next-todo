# Node.js 20 Alpine ベースイメージ
FROM node:24-alpine

# タイムゾーンを日本標準時（JST）に設定
ENV TZ=Asia/Tokyo

# 必要なパッケージをインストール
RUN apk add --no-cache \
    git \
    curl \
    bash \
    openssh-client

# 作業ディレクトリを設定
WORKDIR /workspace

# node ユーザーに所有権を変更
RUN chown -R node:node /workspace

# node ユーザーに切り替え
USER node

# デフォルトシェルを bash に設定
SHELL ["/bin/bash", "-c"]

# コンテナを起動状態に保つ
CMD ["tail", "-f", "/dev/null"]

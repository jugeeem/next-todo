FROM postgres:16-alpine

ENV TZ=Asia/Tokyo
ENV LANG=ja_JP.UTF-8

RUN apk add --no-cache tzdata && \
    cp /usr/share/zoneinfo/${TZ} /etc/localtime && \
    echo "${TZ}" > /etc/timezone

ENV POSTGRES_INITDB_ARGS="--encoding=UTF-8 --locale=C"

# ポート5432を公開
EXPOSE 5432

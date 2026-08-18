#!/usr/bin/env bash
# Запускается на сервере в каталоге проекта (/opt/wildex).
# Тянет свежий main из GitHub и поднимает контейнеры.
set -euo pipefail

BRANCH="${BRANCH:-main}"
cd "$(dirname "$0")/.."

echo "==> git fetch origin/$BRANCH"
git fetch --prune origin
git reset --hard "origin/$BRANCH"
git --no-pager log --oneline -1

echo "==> Проверка конфигурации Caddy"
docker run --rm \
  -v "$PWD/Caddyfile:/etc/caddy/Caddyfile:ro" \
  caddy:2-alpine caddy validate --config /etc/caddy/Caddyfile

echo "==> docker compose up"
docker compose up -d --remove-orphans

echo "==> Перезагрузка конфигурации Caddy без простоя"
docker compose exec -T caddy caddy reload --config /etc/caddy/Caddyfile 2>/dev/null || \
  docker compose restart caddy

echo "==> Состояние"
docker compose ps

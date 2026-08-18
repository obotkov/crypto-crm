#!/usr/bin/env bash
# Запускается на сервере из каталога проекта (/opt/wildex).
# Поднимает/обновляет контейнеры по текущему содержимому каталога.
set -euo pipefail

cd "$(dirname "$0")/.."

echo "==> Проверка конфигурации Caddy"
docker run --rm \
  -v "$PWD/Caddyfile:/etc/caddy/Caddyfile:ro" \
  caddy:2-alpine caddy validate --config /etc/caddy/Caddyfile

echo "==> docker compose up"
docker compose up -d --remove-orphans

echo "==> Перезагрузка конфигурации Caddy без простоя"
docker compose exec -T caddy caddy reload --config /etc/caddy/Caddyfile || \
  docker compose restart caddy

echo "==> Состояние"
docker compose ps

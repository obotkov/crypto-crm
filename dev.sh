#!/usr/bin/env bash
# Локальный просмотр сайта: http://localhost:8080
# С Docker — тот же Caddy, что и на проде. Без Docker — статик-сервер на Python.
set -euo pipefail

cd "$(dirname "$0")"
PORT="${PORT:-8080}"

if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
  echo "Caddy (docker) -> http://localhost:$PORT"
  exec docker run --rm -it \
    -p "$PORT:80" \
    -v "$PWD/site:/srv/site:ro" \
    caddy:2-alpine \
    caddy file-server --root /srv/site --listen :80
fi

echo "Docker не найден — поднимаю python http.server -> http://localhost:$PORT"
exec python3 -m http.server "$PORT" --directory site

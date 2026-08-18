#!/usr/bin/env bash
# Разовая подготовка чистого сервера (Ubuntu/Debian) под WildEx.
# Запуск на сервере от root:  bash bootstrap-server.sh
set -euo pipefail

DEPLOY_PATH="${DEPLOY_PATH:-/opt/wildex}"
REPO_URL="${REPO_URL:-https://github.com/obotkov/crypto-crm.git}"
BRANCH="${BRANCH:-main}"

echo "==> Пакеты"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq ca-certificates curl git rsync ufw

echo "==> Docker"
if ! command -v docker >/dev/null 2>&1; then
  . /etc/os-release
  codename="${VERSION_CODENAME:-noble}"
  # Если для свежего релиза каталога ещё нет — берём последний известный LTS.
  if ! curl -fsSL -o /dev/null "https://download.docker.com/linux/ubuntu/dists/$codename/Release"; then
    echo "    для $codename репозитория нет, использую noble"
    codename=noble
  fi

  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $codename stable" \
    > /etc/apt/sources.list.d/docker.list

  apt-get update -qq
  apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  systemctl enable --now docker
fi
docker --version
docker compose version

echo "==> Репозиторий в $DEPLOY_PATH"
if [ -d "$DEPLOY_PATH/.git" ]; then
  git -C "$DEPLOY_PATH" remote set-url origin "$REPO_URL"
  git -C "$DEPLOY_PATH" fetch --prune origin
  git -C "$DEPLOY_PATH" reset --hard "origin/$BRANCH"
else
  rm -rf "$DEPLOY_PATH"
  git clone --branch "$BRANCH" "$REPO_URL" "$DEPLOY_PATH"
fi

echo "==> Файрвол (ssh/http/https)"
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 443/udp
ufw --force enable
ufw status verbose

echo "==> Первый деплой"
bash "$DEPLOY_PATH/deploy/deploy.sh"

echo "==> Готово. Дальше деплой приходит из GitHub Actions по пушу в $BRANCH."

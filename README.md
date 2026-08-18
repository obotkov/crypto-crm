# WildEx

Платформа учёта криптопортфеля. Сейчас в проде — приветственная страница.

- Прод: https://wild-loop.online
- Сервер: `89.110.92.149`, каталог `/opt/wildex`
- Раздача: Caddy в Docker, HTTPS-сертификат Let's Encrypt выписывается автоматически

## Как устроен флоу

```
локальные правки  ->  git push origin main  ->  GitHub Actions  ->  сервер: git pull + docker compose
```

Ничего вручную на сервере делать не нужно: пуш в `main` запускает workflow
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml), он подключается к серверу
по SSH и запускает `deploy/deploy.sh`. Скрипт сам тянет свежий `main` из GitHub,
валидирует Caddyfile, поднимает контейнеры и перечитывает конфиг без простоя;
затем workflow проверяет, что сайт отвечает 200.

Задеплоить вручную (то же самое, без Actions):

```bash
ssh root@89.110.92.149 'cd /opt/wildex && bash deploy/deploy.sh'
```

## Локальная разработка

```bash
./dev.sh
```

Открыть http://localhost:8080. Если установлен Docker — поднимется тот же образ
Caddy, что и на проде; если нет — простой статик-сервер на Python.

## Структура

| Путь | Что это |
| --- | --- |
| `site/` | статика, которую раздаёт Caddy (`index.html`, `assets/`) |
| `Caddyfile` | конфиг Caddy: домен, HTTPS, заголовки, `/healthz` |
| `docker-compose.yml` | сервис `caddy` с томами под сертификаты и логи |
| `deploy/deploy.sh` | запускается на сервере: `git pull` + валидация конфига + `compose up` |
| `deploy/bootstrap-server.sh` | разовая подготовка сервера (Docker, ufw, clone репозитория) |
| `.github/workflows/deploy.yml` | автодеплой при пуше в `main` |
| `crypto-design/` | макеты и дизайн-система Nocturne (в деплой не попадает) |

Стили страницы берут токены из `site/assets/nocturne.css` — это копия
`crypto-design/_ds/nocturne-*/styles.css`. При обновлении дизайн-системы копию нужно
обновить тоже.

## Первичная настройка (уже сделана, для справки)

1. На сервере: `bash deploy/bootstrap-server.sh`
2. В GitHub → Settings → Secrets and variables → Actions добавлен секрет
   `DEPLOY_SSH_KEY` — приватный ключ, чей публичный лежит в
   `/root/.ssh/authorized_keys` на сервере.
   Опционально `DEPLOY_KNOWN_HOSTS` — вывод `ssh-keyscan -H 89.110.92.149`,
   чтобы не доверять хосту вслепую на каждом прогоне.
3. DNS: A-запись `wild-loop.online → 89.110.92.149`.

## Проверка прода

```bash
curl -sSI https://wild-loop.online | head -1
```

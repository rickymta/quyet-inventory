#!/usr/bin/env bash
# Gia hạn chứng chỉ Let's Encrypt rồi nạp lại cấu hình nginx. Chạy định kỳ bằng cron (xem README).
set -euo pipefail
cd "$(dirname "$0")/.."
HTTPS=(-f docker-compose.yml -f docker-compose.https.yml)
docker compose "${HTTPS[@]}" run --rm certbot renew --webroot -w /var/www/certbot --quiet
docker compose "${HTTPS[@]}" exec -T nginx nginx -s reload

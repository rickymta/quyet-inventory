#!/usr/bin/env bash
# Bật HTTPS bằng Let's Encrypt cho ứng dụng.
# Dùng: scripts/https-init.sh <tên-miền> <email>
# Điều kiện: DNS của tên miền đã trỏ về máy chủ này, cổng 80 và 443 đã mở trên tường lửa.
set -euo pipefail

usage() {
  cat >&2 <<USAGE
Cách dùng: $0 <tên-miền> <email>
  Ví dụ:   $0 kho.example.com admin@example.com

Script sẽ: (1) bảo đảm stack HTTP đang chạy, (2) lấy chứng chỉ Let's Encrypt bằng certbot (webroot),
(3) ghi SERVER_NAME=<tên-miền> vào .env, (4) khởi động lại với docker-compose.https.yml.
Đặt STAGING=1 để dùng máy chủ thử nghiệm của Let's Encrypt (chứng chỉ không được tin cậy).
USAGE
  exit 1
}

[ "$#" -eq 2 ] || usage
DOMAIN="$1"
EMAIL="$2"
if ! [[ "$DOMAIN" =~ ^[A-Za-z0-9]([A-Za-z0-9.-]*[A-Za-z0-9])?$ && "$DOMAIN" == *.* ]]; then
  echo "Tên miền không hợp lệ: $DOMAIN" >&2; exit 1
fi
if ! [[ "$EMAIL" =~ ^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$ ]]; then
  echo "Email không hợp lệ: $EMAIL" >&2; exit 1
fi

cd "$(dirname "$0")/.."
HTTP_ONLY=(-f docker-compose.yml)
HTTPS=(-f docker-compose.yml -f docker-compose.https.yml)

# Chỉ thêm/sửa đúng dòng SERVER_NAME trong .env
set_server_name() {
  touch .env
  if grep -q '^SERVER_NAME=' .env; then
    local tmp; tmp="$(mktemp)"
    awk -v v="SERVER_NAME=$DOMAIN" '/^SERVER_NAME=/ { print v; next } { print }' .env > "$tmp"
    cat "$tmp" > .env
    rm -f "$tmp"
  else
    [ -s .env ] && [ -n "$(tail -c1 .env)" ] && echo >> .env
    echo "SERVER_NAME=$DOMAIN" >> .env
  fi
}

echo "==> (1/4) Bảo đảm stack HTTP đang chạy"
docker compose "${HTTP_ONLY[@]}" up -d

echo "==> (2/4) Lấy chứng chỉ cho $DOMAIN"
EXTRA=()
[ "${STAGING:-0}" = "1" ] && EXTRA+=(--staging)
docker compose "${HTTPS[@]}" run --rm certbot certonly --webroot -w /var/www/certbot \
  -d "$DOMAIN" --email "$EMAIL" --agree-tos --no-eff-email --non-interactive ${EXTRA[@]+"${EXTRA[@]}"}

echo "==> (3/4) Ghi SERVER_NAME=$DOMAIN vào .env"
set_server_name

echo "==> (4/4) Khởi động lại với HTTPS"
SERVER_NAME="$DOMAIN" docker compose "${HTTPS[@]}" up -d --force-recreate nginx

echo
echo "Xong. Mở https://$DOMAIN"
echo "Từ nay luôn chạy: docker compose -f docker-compose.yml -f docker-compose.https.yml up -d"
echo "Gia hạn tự động: thêm cron chạy scripts/https-renew.sh (xem README)."

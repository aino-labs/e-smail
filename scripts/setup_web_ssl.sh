#!/bin/bash
set -euo pipefail

DOMAIN="${DOMAIN:-e-smail.ru}"
ALT_DOMAIN="${ALT_DOMAIN:-www.e-smail.ru}"
EMAIL="${EMAIL:-}"
MODE="self-signed"

while [ $# -gt 0 ]; do
  case "$1" in
    --letsencrypt) MODE="letsencrypt" ;;
    --self-signed) MODE="self-signed" ;;
    --domain) DOMAIN="$2"; shift ;;
    --alt) ALT_DOMAIN="$2"; shift ;;
    --email) EMAIL="$2"; shift ;;
    -h|--help)
      echo "usage: $0 [--self-signed|--letsencrypt] [--domain d] [--alt d] [--email a]"
      echo "  env overrides: DOMAIN, ALT_DOMAIN, EMAIL, COMPOSE_FILE"
      exit 0 ;;
    *) echo "unknown arg: $1" >&2; exit 1 ;;
  esac
  shift
done

CERT_DIR="certs/${DOMAIN}"
mkdir -p "${CERT_DIR}"

if [ "${MODE}" = "self-signed" ]; then
  openssl req -x509 -newkey rsa:4096 -nodes -days 365 \
    -keyout "${CERT_DIR}/privkey.pem" \
    -out "${CERT_DIR}/fullchain.pem" \
    -subj "/CN=${DOMAIN}" \
    -addext "subjectAltName=DNS:${DOMAIN},DNS:${ALT_DOMAIN}"
  echo "self-signed cert written to ${CERT_DIR}"
  echo "reload web: docker compose up -d web"
  exit 0
fi

if [ -z "${EMAIL}" ]; then
  echo "letsencrypt mode requires --email <addr> (or EMAIL env)" >&2
  exit 1
fi

if ! command -v certbot >/dev/null 2>&1; then
  echo "certbot not found, installing via apt..."
  sudo apt-get update && sudo apt-get install -y certbot
fi

sudo certbot certonly --standalone \
  -d "${DOMAIN}" -d "${ALT_DOMAIN}" \
  --email "${EMAIL}" --agree-tos --no-eff-email --non-interactive

LE_DIR="/etc/letsencrypt/live/${DOMAIN}"
sudo cp "${LE_DIR}/fullchain.pem" "${CERT_DIR}/fullchain.pem"
sudo cp "${LE_DIR}/privkey.pem" "${CERT_DIR}/privkey.pem"
sudo chown "$(id -u):$(id -g)" "${CERT_DIR}/fullchain.pem" "${CERT_DIR}/privkey.pem"

echo "letsencrypt cert installed in ${CERT_DIR}"
echo
echo "auto-renew (cron, runs ~daily, acts only when <30 days left):"
echo "0 3 * * * certbot renew --standalone --quiet \\"
echo "  --pre-hook 'docker compose -f /path/docker-compose.prod.yml stop web' \\"
echo "  --post-hook 'cp /etc/letsencrypt/live/${DOMAIN}/fullchain.pem /path/${CERT_DIR}/fullchain.pem; cp /etc/letsencrypt/live/${DOMAIN}/privkey.pem /path/${CERT_DIR}/privkey.pem; docker compose -f /path/docker-compose.prod.yml up -d web'"

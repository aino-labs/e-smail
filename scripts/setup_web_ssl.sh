#!/bin/bash
set -euo pipefail

DOMAIN="${DOMAIN:-e-smail.ru}"
ALT_DOMAIN="${ALT_DOMAIN:-www.e-smail.ru}"
EMAIL="${EMAIL:-}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
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
      echo "  env: DOMAIN, ALT_DOMAIN, EMAIL, COMPOSE_FILE"
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
  chmod 600 "${CERT_DIR}/privkey.pem"
  echo "self-signed cert written to ${CERT_DIR}"
  echo "apply: docker compose -f ${COMPOSE_FILE} up -d frontend"
  exit 0
fi

if [ -z "${EMAIL}" ]; then
  echo "letsencrypt mode requires --email <addr>" >&2
  exit 1
fi

command -v certbot >/dev/null 2>&1 || { apt-get update && apt-get install -y certbot; }

DARGS=(-d "${DOMAIN}")
if [ -n "${ALT_DOMAIN}" ] && getent ahosts "${ALT_DOMAIN}" >/dev/null 2>&1; then
  DARGS+=(-d "${ALT_DOMAIN}")
  echo "including ${ALT_DOMAIN} (resolves)"
else
  echo "skipping ${ALT_DOMAIN} (no DNS) — issuing for ${DOMAIN} only"
fi

echo "stopping frontend to free port 80..."
docker compose -f "${COMPOSE_FILE}" stop frontend 2>/dev/null || true

if ! certbot certonly --standalone --non-interactive --agree-tos --no-eff-email \
      --email "${EMAIL}" "${DARGS[@]}"; then
  echo "certbot failed; bringing frontend back with existing cert" >&2
  docker compose -f "${COMPOSE_FILE}" up -d frontend 2>/dev/null || true
  echo "check: A-record ${DOMAIN} points here and port 80 is open" >&2
  exit 1
fi

LE_DIR="/etc/letsencrypt/live/${DOMAIN}"
cp -fL "${LE_DIR}/fullchain.pem" "${CERT_DIR}/fullchain.pem"
cp -fL "${LE_DIR}/privkey.pem"  "${CERT_DIR}/privkey.pem"
chmod 600 "${CERT_DIR}/privkey.pem"

echo "starting frontend..."
docker compose -f "${COMPOSE_FILE}" up -d frontend 2>/dev/null || \
  echo "frontend not started yet (images not pulled) — certs are in ${CERT_DIR}, deploy will use them"

echo "issuer:"
openssl x509 -in "${CERT_DIR}/fullchain.pem" -noout -issuer
echo
echo "auto-renew — add to 'crontab -e' (runs from $(pwd)):"
echo "0 3 * * * cd $(pwd) && certbot renew --standalone --quiet --pre-hook 'docker compose -f ${COMPOSE_FILE} stop frontend' --deploy-hook 'cp -fL ${LE_DIR}/fullchain.pem ${CERT_DIR}/fullchain.pem; cp -fL ${LE_DIR}/privkey.pem ${CERT_DIR}/privkey.pem; chmod 600 ${CERT_DIR}/privkey.pem' --post-hook 'docker compose -f ${COMPOSE_FILE} up -d frontend'"

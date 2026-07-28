#!/bin/bash
set -e

mkdir -p certs/postfix

if [ -f certs/postfix/fullchain.pem ]; then
  echo "cert already exists, skipping"
  exit 0
fi

openssl req -x509 -newkey rsa:4096 \
  -keyout certs/postfix/privkey.pem \
  -out certs/postfix/fullchain.pem \
  -days 3650 -nodes \
  -subj "/CN=mail.e-smail.ru" \
  -addext "subjectAltName=DNS:mail.e-smail.ru"

chmod 600 certs/postfix/privkey.pem

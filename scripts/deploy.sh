#!/bin/bash
set -e

echo "$2" | docker login ghcr.io -u "$1" --password-stdin

docker compose -f docker-compose.prod.yml pull \
    user-service \
    email-service \
    folder-service \
    support-service \
    frontend \
    postfix

docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d --remove-orphans
docker image prune -f

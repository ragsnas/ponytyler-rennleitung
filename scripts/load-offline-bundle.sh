#!/usr/bin/env bash
# Load the images built by build-offline-bundle.sh and start the prod stack.
# Run this ON THE RASPBERRY PI, from the folder copied off the USB drive
# (it contains images-arm64.tar, docker-compose.prod.yml and .env.example).
#
# Requires Docker + the compose plugin to already be installed on the Pi.
# Does NOT need internet access.

set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${DIR}"

if [ ! -f "images-arm64.tar" ]; then
  echo "images-arm64.tar not found in ${DIR}" >&2
  exit 1
fi

echo "==> Loading images (this can take a while)"
docker load -i images-arm64.tar

if [ ! -f ".env" ]; then
  echo "==> No .env found, creating one from .env.example"
  echo "    Edit it now with your production values, then re-run this script."
  cp .env.example .env
  exit 0
fi

echo "==> Starting stack (no build, uses loaded images)"
docker compose -f docker-compose.prod.yml up -d

echo "==> Running database migrations"
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy

echo
echo "Done. docker compose -f docker-compose.prod.yml ps"
docker compose -f docker-compose.prod.yml ps

#!/usr/bin/env bash
# Build prod images for a Raspberry Pi (linux/arm64) and package everything
# needed to deploy on a Pi with NO internet connection into one folder that
# can be copied onto a USB drive.
#
# Run this on a machine WITH internet access (this repo checkout).
# See DOCKER.md -> "Offline / Raspberry Pi deployment" for the full flow.

set -euo pipefail

PLATFORM="linux/arm64"
BACKEND_IMAGE="ponytyler/backend:prod"
FRONTEND_IMAGE="ponytyler/frontend:prod"
POSTGRES_IMAGE="postgres:15-alpine"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="${ROOT_DIR}/offline-bundle"

echo "==> Ensuring buildx has arm64 emulation available"
docker buildx inspect --bootstrap >/dev/null

echo "==> Building backend image for ${PLATFORM}"
docker buildx build --platform "${PLATFORM}" -t "${BACKEND_IMAGE}" --load \
  -f "${ROOT_DIR}/be/Dockerfile.prod" "${ROOT_DIR}/be"

echo "==> Building frontend image for ${PLATFORM}"
docker buildx build --platform "${PLATFORM}" -t "${FRONTEND_IMAGE}" --load \
  -f "${ROOT_DIR}/ui/rl/Dockerfile.prod" "${ROOT_DIR}/ui/rl"

echo "==> Pulling postgres image for ${PLATFORM}"
docker pull --platform "${PLATFORM}" "${POSTGRES_IMAGE}"

rm -rf "${OUT_DIR}"
mkdir -p "${OUT_DIR}"

echo "==> Saving images to ${OUT_DIR}/images-arm64.tar (this can take a while)"
docker save -o "${OUT_DIR}/images-arm64.tar" \
  "${BACKEND_IMAGE}" "${FRONTEND_IMAGE}" "${POSTGRES_IMAGE}"

echo "==> Copying compose file, env template and load script"
cp "${ROOT_DIR}/docker-compose.prod.yml" "${OUT_DIR}/"
cp "${ROOT_DIR}/.env.example" "${OUT_DIR}/"
cp "${ROOT_DIR}/scripts/load-offline-bundle.sh" "${OUT_DIR}/"
chmod +x "${OUT_DIR}/load-offline-bundle.sh"

echo
echo "Done. Copy the whole '${OUT_DIR}' folder to a USB drive and onto the Pi."
echo "On the Pi, cd into that folder and run: ./load-offline-bundle.sh"

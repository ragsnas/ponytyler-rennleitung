#!/usr/bin/env bash
# Run the Playwright e2e suite against the dedicated docker-compose.e2e.yml
# stack (see e2e/README.md), then tear the stack back down.
#
# Playwright's webServer config starts the stack itself, but leaves it
# running afterwards for manual poking around. This script wraps that so a
# single command builds, tests and cleans up - handy for CI or a quick
# local check.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="${ROOT_DIR}/docker-compose.e2e.yml"

cleanup() {
  echo "==> Tearing down e2e stack"
  docker compose -f "${COMPOSE_FILE}" down -v
}
trap cleanup EXIT

cd "${ROOT_DIR}/e2e"

if [ ! -d "node_modules" ]; then
  echo "==> Installing e2e dependencies"
  npm install
fi

echo "==> Running Playwright e2e suite (starts docker-compose.e2e.yml)"
npm test

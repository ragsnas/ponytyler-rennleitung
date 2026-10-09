#!/usr/bin/env bash
# Run the Playwright e2e suite against the dedicated docker-compose.e2e.yml
# stack (see e2e/README.md), then tear the stack back down.
#
# Playwright's webServer config starts the stack itself, but leaves it
# running afterwards for manual poking around. This script wraps that so a
# single command builds, tests and cleans up - handy for CI or a quick
# local check.
#
# Usage: scripts/run-e2e-tests.sh [smoke|regression|all]   (default: smoke)
#   smoke       happy-path checks of basic functionality
#   regression  hardened scenarios
#   all         smoke, then regression - run this before a production release

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SUITE="${1:-smoke}"
case "${SUITE}" in
  smoke|regression|all) ;;
  *) echo "Unknown suite '${SUITE}' (expected smoke, regression or all)" >&2; exit 2 ;;
esac
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

echo "==> Running Playwright e2e suite '${SUITE}' (starts docker-compose.e2e.yml)"
npm run "test:${SUITE}"

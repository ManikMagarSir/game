#!/usr/bin/env bash
# Voxel Survivor R3F — plug-and-play launcher (macOS / Linux / Git Bash / WSL).
# Usage: ./start.sh [dev|test|e2e|build|preview]   (default: dev)
# Env:   PORT=5173 ./start.sh dev
set -euo pipefail
cd "$(dirname "$0")"

need() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "error: missing required dependency '$1'. Install Node.js 20+ from https://nodejs.org then re-run." >&2
    exit 1
  }
}
need node
need npm

node_major="$(node -p "process.versions.node.split('.')[0]")"
if [ "$node_major" -lt 20 ]; then
  echo "error: Node.js 20+ required (found $(node -v))." >&2
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "node_modules missing — installing dependencies (one-time setup)…"
  npm install
fi

mode="${1:-dev}"
case "$mode" in
  dev)
    echo "Starting dev server…"
    exec npm run dev -- --host 127.0.0.1 --port "${PORT:-5173}"
    ;;
  test)
    exec npm test
    ;;
  e2e)
    if [ ! -d "$HOME/.cache/ms-playwright" ] && [ ! -d "$LOCALAPPDATA/ms-playwright" ]; then
      echo "Installing Playwright Chromium (one-time setup)…"
      npx playwright install chromium
    fi
    exec npx playwright test
    ;;
  build)
    exec npm run build
    ;;
  preview)
    npm run build
    exec npm run preview -- --host 127.0.0.1 --port "${PORT:-4173}"
    ;;
  *)
    echo "error: unknown mode '$mode'. Use: dev|test|e2e|build|preview" >&2
    exit 1
    ;;
esac

#!/usr/bin/env sh

set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
PYTHON_SERVICE_DIR="$ROOT_DIR/python_algorithm_service"
UVICORN_BIN="${UVICORN_BIN:-/opt/miniconda3/envs/algorithm_env/bin/uvicorn}"

if [ -f "$ROOT_DIR/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  . "$ROOT_DIR/.env"
  set +a
fi

if [ "${PYTHON_ALGORITHM_SERVICE_API_KEY:-}" != "" ] && [ "${ALGO_API_KEY:-}" = "" ]; then
  export ALGO_API_KEY="$PYTHON_ALGORITHM_SERVICE_API_KEY"
fi

if [ "${PYTHON_ALGORITHM_SERVICE_AUTH_HEADER:-}" != "" ] && [ "${ALGO_AUTH_HEADER:-}" = "" ]; then
  export ALGO_AUTH_HEADER="$PYTHON_ALGORITHM_SERVICE_AUTH_HEADER"
fi

SERVICE_PORT="${ALGO_PORT:-8001}"

cd "$PYTHON_SERVICE_DIR"
exec "$UVICORN_BIN" app.main:app --reload --host 127.0.0.1 --port "$SERVICE_PORT"

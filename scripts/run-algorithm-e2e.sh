#!/usr/bin/env sh

set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)

if [ -f "$ROOT_DIR/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  . "$ROOT_DIR/.env"
  set +a
fi

export DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/super_project_manager?schema=public}"
export PYTHON_ALGORITHM_SERVICE_URL="${PYTHON_ALGORITHM_SERVICE_URL:-http://127.0.0.1:8001}"

cd "$ROOT_DIR"
npm run test:e2e -- --runInBand --testPathPattern=algorithms.e2e-spec.ts
npm run test:e2e -- --runInBand --testPathPattern=algorithm-risk-sampling.e2e-spec.ts

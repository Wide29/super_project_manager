# Python Algorithm Service

## Run

```bash
npm run algo:python:start
```

## Test

```bash
python -m pytest
```

## Optional authentication

Authentication is disabled by default. Once `ALGO_API_KEY` is set, every route except `/health`, `/openapi.json`, `/docs`, and `/redoc` requires a valid auth header.

```bash
export ALGO_API_KEY=shared-secret
export ALGO_AUTH_HEADER=X-Algorithm-Key
uvicorn app.main:app --reload --port 8001
```

- `ALGO_API_KEY`: shared secret for service-to-service calls
- `ALGO_AUTH_HEADER`: header name to validate, default `Authorization`
- when `ALGO_AUTH_HEADER=Authorization`, the service accepts `Authorization: Bearer <token>`
- when started through `npm run algo:python:start` from the repo root, the launcher reuses root `.env` values and maps `PYTHON_ALGORITHM_SERVICE_API_KEY` / `PYTHON_ALGORITHM_SERVICE_AUTH_HEADER` into `ALGO_*`

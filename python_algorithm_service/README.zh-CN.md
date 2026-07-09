# Python 算法服务

## 运行

```bash
npm run algo:python:start
```

## 测试

```bash
python -m pytest
```

## 可选鉴权

服务默认不开启接口鉴权；当设置 `ALGO_API_KEY` 后，除 `/health`、`/openapi.json`、`/docs`、`/redoc` 外的接口都会校验请求头。

```bash
export ALGO_API_KEY=shared-secret
export ALGO_AUTH_HEADER=X-Algorithm-Key
uvicorn app.main:app --reload --port 8001
```

- `ALGO_API_KEY`: 共享密钥
- `ALGO_AUTH_HEADER`: 鉴权请求头名称，默认 `Authorization`
- 当 `ALGO_AUTH_HEADER=Authorization` 时，服务支持 `Authorization: Bearer <token>` 格式
- 如果你从仓库根目录启动 `npm run algo:python:start`，脚本会自动读取根目录 `.env`，并把 `PYTHON_ALGORITHM_SERVICE_API_KEY` / `PYTHON_ALGORITHM_SERVICE_AUTH_HEADER` 映射到服务侧的 `ALGO_*` 配置

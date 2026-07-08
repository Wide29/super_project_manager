# Python Algorithm Service

## Run

```bash
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
uvicorn app.main:app --reload --port 8001
```

## Test

```bash
python -m pytest
```

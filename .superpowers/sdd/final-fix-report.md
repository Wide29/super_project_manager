# Python Algorithm Service Broad-Review Fix Report

## Scope

Updated only `python_algorithm_service/**` to address the remaining important issues from the broad review:

1. `rule.config` now participates in `risk`, `matching`, and `sampling` calculations.
2. Sampling now aligns `sampling_ratio`, ratio-derived target count, optional `target_sample_count`, forced high-risk inclusion, fallback behavior, and emitted `sample_count`.
3. `top_k` now rejects `0` and negative values at schema-validation time.
4. FastAPI now wraps validation failures and unhandled exceptions in a unified response envelope.
5. Input constraints were tightened for `window_type` and sampling task `risk_level`.

## What Changed

### Rule-driven calculations

- Added default per-domain rule configs in `app/infra/repositories/rule_repository.py`.
- Passed `rule.config` through service orchestration into:
  - `app/domain/risk/task_risk.py`
  - `app/domain/risk/worker_risk.py`
  - `app/domain/matching/scorer.py`
  - `app/domain/matching/policies.py`
  - `app/domain/sampling/planner.py`
  - `app/domain/sampling/strategies.py`

Covered thresholds/parameters include:

- task-risk signal thresholds and score weights
- worker-risk signal thresholds and score weights
- matching base score, load penalty, pass-rate bonus, strong-pass threshold, high-load threshold, rework boost
- sampling ratio by batch risk, forced risk levels, fallback enablement

### Sampling semantics

Sampling plan behavior is now:

1. derive base ratio from batch risk + rule config
2. convert ratio to a target sample count with ceiling rounding
3. let `context.target_sample_count` override the ratio-derived target when provided
4. force-include configured high-risk tasks even if that exceeds target count
5. fill the remaining slots from the available pool in stable order
6. if no forced task exists, mark fallback and warn accordingly
7. set `sample_count == len(selected_task_ids)`

### Validation and error envelopes

- `top_k` now uses `Field(ge=1)`.
- Added `WindowType` enum and constrained worker-risk requests.
- Constrained sampling task `risk_level` with `RiskLevel`.
- Added `app/api/error_handling.py` and registered:
  - `RequestValidationError -> 422 unified envelope`
  - `Exception -> 500 unified envelope`
- Added request-id middleware and propagate the request ID into successful route responses too.

## Test Coverage Added/Updated

- Domain:
  - rule-config-driven task risk
  - rule-config-driven worker risk
  - rule-config-driven matching score/policy
  - sampling ratio/target/forced/fallback interactions
- Service:
  - rule-config-driven task risk orchestration
  - rule-config-driven matching behavior
  - rule-config-driven sampling target fill
- API:
  - `top_k=0` rejected with 422 envelope
  - invalid `window_type` rejected with 422 envelope
  - invalid sampling `risk_level` rejected with 422 envelope
  - unhandled exception wrapped in 500 envelope
  - sampling API assertions updated to match the fixed ratio/count semantics

## Verification

Ran:

```bash
python -m pytest python_algorithm_service/tests -q
```

Result:

- `34 passed`
- `1 warning` from FastAPI/Starlette `TestClient` deprecation around `httpx`

## Residual Concerns

- Sampling currently fills non-forced remainder tasks in stable input order rather than random order. This keeps the implementation deterministic and testable, but true randomized low-risk baseline coverage would be a reasonable next iteration if the product wants production-grade sampling diversity.

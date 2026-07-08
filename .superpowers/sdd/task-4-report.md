# Task 4 Report

## status
DONE

## 改动文件列表
- `python_algorithm_service/app/main.py`
- `python_algorithm_service/app/api/routes/matching.py`
- `python_algorithm_service/app/domain/agent_assist/__init__.py`
- `python_algorithm_service/app/domain/feature/__init__.py`
- `python_algorithm_service/app/domain/forecast/__init__.py`
- `python_algorithm_service/app/domain/matching/__init__.py`
- `python_algorithm_service/app/domain/matching/filters.py`
- `python_algorithm_service/app/domain/matching/policies.py`
- `python_algorithm_service/app/domain/matching/scorer.py`
- `python_algorithm_service/app/schemas/matching.py`
- `python_algorithm_service/app/services/matching_service.py`
- `python_algorithm_service/tests/domain/test_matching.py`
- `python_algorithm_service/tests/test_matching_api.py`

## 运行过的命令
- `sed -n '1,260p' .superpowers/sdd/task-4-brief.md`
- `rg --files python_algorithm_service/app python_algorithm_service/tests`
- `git status --short`
- `sed -n '1,220p' python_algorithm_service/app/main.py`
- `sed -n '1,260p' python_algorithm_service/app/schemas/common.py`
- `sed -n '1,260p' python_algorithm_service/app/infra/repositories/rule_repository.py`
- `sed -n '1,260p' python_algorithm_service/app/services/risk_service.py`
- `sed -n '1,260p' python_algorithm_service/app/services/sampling_service.py`
- `sed -n '1,220p' python_algorithm_service/app/services/feature_service.py`
- `sed -n '1,220p' python_algorithm_service/app/api/routes/risk.py`
- `sed -n '1,220p' python_algorithm_service/app/api/routes/sampling.py`
- `sed -n '1,260p' python_algorithm_service/tests/test_risk_api.py`
- `sed -n '1,260p' python_algorithm_service/tests/test_sampling_api.py`
- `sed -n '1,260p' python_algorithm_service/app/domain/common/types.py`
- `sed -n '1,200p' python_algorithm_service/app/services/__init__.py`
- `sed -n '1,260p' python_algorithm_service/tests/test_risk_service.py`
- `sed -n '1,260p' python_algorithm_service/tests/test_sampling_service.py`
- `sed -n '1,260p' python_algorithm_service/app/schemas/risk.py`
- `sed -n '1,260p' python_algorithm_service/app/schemas/sampling.py`
- `sed -n '1,260p' python_algorithm_service/app/infra/repositories/feature_repository.py`
- `sed -n '1,260p' python_algorithm_service/app/domain/sampling/planner.py`
- `sed -n '1,260p' python_algorithm_service/tests/domain/test_sampling.py`
- `python -m pytest tests/test_matching_api.py -v`
- `python -m pytest tests/domain/test_matching.py tests/test_matching_api.py -v`
- `python -m pytest -v`
- `git diff -- python_algorithm_service`
- `git status --short python_algorithm_service .superpowers/sdd/task-4-report.md`
- `git diff --name-only -- python_algorithm_service`
- `git add python_algorithm_service/app/main.py python_algorithm_service/app/api/routes/matching.py python_algorithm_service/app/domain/agent_assist/__init__.py python_algorithm_service/app/domain/feature/__init__.py python_algorithm_service/app/domain/forecast/__init__.py python_algorithm_service/app/domain/matching/__init__.py python_algorithm_service/app/domain/matching/filters.py python_algorithm_service/app/domain/matching/policies.py python_algorithm_service/app/domain/matching/scorer.py python_algorithm_service/app/schemas/matching.py python_algorithm_service/app/services/matching_service.py python_algorithm_service/tests/domain/test_matching.py python_algorithm_service/tests/test_matching_api.py`
- `git commit -m "Add matching recommendation API"`

## 测试命令和结果
- `cd python_algorithm_service && python -m pytest tests/test_matching_api.py -v`
  - 结果：失败，`404 Not Found`，符合 brief 中的红灯预期。
- `cd python_algorithm_service && python -m pytest tests/domain/test_matching.py tests/test_matching_api.py -v`
  - 结果：通过，`2 passed`.
- `cd python_algorithm_service && python -m pytest -v`
  - 结果：通过，`19 passed`.

## 提交 hash
- `3e16526`

## concerns
- 无阻塞 concerns。
- 与 brief 的最小对齐说明：由于 Task 1/2/3 已落地共享 `ServiceEnvelope` 契约，matching 返回中补齐了既有必填字段 `feature_version`，并按现有服务模式接入了 `FeatureService.get_worker_features(...)`；这属于与已通过 review 的公共契约做最小对齐，没有扩写 forecast / agent_assist 的业务逻辑。

---

## reviewer findings fix (2026-07-08)

### 修复范围
- `python_algorithm_service/app/services/feature_service.py`
- `python_algorithm_service/app/domain/matching/scorer.py`
- `python_algorithm_service/app/domain/matching/policies.py`
- `python_algorithm_service/app/services/matching_service.py`
- `python_algorithm_service/tests/domain/test_matching.py`
- `python_algorithm_service/tests/test_matching_api.py`
- `python_algorithm_service/tests/test_matching_service.py`

### 修复说明
- 将 matching 对 `FeatureService` 的接入改为按候选 worker 分别取特征，不再把单份特征浅层套到全部候选人上。
- `FeatureService.get_worker_features(...)` 增加对 matching 场景的兼容：支持通过 `worker_id + context.worker_profiles` 解析单 worker 特征，并对 legacy `pass_rate` 做 `recent_pass_rate` 归一化回退。
- `score_candidate(...)` 改为直接消费 feature-aligned 字段，优先读取 `recent_pass_rate`，让 feature 层产物真正进入 scorer。
- `apply_policies(...)` 除分数外同时返回结构化 reason/warning code，补齐 rework continuity explainability。
- 在保持 recommendation 内部 `reasons` / `warnings` 为 `list[str]` 不变的前提下，把聚合后的结构化 `reasons` / `warnings` 补进共享 `ServiceEnvelope`。

### 新增/更新测试
- `tests/domain/test_matching.py`
  - 验证 scorer 读取 `recent_pass_rate`
  - 验证 policy boost 同时产出结构化 reason code
- `tests/test_matching_service.py`
  - 验证 matching 按 worker 分别消费 feature service 输出
  - 验证 envelope 聚合结构化 reasons / warnings
- `tests/test_matching_api.py`
  - 验证 API 外壳不变
  - 验证 recommendation 列表仍保留原始 string reasons / warnings
  - 验证 envelope 暴露结构化 explanation / warning

### 本次运行命令
- `cd python_algorithm_service && python -m pytest tests/domain/test_matching.py tests/test_matching_service.py tests/test_matching_api.py -v`
- `cd python_algorithm_service && python -m pytest -v --cov=app --cov-report=term-missing`

### 本次测试与覆盖率结果
- 定向回归：
  - `5 passed`
- 全量回归：
  - `22 passed`
- 覆盖率：
  - `TOTAL 99%`
  - `app/services/matching_service.py 98%`
  - `app/domain/matching/scorer.py 100%`
  - `app/domain/matching/policies.py 100%`
  - `app/services/feature_service.py 97%`

### 本次 concerns
- 无新增阻塞 concerns。

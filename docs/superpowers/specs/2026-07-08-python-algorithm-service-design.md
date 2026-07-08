# Python Algorithm Service Design

## 1. Background

The architecture documents in [docs/architecture](/Users/zhaojiaxiang/codex0/project_manager/docs/architecture) define a long-term direction where algorithm capabilities evolve out of the current application backend into an independent Python service layer.

This design turns that direction into a concrete first implementation target.

The goal is not to rewrite a few scoring functions in Python. The goal is to establish a language-agnostic algorithm service boundary that can support:

- matching recommendation
- quality risk scoring
- dynamic sampling
- later forecast capabilities
- later agent-assist capabilities

This design intentionally avoids coupling the algorithm layer to a specific frontend or backend stack. The business platform may remain TypeScript today, but the design must still work if the frontend or backend stack changes later.

## 2. Scope

### 2.1 In scope

This first design covers:

- an independently deployed Python algorithm service
- real online APIs for:
  - `matching`
  - `risk`
  - `sampling`
- service skeletons for:
  - `feature`
  - `forecast`
  - `agent_assist`
- a language-agnostic integration contract between the business platform and the Python service
- first-version rule-based algorithm implementation with explainable outputs
- service layering, configuration, testing, and rollout guidance

### 2.2 Out of scope

This design does not include:

- full training platform implementation
- offline feature warehouse implementation
- advanced model training pipelines
- direct algorithm writes into business state tables
- fully splitting the Python service into multiple deployable microservices on day one

## 3. Design goals

The system should satisfy the following goals:

1. Keep the business platform as the source of truth for workflow state, permissions, audit, and final decisions.
2. Make the algorithm service independently deployable and independently evolvable.
3. Keep the integration contract language-agnostic so the business backend is not assumed to be TypeScript.
4. Provide explainable outputs with versions, reasons, and warnings.
5. Support gradual evolution from rules to models without breaking the API contract.
6. Make failure safe through timeout, fallback, and manual override support.

## 4. Architecture

### 4.1 High-level structure

```text
Frontend (any stack)
  -> Business Platform / Orchestration Layer (any backend stack)
    -> Algorithm Adapter Responsibilities (implemented inside the business backend)
      -> Python Algorithm Service
```

### 4.2 Responsibility split

#### Frontend

The frontend:

- consumes algorithm results only through the business platform
- does not directly call the Python service
- displays recommendation, risk, and sampling outputs
- captures whether users accept or override algorithm suggestions

#### Business platform

The business platform remains responsible for:

- identity and permissions
- project, batch, task, QC, acceptance, and settlement workflow state
- request orchestration
- audit trail
- result snapshot persistence
- recording user adoption and override behavior
- final business actions

#### Algorithm adapter responsibilities

The design does not require a separately deployed gateway product. Instead, the business backend must implement a stable adapter layer with these responsibilities:

- build algorithm requests from business context
- manage timeout, retry, circuit breaking, and downgrade
- route to experiment variants if needed
- log invocations
- persist snapshots of requests and responses
- expose normalized results to the frontend

This keeps the integration pattern stable even if the backend language changes later.

#### Python Algorithm Service

The Python service is responsible for:

- request validation
- rule loading
- feature access and lightweight feature derivation
- recommendation, scoring, and sampling logic
- structured explanations
- versioned responses

The Python service must not directly change business truth state.

## 5. Service shape

### 5.1 Deployment model

The algorithm system will start as a single independently deployed Python service.

This is a deliberate compromise:

- simpler than starting with multiple microservices
- closer to the target architecture than embedding Python scripts in the business backend
- easy to split later because internal boundaries are explicit

### 5.2 Internal modular boundaries

The single deployed service should still be organized around future domain boundaries:

- `feature`
- `matching`
- `risk`
- `sampling`
- `forecast`
- `agent_assist`

Only `matching`, `risk`, and `sampling` are fully implemented in the first iteration. The others exist as placeholders so later expansion does not require rethinking the package structure.

## 6. Internal code structure

Recommended repository shape:

```text
python_algorithm_service/
  app/
    api/
      routes/
        health.py
        matching.py
        risk.py
        sampling.py
    schemas/
      common.py
      matching.py
      risk.py
      sampling.py
    services/
      feature_service.py
      matching_service.py
      risk_service.py
      sampling_service.py
    domain/
      common/
        enums.py
        types.py
      matching/
        filters.py
        policies.py
        scorer.py
      risk/
        task_risk.py
        worker_risk.py
      sampling/
        planner.py
        strategies.py
    infra/
      repositories/
        feature_repository.py
        rule_repository.py
      clients/
        business_platform_client.py
      logging.py
      settings.py
    main.py
  tests/
```

### 6.1 Layer responsibilities

#### `api`

- HTTP routing
- request and response marshalling
- no business logic

#### `schemas`

- request and response models
- input validation
- output contract stability

#### `services`

- orchestration for each algorithm request
- load rules
- fetch features
- call domain logic
- assemble final response

#### `domain`

- pure business and algorithm logic
- no FastAPI imports
- no ORM imports
- no network calls
- must be easy to unit test

#### `infra`

- configuration
- logging
- repository adapters
- external service adapters

## 7. API contract

### 7.1 Transport

The Python service will expose:

- HTTP APIs
- JSON payloads
- OpenAPI documentation

This keeps the contract language-neutral and suitable for any business platform stack.

### 7.2 First-version endpoints

```text
GET  /health
POST /api/v1/matching/recommend-task-workers
POST /api/v1/risk/task-score
POST /api/v1/risk/worker-score
POST /api/v1/sampling/batch-plan
```

### 7.3 Unified response envelope

Every successful response should use the same outer structure:

```json
{
  "request_id": "uuid",
  "service": "matching",
  "service_version": "v1",
  "rule_version": "matching_rules_v1",
  "feature_version": "task_feature_v1",
  "result": {},
  "reasons": [],
  "warnings": [],
  "debug": {}
}
```

Field expectations:

- `request_id`: correlation id for tracing
- `service`: algorithm domain name
- `service_version`: service contract version
- `rule_version`: ruleset version actually applied
- `feature_version`: feature set version actually applied
- `result`: domain-specific output
- `reasons`: primary explanation list
- `warnings`: degraded, missing-data, or policy warnings
- `debug`: optional diagnostic details for internal use

### 7.4 Endpoint behavior

#### `POST /api/v1/matching/recommend-task-workers`

Input should support:

- `task_id`
- `project_id`
- `batch_id`
- `candidate_worker_ids`
- `top_k`
- `context`

Result should include:

- ranked worker candidates
- score per candidate
- reason list
- warning list
- not-recommended signals when relevant

#### `POST /api/v1/risk/task-score`

Input should support:

- `task_id`
- `project_id`
- optional business context

Result should include:

- `risk_score`
- `risk_level`
- `reason_codes`

#### `POST /api/v1/risk/worker-score`

Input should support:

- `worker_id`
- `project_id`
- optional time window
- optional business context

Result should include:

- `risk_score`
- `risk_level`
- `reason_codes`
- `window_type`

#### `POST /api/v1/sampling/batch-plan`

Input should support:

- `batch_id`
- `project_id`
- batch statistics
- optional task pool
- optional policy context

Result should include:

- suggested sampling ratio
- suggested sample count
- selected or prioritized tasks
- reasons and warnings
- recommendation flags such as expand sampling or hold acceptance

## 8. First-version algorithm strategy

The first version should be rule-first and explainable. It must be possible to replace some internal logic with models later without changing the external API.

### 8.1 Matching

Recommended three-stage flow:

1. hard rule filtering
2. lightweight scoring
3. policy adjustment

Hard rule filtering includes signals such as:

- role compatibility
- supported task types
- supported media types
- original-worker rework policy
- assignability status

Lightweight scoring includes signals such as:

- current load
- historical pass rate
- rework success rate
- domain experience
- urgency alignment

Policy adjustment includes signals such as:

- high-priority task weighting
- rework handling weighting
- important-project protection

### 8.2 Risk

Risk scoring starts with explainable rule-based scoring.

Task-level risk signals include:

- rework count
- historical defect signals
- deadline pressure
- task complexity
- dispute frequency

Worker-level risk signals include:

- recent pass-rate decline
- rising rework rate
- abnormal load
- stability fluctuation

Outputs map into stable levels such as:

- `low`
- `medium`
- `high`

### 8.3 Sampling

Sampling starts with dynamic rule-driven planning:

- determine a base sampling ratio from batch risk
- force-include high-risk tasks
- preserve random baseline coverage for low-risk tasks
- support recommendation flags such as expanded sampling or delayed acceptance

## 9. Features and configuration

### 9.1 Feature access strategy

The first version should not block on building a full online feature platform.

Instead, introduce a `Feature Access Layer` that:

- receives structured inputs from the business platform
- optionally enriches or derives lightweight secondary features inside Python
- preserves a stable interface for future integration with feature stores or offline outputs

This avoids premature infrastructure while keeping the design extensible.

### 9.2 Rule configuration strategy

Rule configuration must not be hardcoded into domain logic.

Configuration should support:

- `rule_type`
- `project_id`
- `version`
- default fallback rules

The source of truth for rule definitions may live outside the Python service, but the Python service must be able to:

- load the applicable configuration
- apply project-specific overrides
- fall back to default rules when configuration is missing
- expose the applied `rule_version` in the response

## 10. Failure handling and downgrade

Every algorithm call must be safe to fail.

### 10.1 Expected downgrade paths

- configuration missing -> use service default rules and return warnings
- feature missing -> return conservative output and warnings
- internal algorithm error -> caller downgrades to business fallback path
- timeout -> caller uses fallback path and records degraded invocation

### 10.2 Fallback ownership

The business platform owns final fallback behavior. The Python service returns warnings and errors, but the business platform decides whether to:

- use cached results
- use default pure-rule behavior in the caller
- require manual operation

## 11. Integration model

### 11.1 Business flow

```text
User action or workflow event
  -> Business platform
  -> Adapter responsibilities inside business backend
  -> Python Algorithm Service
  -> Algorithm response
  -> Business platform snapshot persistence
  -> Frontend display and human decision
```

### 11.2 Persistence ownership

The Python service should not directly write recommendation or scoring results into the business system of record.

The business platform should persist:

- request snapshot
- response snapshot
- service version
- rule version
- feature version
- user adoption or override signals
- final business outcome

This preserves clear ownership and reduces coupling to any specific ORM or database schema.

## 12. Technology choices

Recommended first-version stack:

- `FastAPI`
- `Pydantic v2`
- `uvicorn`
- `pytest`
- `httpx`
- standard `logging` or `structlog`
- `ruff`
- `black`
- optional `mypy` for core domain typing

The design intentionally avoids heavyweight task queues, framework-heavy dependency systems, or complex DDD infrastructure in the first version.

## 13. Engineering rules

The service should follow these rules from the start:

1. Domain logic must not depend on web framework details.
2. Every route must return the unified response envelope.
3. Reason codes, warning codes, and risk levels should be centrally defined.
4. Scoring and policy logic should be written as testable pure functions wherever possible.
5. Every result must carry `service_version`, `rule_version`, and `feature_version`.
6. The API contract must remain stable when internal rules are replaced by trained models.

## 14. Testing strategy

### 14.1 Domain tests

Cover:

- rule filters
- scoring functions
- risk level mapping
- sampling policy behavior
- missing-feature and edge-case handling

### 14.2 API integration tests

Cover:

- request validation
- response shape
- version fields
- warning behavior
- error responses

### 14.3 Business-platform integration tests

Cover:

- timeout and fallback handling
- invocation logging
- snapshot persistence
- frontend field compatibility
- adoption and override feedback loop

## 15. Delivery order

Recommended implementation sequence:

1. establish Python service skeleton and unified response protocol
2. implement `risk/task-score`
3. implement `sampling/batch-plan`
4. implement `matching/recommend-task-workers`
5. add placeholder modules for `feature`, `forecast`, and `agent_assist`
6. integrate the business-platform adapter and rollout controls

This sequence favors the lowest-risk path to a usable first end-to-end flow.

## 16. Future evolution

This design is intended to evolve without API breakage:

- rules can become lightweight models
- lightweight models can become ranking or prediction models
- internal modules can split into deployable services later
- feature access can move from inline request data to a feature store
- the calling business platform can change language or framework

The external integration should remain stable across those changes.

## 17. Open implementation note

The current repository still contains TypeScript-based algorithm gateway logic in [src/algorithms](/Users/zhaojiaxiang/codex0/project_manager/src/algorithms). That code should be treated as the current behavior reference, not the long-term architecture target.

The Python service design here supersedes the assumption that algorithm implementation should remain inside a TypeScript backend. The business backend may still keep adapter responsibilities, but the algorithm logic itself should move behind the independent Python service boundary described above.

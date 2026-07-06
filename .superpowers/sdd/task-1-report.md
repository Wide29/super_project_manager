# Task 1 Report: Build Shared Workbench Agent Card And AI Helpers

## Implemented

- Added `getDeliverySuggestion(message, context)` in [apps/web/lib/api/ai.ts](/Users/zhaojiaxiang/codex0/project_manager/apps/web/lib/api/ai.ts:11) as a thin wrapper over the existing `/ai/chat` proxy path.
- Created the reusable client-side `WorkbenchAgentCard` in [apps/web/components/ai/workbench-agent-card.tsx](/Users/zhaojiaxiang/codex0/project_manager/apps/web/components/ai/workbench-agent-card.tsx:1) with:
  - loading and error states
  - empty-state hint text
  - optional insert action
  - advisory-only draft rendering
- Added the Task 1 browser expectation in [apps/web/tests/workflow-ops.spec.ts](/Users/zhaojiaxiang/codex0/project_manager/apps/web/tests/workflow-ops.spec.ts:199) to assert the QA delivery workbench will expose the AI suggestion and insert buttons once the later integration lands.

## Tested

- `npm run build --workspace web`
  - Result: PASS
- `npm run test:e2e --workspace web -- --grep "角色工作台支持 AI 建议生成与备注填入"`
  - Result: FAIL as expected at this task stage
  - Reason: `/qa-delivery` does not yet mount the shared AI card, so the new button expectation is currently red by design.

## TDD Evidence

- The new browser expectation is present at [apps/web/tests/workflow-ops.spec.ts:199-203](/Users/zhaojiaxiang/codex0/project_manager/apps/web/tests/workflow-ops.spec.ts:199), matching the brief's red-first step for Task 1.

## Self-Review

- The shared card is client-only and keeps AI advisory rather than auto-submitting anything.
- `WorkbenchAgentCard` uses `ReactElement` instead of `JSX.Element` so the Next build typecheck passes in this repository.
- `getDeliverySuggestion` preserves the existing backend proxy boundary and does not add any new endpoint.

## Concerns

- The added e2e test is intentionally red until Task 2 wires the shared card into the QA/Delivery workbench.
- The current task scope does not include page integration, so button visibility is not yet achievable from this file set alone.

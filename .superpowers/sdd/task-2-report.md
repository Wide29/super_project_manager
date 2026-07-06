# Task 2 Report: Integrate AI Draft Insertion Into QA And Algorithm Workbenches

## What I Implemented

- Added external draft support to `TaskReviewForm` via `externalNotesDraft?: string`.
  - When a non-empty external draft arrives, the form now updates the `notes` field without auto-submitting.
- Added external draft support to `BatchAcceptanceForm` via `externalNotesDraft?: string`.
  - When a non-empty external draft arrives, the acceptance note field updates in place without changing any submit behavior.
- Wired `WorkbenchAgentCard` into the QA/Delivery workbench.
  - Added an `AI 质检助手` card next to the existing QA form.
  - Reused `getTaskSuggestion(taskId, prompt)` and kept all AI-facing copy in Chinese.
  - One-click insertion now fills `质检备注`.
- Wired `WorkbenchAgentCard` into the Algorithm workbench.
  - Added an `AI 验收助手` card next to the existing acceptance form.
  - Reused `getDeliverySuggestion(message, context)` and assembled delivery context on the frontend.
  - One-click insertion now fills `验收备注`.
- Cleared stale inserted drafts when the selected QA task or selected delivery changes.
  - This prevents a previous task/delivery’s suggestion from leaking into a newly selected form.
- Expanded `apps/web/tests/workflow-ops.spec.ts` to cover the real AI assist flow.
  - The new test seeds project/batch/task/delivery data.
  - It stubs the existing `/api/ai/task-suggestion` and `/api/ai/chat` proxy calls at the browser layer so the test validates UI integration without depending on an external model service.
- Hardened an existing algorithm workbench e2e assertion in the same spec.
  - The test now samples the first available checkbox instead of assuming two sampleable tasks are always present.

## TDD Evidence

1. Updated `apps/web/tests/workflow-ops.spec.ts` first to assert:
   - QA workbench can generate AI suggestion
   - QA suggestion can be inserted into `质检备注`
   - Algorithm workbench can generate AI suggestion
   - Algorithm suggestion can be inserted into `验收备注`
2. Ran:

```bash
npm run test:e2e --workspace web -- --grep "角色工作台支持 AI 建议生成与备注填入"
```

3. Observed initial failure before implementation:
   - First failure: `生成质检建议` button did not exist yet.
   - Second failure after UI wiring: AI request remained in `生成中...` because the test depended on a live AI backend call.
4. Added the minimal production changes plus browser-level stubs for the existing AI proxy endpoints.
5. Re-ran the same targeted test and confirmed it passed.

## Files Changed

- `apps/web/components/forms/task-review-form.tsx`
- `apps/web/components/forms/batch-acceptance-form.tsx`
- `apps/web/components/workbench/qa-delivery-workbench.tsx`
- `apps/web/components/workbench/algorithm-workbench.tsx`
- `apps/web/tests/workflow-ops.spec.ts`

## Testing Performed

### Passed

```bash
npm run test:e2e --workspace web -- --grep "角色工作台支持 AI 建议生成与备注填入"
```

- Result: PASS

```bash
npm run test:e2e --workspace web -- --grep "角色工作台支持 AI 建议生成与备注填入|角色工作台支持直接质检、交付与算法验收|侧边栏可进入质检交付台与算法验收台"
```

- Result: PASS

```bash
npm run build --workspace web
```

- Result: PASS

```bash
npm run test:e2e
```

- Result: PASS
- Note: this is the backend Jest e2e suite from the repository root.

### Not Fully Green

```bash
npm run test:e2e --workspace web
```

- Result: FAIL
- Failing test outside Task 2 scope:
  - `apps/web/tests/project-batch-forms.spec.ts`
  - Test name: `批次页和任务页支持创建任务、导入 JSON 和分配标注员`
  - Failure symptom: expected newly created manual task link to become visible, but it did not.
- This failure is unrelated to the five Task 2-owned files and was not modified as part of this task.

## Self-Review Findings

- The implementation preserves manual human submission and does not auto-submit or auto-decide.
- The implementation reuses existing AI proxy boundaries only:
  - `getTaskSuggestion()` for QA
  - `getDeliverySuggestion()` for algorithm acceptance
- All newly added user-facing AI copy in the workbench flow is Chinese.
- Clearing `qaDraft` / `acceptanceDraft` on selection change avoids stale suggestion carry-over.
- The e2e AI flow uses browser-route stubs against `/api/ai/*`, which keeps the test deterministic while still exercising the frontend proxy boundary.

## Concerns

- Full Playwright coverage for `apps/web` is not green because of one pre-existing failure in `apps/web/tests/project-batch-forms.spec.ts`, outside the Task 2 ownership boundary.
- The AI workflow e2e test must stub `/api/ai/task-suggestion` and `/api/ai/chat`; otherwise it depends on external AI availability and environment configuration.

## Review Follow-Up: Stale Draft Fix Wave

### Additional changes implemented

- Prevented stale AI card state from surviving selected-record changes by remounting `WorkbenchAgentCard` with record-specific keys in both workbenches.
- Cleared stale in-card draft state before every new generation attempt in `WorkbenchAgentCard`, so a failed refresh cannot leave the old insertable draft behind.
- Added an accessible region label to `WorkbenchAgentCard` so Playwright can scope directly to the intended AI card.
- Strengthened `apps/web/tests/workflow-ops.spec.ts`:
  - it now uses record-specific AI stub responses
  - it asserts exact inserted stub text for QA and algorithm notes
  - it verifies the old suggestion text and old insert button disappear after switching to another selected record

### Additional TDD evidence

1. Expanded the AI workbench e2e first to assert exact inserted text and stale-draft disappearance after switching records.
2. Ran the focused test before the fix and observed the intended failure:
   - old QA draft remained visible/insertable after switching to another selected task
3. Applied the minimal production fix:
   - keyed remounts for the AI cards
   - `setDraft('')` before each generation
4. Re-ran the same focused test and confirmed it passed.

### Additional tests run

```bash
npm run test:e2e --workspace web -- --grep "角色工作台支持 AI 建议生成与备注填入"
```

- Result: PASS

```bash
npm run test:e2e --workspace web -- --grep "角色工作台支持 AI 建议生成与备注填入|角色工作台支持直接质检、交付与算法验收|侧边栏可进入质检交付台与算法验收台"
```

- Result: PASS

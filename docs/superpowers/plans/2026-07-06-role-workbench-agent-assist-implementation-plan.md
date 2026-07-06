# Role Workbench Agent Assist Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add lightweight AI suggestion panels to the QA/Delivery and Algorithm workbenches so operators can generate Chinese note drafts and insert them into existing workflow forms.

**Architecture:** Reuse the existing backend DeepSeek proxy instead of adding new orchestration. The QA workbench uses the existing task-suggestion endpoint for selected tasks, while the Algorithm workbench uses the existing chat endpoint with delivery context assembled on the frontend. Both workbenches mount a shared client-side agent card that generates suggestions and passes drafted note text into the existing form components.

**Tech Stack:** Next.js App Router, TypeScript, Tailwind CSS, Playwright, NestJS AI proxy, DeepSeek

## Global Constraints

- Frontend must not call DeepSeek directly.
- DeepSeek API keys live only in backend environment variables.
- Output shown to users must be Chinese.
- AI remains advisory only and must not auto-submit workflow decisions.
- Existing manual task review, batch delivery, and batch acceptance flows must keep working.

---

## File Structure

- Create: `apps/web/components/ai/workbench-agent-card.tsx`
  - Shared client-side AI suggestion card for role workbenches.
- Modify: `apps/web/lib/api/ai.ts`
  - Add a small helper for role-aware delivery suggestions via `/ai/chat`.
- Modify: `apps/web/components/forms/task-review-form.tsx`
  - Accept externally inserted note drafts.
- Modify: `apps/web/components/forms/batch-acceptance-form.tsx`
  - Accept externally inserted note drafts.
- Modify: `apps/web/components/workbench/qa-delivery-workbench.tsx`
  - Mount AI card for selected task and wire note insertion.
- Modify: `apps/web/components/workbench/algorithm-workbench.tsx`
  - Mount AI card for selected delivery and wire note insertion.
- Modify: `apps/web/tests/workflow-ops.spec.ts`
  - Add browser coverage for generating and inserting AI note drafts.

## Task 1: Build Shared Workbench Agent Card And AI Helpers

**Files:**
- Create: `apps/web/components/ai/workbench-agent-card.tsx`
- Modify: `apps/web/lib/api/ai.ts`
- Test: `apps/web/tests/workflow-ops.spec.ts`

**Interfaces:**
- Consumes:
  - `chatWithAssistant(message: string, context?: string): Promise<AiChatResponse>`
  - `getTaskSuggestion(taskId: string, prompt?: string): Promise<TaskSuggestionResponse>`
- Produces:
  - `getDeliverySuggestion(message: string, context: string): Promise<AiChatResponse>`
  - `WorkbenchAgentCard(props: { title: string; description: string; actionLabel: string; loadingLabel: string; emptyHint: string; disabled?: boolean; onGenerate: () => Promise<string>; onInsert?: (draft: string) => void; insertLabel?: string }): JSX.Element`

- [ ] **Step 1: Write the failing browser expectation**

```ts
// apps/web/tests/workflow-ops.spec.ts
test('角色工作台支持 AI 建议生成与备注填入', async ({ page }) => {
  await page.goto('/qa-delivery');
  await expect(page.getByRole('button', { name: '生成质检建议' })).toBeVisible();
  await expect(page.getByRole('button', { name: '填入质检备注' })).toBeVisible();
});
```

- [ ] **Step 2: Run the targeted browser test to verify it fails**

Run: `npm run test:e2e --workspace web -- --grep "角色工作台支持 AI 建议生成与备注填入"`

Expected: FAIL because the AI workbench card and buttons do not exist yet.

- [ ] **Step 3: Add the minimal AI helper for delivery suggestions**

```ts
// apps/web/lib/api/ai.ts
export function getDeliverySuggestion(message: string, context: string) {
  return chatWithAssistant(message, context);
}
```

```ts
// apps/web/lib/api/ai.ts
export function getTaskSuggestion(taskId: string, prompt?: string) {
  return apiFetch<TaskSuggestionResponse>('/ai/task-suggestion', {
    method: 'POST',
    body: JSON.stringify({ taskId, prompt })
  });
}
```

- [ ] **Step 4: Create the shared workbench AI card**

```tsx
// apps/web/components/ai/workbench-agent-card.tsx
'use client';

import { useState } from 'react';

export function WorkbenchAgentCard({
  title,
  description,
  actionLabel,
  loadingLabel,
  emptyHint,
  disabled,
  onGenerate,
  onInsert,
  insertLabel = '填入备注'
}: {
  title: string;
  description: string;
  actionLabel: string;
  loadingLabel: string;
  emptyHint: string;
  disabled?: boolean;
  onGenerate: () => Promise<string>;
  onInsert?: (draft: string) => void;
  insertLabel?: string;
}) {
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleGenerate() {
    if (disabled) return;
    setLoading(true);
    setError('');

    try {
      const nextDraft = await onGenerate();
      setDraft(nextDraft);
    } catch (err) {
      setError(err instanceof Error ? err.message : '建议生成失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-panel border border-panelLine bg-white p-6 shadow-panel">
      <h3 className="text-lg font-semibold text-slateDeep">{title}</h3>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
      <button
        type="button"
        onClick={handleGenerate}
        disabled={disabled || loading}
        className="mt-4 rounded-full bg-slateDeep px-5 py-2.5 text-sm text-white disabled:opacity-60"
      >
        {loading ? loadingLabel : actionLabel}
      </button>
      {error ? <p className="mt-4 text-sm text-rose-500">{error}</p> : null}
      {draft ? (
        <>
          <div className="mt-4 rounded-2xl bg-skySoft p-4 text-sm leading-7 text-slateDeep">
            {draft}
          </div>
          {onInsert ? (
            <button
              type="button"
              onClick={() => onInsert(draft)}
              className="mt-4 rounded-full bg-skyStrong px-5 py-2.5 text-sm text-white"
            >
              {insertLabel}
            </button>
          ) : null}
        </>
      ) : (
        <p className="mt-4 text-sm text-slate-500">{emptyHint}</p>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Run build to verify the shared card compiles**

Run: `npm run build --workspace web`

Expected: PASS with the new AI helper and shared card compiling successfully.

- [ ] **Step 6: Commit**

```bash
git add apps/web/lib/api/ai.ts apps/web/components/ai/workbench-agent-card.tsx apps/web/tests/workflow-ops.spec.ts
git commit -m "feat: add shared workbench agent assist card"
```

## Task 2: Integrate AI Draft Insertion Into QA And Algorithm Workbenches

**Files:**
- Modify: `apps/web/components/forms/task-review-form.tsx`
- Modify: `apps/web/components/forms/batch-acceptance-form.tsx`
- Modify: `apps/web/components/workbench/qa-delivery-workbench.tsx`
- Modify: `apps/web/components/workbench/algorithm-workbench.tsx`
- Modify: `apps/web/tests/workflow-ops.spec.ts`

**Interfaces:**
- Consumes:
  - `WorkbenchAgentCard`
  - `getTaskSuggestion(taskId: string, prompt?: string): Promise<TaskSuggestionResponse>`
  - `getDeliverySuggestion(message: string, context: string): Promise<AiChatResponse>`
- Produces:
  - `TaskReviewForm(props: { taskId: string; externalNotesDraft?: string }): JSX.Element`
  - `BatchAcceptanceForm(props: { deliveries: BatchDelivery[]; tasks: TaskSummary[]; onCreated?: (acceptance: BatchAcceptance) => void; externalNotesDraft?: string }): JSX.Element`

- [ ] **Step 1: Write the failing workbench AI flow test**

```ts
// apps/web/tests/workflow-ops.spec.ts
test('角色工作台支持 AI 建议生成与备注填入', async ({ page }) => {
  await page.goto('/qa-delivery');
  await page.getByRole('button', { name: '生成质检建议' }).click();
  await expect(page.getByRole('button', { name: '填入质检备注' })).toBeVisible();

  await page.getByRole('button', { name: '填入质检备注' }).click();
  await expect(page.getByLabel('质检备注')).not.toHaveValue('');

  await page.goto('/algorithm');
  await page.getByRole('button', { name: '生成验收建议' }).click();
  await expect(page.getByRole('button', { name: '填入验收备注' })).toBeVisible();

  await page.getByRole('button', { name: '填入验收备注' }).click();
  await expect(page.getByLabel('验收备注')).not.toHaveValue('');
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test:e2e --workspace web -- --grep "角色工作台支持 AI 建议生成与备注填入"`

Expected: FAIL because the workbench forms do not yet accept external draft insertion.

- [ ] **Step 3: Make the forms accept externally inserted drafts**

```tsx
// apps/web/components/forms/task-review-form.tsx
import { useEffect, useState } from 'react';

export function TaskReviewForm({
  taskId,
  externalNotesDraft
}: {
  taskId: string;
  externalNotesDraft?: string;
}) {
  const [form, setForm] = useState(INITIAL_FORM);

  useEffect(() => {
    if (!externalNotesDraft) return;
    setForm((current) => ({ ...current, notes: externalNotesDraft }));
  }, [externalNotesDraft]);
}
```

```tsx
// apps/web/components/forms/batch-acceptance-form.tsx
export function BatchAcceptanceForm({
  deliveries,
  tasks,
  onCreated,
  externalNotesDraft
}: {
  deliveries: BatchDelivery[];
  tasks: TaskSummary[];
  onCreated?: (acceptance: BatchAcceptance) => void;
  externalNotesDraft?: string;
}) {
  useEffect(() => {
    if (!externalNotesDraft) return;
    setForm((current) => ({ ...current, notes: externalNotesDraft }));
  }, [externalNotesDraft]);
}
```

- [ ] **Step 4: Integrate AI cards into both role workbenches**

```tsx
// apps/web/components/workbench/qa-delivery-workbench.tsx
const [qaDraft, setQaDraft] = useState('');

<WorkbenchAgentCard
  title="AI 质检助手"
  description="为当前题目生成风险提示、结论倾向和备注草稿。"
  actionLabel="生成质检建议"
  loadingLabel="生成中..."
  emptyHint="选择题目后可生成 AI 质检建议。"
  disabled={!selectedTask}
  onGenerate={async () => {
    const result = await getTaskSuggestion(
      selectedTask!.taskId,
      '请基于题目内容输出中文质检建议，包含：风险点、通过/打回倾向提示、可直接使用的质检备注草稿。请明确说明建议仅供人工参考。'
    );

    return result.suggestion;
  }}
  onInsert={(draft) => setQaDraft(draft)}
  insertLabel="填入质检备注"
/>

<TaskReviewForm key={selectedTask.taskId} taskId={selectedTask.taskId} externalNotesDraft={qaDraft} />
```

```tsx
// apps/web/components/workbench/algorithm-workbench.tsx
const [acceptanceDraft, setAcceptanceDraft] = useState('');

<WorkbenchAgentCard
  title="AI 验收助手"
  description="为当前交付生成抽检关注点、风险模式和验收备注草稿。"
  actionLabel="生成验收建议"
  loadingLabel="生成中..."
  emptyHint="选择交付后可生成 AI 验收建议。"
  disabled={!selectedRecord}
  onGenerate={async () => {
    const context = `批次：${selectedRecord!.batchName}\n项目：${selectedRecord!.projectName}\n交付说明：${selectedRecord!.delivery.notes ?? '无'}\n候选题目：${selectedRecord!.tasks.map((task) => task.title).join('、')}`;
    const result = await getDeliverySuggestion(
      '请输出中文算法验收建议，包含：建议抽检关注点、可能缺陷模式、可直接使用的验收备注草稿。请明确说明建议仅供人工参考。',
      context
    );

    return result.answer;
  }}
  onInsert={(draft) => setAcceptanceDraft(draft)}
  insertLabel="填入验收备注"
/>

<BatchAcceptanceForm
  key={selectedRecord.delivery.id}
  deliveries={[selectedRecord.delivery]}
  tasks={selectedRecord.tasks}
  externalNotesDraft={acceptanceDraft}
/>
```

- [ ] **Step 5: Run the browser workflow regression**

Run: `npm run test:e2e --workspace web -- --grep "角色工作台支持 AI 建议生成与备注填入|角色工作台支持直接质检、交付与算法验收|侧边栏可进入质检交付台与算法验收台"`

Expected: PASS with AI suggestion generation/insertion and the existing role workflow tests both green.

- [ ] **Step 6: Run final build and backend regression**

Run: `npm run build --workspace web`
Expected: PASS

Run: `npm run test:e2e`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add apps/web/components/forms/task-review-form.tsx apps/web/components/forms/batch-acceptance-form.tsx apps/web/components/workbench/qa-delivery-workbench.tsx apps/web/components/workbench/algorithm-workbench.tsx apps/web/tests/workflow-ops.spec.ts
git commit -m "feat: add ai assist to role workbenches"
```

## Self-Review

### Spec coverage

- QA/Delivery workbench AI suggestion card: covered in Task 2.
- Algorithm workbench AI suggestion card: covered in Task 2.
- Reuse of existing backend AI proxy: covered in Task 1 and Task 2 through existing `/ai/chat` and `/ai/task-suggestion`.
- One-click insertion of AI-generated note drafts into existing forms: covered in Task 2.
- No auto-submit and no silent final decisions: preserved by keeping AI output advisory and form submission manual.

### Placeholder scan

- No `TODO`, `TBD`, or deferred implementation markers remain.
- Each task includes explicit file paths, code snippets, commands, and expected outcomes.

### Type consistency

- `TaskReviewForm` adds `externalNotesDraft?: string` and keeps `taskId: string`.
- `BatchAcceptanceForm` adds `externalNotesDraft?: string` and keeps existing `deliveries`, `tasks`, and `onCreated`.
- `WorkbenchAgentCard` returns plain suggestion text and delegates insertion through `onInsert`.


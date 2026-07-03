# Delivery, Acceptance, and Settlement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first production-grade delivery, algorithm acceptance, reassignment, and settlement workflow on top of the existing project, batch, task, and assignment platform.

**Architecture:** Extend the existing NestJS + Prisma backend with new workflow objects instead of replacing the current task core. Keep the existing Next.js pages as the primary entry points, then incrementally add workflow cards and two role-focused pages so every stage is testable end-to-end.

**Tech Stack:** NestJS, Prisma, PostgreSQL, Jest e2e, Next.js App Router, React, Playwright, Tailwind CSS

## Global Constraints

- Keep `Project / Batch / TaskItem / TaskAssignment` as the existing backbone and add capabilities incrementally.
- Formal acceptance is batch-first; sampled task reviews live under the batch acceptance flow.
- Support three acceptance outcomes exactly: `accepted`, `partially_rejected`, `rejected`.
- Support reassignment for offboarding and other transfer reasons without losing historical execution ownership.
- Settlement authority in v1 is limited to `项目经理 + 运营`.
- Keep existing project, batch, task, and assignment APIs functional while adding new modules.
- Prefer focused modules and pages over broad refactors.
- Every task must end with runnable tests and an intentional commit.

---

## File Structure

### Backend modules and schema

- Modify: `prisma/schema.prisma`
  - Extend enums and add new Prisma models.
- Create: `src/reviews/reviews.module.ts`
- Create: `src/reviews/reviews.controller.ts`
- Create: `src/reviews/reviews.service.ts`
- Create: `src/reviews/dto/create-task-review.dto.ts`
- Create: `src/deliveries/deliveries.module.ts`
- Create: `src/deliveries/deliveries.controller.ts`
- Create: `src/deliveries/deliveries.service.ts`
- Create: `src/deliveries/dto/create-batch-delivery.dto.ts`
- Create: `src/acceptances/acceptances.module.ts`
- Create: `src/acceptances/acceptances.controller.ts`
- Create: `src/acceptances/acceptances.service.ts`
- Create: `src/acceptances/dto/create-batch-acceptance.dto.ts`
- Create: `src/settlements/settlements.module.ts`
- Create: `src/settlements/settlements.controller.ts`
- Create: `src/settlements/settlements.service.ts`
- Create: `src/settlements/dto/create-task-settlement.dto.ts`
- Modify: `src/app.module.ts`
  - Register new modules.
- Modify: `src/assignments/assignments.controller.ts`
- Modify: `src/assignments/assignments.service.ts`
  - Add transfer and lifecycle actions.
- Modify: `src/tasks/tasks.service.ts`
  - Update queue and task status logic to align with new assignment states.
- Modify: `src/batches/batches.service.ts`
  - Support delivery and acceptance state transitions.

### Frontend API and page layer

- Modify: `apps/web/lib/types.ts`
  - Add review, delivery, acceptance, settlement, and expanded status types.
- Create: `apps/web/lib/api/reviews.ts`
- Create: `apps/web/lib/api/deliveries.ts`
- Create: `apps/web/lib/api/acceptances.ts`
- Create: `apps/web/lib/api/settlements.ts`
- Create: `apps/web/components/forms/assignment-transfer-form.tsx`
- Create: `apps/web/components/forms/task-review-form.tsx`
- Create: `apps/web/components/forms/batch-delivery-form.tsx`
- Create: `apps/web/components/forms/batch-acceptance-form.tsx`
- Create: `apps/web/components/forms/task-settlement-form.tsx`
- Create: `apps/web/components/reviews/review-panel.tsx`
- Create: `apps/web/components/deliveries/delivery-panel.tsx`
- Create: `apps/web/components/acceptances/acceptance-panel.tsx`
- Create: `apps/web/components/settlements/settlement-panel.tsx`
- Modify: `apps/web/app/tasks/[taskId]/page.tsx`
- Modify: `apps/web/app/batches/[batchId]/page.tsx`
- Create: `apps/web/app/qa-delivery/page.tsx`
- Create: `apps/web/app/algorithm/page.tsx`
- Modify: `apps/web/components/layout/sidebar.tsx`

### Tests

- Create: `test/reviews.e2e-spec.ts`
- Create: `test/deliveries.e2e-spec.ts`
- Create: `test/acceptances.e2e-spec.ts`
- Create: `test/settlements.e2e-spec.ts`
- Modify: `test/assignments.e2e-spec.ts`
- Modify: `test/task-queue.e2e-spec.ts`
- Modify: `apps/web/tests/project-batch-forms.spec.ts`
- Create: `apps/web/tests/workflow-ops.spec.ts`

### Documentation

- Modify: `README.md`
  - Add new workflow endpoints and test commands after the implementation is complete.

### Excluded generated artifacts

- Do not commit `.next/`, `dist/`, or transient Playwright output directories.

## Task 1: Extend the data model and backend workflow APIs

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `src/app.module.ts`
- Modify: `src/assignments/assignments.controller.ts`
- Modify: `src/assignments/assignments.service.ts`
- Modify: `src/tasks/tasks.service.ts`
- Modify: `src/batches/batches.service.ts`
- Create: `src/assignments/dto/transfer-assignment.dto.ts`
- Create: `src/reviews/reviews.module.ts`
- Create: `src/reviews/reviews.controller.ts`
- Create: `src/reviews/reviews.service.ts`
- Create: `src/reviews/dto/create-task-review.dto.ts`
- Create: `src/deliveries/deliveries.module.ts`
- Create: `src/deliveries/deliveries.controller.ts`
- Create: `src/deliveries/deliveries.service.ts`
- Create: `src/deliveries/dto/create-batch-delivery.dto.ts`
- Create: `src/acceptances/acceptances.module.ts`
- Create: `src/acceptances/acceptances.controller.ts`
- Create: `src/acceptances/acceptances.service.ts`
- Create: `src/acceptances/dto/create-batch-acceptance.dto.ts`
- Create: `src/settlements/settlements.module.ts`
- Create: `src/settlements/settlements.controller.ts`
- Create: `src/settlements/settlements.service.ts`
- Create: `src/settlements/dto/create-task-settlement.dto.ts`
- Test: `test/assignments.e2e-spec.ts`
- Test: `test/reviews.e2e-spec.ts`
- Test: `test/deliveries.e2e-spec.ts`
- Test: `test/acceptances.e2e-spec.ts`
- Test: `test/settlements.e2e-spec.ts`
- Test: `test/task-queue.e2e-spec.ts`

**Interfaces:**
- Consumes:
  - `AssignmentsService.create(taskId: string, data: CreateAssignmentDto)`
  - `TasksService.findOne(id: string)`
  - `BatchesService.findOne(id: string)`
  - Existing Prisma models `Batch`, `TaskItem`, `TaskAssignment`
- Produces:
  - `AssignmentsService.transfer(assignmentId: string, dto: TransferAssignmentDto): Promise<TaskAssignment>`
  - `ReviewsService.create(taskId: string, dto: CreateTaskReviewDto): Promise<TaskReview>`
  - `DeliveriesService.create(batchId: string, dto: CreateBatchDeliveryDto): Promise<BatchDelivery>`
  - `AcceptancesService.create(deliveryId: string, dto: CreateBatchAcceptanceDto): Promise<BatchAcceptance>`
  - `SettlementsService.create(taskId: string, dto: CreateTaskSettlementDto): Promise<TaskSettlement>`

- [ ] **Step 1: Write the failing backend tests**

```ts
// test/reviews.e2e-spec.ts
it('creates a QA review and updates task status', async () => {
  const task = await createTaskFixture(app);

  const response = await request(app.getHttpServer())
    .post(`/tasks/${task.id}/reviews`)
    .send({
      stage: 'qa',
      decision: 'passed',
      reviewerId: 'qa-1'
    })
    .expect(201);

  expect(response.body.stage).toBe('qa');
  expect(response.body.decision).toBe('passed');
});

// test/deliveries.e2e-spec.ts
it('creates a batch delivery and marks the batch delivered', async () => {
  const batch = await createBatchWithReviewedTasks(app);

  const response = await request(app.getHttpServer())
    .post(`/batches/${batch.id}/deliveries`)
    .send({
      submittedBy: 'ops-1',
      notes: 'first delivery'
    })
    .expect(201);

  expect(response.body.batchId).toBe(batch.id);
});

// test/acceptances.e2e-spec.ts
it('accepts a delivery with partial rejection and creates sampling reviews', async () => {
  const fixture = await createDeliveredBatchFixture(app);

  const response = await request(app.getHttpServer())
    .post(`/deliveries/${fixture.deliveryId}/acceptances`)
    .send({
      reviewedBy: 'algo-1',
      decision: 'partially_rejected',
      sampleSize: 2,
      sampledTaskIds: fixture.taskIds,
      rejectedTaskIds: [fixture.taskIds[0]]
    })
    .expect(201);

  expect(response.body.decision).toBe('partially_rejected');
});

// test/settlements.e2e-spec.ts
it('creates a split settlement for transferred assignments', async () => {
  const fixture = await createTransferredTaskFixture(app);

  const response = await request(app.getHttpServer())
    .post(`/tasks/${fixture.taskId}/settlement`)
    .send({
      decisionMode: 'split',
      decidedBy: 'ops-1',
      shares: [
        { assignmentId: fixture.originalAssignmentId, percentage: 40 },
        { assignmentId: fixture.nextAssignmentId, percentage: 60 }
      ]
    })
    .expect(201);

  expect(response.body.decisionMode).toBe('split');
});

// test/assignments.e2e-spec.ts
it('transfers an assignment to a replacement annotator', async () => {
  const fixture = await createAssignmentFixture(app);

  const response = await request(app.getHttpServer())
    .post(`/assignments/${fixture.assignmentId}/transfer`)
    .send({
      nextAssigneeId: 'annotator-2',
      transferReason: 'offboarded',
      notes: 'owner left project'
    })
    .expect(201);

  expect(response.body.assigneeId).toBe('annotator-2');
});
```

- [ ] **Step 2: Run targeted tests to verify they fail**

Run:

```bash
export PATH=/Users/zhaojiaxiang/.nvm/versions/node/v24.16.0/bin:$PATH
npm run test:e2e -- --runTestsByPath test/reviews.e2e-spec.ts test/deliveries.e2e-spec.ts test/acceptances.e2e-spec.ts test/settlements.e2e-spec.ts test/assignments.e2e-spec.ts
```

Expected:

- FAIL with missing routes, Prisma model errors, or DTO validation gaps.

- [ ] **Step 3: Extend Prisma schema and generate the client**

```prisma
enum BatchStatus {
  draft
  in_progress
  ready_for_delivery
  delivered
  partially_rejected
  accepted
  rejected
  closed
}

enum TaskItemStatus {
  pending_allocation
  pending_pickup
  in_progress
  submitted
  qa_rejected
  qa_passed
  delivered
  sampling_rejected
  sampling_passed
}

enum TaskAssignmentStatus {
  assigned
  accepted
  in_progress
  completed
  rejected
  transferred
}

enum TaskReviewStage {
  qa
  algorithm_sampling
}

enum TaskReviewDecision {
  passed
  rejected
}

enum BatchDeliveryStatus {
  submitted
  superseded
}

enum BatchAcceptanceDecision {
  accepted
  partially_rejected
  rejected
}

enum TaskSettlementDecisionMode {
  single_owner
  split
}

enum TaskTransferReason {
  offboarded
  leave
  capacity_rebalance
  rework
  manual
}
```

```prisma
model TaskReview {
  id                String             @id @default(cuid())
  taskItemId        String
  stage             TaskReviewStage
  decision          TaskReviewDecision
  reviewerId        String
  notes             String?
  batchAcceptanceId String?
  createdAt         DateTime           @default(now())
  taskItem          TaskItem           @relation(fields: [taskItemId], references: [id], onDelete: Cascade)
  batchAcceptance   BatchAcceptance?   @relation(fields: [batchAcceptanceId], references: [id], onDelete: SetNull)

  @@index([taskItemId])
  @@index([batchAcceptanceId])
}

model BatchDelivery {
  id          String              @id @default(cuid())
  batchId      String
  submittedBy  String
  notes        String?
  submittedAt  DateTime            @default(now())
  status       BatchDeliveryStatus @default(submitted)
  batch        Batch               @relation(fields: [batchId], references: [id], onDelete: Cascade)
  acceptances  BatchAcceptance[]

  @@index([batchId])
}

model BatchAcceptance {
  id         String                  @id @default(cuid())
  deliveryId String
  reviewedBy String
  decision   BatchAcceptanceDecision
  sampleSize Int
  notes      String?
  reviewedAt DateTime                @default(now())
  delivery   BatchDelivery           @relation(fields: [deliveryId], references: [id], onDelete: Cascade)
  reviews    TaskReview[]

  @@index([deliveryId])
}

model TaskSettlement {
  id                String                      @id @default(cuid())
  taskItemId        String                      @unique
  decisionMode      TaskSettlementDecisionMode
  ownerAssignmentId String?
  decidedBy         String
  notes             String?
  createdAt         DateTime                    @default(now())
  updatedAt         DateTime                    @updatedAt
  taskItem          TaskItem                    @relation(fields: [taskItemId], references: [id], onDelete: Cascade)
  shares            TaskSettlementShare[]
}

model TaskSettlementShare {
  id           String         @id @default(cuid())
  settlementId String
  assignmentId String
  percentage   Int
  settlement   TaskSettlement @relation(fields: [settlementId], references: [id], onDelete: Cascade)
  assignment   TaskAssignment @relation(fields: [assignmentId], references: [id], onDelete: Cascade)

  @@index([settlementId])
  @@index([assignmentId])
}
```

Run:

```bash
export PATH=/Users/zhaojiaxiang/.nvm/versions/node/v24.16.0/bin:$PATH
npx prisma migrate dev --name delivery_acceptance_settlement
npx prisma generate
```

Expected:

- Migration created and Prisma client generated successfully.

- [ ] **Step 4: Implement the new DTOs and services**

```ts
// src/assignments/dto/transfer-assignment.dto.ts
export class TransferAssignmentDto {
  @IsString()
  nextAssigneeId!: string;

  @IsEnum(TaskTransferReason)
  transferReason!: TaskTransferReason;

  @IsOptional()
  @IsString()
  notes?: string;
}
```

```ts
// src/reviews/dto/create-task-review.dto.ts
export class CreateTaskReviewDto {
  @IsEnum(TaskReviewStage)
  stage!: 'qa' | 'algorithm_sampling';

  @IsEnum(TaskReviewDecision)
  decision!: 'passed' | 'rejected';

  @IsString()
  reviewerId!: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  batchAcceptanceId?: string;
}
```

```ts
// src/assignments/assignments.service.ts
async transfer(assignmentId: string, dto: TransferAssignmentDto) {
  const assignment = await this.prisma.taskAssignment.findUniqueOrThrow({
    where: { id: assignmentId }
  });

  return this.prisma.$transaction(async (tx) => {
    await tx.taskAssignment.update({
      where: { id: assignmentId },
      data: {
        status: 'transferred',
        completedAt: new Date(),
        notes: dto.notes,
        transferReason: dto.transferReason
      }
    });

    return tx.taskAssignment.create({
      data: {
        taskItemId: assignment.taskItemId,
        assigneeId: dto.nextAssigneeId,
        operatorId: assignment.operatorId,
        sourceAssignmentId: assignment.id,
        notes: dto.notes
      }
    });
  });
}
```

```ts
// src/reviews/reviews.service.ts
async create(taskId: string, dto: CreateTaskReviewDto) {
  await this.tasksService.findOne(taskId);

  const review = await this.prisma.taskReview.create({
    data: {
      taskItemId: taskId,
      stage: dto.stage,
      decision: dto.decision,
      reviewerId: dto.reviewerId,
      notes: dto.notes,
      batchAcceptanceId: dto.batchAcceptanceId
    }
  });

  const nextStatus =
    dto.stage === 'qa'
      ? dto.decision === 'passed'
        ? 'qa_passed'
        : 'qa_rejected'
      : dto.decision === 'passed'
        ? 'sampling_passed'
        : 'sampling_rejected';

  await this.prisma.taskItem.update({
    where: { id: taskId },
    data: { status: nextStatus }
  });

  return review;
}
```

- [ ] **Step 5: Wire controllers, modules, and batch acceptance transitions**

```ts
// src/reviews/reviews.controller.ts
@Post('tasks/:taskId/reviews')
create(@Param('taskId') taskId: string, @Body() dto: CreateTaskReviewDto) {
  return this.reviewsService.create(taskId, dto);
}
```

```ts
// src/deliveries/deliveries.controller.ts
@Post('batches/:batchId/deliveries')
create(@Param('batchId') batchId: string, @Body() dto: CreateBatchDeliveryDto) {
  return this.deliveriesService.create(batchId, dto);
}
```

```ts
// src/acceptances/acceptances.controller.ts
@Post('deliveries/:deliveryId/acceptances')
create(@Param('deliveryId') deliveryId: string, @Body() dto: CreateBatchAcceptanceDto) {
  return this.acceptancesService.create(deliveryId, dto);
}
```

```ts
// src/settlements/settlements.controller.ts
@Post('tasks/:taskId/settlement')
create(@Param('taskId') taskId: string, @Body() dto: CreateTaskSettlementDto) {
  return this.settlementsService.create(taskId, dto);
}
```

- [ ] **Step 6: Run the backend test suites**

Run:

```bash
export PATH=/Users/zhaojiaxiang/.nvm/versions/node/v24.16.0/bin:$PATH
npm run build
npm run test:e2e -- --runTestsByPath test/assignments.e2e-spec.ts test/reviews.e2e-spec.ts test/deliveries.e2e-spec.ts test/acceptances.e2e-spec.ts test/settlements.e2e-spec.ts test/task-queue.e2e-spec.ts
```

Expected:

- PASS for all targeted suites.

- [ ] **Step 7: Commit**

```bash
git add prisma/schema.prisma prisma/migrations src/app.module.ts src/assignments src/reviews src/deliveries src/acceptances src/settlements test
git commit -m "feat: add delivery and acceptance workflow backend"
```

## Task 2: Add task-level reassignment, review history, and settlement UI

**Files:**
- Modify: `apps/web/lib/types.ts`
- Create: `apps/web/lib/api/reviews.ts`
- Create: `apps/web/lib/api/settlements.ts`
- Create: `apps/web/components/forms/assignment-transfer-form.tsx`
- Create: `apps/web/components/forms/task-review-form.tsx`
- Create: `apps/web/components/forms/task-settlement-form.tsx`
- Create: `apps/web/components/reviews/review-panel.tsx`
- Create: `apps/web/components/settlements/settlement-panel.tsx`
- Modify: `apps/web/components/assignments/assignment-panel.tsx`
- Modify: `apps/web/app/tasks/[taskId]/page.tsx`
- Test: `apps/web/tests/workflow-ops.spec.ts`

**Interfaces:**
- Consumes:
  - `createAssignment(taskId: string, body: CreateAssignmentInput): Promise<TaskAssignment>`
  - `createTaskReview(taskId: string, body: CreateTaskReviewInput): Promise<TaskReview>`
  - `createTaskSettlement(taskId: string, body: CreateTaskSettlementInput): Promise<TaskSettlement>`
  - `transferAssignment(assignmentId: string, body: TransferAssignmentInput): Promise<TaskAssignment>`
- Produces:
  - `AssignmentTransferForm({ assignmentId }: { assignmentId: string })`
  - `TaskReviewForm({ taskId }: { taskId: string })`
  - `TaskSettlementForm({ taskId: string; assignments: TaskAssignment[] }): JSX.Element`
  - `ReviewPanel({ reviews }: { reviews: TaskReview[] })`
  - `SettlementPanel({ settlement }: { settlement: TaskSettlement | null })`

- [ ] **Step 1: Write the failing browser workflow test**

```ts
// apps/web/tests/workflow-ops.spec.ts
test('任务详情页支持转交、质检和结算裁定', async ({ page, request }) => {
  const fixture = await createTaskWithAssignmentFixture(request);

  await page.goto(`/tasks/${fixture.taskId}`);
  await page.getByLabel('接手标注员 ID').fill('annotator-replacement');
  await page.getByRole('button', { name: '确认转交' }).click();
  await expect(page.getByText('annotator-replacement')).toBeVisible();

  await page.getByLabel('审核结论').selectOption('passed');
  await page.getByRole('button', { name: '提交质检' }).click();
  await expect(page.getByText('qa')).toBeVisible();

  await page.getByLabel('裁定模式').selectOption('single_owner');
  await page.getByRole('button', { name: '保存裁定' }).click();
  await expect(page.getByText('single_owner')).toBeVisible();
});
```

- [ ] **Step 2: Run the new browser test to verify it fails**

Run:

```bash
export PATH=/Users/zhaojiaxiang/.nvm/versions/node/v24.16.0/bin:$PATH
npm run test:e2e --workspace web -- --grep "任务详情页支持转交、质检和结算裁定"
```

Expected:

- FAIL because the transfer, review, and settlement controls do not exist yet.

- [ ] **Step 3: Add shared types and API clients**

```ts
// apps/web/lib/types.ts
export interface TaskReview {
  id: string;
  taskItemId: string;
  stage: 'qa' | 'algorithm_sampling';
  decision: 'passed' | 'rejected';
  reviewerId: string;
  notes?: string | null;
  createdAt: string;
}

export interface TransferAssignmentInput {
  nextAssigneeId: string;
  transferReason: 'offboarded' | 'leave' | 'capacity_rebalance' | 'rework' | 'manual';
  notes?: string;
}

export interface TaskSettlement {
  id: string;
  taskItemId: string;
  decisionMode: 'single_owner' | 'split';
  ownerAssignmentId?: string | null;
  decidedBy: string;
  notes?: string | null;
  shares: Array<{ assignmentId: string; percentage: number }>;
}
```

```ts
// apps/web/lib/api/reviews.ts
export function createTaskReview(taskId: string, body: CreateTaskReviewInput) {
  return apiFetch<TaskReview>(`/tasks/${taskId}/reviews`, {
    method: 'POST',
    body: JSON.stringify(body)
  });
}
```

- [ ] **Step 4: Implement task workflow forms and panels**

```tsx
// apps/web/components/forms/assignment-transfer-form.tsx
export function AssignmentTransferForm({ assignmentId }: { assignmentId: string }) {
  const router = useRouter();
  const [nextAssigneeId, setNextAssigneeId] = useState('');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await transferAssignment(assignmentId, {
      nextAssigneeId,
      transferReason: 'offboarded'
    });
    router.refresh();
  }

  return (
    <ActionCard title="代标转交" description="标注员离项后把任务转给新执行人。">
      <form onSubmit={handleSubmit} className="space-y-4">
        <input aria-label="接手标注员 ID" value={nextAssigneeId} onChange={(event) => setNextAssigneeId(event.target.value)} />
        <button type="submit">确认转交</button>
      </form>
    </ActionCard>
  );
}
```

```tsx
// apps/web/components/reviews/review-panel.tsx
export function ReviewPanel({ reviews }: { reviews: TaskReview[] }) {
  return (
    <ActionCard title="质检与抽检记录" description="查看题目审核轨迹。">
      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="rounded-2xl border border-panelLine p-4">
            <p className="text-sm font-medium text-slateDeep">{review.stage}</p>
            <p className="mt-2 text-sm text-slate-500">结论：{review.decision}</p>
          </div>
        ))}
      </div>
    </ActionCard>
  );
}
```

- [ ] **Step 5: Mount the new cards on the task detail page**

```tsx
// apps/web/app/tasks/[taskId]/page.tsx
rightSlot={
  <div className="space-y-6">
    <AssignmentCreateForm taskId={task.id} />
    <AssignmentTransferForm assignmentId={assignments[0]?.id ?? ''} />
    <TaskReviewForm taskId={task.id} />
    <TaskSettlementForm taskId={task.id} assignments={assignments} />
    <AssignmentPanel assignments={assignments} />
    <ReviewPanel reviews={reviews} />
    <SettlementPanel settlement={settlement} />
    <AssistantDrawer taskId={task.id} context={`当前任务标题：${task.title}。当前状态：${task.status}。`} />
  </div>
}
```

- [ ] **Step 6: Run build and browser tests**

Run:

```bash
export PATH=/Users/zhaojiaxiang/.nvm/versions/node/v24.16.0/bin:$PATH
npm run build --workspace web
npm run test:e2e --workspace web -- --grep "任务详情页支持转交、质检和结算裁定"
```

Expected:

- PASS for the targeted browser test and a successful Next.js production build.

- [ ] **Step 7: Commit**

```bash
git add apps/web/lib/types.ts apps/web/lib/api/reviews.ts apps/web/lib/api/settlements.ts apps/web/components/forms apps/web/components/reviews apps/web/components/settlements apps/web/app/tasks/[taskId]/page.tsx apps/web/tests/workflow-ops.spec.ts
git commit -m "feat: add task workflow operations UI"
```

## Task 3: Add batch delivery and algorithm acceptance UI

**Files:**
- Modify: `apps/web/lib/types.ts`
- Create: `apps/web/lib/api/deliveries.ts`
- Create: `apps/web/lib/api/acceptances.ts`
- Create: `apps/web/components/forms/batch-delivery-form.tsx`
- Create: `apps/web/components/forms/batch-acceptance-form.tsx`
- Create: `apps/web/components/deliveries/delivery-panel.tsx`
- Create: `apps/web/components/acceptances/acceptance-panel.tsx`
- Modify: `apps/web/app/batches/[batchId]/page.tsx`
- Modify: `apps/web/tests/project-batch-forms.spec.ts`

**Interfaces:**
- Consumes:
  - `createBatchDelivery(batchId: string, body: CreateBatchDeliveryInput): Promise<BatchDelivery>`
  - `createBatchAcceptance(deliveryId: string, body: CreateBatchAcceptanceInput): Promise<BatchAcceptance>`
- Produces:
  - `BatchDeliveryForm({ batchId }: { batchId: string })`
  - `BatchAcceptanceForm({ deliveryId: string; taskOptions: TaskSummary[] }): JSX.Element`
  - `DeliveryPanel({ deliveries }: { deliveries: BatchDelivery[] })`
  - `AcceptancePanel({ acceptances }: { acceptances: BatchAcceptance[] })`

- [ ] **Step 1: Extend the existing batch browser test with delivery and acceptance assertions**

```ts
// apps/web/tests/project-batch-forms.spec.ts
await expect(page.getByRole('heading', { name: '发起交付', exact: true })).toBeVisible();
await page.getByLabel('交付说明').fill('提交第一轮批次');
await page.getByRole('button', { name: '确认交付' }).click();
await expect(page.getByText('ops-1')).toBeVisible();

await expect(page.getByRole('heading', { name: '算法验收', exact: true })).toBeVisible();
await page.getByLabel('验收结论').selectOption('partially_rejected');
await page.getByLabel('抽检题目').first().check();
await page.getByRole('button', { name: '提交验收' }).click();
await expect(page.getByText('partially_rejected')).toBeVisible();
```

- [ ] **Step 2: Run the browser spec to verify it fails**

Run:

```bash
export PATH=/Users/zhaojiaxiang/.nvm/versions/node/v24.16.0/bin:$PATH
npm run test:e2e --workspace web -- --grep "批次页和任务页支持创建任务、导入 JSON 和分配标注员"
```

Expected:

- FAIL because the delivery and acceptance UI sections do not exist yet.

- [ ] **Step 3: Implement frontend delivery and acceptance clients**

```ts
// apps/web/lib/api/deliveries.ts
export function createBatchDelivery(batchId: string, body: CreateBatchDeliveryInput) {
  return apiFetch<BatchDelivery>(`/batches/${batchId}/deliveries`, {
    method: 'POST',
    body: JSON.stringify(body)
  });
}

// apps/web/lib/api/acceptances.ts
export function createBatchAcceptance(deliveryId: string, body: CreateBatchAcceptanceInput) {
  return apiFetch<BatchAcceptance>(`/deliveries/${deliveryId}/acceptances`, {
    method: 'POST',
    body: JSON.stringify(body)
  });
}
```

- [ ] **Step 4: Implement forms and panels for the batch workflow**

```tsx
// apps/web/components/forms/batch-delivery-form.tsx
export function BatchDeliveryForm({ batchId }: { batchId: string }) {
  const [notes, setNotes] = useState('');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await createBatchDelivery(batchId, { submittedBy: 'ops-1', notes });
  }

  return (
    <ActionCard title="发起交付" description="把已通过质检的批次交给算法验收。">
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea aria-label="交付说明" value={notes} onChange={(event) => setNotes(event.target.value)} />
        <button type="submit">确认交付</button>
      </form>
    </ActionCard>
  );
}
```

```tsx
// apps/web/components/forms/batch-acceptance-form.tsx
export function BatchAcceptanceForm({ deliveryId, taskOptions }: { deliveryId: string; taskOptions: TaskSummary[] }) {
  const [decision, setDecision] = useState<'accepted' | 'partially_rejected' | 'rejected'>('accepted');

  return (
    <ActionCard title="算法验收" description="记录抽检样本与批次结论。">
      <form className="space-y-4">
        <select aria-label="验收结论" value={decision} onChange={(event) => setDecision(event.target.value as typeof decision)}>
          <option value="accepted">accepted</option>
          <option value="partially_rejected">partially_rejected</option>
          <option value="rejected">rejected</option>
        </select>
        {taskOptions.map((task) => (
          <label key={task.id}>
            <input type="checkbox" aria-label="抽检题目" value={task.id} />
            {task.title}
          </label>
        ))}
        <button type="submit">提交验收</button>
      </form>
    </ActionCard>
  );
}
```

- [ ] **Step 5: Mount the batch workflow cards**

```tsx
// apps/web/app/batches/[batchId]/page.tsx
rightSlot={
  <div className="space-y-6">
    <TaskCreateForm batchId={batch.id} />
    <TaskImportForm batchId={batch.id} />
    <BatchDeliveryForm batchId={batch.id} />
    <DeliveryPanel deliveries={deliveries} />
    <BatchAcceptanceForm deliveryId={deliveries[0]?.id ?? ''} taskOptions={tasks} />
    <AcceptancePanel acceptances={acceptances} />
  </div>
}
```

- [ ] **Step 6: Run build and browser coverage**

Run:

```bash
export PATH=/Users/zhaojiaxiang/.nvm/versions/node/v24.16.0/bin:$PATH
npm run build --workspace web
npm run test:e2e --workspace web -- --grep "批次页和任务页支持创建任务、导入 JSON 和分配标注员"
```

Expected:

- PASS with the delivery and acceptance behavior included in the existing workflow spec.

- [ ] **Step 7: Commit**

```bash
git add apps/web/lib/types.ts apps/web/lib/api/deliveries.ts apps/web/lib/api/acceptances.ts apps/web/components/forms/batch-delivery-form.tsx apps/web/components/forms/batch-acceptance-form.tsx apps/web/components/deliveries apps/web/components/acceptances apps/web/app/batches/[batchId]/page.tsx apps/web/tests/project-batch-forms.spec.ts
git commit -m "feat: add batch delivery and acceptance UI"
```

## Task 4: Add role-focused QA/Delivery and Algorithm workbenches

**Files:**
- Create: `apps/web/app/qa-delivery/page.tsx`
- Create: `apps/web/app/algorithm/page.tsx`
- Modify: `apps/web/components/layout/sidebar.tsx`
- Modify: `apps/web/lib/api/tasks.ts`
- Modify: `apps/web/lib/api/batches.ts`
- Modify: `apps/web/lib/api/reviews.ts`
- Modify: `apps/web/lib/api/acceptances.ts`
- Test: `apps/web/tests/workflow-ops.spec.ts`
- Modify: `README.md`

**Interfaces:**
- Consumes:
  - `getBatchTasks(batchId: string): Promise<TaskSummary[]>`
  - `getProjectBatches(projectId: string): Promise<BatchSummary[]>`
  - `createTaskReview(taskId: string, body: CreateTaskReviewInput): Promise<TaskReview>`
  - `createBatchAcceptance(deliveryId: string, body: CreateBatchAcceptanceInput): Promise<BatchAcceptance>`
- Produces:
  - `QaDeliveryPage(): Promise<JSX.Element>`
  - `AlgorithmPage(): Promise<JSX.Element>`

- [ ] **Step 1: Add failing navigation and page assertions to the browser workflow spec**

```ts
// apps/web/tests/workflow-ops.spec.ts
test('侧边栏可进入质检交付台与算法验收台', async ({ page }) => {
  await page.goto('/projects');
  await page.getByRole('link', { name: '质检交付台' }).click();
  await expect(page.getByRole('heading', { name: '质检交付台', exact: true })).toBeVisible();

  await page.getByRole('link', { name: '算法验收台' }).click();
  await expect(page.getByRole('heading', { name: '算法验收台', exact: true })).toBeVisible();
});
```

- [ ] **Step 2: Run the browser test to verify it fails**

Run:

```bash
export PATH=/Users/zhaojiaxiang/.nvm/versions/node/v24.16.0/bin:$PATH
npm run test:e2e --workspace web -- --grep "侧边栏可进入质检交付台与算法验收台"
```

Expected:

- FAIL because the routes and navigation items are not implemented yet.

- [ ] **Step 3: Implement the role-focused pages**

```tsx
// apps/web/app/qa-delivery/page.tsx
export default async function QaDeliveryPage() {
  const batches = await getBatchesReadyForDelivery();

  return (
    <AppShell title="质检交付台" description="集中处理待质检题目、返修题目与批次交付。">
      <div className="grid gap-6 lg:grid-cols-2">
        <ActionCard title="待交付批次" description="查看当前可交付的批次。">
          {batches.map((batch) => (
            <p key={batch.id}>{batch.name}</p>
          ))}
        </ActionCard>
      </div>
    </AppShell>
  );
}

// apps/web/app/algorithm/page.tsx
export default async function AlgorithmPage() {
  const deliveries = await getRecentDeliveries();

  return (
    <AppShell title="算法验收台" description="查看待验收批次、抽检样本与历史结论。">
      <div className="grid gap-6 lg:grid-cols-2">
        <ActionCard title="待验收批次" description="快速进入当前待处理交付。">
          {deliveries.map((delivery) => (
            <p key={delivery.id}>{delivery.id}</p>
          ))}
        </ActionCard>
      </div>
    </AppShell>
  );
}
```

- [ ] **Step 4: Add sidebar navigation and supporting API helpers**

```tsx
// apps/web/components/layout/sidebar.tsx
const items = [
  { href: '/projects', label: '项目管理' },
  { href: '/workbench', label: '标注工作台' },
  { href: '/qa-delivery', label: '质检交付台' },
  { href: '/algorithm', label: '算法验收台' },
  { href: '/assistant', label: 'AI 助手' }
];
```

```md
<!-- README.md -->
## Workflow modules

- `POST /tasks/:taskId/reviews`
- `POST /batches/:batchId/deliveries`
- `POST /deliveries/:deliveryId/acceptances`
- `POST /tasks/:taskId/settlement`
- `POST /assignments/:assignmentId/transfer`
```

- [ ] **Step 5: Run final build and browser verification**

Run:

```bash
export PATH=/Users/zhaojiaxiang/.nvm/versions/node/v24.16.0/bin:$PATH
npm run build --workspace web
npm run test:e2e --workspace web
```

Expected:

- PASS for the full Playwright suite with the new workflow specs included.

- [ ] **Step 6: Run final backend regression**

Run:

```bash
export PATH=/Users/zhaojiaxiang/.nvm/versions/node/v24.16.0/bin:$PATH
npm run test:e2e
```

Expected:

- PASS for the full backend e2e suite.

- [ ] **Step 7: Commit**

```bash
git add apps/web/app/qa-delivery/page.tsx apps/web/app/algorithm/page.tsx apps/web/components/layout/sidebar.tsx apps/web/tests/workflow-ops.spec.ts README.md
git commit -m "feat: add workflow workbenches"
```

## Self-Review

### Spec coverage

- Batch delivery and batch acceptance objects are implemented in Task 1 and surfaced in Task 3.
- Reassignment and transfer reasons are implemented in Task 1 and surfaced in Task 2.
- Task-level review history is implemented in Task 1 and surfaced in Task 2.
- Settlement and split ownership are implemented in Task 1 and surfaced in Task 2.
- QA/Delivery and Algorithm role entry points are implemented in Task 4.
- Existing pages remain the primary shell and are incrementally enhanced in Tasks 2 and 3.

### Placeholder scan

- No `TODO`, `TBD`, or deferred “implement later” instructions remain.
- All code-modifying steps include concrete code examples or signatures.
- All test steps include exact commands and expected results.

### Type consistency

- `TaskReview.stage` is consistently `qa | algorithm_sampling`.
- Acceptance decisions are consistently `accepted | partially_rejected | rejected`.
- Settlement modes are consistently `single_owner | split`.
- Transfer reasons are consistently `offboarded | leave | capacity_rebalance | rework | manual`.


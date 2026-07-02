# Operational Input Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add writable project, batch, task, JSON import, and single-task assignment flows to the Chinese admin console.

**Architecture:** Extend the existing NestJS CRUD backend with one bulk task import endpoint, then layer focused client-side form components into the current Next.js pages so users can create and assign data without leaving context. Reuse existing API patterns, inline admin-shell layouts, and `router.refresh()` mutations to keep the implementation small and aligned with the current codebase.

**Tech Stack:** NestJS, Prisma, PostgreSQL, Jest e2e, Next.js App Router, React 19, TypeScript, Tailwind CSS, GSAP

## Global Constraints

- Frontend forms for project creation
- Frontend forms for batch creation
- Frontend forms for manual task creation
- Frontend lightweight JSON import entry for batch task creation
- Frontend form for single-task assignment
- Backend endpoints needed to support the above flows
- Validation, success feedback, and failure feedback for these actions
- Basic e2e coverage for the new backend write flows
- Enterprise authentication is out of scope
- Role-based access control enforcement is out of scope
- Batch assignment to multiple annotators in one action is out of scope
- Complex CSV or Excel import is out of scope
- Media-specific annotation widgets are out of scope
- Full audit history and approval chain UI are out of scope
- The primary operating path is manual creation and single-task assignment
- A lightweight JSON import entry is provided on the batch page for near-production onboarding
- The UI continues to expose all actions in one admin console
- No frontend permission gating is added in this phase
- Writable actions should use embedded form cards rather than full-page navigation
- The frontend should continue to use the existing `apiFetch` abstraction and refresh via `router.refresh()` after successful mutations

---

## File Structure

### Files to create

- `src/tasks/dto/import-tasks.dto.ts`
- `test/task-import.e2e-spec.ts`
- `apps/web/components/ui/action-card.tsx`
- `apps/web/components/forms/project-create-form.tsx`
- `apps/web/components/forms/batch-create-form.tsx`
- `apps/web/components/forms/task-create-form.tsx`
- `apps/web/components/forms/task-import-form.tsx`
- `apps/web/components/forms/assignment-create-form.tsx`

### Files to modify

- `src/tasks/tasks.controller.ts`
- `src/tasks/tasks.service.ts`
- `apps/web/lib/api/projects.ts`
- `apps/web/lib/api/batches.ts`
- `apps/web/lib/api/tasks.ts`
- `apps/web/lib/api/assignments.ts`
- `apps/web/lib/types.ts`
- `apps/web/app/projects/page.tsx`
- `apps/web/app/projects/[projectId]/page.tsx`
- `apps/web/app/batches/[batchId]/page.tsx`
- `apps/web/app/tasks/[taskId]/page.tsx`
- `apps/web/components/projects/project-list.tsx`
- `apps/web/components/projects/project-detail.tsx`
- `apps/web/components/batches/batch-list.tsx`
- `apps/web/components/tasks/task-list.tsx`

### Responsibilities

- `src/tasks/dto/import-tasks.dto.ts`: validates the bulk JSON import payload shape
- `src/tasks/tasks.controller.ts`: exposes `POST /batches/:batchId/tasks/import`
- `src/tasks/tasks.service.ts`: bulk-creates validated task rows for a batch
- `test/task-import.e2e-spec.ts`: proves JSON import works end to end
- `apps/web/components/ui/action-card.tsx`: shared inline action container for embedded forms
- `apps/web/components/forms/*`: client-side forms for project, batch, task, import, and assignment mutations
- `apps/web/lib/api/*`: typed mutation helpers for writable flows
- `apps/web/lib/types.ts`: request and response helper types for new mutation surfaces
- `apps/web/app/*` and existing display components: mount the forms inside current pages without adding new routes

### Interface map

- `POST /projects` consumes `CreateProjectDto` and returns `ProjectDetail`
- `POST /projects/:projectId/batches` consumes `CreateBatchDto` and returns `BatchDetail`
- `POST /batches/:batchId/tasks` consumes `CreateTaskDto` and returns `TaskDetail`
- `POST /batches/:batchId/tasks/import` consumes `ImportTasksDto` and returns `{ createdCount: number; tasks: Array<{ id: string; title: string }> }`
- `POST /tasks/:taskId/assignments` consumes `CreateAssignmentDto` and returns `TaskAssignment`
- `createProject(body: CreateProjectInput): Promise<ProjectDetail>`
- `createBatch(projectId: string, body: CreateBatchInput): Promise<BatchDetail>`
- `createTask(batchId: string, body: CreateTaskInput): Promise<TaskDetail>`
- `importTasks(batchId: string, body: ImportTasksInput): Promise<{ createdCount: number; tasks: Array<{ id: string; title: string }> }>`
- `createAssignment(taskId: string, body: CreateAssignmentInput): Promise<TaskAssignment>`

## Task 1: Add backend bulk task import endpoint

**Files:**
- Create: `src/tasks/dto/import-tasks.dto.ts`
- Modify: `src/tasks/tasks.controller.ts`
- Modify: `src/tasks/tasks.service.ts`
- Test: `test/task-import.e2e-spec.ts`

**Interfaces:**
- Consumes: existing `CreateTaskDto`, `BatchesService.findOne(batchId: string)`, `PrismaService.taskItem.create`
- Produces:
  - `ImportTasksDto` with shape `{ tasks: CreateTaskImportItemDto[] }`
  - `TasksService.import(batchId: string, items: CreateTaskImportItemDto[]): Promise<{ createdCount: number; tasks: Array<{ id: string; title: string }> }>`
  - `POST /batches/:batchId/tasks/import`

- [ ] **Step 1: Write the failing e2e test**

```ts
// test/task-import.e2e-spec.ts
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Task import API', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('imports multiple tasks for a batch', async () => {
    const project = await request(app.getHttpServer())
      .post('/projects')
      .send({ name: 'Import project', taskType: 'text' })
      .expect(201);

    const batch = await request(app.getHttpServer())
      .post(`/projects/${project.body.id}/batches`)
      .send({ name: 'Import batch' })
      .expect(201);

    const imported = await request(app.getHttpServer())
      .post(`/batches/${batch.body.id}/tasks/import`)
      .send({
        tasks: [
          { title: '题目一', inputPayload: { question: 'Q1' }, priority: 1 },
          { title: '题目二', inputPayload: { question: 'Q2' }, priority: 2 }
        ]
      })
      .expect(201);

    expect(imported.body.createdCount).toBe(2);

    const tasks = await request(app.getHttpServer())
      .get(`/batches/${batch.body.id}/tasks`)
      .expect(200);

    expect(tasks.body).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run the new test to verify it fails**

Run: `npm run test:e2e -- --runTestsByPath test/task-import.e2e-spec.ts`

Expected: FAIL with `Cannot POST /batches/.../tasks/import` or missing DTO/service method errors.

- [ ] **Step 3: Add the import DTOs**

```ts
// src/tasks/dto/import-tasks.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested
} from 'class-validator';
import { TaskItemStatusDto } from './create-task.dto';

export class CreateTaskImportItemDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  externalRef?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ type: Object })
  @IsObject()
  inputPayload!: Record<string, unknown>;

  @ApiProperty({ enum: TaskItemStatusDto, required: false })
  @IsOptional()
  @IsEnum(TaskItemStatusDto)
  status?: TaskItemStatusDto;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;
}

export class ImportTasksDto {
  @ApiProperty({ type: [CreateTaskImportItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTaskImportItemDto)
  tasks!: CreateTaskImportItemDto[];
}
```

- [ ] **Step 4: Expose the import route before `tasks/:id` style collisions**

```ts
// src/tasks/tasks.controller.ts
import { ImportTasksDto } from './dto/import-tasks.dto';

@Post('batches/:batchId/tasks/import')
import(@Param('batchId') batchId: string, @Body() dto: ImportTasksDto) {
  return this.tasksService.import(batchId, dto.tasks);
}
```

- [ ] **Step 5: Implement the service method with minimal Prisma logic**

```ts
// src/tasks/tasks.service.ts
import { CreateTaskImportItemDto } from './dto/import-tasks.dto';

async import(batchId: string, items: CreateTaskImportItemDto[]) {
  await this.batchesService.findOne(batchId);

  const createdTasks = await Promise.all(
    items.map((item) =>
      this.prisma.taskItem.create({
        data: {
          batchId,
          externalRef: item.externalRef,
          title: item.title,
          inputPayload: item.inputPayload as Prisma.InputJsonValue,
          status: item.status,
          priority: item.priority ?? 0
        },
        select: {
          id: true,
          title: true
        }
      })
    )
  );

  return {
    createdCount: createdTasks.length,
    tasks: createdTasks
  };
}
```

- [ ] **Step 6: Re-run the targeted test**

Run: `npm run test:e2e -- --runTestsByPath test/task-import.e2e-spec.ts`

Expected: PASS with `1 passed, 1 total`.

- [ ] **Step 7: Commit**

```bash
git add src/tasks/dto/import-tasks.dto.ts src/tasks/tasks.controller.ts src/tasks/tasks.service.ts test/task-import.e2e-spec.ts
git commit -m "feat: add batch task import endpoint"
```

## Task 2: Add frontend mutation helpers and shared action shell

**Files:**
- Create: `apps/web/components/ui/action-card.tsx`
- Modify: `apps/web/lib/api/projects.ts`
- Modify: `apps/web/lib/api/batches.ts`
- Modify: `apps/web/lib/api/tasks.ts`
- Modify: `apps/web/lib/api/assignments.ts`
- Modify: `apps/web/lib/types.ts`

**Interfaces:**
- Consumes: existing `apiFetch<T>(path: string, init?: RequestInit): Promise<T>`
- Produces:
  - `CreateProjectInput`, `CreateBatchInput`, `CreateTaskInput`, `ImportTasksInput`, `CreateAssignmentInput`
  - `createProject`, `createBatch`, `createTask`, `importTasks`, `createAssignment`
  - `ActionCard({ title, description, children })`

- [ ] **Step 1: Write the failing type expectation by importing the new helpers into existing page files**

```ts
// expectation only
// apps/web/app/projects/page.tsx should be able to import createProject from ../../lib/api/projects
// apps/web/app/batches/[batchId]/page.tsx should be able to import createTask and importTasks
// apps/web/app/tasks/[taskId]/page.tsx should be able to import createAssignment
```

- [ ] **Step 2: Run the frontend build to verify the helpers do not exist yet**

Run: `npm run build --workspace web`

Expected: FAIL with missing export or missing type errors after the page imports are added in Task 3 and Task 4.

- [ ] **Step 3: Add shared request types to `apps/web/lib/types.ts`**

```ts
export interface CreateProjectInput {
  name: string;
  description?: string;
  status?: 'draft' | 'active' | 'archived';
  taskType: string;
  sopDocument?: string;
  acceptanceCriteria?: string;
}

export interface CreateBatchInput {
  name: string;
  status?: 'draft' | 'in_progress' | 'ready_for_delivery' | 'closed';
  plannedTaskCount?: number;
}

export interface CreateTaskInput {
  externalRef?: string;
  title: string;
  inputPayload: Record<string, unknown>;
  status?:
    | 'pending_allocation'
    | 'pending_pickup'
    | 'in_progress'
    | 'submitted'
    | 'returned';
  priority?: number;
}

export interface ImportTasksInput {
  tasks: CreateTaskInput[];
}

export interface ImportedTaskSummary {
  id: string;
  title: string;
}

export interface ImportTasksResponse {
  createdCount: number;
  tasks: ImportedTaskSummary[];
}

export interface CreateAssignmentInput {
  operatorId?: string;
  assigneeId: string;
  status?: 'assigned' | 'accepted' | 'completed' | 'rejected';
  notes?: string;
}
```

- [ ] **Step 4: Add the mutation helpers**

```ts
// apps/web/lib/api/projects.ts
import type { CreateProjectInput, ProjectDetail, ProjectSummary } from '../types';

export function createProject(body: CreateProjectInput) {
  return apiFetch<ProjectDetail>('/projects', {
    method: 'POST',
    body: JSON.stringify(body)
  });
}
```

```ts
// apps/web/lib/api/batches.ts
import type { BatchDetail, BatchSummary, CreateBatchInput } from '../types';

export function createBatch(projectId: string, body: CreateBatchInput) {
  return apiFetch<BatchDetail>(`/projects/${projectId}/batches`, {
    method: 'POST',
    body: JSON.stringify(body)
  });
}
```

```ts
// apps/web/lib/api/tasks.ts
import type {
  CreateTaskInput,
  ImportTasksInput,
  ImportTasksResponse,
  TaskDetail,
  TaskSummary
} from '../types';

export function createTask(batchId: string, body: CreateTaskInput) {
  return apiFetch<TaskDetail>(`/batches/${batchId}/tasks`, {
    method: 'POST',
    body: JSON.stringify(body)
  });
}

export function importTasks(batchId: string, body: ImportTasksInput) {
  return apiFetch<ImportTasksResponse>(`/batches/${batchId}/tasks/import`, {
    method: 'POST',
    body: JSON.stringify(body)
  });
}
```

```ts
// apps/web/lib/api/assignments.ts
import type { CreateAssignmentInput, TaskAssignment } from '../types';

export function createAssignment(taskId: string, body: CreateAssignmentInput) {
  return apiFetch<TaskAssignment>(`/tasks/${taskId}/assignments`, {
    method: 'POST',
    body: JSON.stringify(body)
  });
}
```

- [ ] **Step 5: Add the shared inline action shell**

```tsx
// apps/web/components/ui/action-card.tsx
export function ActionCard({
  title,
  description,
  children
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-panel border border-panelLine bg-white p-6 shadow-panel">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slateDeep">{title}</h3>
        {description ? <p className="mt-2 text-sm text-slate-500">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
```

- [ ] **Step 6: Run the frontend build**

Run: `npm run build --workspace web`

Expected: PASS or fail only because the form components are not mounted yet. There should be no missing helper export errors.

- [ ] **Step 7: Commit**

```bash
git add apps/web/components/ui/action-card.tsx apps/web/lib/api/projects.ts apps/web/lib/api/batches.ts apps/web/lib/api/tasks.ts apps/web/lib/api/assignments.ts apps/web/lib/types.ts
git commit -m "feat: add admin mutation helpers"
```

## Task 3: Add project and batch creation forms to existing pages

**Files:**
- Create: `apps/web/components/forms/project-create-form.tsx`
- Create: `apps/web/components/forms/batch-create-form.tsx`
- Modify: `apps/web/app/projects/page.tsx`
- Modify: `apps/web/app/projects/[projectId]/page.tsx`
- Modify: `apps/web/components/projects/project-list.tsx`
- Modify: `apps/web/components/projects/project-detail.tsx`

**Interfaces:**
- Consumes:
  - `createProject(body: CreateProjectInput): Promise<ProjectDetail>`
  - `createBatch(projectId: string, body: CreateBatchInput): Promise<BatchDetail>`
  - `ActionCard`
- Produces:
  - `ProjectCreateForm({})`
  - `BatchCreateForm({ projectId }: { projectId: string })`

- [ ] **Step 1: Write the failing UI expectation**

```ts
// expectation only
// /projects should render a "新建项目" form card
// /projects/[projectId] should render a "新建批次" form card
```

- [ ] **Step 2: Implement the project form as a client component**

```tsx
// apps/web/components/forms/project-create-form.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createProject } from '../../lib/api/projects';
import { ActionCard } from '../ui/action-card';

export function ProjectCreateForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    description: '',
    taskType: '',
    sopDocument: '',
    acceptanceCriteria: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage('');

    try {
      await createProject({
        name: form.name,
        description: form.description || undefined,
        taskType: form.taskType,
        sopDocument: form.sopDocument || undefined,
        acceptanceCriteria: form.acceptanceCriteria || undefined
      });
      setForm({
        name: '',
        description: '',
        taskType: '',
        sopDocument: '',
        acceptanceCriteria: ''
      });
      setMessage('项目已创建');
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '创建项目失败');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ActionCard title="新建项目" description="创建一个新的数据生产项目。">
      <form onSubmit={handleSubmit} className="space-y-4">
        <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        <input value={form.taskType} onChange={(event) => setForm({ ...form, taskType: event.target.value })} />
        <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
        <textarea value={form.sopDocument} onChange={(event) => setForm({ ...form, sopDocument: event.target.value })} />
        <textarea value={form.acceptanceCriteria} onChange={(event) => setForm({ ...form, acceptanceCriteria: event.target.value })} />
        <button type="submit" disabled={submitting}>保存项目</button>
        {message ? <p>{message}</p> : null}
      </form>
    </ActionCard>
  );
}
```

- [ ] **Step 3: Implement the batch form with project-bound submit**

```tsx
// apps/web/components/forms/batch-create-form.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createBatch } from '../../lib/api/batches';
import { ActionCard } from '../ui/action-card';

export function BatchCreateForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [plannedTaskCount, setPlannedTaskCount] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage('');

    try {
      await createBatch(projectId, {
        name,
        plannedTaskCount: plannedTaskCount ? Number(plannedTaskCount) : undefined
      });
      setName('');
      setPlannedTaskCount('');
      setMessage('批次已创建');
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '创建批次失败');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ActionCard title="新建批次" description="在当前项目下增加一个批次。">
      <form onSubmit={handleSubmit} className="space-y-4">
        <input value={name} onChange={(event) => setName(event.target.value)} />
        <input value={plannedTaskCount} onChange={(event) => setPlannedTaskCount(event.target.value)} />
        <button type="submit" disabled={submitting}>保存批次</button>
        {message ? <p>{message}</p> : null}
      </form>
    </ActionCard>
  );
}
```

- [ ] **Step 4: Mount the forms into the pages and keep list/detail content visible**

```tsx
// apps/web/app/projects/page.tsx
import { ProjectCreateForm } from '../../components/forms/project-create-form';

<AppShell
  title="项目管理"
  description="查看项目进度、状态和题型分布。"
  rightSlot={<ProjectCreateForm />}
>
  <ProjectList projects={projects} />
</AppShell>
```

```tsx
// apps/web/app/projects/[projectId]/page.tsx
import { BatchCreateForm } from '../../../components/forms/batch-create-form';

<AppShell
  title="项目详情"
  description="查看项目信息、SOP、验收标准与批次状态。"
  rightSlot={<BatchCreateForm projectId={project.id} />}
>
  <ProjectDetailView project={project} batches={batches} />
</AppShell>
```

- [ ] **Step 5: Keep display components focused on listing, not form logic**

```tsx
// apps/web/components/projects/project-list.tsx
// no mutation logic; only present list rows and links
```

```tsx
// apps/web/components/projects/project-detail.tsx
// no mutation logic; only present project and batch summaries
```

- [ ] **Step 6: Run the frontend build**

Run: `npm run build --workspace web`

Expected: PASS with `/projects` and `/projects/[projectId]` still building.

- [ ] **Step 7: Commit**

```bash
git add apps/web/components/forms/project-create-form.tsx apps/web/components/forms/batch-create-form.tsx apps/web/app/projects/page.tsx apps/web/app/projects/[projectId]/page.tsx apps/web/components/projects/project-list.tsx apps/web/components/projects/project-detail.tsx
git commit -m "feat: add project and batch creation forms"
```

## Task 4: Add task creation, JSON import, and single-task assignment forms

**Files:**
- Create: `apps/web/components/forms/task-create-form.tsx`
- Create: `apps/web/components/forms/task-import-form.tsx`
- Create: `apps/web/components/forms/assignment-create-form.tsx`
- Modify: `apps/web/app/batches/[batchId]/page.tsx`
- Modify: `apps/web/app/tasks/[taskId]/page.tsx`
- Modify: `apps/web/components/batches/batch-list.tsx`
- Modify: `apps/web/components/tasks/task-list.tsx`

**Interfaces:**
- Consumes:
  - `createTask(batchId: string, body: CreateTaskInput): Promise<TaskDetail>`
  - `importTasks(batchId: string, body: ImportTasksInput): Promise<ImportTasksResponse>`
  - `createAssignment(taskId: string, body: CreateAssignmentInput): Promise<TaskAssignment>`
  - `ActionCard`
- Produces:
  - `TaskCreateForm({ batchId }: { batchId: string })`
  - `TaskImportForm({ batchId }: { batchId: string })`
  - `AssignmentCreateForm({ taskId }: { taskId: string })`

- [ ] **Step 1: Write the failing interaction expectations**

```ts
// expectation only
// /batches/[batchId] exposes "新建任务" and "批量导入 JSON"
// /tasks/[taskId] exposes "分配给标注员"
```

- [ ] **Step 2: Implement manual task creation with local JSON parsing**

```tsx
// apps/web/components/forms/task-create-form.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createTask } from '../../lib/api/tasks';
import { ActionCard } from '../ui/action-card';

export function TaskCreateForm({ batchId }: { batchId: string }) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [externalRef, setExternalRef] = useState('');
  const [priority, setPriority] = useState('0');
  const [inputPayloadText, setInputPayloadText] = useState('{\n  "question": ""\n}');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage('');

    try {
      const inputPayload = JSON.parse(inputPayloadText) as Record<string, unknown>;
      await createTask(batchId, {
        title,
        externalRef: externalRef || undefined,
        priority: Number(priority),
        inputPayload
      });
      setTitle('');
      setExternalRef('');
      setPriority('0');
      setInputPayloadText('{\n  "question": ""\n}');
      setMessage('任务已创建');
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '创建任务失败');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ActionCard title="新建任务" description="手工录入单道题目。">
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="题目标题"
          className="w-full rounded-2xl border border-panelLine bg-cloud px-4 py-3 text-sm outline-none"
        />
        <input
          value={externalRef}
          onChange={(event) => setExternalRef(event.target.value)}
          placeholder="外部引用（可选）"
          className="w-full rounded-2xl border border-panelLine bg-cloud px-4 py-3 text-sm outline-none"
        />
        <input
          value={priority}
          onChange={(event) => setPriority(event.target.value)}
          placeholder="优先级"
          className="w-full rounded-2xl border border-panelLine bg-cloud px-4 py-3 text-sm outline-none"
        />
        <textarea
          value={inputPayloadText}
          onChange={(event) => setInputPayloadText(event.target.value)}
          className="min-h-40 w-full rounded-2xl border border-panelLine bg-cloud px-4 py-3 font-mono text-sm outline-none"
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-skyStrong px-5 py-2.5 text-sm text-white disabled:opacity-60"
        >
          保存任务
        </button>
        {message ? <p className="text-sm text-slate-500">{message}</p> : null}
      </form>
    </ActionCard>
  );
}
```

- [ ] **Step 3: Implement lightweight JSON import**

```tsx
// apps/web/components/forms/task-import-form.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { importTasks } from '../../lib/api/tasks';
import { ActionCard } from '../ui/action-card';

const example = `[
  {
    "title": "题目一",
    "externalRef": "A-001",
    "priority": 1,
    "inputPayload": { "question": "..." }
  }
]`;

export function TaskImportForm({ batchId }: { batchId: string }) {
  const router = useRouter();
  const [value, setValue] = useState(example);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage('');

    try {
      const parsed = JSON.parse(value) as unknown;
      if (!Array.isArray(parsed)) {
        throw new Error('请输入任务数组 JSON');
      }

      const result = await importTasks(batchId, { tasks: parsed as never[] });
      setMessage(`已导入 ${result.createdCount} 条任务`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '导入失败');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ActionCard title="批量导入 JSON" description="粘贴任务数组并一次性导入。">
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="min-h-56 w-full rounded-2xl border border-panelLine bg-cloud px-4 py-3 font-mono text-sm outline-none"
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-slateDeep px-5 py-2.5 text-sm text-white disabled:opacity-60"
        >
          开始导入
        </button>
        {message ? <p className="text-sm text-slate-500">{message}</p> : null}
      </form>
    </ActionCard>
  );
}
```

- [ ] **Step 4: Implement single-task assignment form**

```tsx
// apps/web/components/forms/assignment-create-form.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createAssignment } from '../../lib/api/assignments';
import { ActionCard } from '../ui/action-card';

export function AssignmentCreateForm({ taskId }: { taskId: string }) {
  const router = useRouter();
  const [assigneeId, setAssigneeId] = useState('');
  const [operatorId, setOperatorId] = useState('');
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage('');

    try {
      await createAssignment(taskId, {
        assigneeId,
        operatorId: operatorId || undefined,
        notes: notes || undefined
      });
      setAssigneeId('');
      setOperatorId('');
      setNotes('');
      setMessage('任务已分配');
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '分配任务失败');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ActionCard title="分配给标注员" description="为当前任务创建一条执行记录。">
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          value={assigneeId}
          onChange={(event) => setAssigneeId(event.target.value)}
          placeholder="标注员 ID"
          className="w-full rounded-2xl border border-panelLine bg-cloud px-4 py-3 text-sm outline-none"
        />
        <input
          value={operatorId}
          onChange={(event) => setOperatorId(event.target.value)}
          placeholder="运营商 ID（可选）"
          className="w-full rounded-2xl border border-panelLine bg-cloud px-4 py-3 text-sm outline-none"
        />
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="备注（可选）"
          className="min-h-24 w-full rounded-2xl border border-panelLine bg-cloud px-4 py-3 text-sm outline-none"
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-skyStrong px-5 py-2.5 text-sm text-white disabled:opacity-60"
        >
          确认分配
        </button>
        {message ? <p className="text-sm text-slate-500">{message}</p> : null}
      </form>
    </ActionCard>
  );
}
```

- [ ] **Step 5: Mount forms into batch and task pages**

```tsx
// apps/web/app/batches/[batchId]/page.tsx
import { TaskCreateForm } from '../../../components/forms/task-create-form';
import { TaskImportForm } from '../../../components/forms/task-import-form';

<AppShell
  title="批次详情"
  description="查看批次题量、提交进度与任务列表。"
  rightSlot={
    <div className="space-y-6">
      <TaskCreateForm batchId={batch.id} />
      <TaskImportForm batchId={batch.id} />
    </div>
  }
>
  <BatchList batch={batch} tasks={tasks} />
</AppShell>
```

```tsx
// apps/web/app/tasks/[taskId]/page.tsx
import { AssignmentCreateForm } from '../../../components/forms/assignment-create-form';

<AppShell
  title="任务详情"
  description="围绕单题查看内容、分配记录与 AI 建议。"
  rightSlot={
    <div className="space-y-6">
      <AssignmentCreateForm taskId={task.id} />
      <AssignmentPanel assignments={assignments} />
      <AssistantDrawer taskId={task.id} context={`当前任务标题：${task.title}。当前状态：${task.status}。`} />
    </div>
  }
>
  <TaskList task={task} assignments={assignments} />
</AppShell>
```

- [ ] **Step 6: Keep batch/task display components read-focused**

```tsx
// apps/web/components/batches/batch-list.tsx
// keep task summary links and progress summary only
```

```tsx
// apps/web/components/tasks/task-list.tsx
// keep task content and assignment history presentation only
```

- [ ] **Step 7: Run the frontend build**

Run: `npm run build --workspace web`

Expected: PASS with `/batches/[batchId]` and `/tasks/[taskId]` rendering the new right-rail forms.

- [ ] **Step 8: Commit**

```bash
git add apps/web/components/forms/task-create-form.tsx apps/web/components/forms/task-import-form.tsx apps/web/components/forms/assignment-create-form.tsx apps/web/app/batches/[batchId]/page.tsx apps/web/app/tasks/[taskId]/page.tsx apps/web/components/batches/batch-list.tsx apps/web/components/tasks/task-list.tsx
git commit -m "feat: add task creation and assignment forms"
```

## Task 5: Run full verification and polish failure handling

**Files:**
- Modify: any files touched in Tasks 1-4 if verification exposes issues
- Test: `test/task-import.e2e-spec.ts`
- Test: existing `test/*.e2e-spec.ts`

**Interfaces:**
- Consumes: all previous task outputs
- Produces: green backend and frontend verification for the writable workflow

- [ ] **Step 1: Run backend build**

Run: `npm run build`

Expected: PASS with Nest build completing successfully.

- [ ] **Step 2: Run backend e2e suite**

Run: `npm run test:e2e`

Expected: PASS with existing CRUD tests plus `task-import.e2e-spec.ts`.

- [ ] **Step 3: Run frontend build**

Run: `npm run build --workspace web`

Expected: PASS with all project, batch, task, workbench, and assistant pages building.

- [ ] **Step 4: Smoke-check the writable loop manually**

Run:

```bash
npm run start:dev
```

Expected:

- `/projects` can create a project
- `/projects/[projectId]` can create a batch
- `/batches/[batchId]` can create one task
- `/batches/[batchId]` can import multiple tasks from JSON
- `/tasks/[taskId]` can assign a task to an annotator

- [ ] **Step 5: Fix any surfaced copy, validation, or refresh issues**

```ts
// Accept only concrete fixes discovered in Step 4, for example:
// - keep JSON textarea content unchanged when parsing fails
// - return the explicit message "请输入任务数组 JSON" for non-array imports
// - keep submit buttons disabled until the in-flight request resolves
```

- [ ] **Step 6: Re-run the affected verification commands**

Run: `npm run build && npm run test:e2e && npm run build --workspace web`

Expected: PASS for all three commands.

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "test: verify operational input workflow"
```

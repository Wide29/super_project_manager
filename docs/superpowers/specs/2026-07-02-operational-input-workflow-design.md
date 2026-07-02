# Operational Input Workflow Design

## Goal

Extend the current Chinese admin console from a read-only management view into an operational console that can drive the production chain end to end.

This phase should make the following workflow usable:

1. Project manager creates a project
2. Project manager or operator creates a batch under a project
3. Operator manually creates tasks under a batch
4. Operator can also use a lightweight JSON import entry to create tasks in bulk
5. Operator assigns an individual task to an annotator

The purpose of this phase is to establish the first writable production loop without introducing full role permissions or a heavy spreadsheet-style import system.

## Scope

### In scope

- Frontend forms for project creation
- Frontend forms for batch creation
- Frontend forms for manual task creation
- Frontend lightweight JSON import entry for batch task creation
- Frontend form for single-task assignment
- Backend endpoints needed to support the above flows
- Validation, success feedback, and failure feedback for these actions
- Basic e2e coverage for the new backend write flows

### Out of scope

- Enterprise authentication
- Role-based access control enforcement
- Batch assignment to multiple annotators in one action
- Complex CSV or Excel import
- Media-specific annotation widgets
- Full audit history and approval chain UI

## Product decision

This phase uses a dual-track input model:

- The primary operating path is manual creation and single-task assignment
- A lightweight JSON import entry is provided on the batch page for near-production onboarding

This keeps the UI understandable while still covering the real need to load multiple tasks efficiently.

## User roles in this phase

The UI continues to expose all actions in one admin console, but the intended ownership is:

- Project manager: create project
- Project manager or operator: create batch
- Operator: create tasks manually or via JSON import
- Operator: assign task to annotator

No frontend permission gating is added in this phase. Role separation remains a product convention rather than an enforced technical boundary.

## Information architecture changes

### Overview

No structural change. Existing overview stays as an entry page.

### Project list

Add a primary action button:

- `新建项目`

This opens an inline form panel or modal for creating a new project.

### Project detail

Add a primary action button:

- `新建批次`

This opens a creation form bound to the current project.

### Batch detail

Add two action entries:

- `新建任务`
- `批量导入 JSON`

The manual form is the primary entry. The JSON import entry is secondary and visually lighter.

### Task detail

Add a writable assignment card:

- `分配给标注员`

This creates a task assignment record for a single assignee.

## UX design

### General interaction model

For speed and consistency, writable actions should use embedded form cards rather than full-page navigation.

This means:

- list or detail content remains visible
- create forms appear as slide-down cards or side panels
- submit success refreshes the current page data
- users stay inside the same context

This fits the existing management-console style and reduces navigation overhead.

### Project creation form

Fields:

- 项目名称 `name` required
- 项目描述 `description` optional
- 任务类型 `taskType` required
- SOP 摘要 `sopDocument` optional
- 验收标准 `acceptanceCriteria` optional

Behavior:

- submit button disabled while posting
- on success, return to project list and show the new project at the top
- on failure, show backend error text

### Batch creation form

Fields:

- 批次名称 `name` required
- 状态 `status` optional, default `draft`
- 计划题量 `plannedTaskCount` optional

Behavior:

- bound to current project
- on success, refresh current project detail page and show new batch card

### Manual task creation form

Fields:

- 题目标题 `title` required
- 外部引用 `externalRef` optional
- 优先级 `priority` optional, default `0`
- 任务状态 `status` optional, default `pending_allocation`
- 题目 JSON `inputPayload` required

Behavior:

- `inputPayload` is entered in a formatted textarea
- parse and validate as JSON before submission
- if parse fails, block submit with clear message
- on success, refresh current batch page

### JSON batch import form

Entry shape:

- a textarea that accepts a JSON array

Expected payload format:

```json
[
  {
    "title": "题目一",
    "externalRef": "A-001",
    "priority": 1,
    "status": "pending_allocation",
    "inputPayload": {
      "question": "..."
    }
  }
]
```

Behavior:

- parse the whole textarea as a JSON array
- validate that every item contains `title` and `inputPayload`
- submit in one action to a backend bulk-create endpoint
- on success, show imported count and refresh task list
- on failure, show item-level validation summary if provided by backend

The first version does not need drag-and-drop file upload. Textarea import is enough.

### Single-task assignment form

Fields:

- 标注员 ID `assigneeId` required
- 运营商 ID `operatorId` optional
- 状态 `status` optional, default `assigned`
- 备注 `notes` optional

Behavior:

- create one assignment record for the current task
- on success, refresh assignment list
- no auto-transition of task state is required in this phase

## Backend API design

### Existing endpoints reused

- `POST /projects`
- `POST /projects/:projectId/batches`
- `POST /batches/:batchId/tasks`
- `POST /tasks/:taskId/assignments`

### New endpoint to add

- `POST /batches/:batchId/tasks/import`

Request body:

```json
{
  "tasks": [
    {
      "title": "题目一",
      "externalRef": "A-001",
      "priority": 1,
      "status": "pending_allocation",
      "inputPayload": {
        "question": "..."
      }
    }
  ]
}
```

Response shape:

```json
{
  "createdCount": 1,
  "tasks": [
    {
      "id": "...",
      "title": "题目一"
    }
  ]
}
```

### Validation rules

Project create:

- `name` required
- `taskType` required

Batch create:

- `name` required
- `plannedTaskCount` must be a positive integer if provided

Task create:

- `title` required
- `inputPayload` must be an object

Task import:

- `tasks` must be a non-empty array
- each item must include `title`
- each item must include `inputPayload` object
- invalid items should fail the request with actionable error text

Assignment create:

- `assigneeId` required

## Frontend component plan

### New components

- `apps/web/components/forms/project-create-form.tsx`
- `apps/web/components/forms/batch-create-form.tsx`
- `apps/web/components/forms/task-create-form.tsx`
- `apps/web/components/forms/task-import-form.tsx`
- `apps/web/components/forms/assignment-create-form.tsx`
- `apps/web/components/ui/action-card.tsx`

### Existing pages to update

- `apps/web/app/projects/page.tsx`
- `apps/web/app/projects/[projectId]/page.tsx`
- `apps/web/app/batches/[batchId]/page.tsx`
- `apps/web/app/tasks/[taskId]/page.tsx`

### Frontend API helpers

Add or extend:

- `createProject(body)`
- `createBatch(projectId, body)`
- `createTask(batchId, body)`
- `importTasks(batchId, body)`
- `createAssignment(taskId, body)`

The frontend should continue to use the existing `apiFetch` abstraction and refresh via `router.refresh()` after successful mutations.

## Data flow

### Manual creation flow

1. user opens inline form
2. frontend validates required fields
3. frontend posts to backend
4. backend validates and writes record
5. frontend shows success state
6. current page refreshes to reflect new data

### JSON import flow

1. user pastes JSON array
2. frontend parses locally
3. frontend blocks obvious malformed JSON
4. frontend posts parsed array to backend
5. backend validates all items and bulk creates records
6. frontend shows imported count
7. current batch page refreshes

## Error handling

### Frontend

- Show inline validation for empty required fields
- Show explicit JSON parse errors for task create and import
- Preserve user-entered form values when submission fails
- Disable duplicate submissions while request is in flight

### Backend

- Return standard Nest validation errors for DTO failures
- Return `404` when parent project, batch, or task does not exist
- Return `400` for malformed JSON import payloads

## Testing strategy

### Backend tests

Add e2e coverage for:

- project creation remains valid for richer payloads
- batch creation with planned count
- bulk task import endpoint
- assignment creation with optional operator and notes

### Frontend verification

At minimum:

- production build passes
- manual smoke path works:
  - create project
  - create batch
  - create one task
  - assign task
- JSON import creates multiple tasks successfully

## Risks and mitigations

### Risk: JSON import usability is too technical

Mitigation:

- keep manual creation as the primary button
- provide placeholder example JSON in the textarea

### Risk: operator IDs and annotator IDs are free text

Mitigation:

- accept free text in this phase
- later replace with user directory or role selector once auth exists

### Risk: page refresh after mutation feels abrupt

Mitigation:

- use inline success message before refresh when needed
- keep mutations contextual and local to the current page

## Recommendation

Implement this as a focused writable workflow phase, not a general admin rebuild.

The best version of this phase is:

- simple forms
- small number of new endpoints
- clear success and failure feedback
- no premature permission system

That gives the product its first real operational backbone while keeping the codebase easy to evolve in the next phase.

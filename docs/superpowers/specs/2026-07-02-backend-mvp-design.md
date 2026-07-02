# Backend MVP Design

## Goal

Build the first runnable backend MVP for the agent-powered data production platform using NestJS, Prisma, and PostgreSQL.

This milestone focuses on a clean, production-leaning backend skeleton with real persistence and CRUD APIs for the core production chain:

- Project
- Batch
- TaskItem
- TaskAssignment

The result should be a runnable API service with Swagger documentation and a database schema that supports future expansion into QC, acceptance, user management, and agent orchestration.

## Scope

### In scope

- NestJS backend application setup
- Prisma integration with PostgreSQL
- Database schema and migrations
- CRUD APIs for:
  - Projects
  - Batches
  - Task items
  - Task assignments
- Request validation
- Basic error handling
- Swagger API documentation
- Modular code structure suitable for further growth

### Out of scope

- Authentication and authorization
- Full user, role, and organization model
- QC workflow
- Algorithm acceptance workflow
- Agent orchestration runtime
- Queue-based async jobs
- Complex workflow engine
- Frontend application

## Technical stack

- Runtime: Node.js
- Framework: NestJS
- ORM: Prisma
- Database: PostgreSQL
- API documentation: Swagger
- Validation: class-validator + class-transformer

## Why this approach

This MVP uses a modular monolith approach:

- fast to build and iterate
- simple to run locally
- easy to reason about while the domain is still being shaped
- compatible with future extraction of services if the platform grows

Prisma is preferred because it gives:

- fast schema iteration
- good TypeScript ergonomics
- explicit migrations
- a smooth path for future relational expansion

## Domain boundaries

The first backend cut models a minimal production chain:

- A `Project` owns many `Batch` records
- A `Batch` owns many `TaskItem` records
- A `TaskItem` owns many `TaskAssignment` records

This keeps the first implementation close to the business workflow while leaving room for later states such as rework, QC, and acceptance.

## Data model

### Project

Represents a business project.

Fields:

- `id`
- `name`
- `description`
- `status`
- `taskType`
- `sopDocument`
- `acceptanceCriteria`
- `createdAt`
- `updatedAt`

Suggested statuses:

- `draft`
- `active`
- `archived`

### Batch

Represents a production or delivery batch inside a project.

Fields:

- `id`
- `projectId`
- `name`
- `status`
- `plannedTaskCount`
- `createdAt`
- `updatedAt`

Suggested statuses:

- `draft`
- `in_progress`
- `ready_for_delivery`
- `closed`

### TaskItem

Represents the smallest task unit, currently aligned with a question.

Fields:

- `id`
- `batchId`
- `externalRef`
- `title`
- `inputPayload`
- `status`
- `priority`
- `createdAt`
- `updatedAt`

Suggested statuses:

- `pending_allocation`
- `pending_pickup`
- `in_progress`
- `submitted`
- `returned`

`inputPayload` should use JSON so the system can support multiple task types without early schema fragmentation.

### TaskAssignment

Represents a task assignment event between a task and an execution party.

Fields:

- `id`
- `taskItemId`
- `operatorId`
- `assigneeId`
- `status`
- `assignedAt`
- `completedAt`
- `notes`

Suggested statuses:

- `assigned`
- `accepted`
- `completed`
- `rejected`

For this milestone, `operatorId` and `assigneeId` are plain strings rather than foreign keys to a user table. This keeps the MVP focused while reserving a clean upgrade path to full identity and RBAC later.

## API design

### Projects

- `POST /projects`
- `GET /projects`
- `GET /projects/:id`
- `PATCH /projects/:id`

### Batches

- `POST /projects/:projectId/batches`
- `GET /projects/:projectId/batches`
- `GET /batches/:id`
- `PATCH /batches/:id`

### Tasks

- `POST /batches/:batchId/tasks`
- `GET /batches/:batchId/tasks`
- `GET /tasks/:id`
- `PATCH /tasks/:id`

### Assignments

- `POST /tasks/:taskId/assignments`
- `GET /tasks/:taskId/assignments`

## Module design

The service should be organized into the following modules:

- `app`
- `prisma`
- `projects`
- `batches`
- `tasks`
- `assignments`

Responsibilities:

- `app`: bootstrap, Swagger, global configuration, shared filters
- `prisma`: Prisma client and database lifecycle
- `projects`: project CRUD
- `batches`: batch CRUD and project linkage
- `tasks`: task CRUD and batch linkage
- `assignments`: assignment CRUD and task linkage

## Directory structure

```text
src/
  main.ts
  app.module.ts
  common/
    dto/
    filters/
    interceptors/
  prisma/
    prisma.module.ts
    prisma.service.ts
  projects/
    dto/
    projects.controller.ts
    projects.module.ts
    projects.service.ts
  batches/
    dto/
    batches.controller.ts
    batches.module.ts
    batches.service.ts
  tasks/
    dto/
    tasks.controller.ts
    tasks.module.ts
    tasks.service.ts
  assignments/
    dto/
    assignments.controller.ts
    assignments.module.ts
    assignments.service.ts

prisma/
  schema.prisma
  migrations/
```

## Architecture rules

- Keep controllers thin
- Keep database access inside service boundaries
- Keep resource ownership checks explicit
- Keep state values enumerated and centralized
- Prefer DTO-based validation at the boundary
- Avoid embedding future QC or agent behavior into the first schema beyond reserved fields

## Error handling

The MVP should include:

- 404 handling for missing resources
- 400 validation errors for malformed input
- conflict-safe handling for invalid parent-child creation attempts
- consistent API error shape through a global exception filter if practical in the first cut

## Testing strategy

Initial testing should prioritize:

- module-level service tests for CRUD behaviors
- validation behavior on DTOs
- minimal integration coverage for project -> batch -> task -> assignment creation flow

Heavy end-to-end coverage is not required in the first cut, but the app should be structured so it can be added cleanly.

## Delivery sequence

1. Initialize NestJS project
2. Add Prisma and PostgreSQL configuration
3. Define Prisma schema and run first migration
4. Implement `projects`
5. Implement `batches`
6. Implement `tasks`
7. Implement `assignments`
8. Add Swagger and shared validation
9. Verify local startup and core CRUD flows

## Risks and tradeoffs

- Deferring user and role tables means assignments are not yet relationally strict
- JSON payloads trade strict early typing for faster multi-task extensibility
- A modular monolith is the right fit for MVP speed, but module boundaries should stay disciplined to avoid later entanglement

## Success criteria

This milestone is complete when:

- the NestJS service boots locally
- Prisma migrations can create the schema in PostgreSQL
- all four core resources have working CRUD or scoped creation/list endpoints
- Swagger exposes the API clearly
- a developer can create a project, create a batch under it, create tasks under the batch, and create assignments under a task

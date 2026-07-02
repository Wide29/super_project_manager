# Frontend MVP Design

## Goal

Build the first Chinese-language frontend MVP for the agent-powered data production platform.

This frontend should connect to the real NestJS backend, use a professional management-console visual style, and include restrained GSAP motion. It should also integrate with a backend AI gateway that uses DeepSeek for both assistant chat and task suggestion workflows.

## Scope

### In scope

- Next.js frontend application
- TypeScript-based implementation
- Tailwind CSS styling
- GSAP for restrained motion
- Chinese UI copy
- Real backend API integration
- Core project-management pages
- Basic annotation workbench
- AI assistant panel

### Out of scope

- Full enterprise auth
- Complete QC and acceptance UI
- Full multi-role permission enforcement in the frontend
- Full data visualization dashboard system
- Complex designer-grade annotation widgets for all task media types

## Product direction

The product should feel like a modern professional management console rather than a consumer landing page or a flashy operations big-screen.

Primary qualities:

- calm
- efficient
- trustworthy
- slightly polished
- clearly Chinese-language first

Motion should support flow and hierarchy, not spectacle.

## Design direction

### Visual theme

- Primary background: white
- Secondary background: very light sky-blue gray
- Primary brand color: `#62B6FF`
- Soft accent: `#DFF1FF`
- Strong accent: `#1F7AE0`
- Text primary: deep slate
- Borders: low-contrast cool gray-blue

### Component character

- White cards
- Light shadows
- Soft but not overly rounded corners
- Clear spacing and typography
- Minimal decorative noise

### Motion direction

Use GSAP only in focused places:

- page-load staggered reveal
- sidebar expansion and collapse
- card-list entrance
- annotation workbench question transition
- assistant panel slide-in

Do not use constant ambient motion, exaggerated parallax, or large decorative animation layers.

## Technical stack

- Next.js
- TypeScript
- Tailwind CSS
- GSAP

## Integration model

The frontend must connect to the real backend instead of mock data.

### Backend integration rule

The frontend talks only to our NestJS backend.

It must not call DeepSeek directly.

### AI integration rule

DeepSeek API keys live only in backend environment variables.

The backend provides a unified AI gateway for frontend use.

## AI usage model

Phase 1 should support both of these workflows:

### 1. Assistant chat

Used in a management-console assistant panel for:

- project questions
- workflow explanations
- operational guidance
- general assistance

Backend endpoint:

- `POST /ai/chat`

### 2. Task suggestion

Used in task and workbench views for:

- recommendation generation
- pre-annotation style suggestions
- structured answer hints

Backend endpoint:

- `POST /ai/task-suggestion`

For the MVP, the recommended first AI-facing UI is the assistant panel. Task suggestions can be added in a simpler surface once the main workbench is stable.

## Information architecture

The frontend should be organized into four top-level product areas.

### 1. Overview

Purpose:

- role entry point
- quick platform orientation
- progress summary
- assistant entry point

Pages:

- overview home

### 2. Project management

Purpose:

- manage the production chain from project to assignment

Pages:

- project list
- project detail
- batch management
- task list
- assignment management

### 3. Annotation workbench

Purpose:

- support annotator pickup and task completion

Pages:

- task queue entry
- single-task workbench

### 4. AI assistant

Purpose:

- support operator and manager interactions with AI

Pages or surfaces:

- global assistant drawer or side panel
- task suggestion surface in task/workbench contexts

## Page coverage strategy

All three user-facing directions should be covered in the same frontend project, but not at equal depth in the first iteration.

### Fully covered in MVP

- Project manager view

Includes:

- project list
- project detail
- batch list and edits
- task list
- assignment list and creation

### Usable but lighter in MVP

- Annotator workbench

Includes:

- view next task
- complete task
- submit and move to next task

### Lightweight in MVP

- Unified overview home

Includes:

- role entry
- summary cards
- entry links into major workflows

## Page definitions

### Project list

Purpose:

- show all projects with core status and quick navigation

Key elements:

- page title in Chinese
- search or filter bar
- project cards or table
- status badge
- task type
- quick action to enter project detail

### Project detail

Purpose:

- central operating page for one project

Key elements:

- project header
- status and type tags
- SOP summary
- acceptance summary
- batch overview cards
- progress summary
- links into tasks and assignments

### Batch management

Purpose:

- manage project batches

Key elements:

- batch list
- status
- planned task count
- create batch action
- click-through to batch-scoped task list

### Task list

Purpose:

- inspect tasks under a batch

Key elements:

- task title
- external reference
- status
- priority
- payload preview
- quick access to assignment actions

### Assignment management

Purpose:

- assign tasks to operators or annotators

Key elements:

- task identity
- assignee and operator fields
- assignment status
- creation form or action drawer

### Workbench queue entry

Purpose:

- let annotators start work quickly

Key elements:

- pending task summary
- action to fetch next task
- lightweight productivity context

### Single-task workbench

Purpose:

- show one task clearly and support fast completion

Key elements:

- task title
- task content
- structured answer area
- submit action
- automatic transition to next task after submit
- optional AI suggestion panel

### Assistant panel

Purpose:

- give users an AI copilot inside the console

Key elements:

- panel or drawer
- Chinese prompt input
- response area
- project-aware or page-aware context later

## Layout strategy

### App shell

Recommended shell:

- left navigation rail
- top bar
- main content canvas
- optional right-side assistant panel

This supports both management pages and workbench pages while keeping mental models stable.

### Navigation

Navigation labels should be Chinese-first and operationally clear.

Suggested labels:

- 总览
- 项目管理
- 批次
- 题目
- 分配
- 标注工作台
- 智能助手

## Typography and copy

The UI must be Chinese-language first.

Copy principles:

- direct
- operational
- plain language
- avoid marketing tone
- prefer action-based labels

Examples:

- `创建项目`
- `查看批次`
- `提交并进入下一题`
- `获取建议`
- `智能助手`

## Frontend directory structure

Recommended structure:

```text
apps/web/
  app/
    layout.tsx
    page.tsx
    projects/
    batches/
    tasks/
    workbench/
  components/
  lib/
    api/
    ai/
  styles/
```

## Backend endpoints required by frontend

### Existing core CRUD

- `POST /projects`
- `GET /projects`
- `GET /projects/:id`
- `PATCH /projects/:id`

- `POST /projects/:projectId/batches`
- `GET /projects/:projectId/batches`
- `GET /batches/:id`
- `PATCH /batches/:id`

- `POST /batches/:batchId/tasks`
- `GET /batches/:batchId/tasks`
- `GET /tasks/:id`
- `PATCH /tasks/:id`

- `POST /tasks/:taskId/assignments`
- `GET /tasks/:taskId/assignments`

### Additional frontend-needed endpoints

- `GET /dashboard/overview`
- `GET /tasks/queue/next?assigneeId=...`
- `POST /tasks/:id/submit`
- `POST /ai/chat`
- `POST /ai/task-suggestion`

For MVP implementation order, `GET /dashboard/overview`, `GET /tasks/queue/next`, and `POST /ai/chat` are the highest-value additions.

## Development order

Recommended implementation sequence:

1. scaffold `apps/web`
2. build global app shell, Chinese navigation, theme tokens, and GSAP entrance foundation
3. connect project list and project detail pages
4. connect batches, tasks, and assignments pages
5. build annotation workbench
6. connect AI assistant panel
7. add overview page

## Risks and tradeoffs

- Covering all role directions in one pass increases scope, so depth must be intentionally uneven
- Real backend integration improves stability but requires backend endpoint expansion before some frontend pages are fully useful
- GSAP can add polish, but overuse would conflict with the professional-console goal

## Success criteria

This frontend milestone is successful when:

- the UI is Chinese-language first
- it connects to the real backend CRUD APIs
- project manager workflows are navigable and usable
- the annotator workbench can fetch and submit tasks through backend APIs
- the assistant panel can talk to backend AI endpoints
- motion is present but restrained, and the product still feels like a professional management console

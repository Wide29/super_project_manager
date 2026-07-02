# System Architecture Draft

## Overview

The platform should be built as a modular application with clear separation between workflow management, execution workbenches, and agent orchestration.

## Core modules

### 1. Identity and access

- Users
- Roles
- Project membership
- Operator hierarchy
- Permission control

### 2. Project and batch management

- Project lifecycle
- Batch lifecycle
- SOP and acceptance configuration
- Capacity planning

### 3. Task orchestration

- Question import
- Task generation
- Allocation
- Pickup
- Auto-next logic
- Rework routing

### 4. Annotation workbench

- Question display
- Answer submission
- Context and SOP display
- Agent suggestion panel

### 5. QC and delivery

- QC queue
- Pass/reject actions
- Issue categorization
- Delivery packaging

### 6. Algorithm acceptance

- Sampling queue
- Acceptance decisions
- Batch-level summaries

### 7. Agent orchestration

- Prompt routing by task type
- Model execution records
- Suggestion storage
- Confidence scoring
- Risk alerts

### 8. Analytics and observability

- Progress dashboard
- Quality metrics
- Capacity metrics
- Audit log
- Operational alerts

## Suggested technical split

### Frontend

- React + TypeScript
- One admin console with role-based views
- Separate workbench modes for annotation, QC, and acceptance

### Backend

- API layer for project, task, QC, and acceptance services
- Agent orchestration service for model invocation and trace retention
- Workflow service for state transitions and permission checks

### Storage

- Relational database for domain entities
- Object storage for media assets
- Cache for task pickup and hot queues
- Search index for question and result retrieval

## Initial domain tables

- `users`
- `roles`
- `projects`
- `project_members`
- `batches`
- `task_items`
- `task_assignments`
- `annotation_results`
- `qc_records`
- `acceptance_records`
- `sop_documents`
- `capacity_plans`
- `agent_runs`
- `agent_suggestions`
- `risk_alerts`
- `audit_logs`

## Architecture principles

- Keep task state changes explicit and auditable.
- Separate task state, QC state, and batch acceptance state.
- Treat agent outputs as suggestions by default.
- Preserve the full chain of raw input, agent output, human edits, and final result.

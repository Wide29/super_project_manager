# Agent-Powered Data Production Platform PRD

## 1. Positioning

An agent-enabled, human-in-the-loop data production platform for annotation and evaluation workflows. The platform uses each question as the minimum production unit and supports project setup, task allocation, annotation, QC, delivery, and algorithm acceptance across multiple task types.

## 2. Supported scenarios

- Algorithm questions
- Agent Judge questions
- Image annotation
- Text annotation
- Audio annotation
- Video annotation

The MVP keeps a unified `question task` abstraction and reserves type-specific extensibility for later phases.

## 3. Core roles

### Project manager

- Creates projects and batches
- Allocates capacity to operators
- Adds operators, delivery staff, QC, and algorithm roles
- Tracks progress, quality, and delivery

### Algorithm

- Defines SOP and acceptance criteria with project and operations
- Samples delivered tasks
- Decides batch acceptance

### Operations / delivery

- Co-defines SOP and delivery rules
- Coordinates delivery and exceptions
- Acts as QC in the current stage

### Operator

- Accepts assigned capacity from the platform
- Manages downstream annotators
- Oversees execution within its own pool

### Annotator

- Picks up questions in the workbench
- Submits answers
- Automatically receives the next question

### QC

- Reviews submitted questions
- Approves or rejects
- Records issue types and feedback

## 4. Core objects

- `Project`
- `Batch`
- `TaskItem`
- `AnnotationResult`
- `QCRecord`
- `AcceptanceRecord`
- `SOPDocument`
- `CapacityPlan`
- `AgentRun`
- `AgentSuggestion`
- `RiskAlert`

## 5. End-to-end workflow

1. Project manager creates a project.
2. Project manager, algorithm, and operations define SOP and acceptance criteria.
3. Project manager creates a batch and imports questions.
4. Project manager allocates capacity to operators.
5. Operators organize annotators for execution.
6. Annotators continuously receive and submit questions.
7. QC reviews results and sends failed questions back for rework.
8. Delivery aggregates passed questions into a deliverable batch.
9. Algorithm samples the batch and decides acceptance.
10. Failed questions or batches flow back into rework.

## 6. Task states

- Draft
- Pending allocation
- Pending pickup
- In progress
- Pending QC
- QC rejected
- Pending rework
- QC passed
- Pending algorithm sampling
- Accepted
- Returned by algorithm

## 7. Agent capabilities

### Project setup agent

- Drafts SOPs
- Drafts QC checklists
- Drafts acceptance criteria

### Pre-annotation agent

- Produces candidate answers or labels
- Returns confidence and rationale

### QC agent

- Flags missing fields, format issues, and high-risk answers
- Recommends pass, reject, or escalate

### Acceptance agent

- Recommends samples
- Highlights quality anomalies
- Produces batch acceptance summaries

### Operations agent

- Predicts delay risk
- Detects capacity bottlenecks
- Produces daily and weekly summaries

## 8. MVP scope

- Project and role management
- SOP and acceptance configuration
- Batch creation and question import
- Capacity allocation to operators
- Annotator workbench with auto-next
- QC pass/reject loop
- Delivery and algorithm sampling
- Basic dashboards
- Agent-assisted SOP drafts, pre-annotation, QC hints, and acceptance summaries

## 9. Out of scope for the first milestone

- Deep type-specific annotation tools
- Automated settlement
- Multi-tenant support
- Highly customizable workflow engine
- Full third-party integration layer

## 10. Success metrics

- Question throughput
- Average turnaround time
- QC pass rate
- Rework rate
- Batch acceptance rate
- Agent suggestion adoption rate
- Agent-assisted productivity improvement

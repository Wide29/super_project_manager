# Agent-Powered Data Production Platform

This repository contains the initial product foundation for an agent-powered, human-in-the-loop data production platform.

## What is in this repo

- Product vision and PRD for the MVP and Agent-enabled roadmap
- System architecture draft
- Suggested repository layout for future implementation

## Product summary

The platform treats each question as the smallest production unit and supports:

- Project creation and batch management
- Capacity allocation from project manager to operators
- Continuous task pickup for annotators
- QC and delivery workflows
- Algorithm-side sampling and acceptance
- Agent assistance across SOP drafting, pre-annotation, QC, acceptance analysis, and operations

## Repository structure

- `docs/prd/`
  Product requirements drafts
- `docs/architecture/`
  Architecture and data model drafts
- `docs/product/`
  Page inventory and functional decomposition

## Suggested next steps

1. Confirm MVP scope and role permissions.
2. Freeze the core domain model and task state machine.
3. Choose the implementation stack for backend, frontend, and AI orchestration.
4. Break the MVP into milestones and start scaffolding the application code.

## Backend MVP setup

1. Copy `.env.example` to `.env`
2. Start PostgreSQL locally
3. Run `npm install`
4. Run `npx prisma migrate dev --name init`
5. Run `npm run start:dev`
6. Open `http://localhost:3000/api`

## Python algorithm service

- Service root: `python_algorithm_service/`
- Start locally: `cd python_algorithm_service && uvicorn app.main:app --reload --port 8001`
- Test locally: `cd python_algorithm_service && python -m pytest`

## Workflow modules

- `POST /tasks/:taskId/reviews`
- `GET /tasks/:taskId/reviews`
- `POST /batches/:batchId/deliveries`
- `GET /batches/:batchId/deliveries`
- `POST /deliveries/:deliveryId/acceptances`
- `GET /batches/:batchId/acceptances`
- `POST /tasks/:taskId/settlement`
- `GET /tasks/:taskId/settlement`
- `POST /assignments/:assignmentId/transfer`

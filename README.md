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
- Start locally: `npm run algo:python:start`
- Test locally: `conda run -n algorithm_env python -m pytest python_algorithm_service/tests -q`
- Backend integration switch: set `PYTHON_ALGORITHM_SERVICE_URL` to enable Nest algorithm gateway calls to the Python service; leave it unset to keep the current in-process fallback logic
- Optional gateway hardening:
  - `PYTHON_ALGORITHM_SERVICE_TIMEOUT_MS`: per-attempt timeout in milliseconds, default `1500`
  - `PYTHON_ALGORITHM_SERVICE_RETRY_COUNT`: retry count after the first attempt, default `1`
  - `PYTHON_ALGORITHM_SERVICE_API_KEY`: optional shared secret sent to the Python service
  - `PYTHON_ALGORITHM_SERVICE_AUTH_HEADER`: auth header name, default `Authorization`; when using `Authorization`, the backend sends `Bearer <API_KEY>`
- Local authenticated integration:
  - put `PYTHON_ALGORITHM_SERVICE_URL=http://127.0.0.1:8001`
  - put the same secret into `PYTHON_ALGORITHM_SERVICE_API_KEY` and `ALGO_API_KEY`
  - run `npm run algo:python:start`
  - run `npm run start:dev`
  - run `npm run algo:e2e`

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

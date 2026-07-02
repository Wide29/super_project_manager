# Frontend MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Chinese-language Next.js frontend MVP that connects to the real NestJS backend and a backend-proxied DeepSeek AI gateway.

**Architecture:** The frontend lives in `apps/web` as a Next.js App Router project using Tailwind CSS and restrained GSAP motion. The existing NestJS backend is extended with a small set of frontend-needed endpoints and an AI proxy module so the frontend never handles DeepSeek credentials directly.

**Tech Stack:** Next.js, TypeScript, Tailwind CSS, GSAP, NestJS, Prisma, PostgreSQL, DeepSeek API

## Global Constraints

- Next.js frontend application
- TypeScript-based implementation
- Tailwind CSS styling
- GSAP for restrained motion
- Chinese UI copy
- Real backend API integration
- The frontend talks only to our NestJS backend
- It must not call DeepSeek directly
- DeepSeek API keys live only in backend environment variables
- The backend provides a unified AI gateway for frontend use
- Primary background: white
- Secondary background: very light sky-blue gray
- Primary brand color: `#62B6FF`
- Soft accent: `#DFF1FF`
- Strong accent: `#1F7AE0`
- Use GSAP only in focused places: page-load staggered reveal, sidebar expansion and collapse, card-list entrance, annotation workbench question transition, assistant panel slide-in
- The UI must be Chinese-language first
- Out of scope: Full enterprise auth
- Out of scope: Complete QC and acceptance UI
- Out of scope: Full multi-role permission enforcement in the frontend
- Out of scope: Full data visualization dashboard system
- Out of scope: Complex designer-grade annotation widgets for all task media types

---

## File Structure

### Files to create

- `apps/web/package.json`
- `apps/web/next.config.ts`
- `apps/web/tsconfig.json`
- `apps/web/postcss.config.js`
- `apps/web/tailwind.config.ts`
- `apps/web/.env.example`
- `apps/web/app/layout.tsx`
- `apps/web/app/page.tsx`
- `apps/web/app/projects/page.tsx`
- `apps/web/app/projects/[projectId]/page.tsx`
- `apps/web/app/batches/[batchId]/page.tsx`
- `apps/web/app/tasks/[taskId]/page.tsx`
- `apps/web/app/workbench/page.tsx`
- `apps/web/app/globals.css`
- `apps/web/components/layout/app-shell.tsx`
- `apps/web/components/layout/sidebar.tsx`
- `apps/web/components/layout/topbar.tsx`
- `apps/web/components/projects/project-list.tsx`
- `apps/web/components/projects/project-detail.tsx`
- `apps/web/components/batches/batch-list.tsx`
- `apps/web/components/tasks/task-list.tsx`
- `apps/web/components/assignments/assignment-panel.tsx`
- `apps/web/components/workbench/task-workbench.tsx`
- `apps/web/components/ai/assistant-drawer.tsx`
- `apps/web/components/motion/page-reveal.tsx`
- `apps/web/lib/api/client.ts`
- `apps/web/lib/api/projects.ts`
- `apps/web/lib/api/batches.ts`
- `apps/web/lib/api/tasks.ts`
- `apps/web/lib/api/assignments.ts`
- `apps/web/lib/api/dashboard.ts`
- `apps/web/lib/api/ai.ts`
- `apps/web/lib/types.ts`
- `apps/web/lib/theme.ts`
- `apps/web/tests/smoke.spec.ts`
- `src/dashboard/dashboard.module.ts`
- `src/dashboard/dashboard.controller.ts`
- `src/dashboard/dashboard.service.ts`
- `src/ai/ai.module.ts`
- `src/ai/ai.controller.ts`
- `src/ai/ai.service.ts`
- `src/ai/dto/chat-request.dto.ts`
- `src/ai/dto/task-suggestion.dto.ts`
- `src/tasks/dto/submit-task.dto.ts`
- `test/dashboard.e2e-spec.ts`
- `test/ai.e2e-spec.ts`
- `test/task-queue.e2e-spec.ts`

### Files to modify

- `package.json`
- `.env.example`
- `src/app.module.ts`
- `src/tasks/tasks.controller.ts`
- `src/tasks/tasks.service.ts`
- `README.md`

### Responsibilities

- `apps/web/app/*`: route entry points for Chinese frontend pages
- `apps/web/components/layout/*`: persistent admin shell and navigation
- `apps/web/components/*`: page-specific UI blocks
- `apps/web/components/motion/page-reveal.tsx`: GSAP wrapper for restrained animated entrance
- `apps/web/lib/api/*`: fetch wrappers for real backend APIs
- `apps/web/lib/types.ts`: shared frontend types mirroring backend payloads
- `src/dashboard/*`: overview statistics endpoint for frontend home
- `src/ai/*`: backend DeepSeek proxy endpoints
- `src/tasks/*`: next-task queue and submit-task endpoints
- `test/*.e2e-spec.ts`: backend integration tests for new endpoints

### Interface map

- `GET /projects -> ProjectSummary[]`
- `GET /projects/:id -> ProjectDetail`
- `GET /projects/:projectId/batches -> BatchSummary[]`
- `GET /batches/:id -> BatchDetail`
- `GET /batches/:batchId/tasks -> TaskSummary[]`
- `GET /tasks/:id -> TaskDetail`
- `GET /tasks/:taskId/assignments -> TaskAssignment[]`
- `GET /dashboard/overview -> DashboardOverview`
- `GET /tasks/queue/next?assigneeId=string -> TaskDetail | null`
- `POST /tasks/:id/submit` consumes `{ assigneeId: string; outputPayload: Record<string, unknown>; notes?: string }` and returns updated task payload
- `POST /ai/chat` consumes `{ message: string; context?: string }` and returns `{ answer: string }`
- `POST /ai/task-suggestion` consumes `{ taskId: string; prompt?: string }` and returns `{ suggestion: string; structured?: Record<string, unknown> }`
- Frontend API helper signatures:
  - `getProjects(): Promise<ProjectSummary[]>`
  - `getProject(projectId: string): Promise<ProjectDetail>`
  - `getProjectBatches(projectId: string): Promise<BatchSummary[]>`
  - `getBatch(batchId: string): Promise<BatchDetail>`
  - `getBatchTasks(batchId: string): Promise<TaskSummary[]>`
  - `getTask(taskId: string): Promise<TaskDetail>`
  - `getTaskAssignments(taskId: string): Promise<TaskAssignment[]>`
  - `getDashboardOverview(): Promise<DashboardOverview>`
  - `getNextTask(assigneeId: string): Promise<TaskDetail | null>`
  - `submitTask(taskId: string, body: SubmitTaskRequest): Promise<TaskDetail>`
  - `askAssistant(body: ChatRequest): Promise<ChatResponse>`
  - `getTaskSuggestion(body: TaskSuggestionRequest): Promise<TaskSuggestionResponse>`

## Task 1: Scaffold the Next.js frontend application

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/next.config.ts`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/postcss.config.js`
- Create: `apps/web/tailwind.config.ts`
- Create: `apps/web/.env.example`
- Create: `apps/web/app/layout.tsx`
- Create: `apps/web/app/page.tsx`
- Create: `apps/web/app/globals.css`
- Test: `apps/web/package.json`

**Interfaces:**
- Consumes: none
- Produces:
  - `apps/web` runnable Next.js app
  - `NEXT_PUBLIC_API_BASE_URL` env contract

- [ ] **Step 1: Write the failing startup expectation**

```ts
// Expected behavior:
// `npm run dev --workspace web` starts a Next.js app on port 3001 with Chinese root page content.
```

- [ ] **Step 2: Verify the frontend app does not exist yet**

Run: `test -d apps/web && echo exists || echo missing`
Expected: `missing`

- [ ] **Step 3: Create the workspace frontend package**

```json
// apps/web/package.json
{
  "name": "web",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --port 3001",
    "build": "next build",
    "start": "next start --port 3001",
    "lint": "next lint"
  },
  "dependencies": {
    "gsap": "^3.12.7",
    "next": "^15.0.4",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/node": "^22.10.2",
    "@types/react": "^19.0.2",
    "@types/react-dom": "^19.0.2",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.7.2"
  }
}
```

```ts
// apps/web/next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {};

export default nextConfig;
```

```json
// apps/web/tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "es2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

```js
// apps/web/postcss.config.js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
};
```

```ts
// apps/web/tailwind.config.ts
import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        skyBrand: '#62B6FF',
        skySoft: '#DFF1FF',
        skyStrong: '#1F7AE0',
        slateDeep: '#1F2A44',
        panelLine: '#D7E7F5',
        cloud: '#F6FBFF'
      },
      boxShadow: {
        panel: '0 14px 38px rgba(32, 82, 140, 0.08)'
      },
      borderRadius: {
        panel: '18px'
      }
    }
  },
  plugins: []
} satisfies Config;
```

```env
// apps/web/.env.example
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
```

- [ ] **Step 4: Create the root layout and root page**

```tsx
// apps/web/app/layout.tsx
import './globals.css';
import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: '超级项目管理台',
  description: '数据生产平台前端管理台'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
```

```tsx
// apps/web/app/page.tsx
export default function HomePage() {
  return (
    <main className="min-h-screen bg-cloud px-8 py-10 text-slateDeep">
      <section className="mx-auto max-w-6xl rounded-panel border border-panelLine bg-white p-10 shadow-panel">
        <p className="text-sm text-skyStrong">总览</p>
        <h1 className="mt-3 text-4xl font-semibold">超级项目管理台</h1>
        <p className="mt-4 text-base text-slate-600">
          这是第一版中文管理台入口，后续将接入项目、批次、题目、分配、标注工作台与智能助手。
        </p>
      </section>
    </main>
  );
}
```

```css
/* apps/web/app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

html,
body {
  margin: 0;
  padding: 0;
  background: #f6fbff;
  color: #1f2a44;
  font-family: 'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', sans-serif;
}

* {
  box-sizing: border-box;
}
```

- [ ] **Step 5: Add the frontend workspace to the root package**

```json
// package.json
{
  "workspaces": ["apps/web"]
}
```

- [ ] **Step 6: Install frontend dependencies**

Run: `npm install`
Expected: workspace installs Next.js, Tailwind, and GSAP packages

- [ ] **Step 7: Verify the frontend builds**

Run: `npm run build --workspace web`
Expected: Next.js build completes successfully

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json apps/web
git commit -m "feat: scaffold nextjs frontend workspace"
```

## Task 2: Build the Chinese admin shell and theme foundation

**Files:**
- Create: `apps/web/components/layout/app-shell.tsx`
- Create: `apps/web/components/layout/sidebar.tsx`
- Create: `apps/web/components/layout/topbar.tsx`
- Create: `apps/web/components/motion/page-reveal.tsx`
- Create: `apps/web/lib/theme.ts`
- Modify: `apps/web/app/layout.tsx`
- Modify: `apps/web/app/page.tsx`
- Test: `apps/web/app/page.tsx`

**Interfaces:**
- Consumes:
  - `RootLayout`
- Produces:
  - `AppShell(props: { children: React.ReactNode; title: string; description?: string; rightSlot?: React.ReactNode }): JSX.Element`
  - `Sidebar(): JSX.Element`
  - `Topbar(props: { title: string; description?: string }): JSX.Element`
  - `PageReveal(props: { children: React.ReactNode }): JSX.Element`

- [ ] **Step 1: Write the failing shell expectation**

```tsx
// Expected behavior:
// every app page can render inside a shared shell with Chinese navigation labels and a restrained GSAP reveal wrapper.
```

- [ ] **Step 2: Verify there is no reusable shell yet**

Run: `find apps/web/components -maxdepth 3 -type f`
Expected: no layout component files exist yet

- [ ] **Step 3: Create the shared theme token file**

```ts
// apps/web/lib/theme.ts
export const theme = {
  colors: {
    brand: '#62B6FF',
    soft: '#DFF1FF',
    strong: '#1F7AE0',
    deep: '#1F2A44',
    cloud: '#F6FBFF',
    line: '#D7E7F5'
  },
  navItems: [
    { href: '/', label: '总览' },
    { href: '/projects', label: '项目管理' },
    { href: '/workbench', label: '标注工作台' },
    { href: '/assistant', label: '智能助手' }
  ]
} as const;
```

- [ ] **Step 4: Create the shell, sidebar, and topbar components**

```tsx
// apps/web/components/layout/sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { theme } from '../../lib/theme';

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-panelLine bg-white/90 p-6">
      <div className="mb-10">
        <div className="inline-flex items-center rounded-full bg-skySoft px-3 py-1 text-xs font-medium text-skyStrong">
          数据生产平台
        </div>
        <h2 className="mt-4 text-2xl font-semibold text-slateDeep">超级项目管理台</h2>
      </div>

      <nav className="space-y-2">
        {theme.navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-2xl px-4 py-3 text-sm transition ${
                active
                  ? 'bg-skyStrong text-white shadow-panel'
                  : 'text-slate-600 hover:bg-skySoft hover:text-slateDeep'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
```

```tsx
// apps/web/components/layout/topbar.tsx
export function Topbar({
  title,
  description
}: {
  title: string;
  description?: string;
}) {
  return (
    <header className="mb-8 flex items-start justify-between gap-4">
      <div>
        <p className="text-sm text-skyStrong">中文管理台</p>
        <h1 className="mt-2 text-3xl font-semibold text-slateDeep">{title}</h1>
        {description ? <p className="mt-2 text-sm text-slate-500">{description}</p> : null}
      </div>
      <div className="rounded-2xl border border-panelLine bg-white px-4 py-3 text-sm text-slate-500 shadow-panel">
        实时连接后端 API
      </div>
    </header>
  );
}
```

```tsx
// apps/web/components/motion/page-reveal.tsx
'use client';

import gsap from 'gsap';
import { useEffect, useRef } from 'react';

export function PageReveal({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    gsap.fromTo(
      ref.current,
      { opacity: 0, y: 18 },
      { opacity: 1, y: 0, duration: 0.55, ease: 'power2.out' }
    );
  }, []);

  return <div ref={ref}>{children}</div>;
}
```

```tsx
// apps/web/components/layout/app-shell.tsx
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import { PageReveal } from '../motion/page-reveal';

export function AppShell({
  children,
  title,
  description,
  rightSlot
}: {
  children: React.ReactNode;
  title: string;
  description?: string;
  rightSlot?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-cloud text-slateDeep">
      <Sidebar />
      <main className="flex-1 px-8 py-8">
        <PageReveal>
          <Topbar title={title} description={description} />
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <section>{children}</section>
            {rightSlot ? <aside>{rightSlot}</aside> : null}
          </div>
        </PageReveal>
      </main>
    </div>
  );
}
```

- [ ] **Step 5: Apply the shell to the root page**

```tsx
// apps/web/app/page.tsx
import { AppShell } from '../components/layout/app-shell';

export default function HomePage() {
  return (
    <AppShell title="总览" description="查看项目进度、快速进入管理与标注流程。">
      <div className="grid gap-6 md:grid-cols-3">
        {[
          ['项目总数', '4'],
          ['进行中批次', '12'],
          ['待领取任务', '128']
        ].map(([label, value]) => (
          <article key={label} className="rounded-panel border border-panelLine bg-white p-6 shadow-panel">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-3 text-3xl font-semibold text-slateDeep">{value}</p>
          </article>
        ))}
      </div>
    </AppShell>
  );
}
```

- [ ] **Step 6: Verify the frontend build still passes**

Run: `npm run build --workspace web`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add apps/web/app apps/web/components apps/web/lib/theme.ts
git commit -m "feat: add chinese admin shell and motion foundation"
```

## Task 3: Add frontend API client and connect project management pages

**Files:**
- Create: `apps/web/lib/types.ts`
- Create: `apps/web/lib/api/client.ts`
- Create: `apps/web/lib/api/projects.ts`
- Create: `apps/web/lib/api/batches.ts`
- Create: `apps/web/components/projects/project-list.tsx`
- Create: `apps/web/components/projects/project-detail.tsx`
- Create: `apps/web/app/projects/page.tsx`
- Create: `apps/web/app/projects/[projectId]/page.tsx`
- Test: `apps/web/app/projects/page.tsx`

**Interfaces:**
- Consumes:
  - `AppShell`
- Produces:
  - `apiFetch<T>(path: string, init?: RequestInit): Promise<T>`
  - `getProjects(): Promise<ProjectSummary[]>`
  - `getProject(projectId: string): Promise<ProjectDetail>`
  - `getProjectBatches(projectId: string): Promise<BatchSummary[]>`

- [ ] **Step 1: Write the failing integration expectation**

```ts
// Expected behavior:
// the projects list page loads data from GET /projects and the project detail page combines GET /projects/:id and GET /projects/:projectId/batches.
```

- [ ] **Step 2: Create shared frontend types**

```ts
// apps/web/lib/types.ts
export interface ProjectSummary {
  id: string;
  name: string;
  description?: string | null;
  status: 'draft' | 'active' | 'archived';
  taskType: string;
  createdAt: string;
}

export interface ProjectDetail extends ProjectSummary {
  sopDocument?: string | null;
  acceptanceCriteria?: string | null;
  updatedAt: string;
}

export interface BatchSummary {
  id: string;
  projectId: string;
  name: string;
  status: 'draft' | 'in_progress' | 'ready_for_delivery' | 'closed';
  plannedTaskCount?: number | null;
  createdAt: string;
}
```

- [ ] **Step 3: Create the generic API client and project/batch fetchers**

```ts
// apps/web/lib/api/client.ts
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {})
    },
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}
```

```ts
// apps/web/lib/api/projects.ts
import { apiFetch } from './client';
import type { ProjectDetail, ProjectSummary } from '../types';

export function getProjects() {
  return apiFetch<ProjectSummary[]>('/projects');
}

export function getProject(projectId: string) {
  return apiFetch<ProjectDetail>(`/projects/${projectId}`);
}
```

```ts
// apps/web/lib/api/batches.ts
import { apiFetch } from './client';
import type { BatchSummary } from '../types';

export function getProjectBatches(projectId: string) {
  return apiFetch<BatchSummary[]>(`/projects/${projectId}/batches`);
}
```

- [ ] **Step 4: Create project list and detail UI blocks**

```tsx
// apps/web/components/projects/project-list.tsx
import Link from 'next/link';
import type { ProjectSummary } from '../../lib/types';

export function ProjectList({ projects }: { projects: ProjectSummary[] }) {
  return (
    <div className="space-y-4">
      {projects.map((project) => (
        <Link
          key={project.id}
          href={`/projects/${project.id}`}
          className="block rounded-panel border border-panelLine bg-white p-6 shadow-panel transition hover:-translate-y-0.5"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold text-slateDeep">{project.name}</h3>
              <p className="mt-2 text-sm text-slate-500">{project.description || '暂无项目描述'}</p>
            </div>
            <span className="rounded-full bg-skySoft px-3 py-1 text-xs text-skyStrong">
              {project.status}
            </span>
          </div>
          <div className="mt-4 text-sm text-slate-500">题型：{project.taskType}</div>
        </Link>
      ))}
    </div>
  );
}
```

```tsx
// apps/web/components/projects/project-detail.tsx
import type { BatchSummary, ProjectDetail } from '../../lib/types';

export function ProjectDetailView({
  project,
  batches
}: {
  project: ProjectDetail;
  batches: BatchSummary[];
}) {
  return (
    <div className="space-y-6">
      <section className="rounded-panel border border-panelLine bg-white p-6 shadow-panel">
        <h2 className="text-2xl font-semibold">{project.name}</h2>
        <p className="mt-2 text-sm text-slate-500">{project.description || '暂无项目说明'}</p>
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <span className="rounded-full bg-skySoft px-3 py-1 text-skyStrong">状态：{project.status}</span>
          <span className="rounded-full bg-skySoft px-3 py-1 text-skyStrong">题型：{project.taskType}</span>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-panel border border-panelLine bg-white p-6 shadow-panel">
          <h3 className="text-lg font-semibold">SOP 摘要</h3>
          <p className="mt-3 text-sm text-slate-500">{project.sopDocument || '暂无 SOP 内容'}</p>
        </article>
        <article className="rounded-panel border border-panelLine bg-white p-6 shadow-panel">
          <h3 className="text-lg font-semibold">验收标准</h3>
          <p className="mt-3 text-sm text-slate-500">
            {project.acceptanceCriteria || '暂无验收标准说明'}
          </p>
        </article>
      </section>

      <section className="rounded-panel border border-panelLine bg-white p-6 shadow-panel">
        <h3 className="text-lg font-semibold">批次概览</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {batches.map((batch) => (
            <div key={batch.id} className="rounded-2xl border border-panelLine bg-cloud p-4">
              <p className="font-medium">{batch.name}</p>
              <p className="mt-2 text-sm text-slate-500">状态：{batch.status}</p>
              <p className="mt-1 text-sm text-slate-500">
                计划题量：{batch.plannedTaskCount ?? '未设置'}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 5: Create the project routes**

```tsx
// apps/web/app/projects/page.tsx
import { AppShell } from '../../components/layout/app-shell';
import { ProjectList } from '../../components/projects/project-list';
import { getProjects } from '../../lib/api/projects';

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <AppShell title="项目管理" description="查看项目进度、状态和题型分布。">
      <ProjectList projects={projects} />
    </AppShell>
  );
}
```

```tsx
// apps/web/app/projects/[projectId]/page.tsx
import { AppShell } from '../../../components/layout/app-shell';
import { ProjectDetailView } from '../../../components/projects/project-detail';
import { getProjectBatches } from '../../../lib/api/batches';
import { getProject } from '../../../lib/api/projects';

export default async function ProjectDetailPage({
  params
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const [project, batches] = await Promise.all([
    getProject(projectId),
    getProjectBatches(projectId)
  ]);

  return (
    <AppShell title="项目详情" description="查看项目信息、SOP、验收标准与批次状态。">
      <ProjectDetailView project={project} batches={batches} />
    </AppShell>
  );
}
```

- [ ] **Step 6: Verify the frontend build still passes**

Run: `npm run build --workspace web`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add apps/web/app/projects apps/web/components/projects apps/web/lib
git commit -m "feat: connect project management pages to backend apis"
```

## Task 4: Extend the backend for dashboard, queue, submit, and AI proxy

**Files:**
- Modify: `.env.example`
- Modify: `src/app.module.ts`
- Create: `src/dashboard/dashboard.module.ts`
- Create: `src/dashboard/dashboard.controller.ts`
- Create: `src/dashboard/dashboard.service.ts`
- Create: `src/ai/ai.module.ts`
- Create: `src/ai/ai.controller.ts`
- Create: `src/ai/ai.service.ts`
- Create: `src/ai/dto/chat-request.dto.ts`
- Create: `src/ai/dto/task-suggestion.dto.ts`
- Create: `src/tasks/dto/submit-task.dto.ts`
- Modify: `src/tasks/tasks.controller.ts`
- Modify: `src/tasks/tasks.service.ts`
- Modify: `package.json`
- Test: `test/dashboard.e2e-spec.ts`
- Test: `test/task-queue.e2e-spec.ts`
- Test: `test/ai.e2e-spec.ts`

**Interfaces:**
- Consumes:
  - `PrismaService`
  - existing task/project/batch tables
- Produces:
  - `GET /dashboard/overview`
  - `GET /tasks/queue/next?assigneeId=string`
  - `POST /tasks/:id/submit`
  - `POST /ai/chat`
  - `POST /ai/task-suggestion`

- [ ] **Step 1: Write failing backend e2e tests for new endpoints**

```ts
// test/dashboard.e2e-spec.ts
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Dashboard API', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns overview totals', async () => {
    const response = await request(app.getHttpServer()).get('/dashboard/overview').expect(200);
    expect(response.body).toHaveProperty('projectCount');
    expect(response.body).toHaveProperty('batchCount');
    expect(response.body).toHaveProperty('taskCount');
  });
});
```

```ts
// test/task-queue.e2e-spec.ts
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Task queue API', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns next task for an assignee and supports submit', async () => {
    const project = await request(app.getHttpServer()).post('/projects').send({
      name: 'Work queue project',
      taskType: 'text'
    });

    const batch = await request(app.getHttpServer())
      .post(`/projects/${project.body.id}/batches`)
      .send({ name: 'Queue Batch' });

    const task = await request(app.getHttpServer())
      .post(`/batches/${batch.body.id}/tasks`)
      .send({ title: 'Queue task', inputPayload: { question: 'Q1' } });

    await request(app.getHttpServer())
      .post(`/tasks/${task.body.id}/assignments`)
      .send({ assigneeId: 'annotator-queue' });

    const nextTask = await request(app.getHttpServer())
      .get('/tasks/queue/next')
      .query({ assigneeId: 'annotator-queue' })
      .expect(200);

    expect(nextTask.body.id).toBe(task.body.id);

    const submitted = await request(app.getHttpServer())
      .post(`/tasks/${task.body.id}/submit`)
      .send({
        assigneeId: 'annotator-queue',
        outputPayload: { answer: '已提交' }
      })
      .expect(200);

    expect(submitted.body.status).toBe('submitted');
  });
});
```

```ts
// test/ai.e2e-spec.ts
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('AI API', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('validates assistant chat payload', async () => {
    await request(app.getHttpServer())
      .post('/ai/chat')
      .send({})
      .expect(400);
  });
});
```

- [ ] **Step 2: Add backend env and dependency support for DeepSeek proxy**

```json
// package.json
{
  "dependencies": {
    "openai": "^4.104.0"
  }
}
```

```env
// .env.example
DEEPSEEK_API_KEY=your_deepseek_api_key
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
```

- [ ] **Step 3: Implement dashboard and task queue/submit backend logic**

```ts
// src/dashboard/dashboard.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async overview() {
    const [projectCount, batchCount, taskCount, assignmentCount] = await Promise.all([
      this.prisma.project.count(),
      this.prisma.batch.count(),
      this.prisma.taskItem.count(),
      this.prisma.taskAssignment.count()
    ]);

    return { projectCount, batchCount, taskCount, assignmentCount };
  }
}
```

```ts
// src/dashboard/dashboard.controller.ts
import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';

@ApiTags('dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  overview() {
    return this.dashboardService.overview();
  }
}
```

```ts
// src/dashboard/dashboard.module.ts
import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  controllers: [DashboardController],
  providers: [DashboardService]
})
export class DashboardModule {}
```

```ts
// src/tasks/dto/submit-task.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString } from 'class-validator';

export class SubmitTaskDto {
  @ApiProperty()
  @IsString()
  assigneeId!: string;

  @ApiProperty({ type: Object })
  @IsObject()
  outputPayload!: Record<string, unknown>;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
```

```ts
// src/tasks/tasks.service.ts additions
async getNextForAssignee(assigneeId: string) {
  const assignment = await this.prisma.taskAssignment.findFirst({
    where: { assigneeId, status: { in: ['assigned', 'accepted'] } },
    orderBy: { assignedAt: 'asc' },
    include: { taskItem: true }
  });

  return assignment?.taskItem ?? null;
}

async submit(id: string, assigneeId: string, outputPayload: Record<string, unknown>, notes?: string) {
  await this.findOne(id);

  await this.prisma.taskAssignment.updateMany({
    where: { taskItemId: id, assigneeId },
    data: {
      status: 'completed',
      completedAt: new Date(),
      notes
    }
  });

  return this.prisma.taskItem.update({
    where: { id },
    data: {
      status: 'submitted',
      inputPayload: outputPayload as Prisma.InputJsonValue
    }
  });
}
```

```ts
// src/tasks/tasks.controller.ts additions
@Get('tasks/queue/next')
getNext(@Query('assigneeId') assigneeId: string) {
  return this.tasksService.getNextForAssignee(assigneeId);
}

@Post('tasks/:id/submit')
submit(@Param('id') id: string, @Body() dto: SubmitTaskDto) {
  return this.tasksService.submit(id, dto.assigneeId, dto.outputPayload, dto.notes);
}
```

- [ ] **Step 4: Implement the AI proxy module**

```ts
// src/ai/dto/chat-request.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ChatRequestDto {
  @ApiProperty()
  @IsString()
  message!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  context?: string;
}
```

```ts
// src/ai/dto/task-suggestion.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class TaskSuggestionDto {
  @ApiProperty()
  @IsString()
  taskId!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  prompt?: string;
}
```

```ts
// src/ai/ai.service.ts
import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AiService {
  private readonly client = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: process.env.DEEPSEEK_BASE_URL
  });

  constructor(private readonly prisma: PrismaService) {}

  async chat(message: string, context?: string) {
    const response = await this.client.chat.completions.create({
      model: process.env.DEEPSEEK_MODEL ?? 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: '你是数据生产平台中的中文智能助手，请直接、专业、简洁地回答。'
        },
        {
          role: 'user',
          content: context ? `上下文：${context}\n\n问题：${message}` : message
        }
      ]
    });

    return { answer: response.choices[0]?.message?.content ?? '' };
  }

  async taskSuggestion(taskId: string, prompt?: string) {
    const task = await this.prisma.taskItem.findUnique({ where: { id: taskId } });
    const response = await this.client.chat.completions.create({
      model: process.env.DEEPSEEK_MODEL ?? 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: '你是标注任务建议助手，请输出中文建议。'
        },
        {
          role: 'user',
          content: `${prompt ?? '请基于题目内容生成作答建议。'}\n\n题目：${JSON.stringify(task)}`
        }
      ]
    });

    return { suggestion: response.choices[0]?.message?.content ?? '' };
  }
}
```

```ts
// src/ai/ai.controller.ts
import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { ChatRequestDto } from './dto/chat-request.dto';
import { TaskSuggestionDto } from './dto/task-suggestion.dto';

@ApiTags('ai')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  chat(@Body() dto: ChatRequestDto) {
    return this.aiService.chat(dto.message, dto.context);
  }

  @Post('task-suggestion')
  taskSuggestion(@Body() dto: TaskSuggestionDto) {
    return this.aiService.taskSuggestion(dto.taskId, dto.prompt);
  }
}
```

```ts
// src/ai/ai.module.ts
import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';

@Module({
  controllers: [AiController],
  providers: [AiService]
})
export class AiModule {}
```

- [ ] **Step 5: Register the new backend modules**

```ts
// src/app.module.ts
import { AiModule } from './ai/ai.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    PrismaModule,
    ProjectsModule,
    BatchesModule,
    TasksModule,
    AssignmentsModule,
    DashboardModule,
    AiModule
  ]
})
export class AppModule {}
```

- [ ] **Step 6: Install the new backend dependency and run targeted tests**

Run: `npm install`
Expected: `openai` dependency installed and lockfile updated

Run: `npm run test:e2e -- test/dashboard.e2e-spec.ts`
Expected: PASS

Run: `npm run test:e2e -- test/task-queue.e2e-spec.ts`
Expected: PASS

Run: `npm run test:e2e -- test/ai.e2e-spec.ts`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json .env.example src/app.module.ts src/dashboard src/ai src/tasks test/dashboard.e2e-spec.ts test/task-queue.e2e-spec.ts test/ai.e2e-spec.ts
git commit -m "feat: add frontend support and deepseek ai gateway"
```

## Task 5: Build batch, task, and assignment management pages

**Files:**
- Create: `apps/web/lib/api/tasks.ts`
- Create: `apps/web/lib/api/assignments.ts`
- Create: `apps/web/components/batches/batch-list.tsx`
- Create: `apps/web/components/tasks/task-list.tsx`
- Create: `apps/web/components/assignments/assignment-panel.tsx`
- Create: `apps/web/app/batches/[batchId]/page.tsx`
- Create: `apps/web/app/tasks/[taskId]/page.tsx`
- Test: `apps/web/app/batches/[batchId]/page.tsx`

**Interfaces:**
- Consumes:
  - `getBatch(batchId: string): Promise<BatchDetail>`
  - `getBatchTasks(batchId: string): Promise<TaskSummary[]>`
  - `getTask(taskId: string): Promise<TaskDetail>`
  - `getTaskAssignments(taskId: string): Promise<TaskAssignment[]>`
- Produces:
  - batch detail page
  - task detail page
  - assignment management panel

- [ ] **Step 1: Write the failing page expectation**

```ts
// Expected behavior:
// a batch page shows task rows from the backend and a task page shows assignment rows from the backend.
```

- [ ] **Step 2: Extend frontend types and API helpers**

```ts
// apps/web/lib/types.ts additions
export interface BatchDetail extends BatchSummary {
  updatedAt: string;
}

export interface TaskSummary {
  id: string;
  batchId: string;
  externalRef?: string | null;
  title: string;
  inputPayload: Record<string, unknown>;
  status: 'pending_allocation' | 'pending_pickup' | 'in_progress' | 'submitted' | 'returned';
  priority: number;
  createdAt: string;
}

export interface TaskDetail extends TaskSummary {
  updatedAt: string;
}

export interface TaskAssignment {
  id: string;
  taskItemId: string;
  operatorId?: string | null;
  assigneeId: string;
  status: 'assigned' | 'accepted' | 'completed' | 'rejected';
  assignedAt: string;
  completedAt?: string | null;
  notes?: string | null;
}
```

```ts
// apps/web/lib/api/tasks.ts
import { apiFetch } from './client';
import type { TaskDetail, TaskSummary } from '../types';

export function getBatchTasks(batchId: string) {
  return apiFetch<TaskSummary[]>(`/batches/${batchId}/tasks`);
}

export function getTask(taskId: string) {
  return apiFetch<TaskDetail>(`/tasks/${taskId}`);
}
```

```ts
// apps/web/lib/api/assignments.ts
import { apiFetch } from './client';
import type { TaskAssignment } from '../types';

export function getTaskAssignments(taskId: string) {
  return apiFetch<TaskAssignment[]>(`/tasks/${taskId}/assignments`);
}
```

- [ ] **Step 3: Create batch and task management UI**

```tsx
// apps/web/components/tasks/task-list.tsx
import Link from 'next/link';
import type { TaskSummary } from '../../lib/types';

export function TaskList({ tasks }: { tasks: TaskSummary[] }) {
  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <Link
          key={task.id}
          href={`/tasks/${task.id}`}
          className="grid rounded-panel border border-panelLine bg-white p-4 shadow-panel md:grid-cols-[1.3fr_0.9fr_0.6fr]"
        >
          <div>
            <h3 className="font-medium">{task.title}</h3>
            <p className="mt-2 text-sm text-slate-500">外部引用：{task.externalRef || '无'}</p>
          </div>
          <div className="text-sm text-slate-500">状态：{task.status}</div>
          <div className="text-sm text-slate-500">优先级：{task.priority}</div>
        </Link>
      ))}
    </div>
  );
}
```

```tsx
// apps/web/components/assignments/assignment-panel.tsx
import type { TaskAssignment } from '../../lib/types';

export function AssignmentPanel({ assignments }: { assignments: TaskAssignment[] }) {
  return (
    <div className="rounded-panel border border-panelLine bg-white p-6 shadow-panel">
      <h3 className="text-lg font-semibold">分配记录</h3>
      <div className="mt-4 space-y-3">
        {assignments.map((assignment) => (
          <div key={assignment.id} className="rounded-2xl border border-panelLine bg-cloud p-4">
            <p className="font-medium">标注员：{assignment.assigneeId}</p>
            <p className="mt-1 text-sm text-slate-500">
              运营商：{assignment.operatorId || '未设置'}
            </p>
            <p className="mt-1 text-sm text-slate-500">状态：{assignment.status}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

```tsx
// apps/web/components/batches/batch-list.tsx
import type { BatchDetail, TaskSummary } from '../../lib/types';
import { TaskList } from '../tasks/task-list';

export function BatchDetailView({ batch, tasks }: { batch: BatchDetail; tasks: TaskSummary[] }) {
  return (
    <div className="space-y-6">
      <section className="rounded-panel border border-panelLine bg-white p-6 shadow-panel">
        <h2 className="text-2xl font-semibold">{batch.name}</h2>
        <p className="mt-2 text-sm text-slate-500">状态：{batch.status}</p>
        <p className="mt-2 text-sm text-slate-500">计划题量：{batch.plannedTaskCount ?? '未设置'}</p>
      </section>
      <TaskList tasks={tasks} />
    </div>
  );
}
```

- [ ] **Step 4: Create the batch and task pages**

```tsx
// apps/web/app/batches/[batchId]/page.tsx
import { AppShell } from '../../../components/layout/app-shell';
import { BatchDetailView } from '../../../components/batches/batch-list';
import { getBatch, getProjectBatches } from '../../../lib/api/batches';
import { getBatchTasks } from '../../../lib/api/tasks';

export default async function BatchPage({
  params
}: {
  params: Promise<{ batchId: string }>;
}) {
  const { batchId } = await params;
  const [batch, tasks] = await Promise.all([getBatch(batchId), getBatchTasks(batchId)]);

  return (
    <AppShell title="批次详情" description="查看批次下的题目与执行状态。">
      <BatchDetailView batch={batch} tasks={tasks} />
    </AppShell>
  );
}
```

```tsx
// apps/web/app/tasks/[taskId]/page.tsx
import { AppShell } from '../../../components/layout/app-shell';
import { AssignmentPanel } from '../../../components/assignments/assignment-panel';
import { getTaskAssignments } from '../../../lib/api/assignments';
import { getTask } from '../../../lib/api/tasks';

export default async function TaskPage({
  params
}: {
  params: Promise<{ taskId: string }>;
}) {
  const { taskId } = await params;
  const [task, assignments] = await Promise.all([getTask(taskId), getTaskAssignments(taskId)]);

  return (
    <AppShell
      title="题目详情"
      description="查看题目内容、当前状态与分配情况。"
      rightSlot={<AssignmentPanel assignments={assignments} />}
    >
      <div className="rounded-panel border border-panelLine bg-white p-6 shadow-panel">
        <h2 className="text-2xl font-semibold">{task.title}</h2>
        <p className="mt-4 text-sm text-slate-500">状态：{task.status}</p>
        <pre className="mt-4 overflow-x-auto rounded-2xl bg-cloud p-4 text-sm text-slate-600">
          {JSON.stringify(task.inputPayload, null, 2)}
        </pre>
      </div>
    </AppShell>
  );
}
```

- [ ] **Step 5: Verify the frontend build still passes**

Run: `npm run build --workspace web`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/web/app/batches apps/web/app/tasks apps/web/components/batches apps/web/components/tasks apps/web/components/assignments apps/web/lib/api
git commit -m "feat: add batch task and assignment pages"
```

## Task 6: Build the annotation workbench and AI assistant panel

**Files:**
- Create: `apps/web/lib/api/dashboard.ts`
- Create: `apps/web/lib/api/ai.ts`
- Create: `apps/web/components/workbench/task-workbench.tsx`
- Create: `apps/web/components/ai/assistant-drawer.tsx`
- Create: `apps/web/app/workbench/page.tsx`
- Modify: `apps/web/app/page.tsx`
- Test: `apps/web/app/workbench/page.tsx`

**Interfaces:**
- Consumes:
  - `getDashboardOverview(): Promise<DashboardOverview>`
  - `getNextTask(assigneeId: string): Promise<TaskDetail | null>`
  - `submitTask(taskId: string, body: SubmitTaskRequest): Promise<TaskDetail>`
  - `askAssistant(body: ChatRequest): Promise<ChatResponse>`
- Produces:
  - overview page with backend data
  - workbench page with next-task fetch and submit behavior
  - assistant drawer UI

- [ ] **Step 1: Write the failing workbench expectation**

```ts
// Expected behavior:
// the workbench page loads the next task from the backend and the assistant drawer can send Chinese prompts through /ai/chat.
```

- [ ] **Step 2: Add dashboard and AI API helpers**

```ts
// apps/web/lib/api/dashboard.ts
import { apiFetch } from './client';

export interface DashboardOverview {
  projectCount: number;
  batchCount: number;
  taskCount: number;
  assignmentCount: number;
}

export function getDashboardOverview() {
  return apiFetch<DashboardOverview>('/dashboard/overview');
}
```

```ts
// apps/web/lib/api/ai.ts
import { apiFetch } from './client';
import type { TaskDetail } from '../types';

export interface ChatRequest {
  message: string;
  context?: string;
}

export interface ChatResponse {
  answer: string;
}

export interface SubmitTaskRequest {
  assigneeId: string;
  outputPayload: Record<string, unknown>;
  notes?: string;
}

export interface TaskSuggestionRequest {
  taskId: string;
  prompt?: string;
}

export interface TaskSuggestionResponse {
  suggestion: string;
  structured?: Record<string, unknown>;
}

export function askAssistant(body: ChatRequest) {
  return apiFetch<ChatResponse>('/ai/chat', {
    method: 'POST',
    body: JSON.stringify(body)
  });
}

export function getTaskSuggestion(body: TaskSuggestionRequest) {
  return apiFetch<TaskSuggestionResponse>('/ai/task-suggestion', {
    method: 'POST',
    body: JSON.stringify(body)
  });
}

export function getNextTask(assigneeId: string) {
  return apiFetch<TaskDetail | null>(`/tasks/queue/next?assigneeId=${encodeURIComponent(assigneeId)}`);
}

export function submitTask(taskId: string, body: SubmitTaskRequest) {
  return apiFetch<TaskDetail>(`/tasks/${taskId}/submit`, {
    method: 'POST',
    body: JSON.stringify(body)
  });
}
```

- [ ] **Step 3: Build the assistant drawer and workbench components**

```tsx
// apps/web/components/ai/assistant-drawer.tsx
'use client';

import { useState } from 'react';
import { askAssistant } from '../../lib/api/ai';

export function AssistantDrawer() {
  const [message, setMessage] = useState('');
  const [answer, setAnswer] = useState('欢迎使用智能助手。');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    try {
      const response = await askAssistant({ message });
      setAnswer(response.answer);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-panel border border-panelLine bg-white p-6 shadow-panel">
      <h3 className="text-lg font-semibold">智能助手</h3>
      <form className="mt-4 space-y-3" onSubmit={onSubmit}>
        <textarea
          className="min-h-28 w-full rounded-2xl border border-panelLine p-3 text-sm outline-none"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="请输入你的问题，例如：当前项目应该如何拆批次？"
        />
        <button
          type="submit"
          className="rounded-full bg-skyStrong px-4 py-2 text-sm text-white"
          disabled={loading}
        >
          {loading ? '正在生成...' : '发送问题'}
        </button>
      </form>
      <div className="mt-4 rounded-2xl bg-cloud p-4 text-sm text-slate-600">{answer}</div>
    </div>
  );
}
```

```tsx
// apps/web/components/workbench/task-workbench.tsx
'use client';

import { useMemo, useState } from 'react';
import type { TaskDetail } from '../../lib/types';
import { submitTask } from '../../lib/api/ai';

export function TaskWorkbench({
  initialTask,
  assigneeId
}: {
  initialTask: TaskDetail | null;
  assigneeId: string;
}) {
  const [task, setTask] = useState<TaskDetail | null>(initialTask);
  const [answer, setAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const payloadText = useMemo(
    () => (task ? JSON.stringify(task.inputPayload, null, 2) : '暂无可领取题目'),
    [task]
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!task) return;

    await submitTask(task.id, {
      assigneeId,
      outputPayload: { answer }
    });

    setSubmitted(true);
    setTask(null);
    setAnswer('');
  }

  return (
    <div className="rounded-panel border border-panelLine bg-white p-6 shadow-panel">
      <h2 className="text-2xl font-semibold">标注工作台</h2>
      {submitted ? (
        <p className="mt-4 text-sm text-skyStrong">题目已提交，当前示例版本将等待下一次刷新后领取下一题。</p>
      ) : null}
      <p className="mt-4 text-lg font-medium">{task?.title || '当前没有待领取题目'}</p>
      <pre className="mt-4 overflow-x-auto rounded-2xl bg-cloud p-4 text-sm text-slate-600">
        {payloadText}
      </pre>
      <form className="mt-4 space-y-3" onSubmit={onSubmit}>
        <textarea
          className="min-h-32 w-full rounded-2xl border border-panelLine p-3 text-sm outline-none"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="请输入你的作答内容"
        />
        <button type="submit" className="rounded-full bg-skyStrong px-4 py-2 text-sm text-white" disabled={!task}>
          提交并进入下一题
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 4: Create the workbench and overview pages**

```tsx
// apps/web/app/workbench/page.tsx
import { AssistantDrawer } from '../../components/ai/assistant-drawer';
import { AppShell } from '../../components/layout/app-shell';
import { TaskWorkbench } from '../../components/workbench/task-workbench';
import { getNextTask } from '../../lib/api/ai';

export default async function WorkbenchPage() {
  const assigneeId = 'annotator-1';
  const task = await getNextTask(assigneeId);

  return (
    <AppShell
      title="标注工作台"
      description="领取任务、作答并提交。"
      rightSlot={<AssistantDrawer />}
    >
      <TaskWorkbench initialTask={task} assigneeId={assigneeId} />
    </AppShell>
  );
}
```

```tsx
// apps/web/app/page.tsx
import Link from 'next/link';
import { AppShell } from '../components/layout/app-shell';
import { AssistantDrawer } from '../components/ai/assistant-drawer';
import { getDashboardOverview } from '../lib/api/dashboard';

export default async function HomePage() {
  const overview = await getDashboardOverview();

  return (
    <AppShell
      title="总览"
      description="查看项目进度、快速进入管理与标注流程。"
      rightSlot={<AssistantDrawer />}
    >
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {[
          ['项目总数', overview.projectCount],
          ['批次总数', overview.batchCount],
          ['题目总数', overview.taskCount],
          ['分配总数', overview.assignmentCount]
        ].map(([label, value]) => (
          <article key={String(label)} className="rounded-panel border border-panelLine bg-white p-6 shadow-panel">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-3 text-3xl font-semibold text-slateDeep">{value}</p>
          </article>
        ))}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {[
          { href: '/projects', label: '进入项目管理' },
          { href: '/workbench', label: '进入标注工作台' },
          { href: '/projects', label: '查看批次与题目' }
        ].map((item) => (
          <Link
            key={item.href + item.label}
            href={item.href}
            className="rounded-panel border border-panelLine bg-white p-5 text-sm text-slate-600 shadow-panel"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
```

- [ ] **Step 5: Verify the frontend build still passes**

Run: `npm run build --workspace web`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/web/app/page.tsx apps/web/app/workbench apps/web/components/ai apps/web/components/workbench apps/web/lib/api
git commit -m "feat: add chinese workbench and ai assistant surfaces"
```

## Task 7: Document the full frontend and AI setup flow

**Files:**
- Modify: `README.md`
- Modify: `apps/web/.env.example`
- Test: `README.md`

**Interfaces:**
- Consumes:
  - backend and frontend environment setup
- Produces:
  - documented developer setup for running backend, database, frontend, and DeepSeek integration

- [ ] **Step 1: Add backend AI configuration to the root README**

```md
## AI gateway setup

1. Add `DEEPSEEK_API_KEY` to the root `.env`
2. Optionally set `DEEPSEEK_BASE_URL` and `DEEPSEEK_MODEL`
3. Start the NestJS backend with `npm run start:dev`
4. The frontend will use backend endpoints `/ai/chat` and `/ai/task-suggestion`
```

- [ ] **Step 2: Add frontend local setup instructions**

```md
## Frontend MVP setup

1. Copy `apps/web/.env.example` to `apps/web/.env.local`
2. Set `NEXT_PUBLIC_API_BASE_URL=http://localhost:3000`
3. Run `npm install`
4. Start backend and PostgreSQL
5. Run `npm run dev --workspace web`
6. Open `http://localhost:3001`
```

- [ ] **Step 3: Run final verification commands**

Run: `npm run build`
Expected: backend build passes

Run: `npm run build --workspace web`
Expected: frontend build passes

- [ ] **Step 4: Commit**

```bash
git add README.md apps/web/.env.example
git commit -m "docs: add frontend and ai setup instructions"
```

## Self-Review

### Spec coverage

- Next.js frontend application: Task 1
- TypeScript-based implementation: Tasks 1 through 6
- Tailwind CSS styling: Tasks 1 and 2
- GSAP for restrained motion: Task 2
- Chinese UI copy: Tasks 2, 3, 5, and 6
- Real backend API integration: Tasks 3, 5, and 6
- Core project-management pages: Tasks 3 and 5
- Basic annotation workbench: Task 6
- AI assistant panel: Tasks 4 and 6
- Backend AI gateway using DeepSeek: Task 4

### Placeholder scan

- No `TODO`, `TBD`, or deferred implementation markers remain
- Each task contains explicit files, commands, and code examples

### Type consistency

- Shared API helper signatures match frontend route usage
- New backend endpoints are matched by frontend helper functions
- AI requests and responses are consistently named across backend and frontend

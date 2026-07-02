import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const repoRoot = '/Users/zhaojiaxiang/codex0/project_manager';
const backendUrl = 'http://127.0.0.1:3000';
const frontendUrl = 'http://127.0.0.1:3001';

function startProcess(command, args, options = {}) {
  const child = spawn(command, args, {
    cwd: repoRoot,
    env: { ...process.env, ...options.env },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  child.stdout.on('data', () => {});
  child.stderr.on('data', () => {});

  return child;
}

async function waitForUrl(url, label) {
  const timeoutAt = Date.now() + 120000;
  let lastError = null;

  while (Date.now() < timeoutAt) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
      lastError = new Error(`${label} responded with ${response.status}`);
    } catch (error) {
      lastError = error;
    }

    await delay(1000);
  }

  throw new Error(`${label} did not become ready: ${lastError}`);
}

async function createProject() {
  const response = await fetch(`${backendUrl}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: `Smoke project ${Date.now()}`,
      taskType: 'text',
      description: 'frontend smoke coverage'
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to create project: ${response.status}`);
  }

  return response.json();
}

async function fetchHtml(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  return response.text();
}

function assertIncludes(html, text, label) {
  if (!html.includes(text)) {
    throw new Error(`${label} is missing expected text: ${text}`);
  }
}

async function main() {
  const backend = startProcess('npm', ['run', 'start:dev']);
  const frontend = startProcess('npm', ['run', 'dev', '--workspace', 'web'], {
    env: { NEXT_PUBLIC_API_BASE_URL: backendUrl }
  });

  try {
    await waitForUrl(`${backendUrl}/projects`, 'backend');
    await waitForUrl(`${frontendUrl}/projects`, 'frontend');

    const project = await createProject();

    const projectsHtml = await fetchHtml(`${frontendUrl}/projects`);
    assertIncludes(projectsHtml, '新建项目', '/projects');
    assertIncludes(projectsHtml, '项目名称', '/projects');

    const detailHtml = await fetchHtml(`${frontendUrl}/projects/${project.id}`);
    assertIncludes(detailHtml, '新建批次', '/projects/[projectId]');
    assertIncludes(detailHtml, '批次名称', '/projects/[projectId]');
  } finally {
    backend.kill('SIGTERM');
    frontend.kill('SIGTERM');
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

import { defineConfig } from '@playwright/test';
import path from 'node:path';

const repoRoot = path.resolve(__dirname, '..', '..');

export default defineConfig({
  testDir: './tests',
  timeout: 120_000,
  use: {
    baseURL: 'http://localhost:3001',
    headless: true
  },
  webServer: [
    {
      command: 'npm run start:dev',
      cwd: repoRoot,
      url: 'http://localhost:3000/projects',
      reuseExistingServer: false,
      timeout: 120_000
    },
    {
      command: 'npm run dev --workspace web',
      cwd: repoRoot,
      url: 'http://localhost:3001/projects',
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        ...process.env,
        NEXT_PUBLIC_API_BASE_URL: 'http://localhost:3000'
      }
    }
  ]
});

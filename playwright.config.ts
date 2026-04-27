import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:3100',
    screenshot: 'on',
    trace: 'on-first-retry',
  },
  reporter: [['list']],
});

// app/playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  webServer: [
    {
      command: 'npm --prefix ../mock-server run serve',
      url: 'http://localhost:3001/vehicles',
      reuseExistingServer: true,
      // Disable injected 503s for e2e: they're a real UX concern (see mock-server/middleware.js)
      // but a source of test flakiness here, not something this suite is meant to prove.
      env: { ERROR_RATE: '0' },
    },
    { command: 'npm start', url: 'http://localhost:4200', reuseExistingServer: true },
  ],
  use: { baseURL: 'http://localhost:4200' },
});

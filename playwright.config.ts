import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 10_000,
  fullyParallel: false,
  forbidOnly: true,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:5173',
    headless: false,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      testMatch: ['**/login.spec.ts', '**/guest-booking.spec.ts'],
      outputDir: 'test-results/regression',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'agent-seed',
      testMatch: '**/setup/agent.seed.spec.ts',
      outputDir: 'test-results/agent-seed',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      name: 'API',
      command: 'node --import tsx app/server/index.ts',
      url: 'http://127.0.0.1:3001/api/health',
      reuseExistingServer: !process.env.CI,
      env: { NODE_ENV: 'development' },
    },
    {
      name: 'Client',
      command: 'node node_modules/vite/bin/vite.js',
      url: 'http://127.0.0.1:5173',
      reuseExistingServer: !process.env.CI,
      env: { NODE_ENV: 'development' },
    },
  ],
});

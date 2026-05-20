import path from 'path';

const config = {
  testDir: path.join(__dirname, 'frontend', 'tests'),
  timeout: 30_000,
  expect: { timeout: 5000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  use: {
    actionTimeout: 0,
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
  webServer: {
    // start the frontend dev server from the repo root
    command: 'npm --prefix frontend run dev',
    url: 'http://localhost:5173',
    timeout: 120_000,
    reuseExistingServer: true,
  },
};

export default config;

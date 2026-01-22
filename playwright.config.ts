import type { PlaywrightTestConfig } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('.env.test') });

const config: PlaywrightTestConfig = {
  webServer: {
    command: 'npm run build && npm run preview',
    port: 4173,
    stdout: process.env.WEBSERVER_LOG_STDERR === 'ignore' ? 'ignore' : 'pipe',
    stderr: process.env.WEBSERVER_LOG_STDERR === 'ignore' ? 'ignore' : 'pipe',
    reuseExistingServer: true
  },
  testDir: 'tests/end-to-end',
  testMatch: /(.+\.)?(test|spec)\.[jt]s/,
  reporter: [['list'], ['html']],
  retries: 3,
  fullyParallel: true,
  projects: [
    {
      name: 'setup',
      testMatch: 'setup.ts',
      use: { browserName: 'chromium' },
    },
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        contextOptions: {
          permissions: ['clipboard-read', 'clipboard-write'],
        },
      },
      dependencies: ['setup'],
    },
    {
      name: 'firefox',
      use: { browserName: 'firefox' },
      dependencies: ['setup'],
    },
    {
      name: 'webkit',
      use: { browserName: 'webkit' },
      dependencies: ['setup'],
    },
  ],
  use: {
    launchOptions: {
      slowMo: 200,
    },
  },
};

export default config;

import type { PlaywrightTestConfig } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// This only pre-populates process.env - Vite's own build step would still unconditionally
// load the project's root .env on top of it otherwise (a real, gitignored, developer-local
// file), since Vite always loads the base .env regardless of mode. The webServer command
// below passes --mode test, which vite.config.ts uses to redirect envDir away from the
// project root during e2e builds, so only what's set here (and inherited process.env,
// which always wins over file-based env) reaches the build.
dotenv.config({ path: path.resolve('.env.test'), quiet: true });
const isUI = process.argv.includes('--ui');
const isDebug = !!process.env.PLAYWRIGHT_DEV || process.argv.includes('--debug');

const config: PlaywrightTestConfig = {
  webServer: {
    command:
      isUI && isDebug
        ? 'npm run dev -- --port 4173 --mode test'
        : 'npm run build -- --mode test && npm run preview -- --mode test',
    port: 4173,
    reuseExistingServer: !process.env.CI,
    stdout: process.env.WEBSERVER_LOG_STDERR === 'ignore' ? 'ignore' : 'pipe',
    stderr: process.env.WEBSERVER_LOG_STDERR === 'ignore' ? 'ignore' : 'pipe',
  },
  workers: process.env.CI ? 4 : undefined,
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
};

export default config;

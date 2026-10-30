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
// Each worktree running e2e at the same time needs its own port: reuseExistingServer
// would otherwise quietly test whichever checkout's server already holds 4173.
const port = Number(process.env.E2E_PORT || 4173);
if (!Number.isInteger(port) || port < 1 || port > 65535)
  throw new Error(`E2E_PORT must be a port number, got ${process.env.E2E_PORT}`);

const config: PlaywrightTestConfig = {
  webServer: {
    command:
      isUI && isDebug
        ? `npm run dev -- --port ${port} --strictPort --mode test`
        : `npm run build -- --mode test && npm run preview -- --port ${port} --strictPort --mode test`,
    port,
    reuseExistingServer: !process.env.CI,
    stdout: process.env.WEBSERVER_LOG_STDERR === 'ignore' ? 'ignore' : 'pipe',
    stderr: process.env.WEBSERVER_LOG_STDERR === 'ignore' ? 'ignore' : 'pipe',
  },
  // GitHub-hosted ubuntu-22.04 runners have 2 vCPUs; workers: 4 oversubscribes them 2x,
  // and with fullyParallel + 3 browser projects sharing one webServer, that contention was
  // slowing the app past the default 30s test timeout under CI load (chromium/firefox/webkit
  // all launching and navigating concurrently) - not a bug in the tests themselves.
  workers: process.env.CI ? 2 : undefined,
  timeout: process.env.CI ? 45000 : undefined,
  testDir: 'tests/end-to-end',
  testMatch: /(.+\.)?(test|spec)\.[jt]s/,
  reporter: [['list'], ['html']],
  retries: 3,
  fullyParallel: true,
  use: { baseURL: `http://localhost:${port}` },
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

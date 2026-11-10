import type { PlaywrightTestConfig } from '@playwright/test';
import base from './playwright.config';

// Screenshot comparison per theme (tests/visual). Not part of `pnpm test`: baselines are
// machine-specific, so they're generated on the base branch and compared on the change.
const config: PlaywrightTestConfig = {
  ...base,
  testMatch: /\.visual\.ts$/,
  retries: 0,
  reporter: [['list']],
  snapshotPathTemplate: 'tests/visual/__screenshots__/{projectName}/{arg}{ext}',
  expect: { toHaveScreenshot: { maxDiffPixels: 0 } },
  projects: [
    {
      name: 'setup',
      testDir: 'tests/end-to-end',
      testMatch: 'setup.ts',
      use: { browserName: 'chromium' },
    },
    {
      name: 'visual',
      testDir: 'tests/visual',
      use: { browserName: 'chromium', viewport: { width: 1280, height: 1600 } },
      dependencies: ['setup'],
    },
    {
      // Below Tailwind's sm and md breakpoints
      name: 'visual-narrow',
      testDir: 'tests/visual',
      use: { browserName: 'chromium', viewport: { width: 600, height: 1600 } },
      dependencies: ['setup'],
    },
  ],
};

export default config;

import type { PlaywrightTestConfig } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('.env.test') });

const config: PlaywrightTestConfig = {
  webServer: {
    command: 'npm run build && npm run preview',
    port: 4173,
  },
  testDir: 'tests',
  testMatch: /(.+\.)?(test|spec)\.[jt]s/,
  reporter: [['list'], ['html']],
  use: {
    permissions: ['clipboard-read', 'clipboard-write'],
    launchOptions: {
      slowMo: 200,
    },
  },
};

export default config;

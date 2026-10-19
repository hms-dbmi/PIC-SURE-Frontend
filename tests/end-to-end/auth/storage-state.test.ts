import { expect } from '@playwright/test';
import { test, ensureStorageState, mockApiConfig } from '../custom-context';
import { userIsLoggedIn } from '../utils';

const generalUser = 'tests/end-to-end/.auth/generalUser.json';

test.use({ storageState: generalUser });

// What WebKit sometimes does under load: the context starts without the restored localStorage.
test('A signed-in context that lost its restored localStorage gets it back', async ({
  context,
  page,
}, testInfo) => {
  await context.setStorageState({ cookies: [], origins: [] });

  await ensureStorageState(context, generalUser, testInfo);
  await mockApiConfig(page);
  await page.goto('/help');

  await userIsLoggedIn(page);
  expect(testInfo.annotations.map(({ type }) => type)).toContain('storage-state-reapplied');
});

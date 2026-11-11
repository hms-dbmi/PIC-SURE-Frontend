import { expect } from '@playwright/test';
import { test, ensureStorageState, mockApiConfig } from '../custom-context';
import { userIsLoggedIn } from '../utils';

const generalUser = 'tests/end-to-end/.auth/generalUser.json';

test.use({ storageState: generalUser });

test('A signed-in context that lost its restored localStorage gets it back', async ({
  context,
  page,
}, testInfo) => {
  await context.setStorageState({ cookies: [], origins: [] });

  const state = await ensureStorageState(context, generalUser, testInfo);
  await mockApiConfig(page);
  await page.goto('/help');

  expect(state.origins.flatMap(({ localStorage }) => localStorage.map(({ name }) => name))).toEqual(
    expect.arrayContaining(['token', 'user']),
  );
  await userIsLoggedIn(page);
});

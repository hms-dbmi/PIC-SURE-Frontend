import { expect } from '@playwright/test';
import { test, mockApiSuccess, mockApiFail, mockApiConfig } from '../custom-context';

import {
  privileges as mockPrivileges,
  roles as mockRoles,
  applications as mockApps,
  connections as mockConnections,
} from '../../support/mock-data';
import { userIsLoggedIn } from '../utils';

test.use({ storageState: 'tests/end-to-end/.auth/superUser.json' });

test.beforeEach(async ({ page }) => {
  await mockApiConfig(page);
  await mockApiSuccess(page, '*/**/psama/role', mockRoles);
  await mockApiSuccess(page, '*/**/psama/privilege', mockPrivileges);
  await mockApiSuccess(page, '*/**/psama/application', mockApps);
  await mockApiSuccess(page, '*/**/psama/connection', mockConnections);
});

const UUID = 'f0f0f0f0-0000-4000-8000-000000000000';

for (const { url, failing, entity } of [
  { url: `/admin/configuration/role/${UUID}/edit`, failing: '*/**/psama/role/**', entity: 'role' },
  {
    url: `/admin/configuration/privilege/${UUID}/edit`,
    failing: '*/**/psama/privilege/**',
    entity: 'privilege',
  },
  {
    url: `/admin/configuration/connection/${UUID}/edit`,
    failing: '*/**/psama/connection/**',
    entity: 'connection',
  },
  { url: `/admin/users/${UUID}`, failing: '*/**/psama/user', entity: 'user' },
  { url: `/admin/users/${UUID}/edit`, failing: '*/**/psama/user', entity: 'user' },
]) {
  test(`${url} names the ${entity} it failed to load`, async ({ page }) => {
    // Given
    await mockApiFail(page, failing, 'failed');

    // When
    await page.goto(url);
    await userIsLoggedIn(page);

    // Then
    await expect(
      page.getByText(`An error occurred while retrieving ${entity} ${UUID}.`),
    ).toBeVisible();
  });
}

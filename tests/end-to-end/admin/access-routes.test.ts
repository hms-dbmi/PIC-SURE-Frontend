import { expect } from '@playwright/test';
import { test, mockApiSuccess, mockApiConfig } from '../custom-context';

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
  await mockApiSuccess(page, `*/**/psama/role/${mockRoles[0].uuid}`, mockRoles[0]);
  await mockApiSuccess(page, '*/**/psama/privilege', mockPrivileges);
  await mockApiSuccess(page, `*/**/psama/privilege/${mockPrivileges[0].uuid}`, mockPrivileges[0]);
  await mockApiSuccess(page, '*/**/psama/application', mockApps);
  await mockApiSuccess(page, '*/**/psama/connection', mockConnections);
});

for (const { url, title, heading, section } of [
  {
    url: '/admin/configuration/role/new',
    title: 'New Role',
    heading: 'New Role',
    section: 'admin-role-new',
  },
  {
    url: `/admin/configuration/role/${mockRoles[0].uuid}/edit`,
    title: 'Edit Role',
    heading: 'Edit Role',
    section: 'admin-role-edit',
  },
  {
    url: '/admin/configuration/privilege/new',
    title: 'New Privilege',
    heading: 'New Privilege',
    section: 'admin-privilege-new',
  },
  {
    url: `/admin/configuration/privilege/${mockPrivileges[0].uuid}/edit`,
    title: 'Edit Privilege',
    heading: 'Edit Privilege',
    section: 'admin-privilege-edit',
  },
  {
    url: '/admin/configuration/connection/new',
    title: 'New Connection',
    heading: 'New Connection',
    section: 'admin-connection-new',
  },
  {
    url: `/admin/configuration/connection/${mockConnections[0].uuid}/edit`,
    title: 'Edit Connection Configuration',
    heading: 'Edit Connection',
    section: 'admin-connection-edit',
  },
]) {
  test(`${url} shows the ${heading} form`, async ({ page }) => {
    // When
    await page.goto(url);
    await userIsLoggedIn(page);

    // Then
    await expect(page).toHaveTitle(new RegExp(`\\| ${title}$`));
    await expect(page.getByRole('heading', { name: heading })).toBeVisible();
    await expect(page.locator(`#${section} form`)).toBeVisible();
  });
}

for (const url of [
  '/admin/configuration/application/new',
  `/admin/configuration/user/${mockRoles[0].uuid}/edit`,
]) {
  test(`${url} is not a configuration page`, async ({ page }) => {
    // When
    const response = await page.goto(url);

    // Then
    expect(response?.status()).toBe(404);
    await expect(page.getByTestId('app-error-status')).toHaveText('404');
  });
}

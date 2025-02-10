import { expect } from '@playwright/test';
import { test, mockApiSuccess, mockApiFail } from '../../../../custom-context';

import {
  privileges as mockPrivileges,
  roles as mockRoles,
  applications as mockApps,
  connections as mockConnections,
} from '../../../../mock-data';

const validationText = {
  empty: 'Please fill out this field.',
  option: 'Please select an item in the list.',
};

test.beforeEach(async ({ page }) => {
  await mockApiSuccess(page, '*/**/psama/role', mockRoles);
  await mockApiSuccess(page, '*/**/psama/privilege', mockPrivileges);
  await mockApiSuccess(page, '*/**/psama/application', mockApps);
  await mockApiSuccess(page, '*/**/psama/connection', mockConnections);
});
test('', async ({ page }) => {});
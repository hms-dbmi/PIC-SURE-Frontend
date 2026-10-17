import { expect, type Page, type Locator } from '@playwright/test';

// This method is used to ensure that the user state is fully loaded before proceeding.
// Sometimes, the tests are flaky because there is a race condition in the tests that
// causes the user to not be fully logged in before some test steps.
export const userIsLoggedIn = async (page: Page) => {
  await expect(
    page.locator('#app-nav-user').getByTestId('app-nav-user-menu-trigger'),
  ).toBeVisible();
};

export const expectUniqueIds = async (page: Page) => {
  const duplicates = await page.evaluate(() => {
    const counts = new Map<string, number>();
    for (const { id } of document.querySelectorAll('[id]'))
      counts.set(id, (counts.get(id) ?? 0) + 1);
    return [...counts].filter(([, count]) => count > 1).map(([id]) => id);
  });
  expect(duplicates).toEqual([]);
};

export const userIsLoggedOut = async (page: Page) => {
  await expect(page.locator('#app-nav-user').locator('#app-nav-login')).toBeVisible();
};

export const optionsHaveLoaded = async (
  page: Page | Locator,
  container: 'available' | 'selected' = 'available',
) => {
  await page
    .getByTestId('ui-options-selection-list')
    .first()
    .getByTestId(`ui-options-selection-list-${container}`)
    .locator('label')
    .first()
    .waitFor({ state: 'visible', timeout: 5000 });
};

export const getOption = async (page: Page | Locator, optionIndex = 0) => {
  // Use .first() to avoid strict-mode violations when multiple filter panels are briefly open
  const component = page.getByTestId('ui-options-selection-list').first();
  const optionContainer = component.getByTestId('ui-options-selection-list-available');
  await expect(optionContainer).toBeVisible({ timeout: 15000 });
  await optionsHaveLoaded(page);
  // Wait for at least one option to render before returning
  await optionContainer.getByRole('listitem').first().waitFor({ state: 'visible', timeout: 15000 });
  const options = await optionContainer.getByRole('listitem').all();
  return options[optionIndex];
};

export const nthFilterIcon = async (page: Page, rowIndex = 0) => {
  await expect(page.locator('tbody')).toBeVisible();
  // Data rows only: an open (or closing) expansion row between them must not shift the index
  const row = page.locator('tbody tr[id^="explorer-table-row-"]').nth(rowIndex);
  return row.locator('td').last().locator('button').nth(1);
};

export const clickNthFilterIcon = async (page: Page, rowIndex = 0) => {
  const filterIcon = await nthFilterIcon(page, rowIndex);
  await expect(filterIcon).toBeVisible();
  await filterIcon.click();
};

import { expect, type Page, type Locator } from '@playwright/test';
import { genomicFilter } from './mock-data';

// This method is used to ensure that the user state is fully loaded before proceeding.
// Sometimes, the tests are flaky because there is a race condition in the tests that
// causes the user to not be fully logged in before some test steps.
export const userIsLoggedIn = async (page: Page) => {
  await expect(page.locator('#user-session-avatar').getByTestId('user-info-btn')).toBeVisible();
};

export const userIsLoggedOut = async (page: Page) => {
  await expect(page.locator('#user-session-avatar').locator('#user-login-btn')).toBeVisible();
};

export const optionsHaveLoaded = async (page: Page | Locator, container = 'options-container') => {
  await page
    .getByTestId('optional-selection-list')
    .first()
    .locator(`#${container} label`)
    .first()
    .waitFor({ state: 'visible', timeout: 5000 });
};

export const getOption = async (page: Page | Locator, optionIndex = 0) => {
  // Use .first() to avoid strict-mode violations when multiple filter panels are briefly open
  const component = page.getByTestId('optional-selection-list').first();
  const optionContainer = component.locator('#options-container');
  await expect(optionContainer).toBeVisible({ timeout: 15000 });
  await optionsHaveLoaded(page);
  // Wait for at least one option to render before returning
  await optionContainer.getByRole('listitem').first().waitFor({ state: 'visible', timeout: 15000 });
  const options = await optionContainer.getByRole('listitem').all();
  return options[optionIndex];
};

export const nthFilterIcon = async (page: Page, rowIndex = 0) => {
  await expect(page.locator('tbody')).toBeVisible();
  const tableBody = page.locator('tbody');
  const firstRow = tableBody.locator('tr').nth(rowIndex);
  return firstRow.locator('td').last().locator('button').nth(1);
};

export const clickNthFilterIcon = async (page: Page, rowIndex = 0) => {
  const filterIcon = await nthFilterIcon(page, rowIndex);
  await expect(filterIcon).toBeVisible();
  await filterIcon.click();
};

// Only client-side navigation keeps a layout - and so the cohort summary panel it renders -
// alive, and page.goto() would not. The in-app links to Explore's child routes mostly live in
// that panel's body, which is the state under test in several specs, so a synthetic anchor
// exercises the same SvelteKit navigation without depending on the panel's own markup.
export const navigateInApp = async (page: Page, href: string) => {
  await page.evaluate((target) => {
    document.getElementById('e2e-nav-link')?.remove();
    const link = document.createElement('a');
    link.id = 'e2e-nav-link';
    link.href = target;
    link.textContent = 'e2e navigate';
    document.body.appendChild(link);
  }, href);
  await page.locator('#e2e-nav-link').click();
  // The click starts a client-side navigation that discards this anchor with the rest of the
  // old page, but a same-route navigation keeps the body - so remove it rather than leave a
  // stray visible link behind for the next assertion to trip over.
  await page.evaluate(() => document.getElementById('e2e-nav-link')?.remove());
};

// Puts a genomic filter in sessionStorage for the next page load to restore, the way a user
// who built one on an earlier visit would have left it. Must be called before navigating.
export const seedGenomicFilter = async (page: Page) => {
  await page.addInitScript(
    (json: string) => {
      sessionStorage.setItem('genomicFilters', json);
    },
    JSON.stringify([genomicFilter]),
  );
};

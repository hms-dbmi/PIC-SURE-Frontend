import { expect, type Page, type Locator } from '@playwright/test';

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

// A box that has to stand out from what's behind it: a near-white fill no darker than its
// backdrop, and a border with at least the 3:1 non-text contrast WCAG 1.4.11 asks of a
// component's boundary.
export async function expectStandsOut(box: Locator) {
  await expect(box).toBeVisible();
  const colors = await box.evaluate((element) => {
    const context = document.createElement('canvas').getContext('2d', {
      willReadFrequently: true,
    })!;
    // Computed colors can come back as oklch(); a canvas resolves any CSS color to sRGB.
    const toLuminance = (color: string) => {
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = color;
      context.fillRect(0, 0, 1, 1);
      const [r, g, b] = [...context.getImageData(0, 0, 1, 1).data].map((value) => {
        const channel = value / 255;
        return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const isPainted = (color: string) => color !== 'rgba(0, 0, 0, 0)' && color !== 'transparent';
    let behind = element.parentElement;
    while (behind && !isPainted(getComputedStyle(behind).backgroundColor)) {
      behind = behind.parentElement;
    }
    const style = getComputedStyle(element);
    return {
      fill: toLuminance(style.backgroundColor),
      border: toLuminance(style.borderTopColor),
      borderWidth: parseFloat(style.borderTopWidth),
      backdrop: toLuminance(getComputedStyle(behind ?? document.body).backgroundColor),
    };
  });
  const contrast = (a: number, b: number) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

  expect(colors.fill).toBeGreaterThanOrEqual(0.9);
  expect(colors.fill).toBeGreaterThanOrEqual(colors.backdrop);
  expect(colors.borderWidth).toBeGreaterThan(0);
  expect(contrast(colors.border, colors.backdrop)).toBeGreaterThanOrEqual(3);
  expect(contrast(colors.border, colors.fill)).toBeGreaterThanOrEqual(3);
}

import { expect } from '@playwright/test';

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export const getOption = async (page: any, optionIndex = 0) => {
  const component = page.getByTestId('optional-selection-list');
  const optionContainer = component.locator('#options-container');
  await expect(optionContainer).toBeVisible();
  const options = await optionContainer.getByRole('listitem').all();
  return options[optionIndex];
};

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export const nthFilterIcon = async (page: any, rowIndex = 0) => {
  await expect(page.locator('tbody')).toBeVisible();
  const tableBody = page.locator('tbody');
  const firstRow = tableBody.locator('tr').nth(rowIndex);
  return firstRow.locator('td').last().locator('button').nth(1);
};

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export const clickNthFilterIcon = async (page: any, rowIndex = 0) => {
  const filterIcon = await nthFilterIcon(page, rowIndex);
  await expect(filterIcon).toBeVisible();
  await filterIcon.click();
};

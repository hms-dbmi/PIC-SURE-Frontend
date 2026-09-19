import { expect, type Page } from '@playwright/test';
import { test, mockApiConfig, mockApiFail, mockApiSuccessByMethod } from '../custom-context';
import { defaultRegisterFormFields } from '../../../src/lib/models/User';
import type { FieldSchema } from '../../../src/lib/utilities/Validation';

const registerFields: [string, FieldSchema][] = Object.entries(defaultRegisterFormFields);
const registerPath = '*/**/psama/user/register';

// Waiting for the network to go idle after navigation gives the client bundle time to
// hydrate the form before we interact with it - without this, a click can land on the
// server-rendered button before its onsubmit handler is attached, producing a real
// native form submission (a GET navigation) instead of running handleSubmit.
async function gotoRegister(page: Page) {
  await page.goto('/register');
  await page.waitForLoadState('networkidle');
}

async function fillValidValues(page: Page) {
  for (const [name] of registerFields) {
    const container = page.getByTestId(`register-field-${name}`);
    await container.locator('input').fill(name === 'email' ? 'name@example.com' : 'Test Value');
  }
}

test.describe('Register page', () => {
  test.beforeEach(({ page }) =>
    mockApiConfig(page, { features: [{ name: 'OPEN', value: 'true' }] }),
  );

  test('Submitting with all fields valid produces no validation errors', async ({ page }) => {
    // Given
    await mockApiSuccessByMethod(page, registerPath, 'POST', { uuid: 'test-uuid' });
    await gotoRegister(page);
    await fillValidValues(page);

    // When
    await page.getByRole('button', { name: 'Register' }).click();

    // Then
    await expect(
      page.locator('[data-testid^="register-field-"][data-testid$="-error"]'),
    ).toHaveCount(0);
  });

  test('A successful submission shows the success message and no error', async ({ page }) => {
    // Given
    await mockApiSuccessByMethod(page, registerPath, 'POST', { uuid: 'test-uuid' });
    await gotoRegister(page);
    await fillValidValues(page);

    // When
    await page.getByRole('button', { name: 'Register' }).click();

    // Then
    await expect(page.getByText(/successfully created/i)).toBeVisible();
    await expect(page.getByTestId('register-form-error')).not.toBeVisible();
    await expect(page.getByTestId('register-form')).not.toBeVisible();
  });

  test('A failed submission shows the error message and no success message', async ({ page }) => {
    // Given
    await mockApiFail(page, registerPath, 'failed');
    await gotoRegister(page);
    await fillValidValues(page);

    // When
    await page.getByRole('button', { name: 'Register' }).click();

    // Then
    await expect(page.getByTestId('register-form-error')).toContainText(
      /error occured during submission/i,
    );
    await expect(page.getByText(/successfully created/i)).not.toBeVisible();
  });
});

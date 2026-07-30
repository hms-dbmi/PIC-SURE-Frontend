import { expect } from '@playwright/test';
import { test, mockApiConfig } from '../custom-context';

test.describe('Branding overrides', () => {
  test('LOGO/LOGO_ALT overrides replace the default logo mark with an image', async ({ page }) => {
    // Given
    await mockApiConfig(page, {
      branding: [
        { name: 'LOGO', value: 'https://example.com/custom-logo.png' },
        { name: 'LOGO_ALT', value: 'Custom Logo Alt Text' },
      ],
    });

    // When
    await page.goto('/login');

    // Then
    const logo = page.getByTestId('nav-logo');
    await expect(logo).toBeVisible();
    await expect(logo).toHaveAttribute('src', 'https://example.com/custom-logo.png');
    await expect(logo).toHaveAttribute('alt', 'Custom Logo Alt Text');
  });

  test('Without a branding override, the default logo mark renders (no branding row applied)', async ({
    page,
  }) => {
    // Given
    await mockApiConfig(page);

    // When
    await page.goto('/login');

    // Then
    const logo = page.getByTestId('nav-logo');
    await expect(logo).toBeVisible();
    await expect(logo).not.toHaveAttribute('src');
    await expect(logo.locator('title')).toHaveText('PIC-SURE');
  });
});

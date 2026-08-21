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

test.describe('Theme', () => {
  test('Without a THEME override, the default picsure theme and favicon are used', async ({
    page,
  }) => {
    // Given
    await mockApiConfig(page);

    // When
    await page.goto('/login');

    // Then
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'picsure');
    await expect(page.locator('main')).toHaveAttribute('data-theme', 'picsure');
    await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', /picsure-favicon\.png$/);
  });

  test('A recognized THEME override sets data-theme and swaps in the theme-specific favicon', async ({
    page,
  }) => {
    // Given
    await mockApiConfig(page, { branding: [{ name: 'THEME', value: 'bdc' }] });

    // When
    await page.goto('/login');

    // Then
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'bdc');
    await expect(page.locator('main')).toHaveAttribute('data-theme', 'bdc');
    await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', /bdc-favicon\.png$/);
  });

  test('An unrecognized THEME override still sets data-theme but falls back to the default favicon', async ({
    page,
  }) => {
    // Given
    await mockApiConfig(page, { branding: [{ name: 'THEME', value: 'some-other-theme' }] });

    // When
    await page.goto('/login');

    // Then
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'some-other-theme');
    await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', /\/favicon\.png$/);
  });
});

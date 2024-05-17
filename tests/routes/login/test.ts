import { expect } from '@playwright/test';
import { unauthedTest } from '../../custom-context';

unauthedTest.describe('Login page', () => {
  unauthedTest('No navigation bar before login', async ({ page }) => {
    // Given
    await page.goto('/login');
    // When
    const navBar = page.locator('nav');
    // Then
    await expect(navBar).not.toBeVisible();
  });
  unauthedTest('Logo shows on login page', async ({ page }) => {
    // Given
    await page.goto('/login');
    // When
    const logo = page.locator('img#nav-logo');
    // Then
    await expect(logo).toBeVisible();
  });
  unauthedTest('Login button shows on login page', async ({ page }) => {
    // Given
    await page.goto('/login');
    // When
    const loginButton = page.locator('button#login-button');
    // Then
    await expect(loginButton).toBeVisible();
  });
  unauthedTest('Clicking the login button opens the idp login page', async ({ page }) => {
    // Given
    await page.goto('/login');
    // When
    const loginButton = page.locator('button#login-button');
    await loginButton.click();
    // Then
    await expect(page).toHaveURL(/avillachlab.auth0.com/);
  });
});

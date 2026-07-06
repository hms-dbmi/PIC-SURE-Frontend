import { expect } from '@playwright/test';
import { test, mockApiFail, mockApiSuccess, mockApiConfig } from '../custom-context';
import { picsureUser, roles as mockRoles, mockExpiredToken, mockToken } from '../mock-data';
import { userIsLoggedIn } from '../utils';
import type { Branding } from '../../../src/lib/models/Configuration';
import brandingJson from '../../../src/lib/assets/configuration.json' with { type: 'json' };
const branding: Branding = JSON.parse(JSON.stringify(brandingJson));

const capabilities = branding?.apiPage?.capabilities || [];

const placeHolderDots =
  '••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••';

test.use({ storageState: 'tests/end-to-end/.auth/generalUser.json' });

test.describe('API page', () => {
  test.beforeEach(async ({ context }) => {
    await mockApiConfig(context);
    await mockApiSuccess(context, '*/**/psama/role', mockRoles);
    const user = picsureUser;
    user.token = mockExpiredToken;
    await mockApiSuccess(context, '*/**/psama/user/me?hasToken', user);
  });

  test('Has expected error message', async ({ page }) => {
    // Given
    await mockApiFail(page, '*/**/psama/user/me?hasToken', 'accessdenied');
    await page.goto('/api');
    await userIsLoggedIn(page);

    // When
    const errorAlert = page.locator('[data-testid=error-alert]');

    // Then
    await expect(errorAlert).toBeVisible();
  });

  test('Has expected header content', async ({ page }) => {
    // Given
    await page.goto('/api');
    await userIsLoggedIn(page);

    // Then
    await expect(page.locator('h1')).toHaveText('Programmatic Access with the PIC-SURE API');
    await expect(
      page.getByText('Search data and build cohorts directly with Python, R, or any HTTP client.'),
    ).toBeVisible();
  });

  test('Has expected workflow cards', async ({ page }) => {
    // Given
    await page.goto('/api');
    await userIsLoggedIn(page);

    // When
    const pythonCard = page.getByTestId('workflow-card-python');
    const rCard = page.getByTestId('workflow-card-r');
    const httpCard = page.getByTestId('workflow-card-http');

    // Then
    await expect(page.locator('#choose-your-workflow h2')).toHaveText('Choose Your Workflow');
    await expect(pythonCard).toBeVisible();
    await expect(pythonCard).toContainText('Python Client');
    await expect(pythonCard.locator('.badge')).toHaveText('Recommended');
    await expect(pythonCard).toContainText('Requires Python version 3.10.20 or later');
    await expect(rCard).toBeVisible();
    await expect(rCard).toContainText('R Client');
    await expect(rCard.locator('.badge')).toHaveText('Recommended');
    await expect(rCard).toContainText('Requires R version 4.1 or later');
    await expect(httpCard).toBeVisible();
    await expect(httpCard).toContainText('Direct API Access');
    await expect(httpCard.locator('.badge')).toHaveText('Advanced');
    await expect(httpCard).toContainText('Interact directly with PIC-SURE API endpoints');
  });

  test('Workflow cards have Quick Start buttons linking to the quick start section', async ({
    page,
  }) => {
    // Given
    await page.goto('/api');
    await userIsLoggedIn(page);

    // When
    const quickStartButtons = page.locator('#choose-your-workflow a', { hasText: 'Quick Start' });

    // Then
    await expect(quickStartButtons).toHaveCount(3);
    for (const button of await quickStartButtons.all()) {
      await expect(button).toHaveAttribute('href', '#quick-start');
    }
  });

  test('Has quick start tabs for Python, R, and API', async ({ page }) => {
    // Given
    await page.goto('/api');
    await userIsLoggedIn(page);

    // When
    const tabs = page.getByTestId('tabs-control');

    // Then
    await expect(tabs).toHaveCount(3);
    await expect(tabs.nth(0)).toContainText('Python');
    await expect(tabs.nth(1)).toContainText('R');
    await expect(tabs.nth(2)).toContainText('API');
    await expect(page.locator('#quick-start .code-block').first()).toBeVisible();
  });

  test('Has API Access section', async ({ page }) => {
    // Given
    await page.goto('/api');
    await userIsLoggedIn(page);

    // Then
    await expect(page.locator('#api-access h2')).toHaveText('API Access');
    await expect(page.getByText('Browse and use the PIC-SURE API endpoints.')).toBeVisible();
  });

  test('Shows all capabilities with success icons when logged in', async ({ page }) => {
    // Given
    await page.goto('/api');
    await userIsLoggedIn(page);

    // When
    const items = page.getByTestId('capability-item');

    // Then
    await expect(items).toHaveCount(capabilities.length);
    for (const [index, capability] of capabilities.entries()) {
      await expect(items.nth(index)).toContainText(capability.text);
      await expect(items.nth(index).locator('i.fa-circle-check')).toBeVisible();
      if (capability.requiresLogin) {
        await expect(items.nth(index)).toContainText('(Requires login)');
      }
    }
  });

  test('Shows personal access token card with login confirmed', async ({ page }) => {
    // Given
    await page.goto('/api');
    await userIsLoggedIn(page);

    // Then
    await expect(page.getByText('Personal Access Token').first()).toBeVisible();
    await expect(page.getByText('Login confirmed')).toBeVisible();
    await expect(page.locator('i.fa-user-shield')).toBeVisible();
  });

  test('Has expected content', async ({ page }) => {
    // Given
    await page.goto('/api');
    await userIsLoggedIn(page);

    // When
    const userToken = page.locator('#user-token');

    // Then
    await expect(userToken).toBeVisible();
  });
  test('Has expected badge and expiration', async ({ page }) => {
    // Given
    await page.goto('/api');
    await userIsLoggedIn(page);

    // When
    const expires = page.locator('#expires');
    const badge = page.locator('#expires-badge');

    // Then
    await expect(expires).toBeVisible();
    await expect(badge).toBeVisible();

    await expect(badge).toHaveText('EXPIRED');
    await expect(expires).toContainText('Mon Feb 01 2021');
  });
  test(`User account matches expected email of ${picsureUser.email}`, async ({ page }) => {
    // Given
    await page.goto('/api');
    await userIsLoggedIn(page);

    // When
    const userEmail = page.locator('#account');

    // Then
    await expect(userEmail).toBeVisible();
    await expect(userEmail).toHaveText(picsureUser.email || '');
  });
  test('Token is hidden by default', async ({ page }) => {
    // Given
    await page.goto('/api');
    await userIsLoggedIn(page);

    // When
    const userToken = page.locator('#token');

    // Then
    await expect(userToken).toBeVisible();
    expect(await userToken.innerText()).toBe(placeHolderDots);
  });
  test('Buttons are displayed', async ({ page }) => {
    // Given
    await page.goto('/api');
    await userIsLoggedIn(page);

    // When
    const copyButton = page.getByTestId('copy-btn');
    const refeshButton = page.getByTestId('refresh-btn');
    const revealButton = page.getByTestId('reveal-btn');

    // Then
    await expect(copyButton).toBeVisible();
    await expect(refeshButton).toBeVisible();
    await expect(revealButton).toBeVisible();
  });
  test('Copy button copies token to clipboard', async ({ page }) => {
    // Given
    await page.goto('/api');
    await userIsLoggedIn(page);

    // When
    const copyButton = page.getByTestId('copy-btn');

    // Then
    await expect(copyButton).toBeVisible();
    await expect(copyButton).toContainText('Copy');

    // When
    await copyButton.click();

    // Then
    await expect(copyButton).toContainText('Copied!');
    //expect(await page.evaluate(() => navigator.clipboard.readText())).toEqual(mockUser.token);
  });
  test('Token is visible when reveal button is clicked', async ({ page }) => {
    // Given
    await page.goto('/api');
    await userIsLoggedIn(page);

    // When
    const revealButton = page.getByTestId('reveal-btn');
    await revealButton.click();
    const userToken = page.locator('#token');

    // Then
    await expect(userToken).toBeVisible();
    expect(await userToken.innerText()).toBe(picsureUser.token);
  });
  test('Reveal button text changes when clicked', async ({ page }) => {
    // Given
    await page.goto('/api');
    await userIsLoggedIn(page);

    // When
    const revealButton = page.getByTestId('reveal-btn');
    await revealButton.click();

    // Then
    expect((await revealButton.innerHTML()).toString()).toBe('Hide');
  });
  test('Refresh button changes token', async ({ page }) => {
    // Given
    await page.goto('/api');
    await userIsLoggedIn(page);

    // When
    const refreshButton = page.getByTestId('refresh-btn');
    const userToken = page.locator('#token');
    await refreshButton.click();

    // Then
    expect(await userToken.innerText()).not.toBe(picsureUser.token);
  });
  test('Refresh button changes expiration, updates button text, disables button', async ({
    page,
  }) => {
    // Given
    await page.goto('/api');
    await userIsLoggedIn(page);
    const newToken = mockToken;
    await mockApiSuccess(page, '*/**/psama/user/me/refresh_long_term_token', {
      userLongTermToken: newToken,
    });
    const revealButton = page.getByTestId('reveal-btn');
    await revealButton.click();

    // When
    const refreshButton = page.getByTestId('refresh-btn');
    const expires = page.locator('#expires');
    await refreshButton.click();
    // Confirm Modal pops up
    const confrimButton = page.locator('button:has-text("Confirm")');
    await confrimButton.click();

    // Then
    await expect(refreshButton).toHaveText('Refreshed!');
    await expect(refreshButton).toBeDisabled();

    const userToken = page.locator('#token');
    await expect(userToken).not.toHaveText(placeHolderDots);
    await expect(userToken).toHaveText(newToken);
    await expect(expires).toContainText('Tue Jul 07 2274');
  });
  test('Canceling confirm modal does nothing to user', async ({ page }) => {
    // Given
    await page.goto('/api');
    await userIsLoggedIn(page);

    // When
    const userToken = page.locator('#token');
    const refreshButton = page.getByTestId('refresh-btn');
    const expires = page.locator('#expires');
    await refreshButton.click();
    // Confirm Modal pops up
    const cancel = page.locator('button:has-text("Cancel")');
    await cancel.click();

    // Then
    await expect(refreshButton).toHaveText('Refresh');
    await expect(refreshButton).not.toBeDisabled();
    expect(await userToken.innerText()).toBe(placeHolderDots);
    expect(await expires.innerText()).toContain('Mon Feb 01 2021');
  });
});

test.describe('Legacy analyze routes redirect to /api', () => {
  test.beforeEach(async ({ context }) => {
    await mockApiSuccess(context, '*/**/psama/role', mockRoles);
    const user = picsureUser;
    user.token = mockExpiredToken;
    await mockApiSuccess(context, '*/**/psama/user/me?hasToken', user);
  });

  ['/analyze/api', '/analyze/api/example', '/analyze'].forEach((legacyPath) => {
    test(`${legacyPath} redirects to /api`, async ({ page }) => {
      // When
      await page.goto(legacyPath);

      // Then
      await page.waitForURL('/api');
      await expect(page).toHaveURL('/api');
    });
  });
});

test.describe('API page logged out', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/unauthenticated.json' });

  test('Has API nav link', async ({ page }) => {
    // Given
    await page.goto('/api');

    // When
    const navLink = page.locator('#nav-link-api');

    // Then
    await expect(navLink).toBeVisible();
    await expect(navLink).toHaveText('API');
    await expect(navLink).toHaveAttribute('aria-current', 'page');
  });

  test('Shows public access placeholder instead of personal access token', async ({ page }) => {
    // Given
    await page.goto('/api');

    // Then
    await expect(page.getByTestId('public-access-placeholder')).toBeVisible();
    await expect(page.locator('#user-token')).not.toBeVisible();
  });

  test('Capabilities requiring login show an x icon and login text', async ({ page }) => {
    // Given
    await page.goto('/api');

    // When
    const items = page.getByTestId('capability-item');

    // Then
    await expect(items).toHaveCount(capabilities.length);
    for (const [index, capability] of capabilities.entries()) {
      await expect(items.nth(index)).toContainText(capability.text);
      if (capability.requiresLogin) {
        await expect(items.nth(index).locator('i.fa-circle-xmark')).toBeVisible();
        await expect(items.nth(index)).toContainText('(Requires login)');
      } else {
        await expect(items.nth(index).locator('i.fa-circle-check')).toBeVisible();
      }
    }
  });

  test('Table of contents lists all page sections', async ({ page }) => {
    // Given
    await page.goto('/api');

    // When
    const links = page.getByTestId('toc').locator('a');

    // Then
    const expected: Array<[string, string]> = [
      ['Overview', '#api-header'],
      ['Choose Your Workflow', '#choose-your-workflow'],
      ['Authentication', '#authentication'],
      ['Quick Start', '#quick-start'],
      ['API Access', '#api-access'],
    ];
    await expect(links).toHaveCount(expected.length);
    for (const [index, [label, href]] of expected.entries()) {
      await expect(links.nth(index)).toHaveText(label);
      await expect(links.nth(index)).toHaveAttribute('href', href);
    }
  });

  test('Clicking a table of contents link scrolls to the section', async ({ page }) => {
    // Given
    await page.goto('/api');

    // When
    await page.getByTestId('toc').getByRole('link', { name: 'Quick Start' }).click();

    // Then
    await expect(async () => {
      const offset = await page.evaluate(() => {
        const scroller = document.getElementById('page');
        const section = document.getElementById('quick-start');
        if (!scroller || !section) return NaN;
        return Math.round(
          section.getBoundingClientRect().top - scroller.getBoundingClientRect().top,
        );
      });
      expect(Math.abs(offset)).toBeLessThan(4);
    }).toPass({ timeout: 5000 });
  });

  test('Table of contents indicates the section in view', async ({ page }) => {
    // Given
    await page.goto('/api');
    const authLink = page.getByTestId('toc').getByRole('link', { name: 'Authentication' });
    await expect(authLink).not.toHaveAttribute('aria-current', 'true');

    // When
    await page.evaluate(() => {
      const scroller = document.getElementById('page');
      const section = document.getElementById('authentication');
      if (!scroller || !section) return;
      scroller.scrollTop +=
        section.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
    });

    // Then
    await expect(authLink).toHaveAttribute('aria-current', 'true');
  });

  test('Deep link pre-selects the quick start tab and scrolls to the section', async ({ page }) => {
    // Given
    await page.goto('/api#quick-start-r');

    // Then
    await expect(page.locator('#quick-start .code-block:visible')).toContainText('Requires R');
    await expect(async () => {
      const offset = await page.evaluate(() => {
        const scroller = document.getElementById('page');
        const section = document.getElementById('quick-start');
        if (!scroller || !section) return NaN;
        return Math.round(
          section.getBoundingClientRect().top - scroller.getBoundingClientRect().top,
        );
      });
      expect(Math.abs(offset)).toBeLessThan(4);
    }).toPass({ timeout: 5000 });
  });

  test('Table of contents is hidden on narrow viewports', async ({ page }) => {
    // Given
    await page.setViewportSize({ width: 1024, height: 800 });
    await page.goto('/api');

    // Then
    await expect(page.getByTestId('toc')).toBeHidden();
  });

  test('Legacy /analyze/api redirects to /api when logged out', async ({ page }) => {
    // When
    await page.goto('/analyze/api');

    // Then
    await page.waitForURL('/api');
    await expect(page).toHaveURL('/api');
  });
});

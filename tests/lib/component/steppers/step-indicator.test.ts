import { expect } from '@playwright/test';
import { test, mockApiSuccess } from '../../../custom-context';
import { picsureUser } from '../../../mock-data';

test.describe('StepIndicator Component Integration', () => {
  test.use({ storageState: 'tests/.auth/generalUser.json' });

  test.beforeEach(async ({ page }) => {
    // Mock the necessary API endpoints
    await mockApiSuccess(page, '*/**/psama/user/me', picsureUser);
  });

  test('renders step indicator with all visual elements', async ({ page }) => {
    await page.goto('/collaborate');

    const stepIndicator = page.getByTestId('step-indicator-Find Collaborators');

    // Check that step buttons are rendered within the step indicator
    const stepButtons = stepIndicator.locator('button[aria-label]');
    await expect(stepButtons).toHaveCount(4);

    // Verify each step has an icon span
    for (let i = 0; i < 4; i++) {
      const button = stepButtons.nth(i);
      const iconSpan = button.locator('span').first();
      await expect(iconSpan).toBeVisible();
      await expect(iconSpan).toHaveClass(/rounded-full/);
      await expect(iconSpan).toHaveClass(/border-2/);
    }
  });

  test('displays correct step icons', async ({ page }) => {
    await page.goto('/collaborate');

    const stepIndicator = page.getByTestId('step-indicator-Find Collaborators');

    // Check for FontAwesome icons within the step indicator
    await expect(stepIndicator.locator('.fa-search')).toBeVisible();
    await expect(stepIndicator.locator('.fa-handshake')).toBeVisible();
    await expect(stepIndicator.locator('.fa-database')).toBeVisible();
    await expect(stepIndicator.locator('.fa-chart-line')).toBeVisible();
  });

  test('applies correct styling to current step', async ({ page }) => {
    await page.goto('/collaborate');

    const stepIndicator = page.getByTestId('step-indicator-Find Collaborators');

    // Second step should be active (currentStep = 1)
    const activeStepIcon = stepIndicator.locator('button').nth(1).locator('span.rounded-full');
    await expect(activeStepIcon).toHaveClass(/bg-primary-500/);
    await expect(activeStepIcon).toHaveClass(/border-primary-500/);
    await expect(activeStepIcon).toHaveClass(/text-white/);

    // Other steps should be inactive
    const inactiveStepIcon = stepIndicator.locator('button').first().locator('span.rounded-full');
    await expect(inactiveStepIcon).toHaveClass(/bg-surface-100/);
    await expect(inactiveStepIcon).toHaveClass(/border-surface-300/);
    await expect(inactiveStepIcon).toHaveClass(/text-surface-500/);
  });

  test('displays step labels correctly', async ({ page }) => {
    await page.goto('/collaborate');

    // Check that step labels are visible and correctly styled
    const stepLabels = page.locator('span.text-sm.font-semibold');
    await expect(stepLabels).toHaveCount(4);

    // Active step label should have primary color (currentStep = 1)
    const activeLabel = stepLabels.nth(1);
    await expect(activeLabel).toHaveClass(/text-primary-700/);

    // Inactive step labels should have surface color
    const inactiveLabel = stepLabels.first();
    await expect(inactiveLabel).toHaveClass(/text-surface-500/);
  });

  test('renders connector lines between steps', async ({ page }) => {
    await page.goto('/collaborate');

    // Check for connector divs
    const connectors = page.locator('div.flex-1.h-0\\.5.mt-6.bg-surface-300');
    await expect(connectors).toHaveCount(3); // n-1 connectors for n steps
  });

  test('step buttons have proper accessibility attributes', async ({ page }) => {
    await page.goto('/collaborate');

    const stepIndicator = page.getByTestId('step-indicator-Find Collaborators');

    // Check aria-labels within the step indicator
    await expect(stepIndicator.locator('button[aria-label="Build Patient Cohort"]')).toBeVisible();
    await expect(stepIndicator.locator('button[aria-label="Find Collaborators"]')).toBeVisible();
    await expect(
      stepIndicator.locator('button[aria-label="Request Access to Data"]'),
    ).toBeVisible();
    await expect(
      stepIndicator.locator('button[aria-label="Analyze with Service Workbench"]'),
    ).toBeVisible();

    // Check button type and focus outline classes within the step indicator
    const buttons = stepIndicator.locator('button[aria-label]');
    for (let i = 0; i < 4; i++) {
      const button = buttons.nth(i);
      await expect(button).toHaveAttribute('type', 'button');
      await expect(button).toHaveClass(/focus:outline-none/);
    }
  });

  test('step indicator responds to current step changes', async ({ page }) => {
    // Test on different pages with different currentStep values

    // Collaborate page (currentStep = 1)
    await page.goto('/collaborate');
    let stepIndicator = page.getByTestId('step-indicator-Find Collaborators');
    let activeIcon = stepIndicator.locator('button').nth(1).locator('span.rounded-full');
    await expect(activeIcon).toHaveClass(/bg-primary-500/);

    // Analysis page (currentStep = 3)
    await page.goto('/analyze/analysis');
    stepIndicator = page.getByTestId('step-indicator-Analyze with Service Workbench');
    activeIcon = stepIndicator.locator('button').nth(3).locator('span.rounded-full');
    await expect(activeIcon).toHaveClass(/bg-primary-500/);
  });
});

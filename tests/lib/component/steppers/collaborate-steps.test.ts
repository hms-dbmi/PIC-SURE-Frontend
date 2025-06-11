import { expect } from '@playwright/test';
import { test, mockApiSuccess } from '../../../custom-context';
import { picsureUser } from '../../../mock-data';

test.describe('CollaborateSteps Component', () => {
  test.use({ storageState: 'tests/.auth/generalUser.json' });

  test.beforeEach(async ({ page }) => {
    // Mock the necessary API endpoints
    await mockApiSuccess(page, '*/**/psama/user/me', picsureUser);
  });

  test('displays collaborate steps on collaborate page with expected content', async ({ page }) => {
    await page.goto('/collaborate');

    // Check that the step indicator is present
    const stepIndicator = page.getByTestId('step-indicator-Find Collaborators');
    await expect(stepIndicator).toBeVisible();

    // Check that all expected steps are rendered within the step indicator
    await expect(stepIndicator.locator('text=Build Patient Cohort')).toBeVisible();
    await expect(stepIndicator.locator('text=Find Collaborators')).toBeVisible();
    await expect(stepIndicator.locator('text=Request Access to Data')).toBeVisible();
    await expect(stepIndicator.locator('text=Analyze with Service Workbench')).toBeVisible();

    // Verify icons are present within the step indicator
    await expect(stepIndicator.locator('.fa-search')).toBeVisible();
    await expect(stepIndicator.locator('.fa-handshake')).toBeVisible();
    await expect(stepIndicator.locator('.fa-database')).toBeVisible();
    await expect(stepIndicator.locator('.fa-chart-line')).toBeVisible();

    // Second step should be highlighted (current step = 1)
    const secondStepIcon = stepIndicator.locator('button').nth(1).locator('span.rounded-full');
    await expect(secondStepIcon).toHaveClass(/bg-primary-500/);
    await expect(secondStepIcon).toHaveClass(/text-white/);
  });

  test('displays collaborate steps on collaborate page with current step 1', async ({ page }) => {
    await page.goto('/collaborate');

    // Check that the step indicator is present
    const stepIndicator = page.getByTestId('step-indicator-Find Collaborators');
    await expect(stepIndicator).toBeVisible();

    // Second step should be highlighted (current step = 1)
    const secondStepIcon = stepIndicator.locator('button').nth(1).locator('span.rounded-full');
    await expect(secondStepIcon).toHaveClass(/bg-primary-500/);
    await expect(secondStepIcon).toHaveClass(/text-white/);

    // First step should not be highlighted
    const firstStepIcon = stepIndicator.locator('button').first().locator('span.rounded-full');
    await expect(firstStepIcon).toHaveClass(/bg-surface-100/);
    await expect(firstStepIcon).toHaveClass(/text-surface-500/);
  });

  test('displays collaborate steps on analysis page with current step 3', async ({ page }) => {
    await page.goto('/analyze/analysis');

    // Check that the step indicator is present
    const stepIndicator = page.getByTestId('step-indicator-Analyze with Service Workbench');
    await expect(stepIndicator).toBeVisible();

    // Fourth step should be highlighted (current step = 3)
    const fourthStepIcon = stepIndicator.locator('button').nth(3).locator('span.rounded-full');
    await expect(fourthStepIcon).toHaveClass(/bg-primary-500/);
    await expect(fourthStepIcon).toHaveClass(/text-white/);

    // Other steps should not be highlighted
    const firstStepIcon = stepIndicator.locator('button').first().locator('span.rounded-full');
    await expect(firstStepIcon).toHaveClass(/bg-surface-100/);
    await expect(firstStepIcon).toHaveClass(/text-surface-500/);
  });

  test('step navigation works correctly', async ({ page }) => {
    await page.goto('/collaborate');

    // Click on the "Build Patient Cohort" step within the step indicator
    const stepIndicator = page.getByTestId('step-indicator-Find Collaborators');
    const explorerStep = stepIndicator.locator('button[aria-label="Build Patient Cohort"]');
    await explorerStep.click();

    // Should navigate to the explorer page
    await expect(page).toHaveURL('/explorer');
  });

  test('step navigation works for explorer step', async ({ page }) => {
    await page.goto('/collaborate');

    // Click on the "Build Patient Cohort" step within the step indicator
    const stepIndicator = page.getByTestId('step-indicator-Find Collaborators');
    const explorerStep = stepIndicator.locator('button[aria-label="Build Patient Cohort"]');
    await explorerStep.click();

    // Should navigate to the explorer page
    await expect(page).toHaveURL('/explorer');
  });

  test('step navigation works for analysis step', async ({ page }) => {
    await page.goto('/collaborate');

    // Click on the "Analyze with Service Workbench" step within the step indicator
    const stepIndicator = page.getByTestId('step-indicator-Find Collaborators');
    const analysisStep = stepIndicator.locator(
      'button[aria-label="Analyze with Service Workbench"]',
    );
    await analysisStep.click();

    // Should navigate to the analysis page
    await expect(page).toHaveURL('/analyze/analysis');
  });

  test('clicking current step does not navigate', async ({ page }) => {
    await page.goto('/collaborate');
    const currentUrl = page.url();

    // Click on the current step (Find Collaborators) within the step indicator
    const stepIndicator = page.getByTestId('step-indicator-Find Collaborators');
    const currentStep = stepIndicator.locator('button[aria-label="Find Collaborators"]');
    await currentStep.click();

    // Should stay on the same page
    await expect(page).toHaveURL(currentUrl);
  });

  test('step indicator has proper responsive width', async ({ page }) => {
    await page.goto('/collaborate');

    // The CollaborateSteps component sets width to "w-3/4"
    const stepIndicator = page.getByTestId('step-indicator-Find Collaborators');
    await expect(stepIndicator).toHaveClass(/w-3\/4/);
  });

  test('all step buttons are accessible', async ({ page }) => {
    await page.goto('/collaborate');

    const stepIndicator = page.getByTestId('step-indicator-Find Collaborators');

    // Check that all step buttons have proper aria-labels within the step indicator
    await expect(stepIndicator.locator('button[aria-label="Build Patient Cohort"]')).toBeVisible();
    await expect(stepIndicator.locator('button[aria-label="Find Collaborators"]')).toBeVisible();
    await expect(
      stepIndicator.locator('button[aria-label="Request Access to Data"]'),
    ).toBeVisible();
    await expect(
      stepIndicator.locator('button[aria-label="Analyze with Service Workbench"]'),
    ).toBeVisible();

    // Test keyboard navigation within the step indicator
    const firstButton = stepIndicator.locator('button[aria-label="Build Patient Cohort"]');
    await firstButton.focus();
    await expect(firstButton).toBeFocused();

    // Test that we can focus on other buttons by clicking them
    const secondButton = stepIndicator.locator('button[aria-label="Find Collaborators"]');
    await secondButton.focus();
    await expect(secondButton).toBeFocused();
  });

  test('step labels are displayed correctly', async ({ page }) => {
    await page.goto('/collaborate');

    const stepIndicator = page.getByTestId('step-indicator-Find Collaborators');

    // Verify step labels match the configuration within the step indicator
    const stepLabels = [
      'Build Patient Cohort',
      'Find Collaborators',
      'Request Access to Data',
      'Analyze with Service Workbench',
    ];

    for (const label of stepLabels) {
      await expect(stepIndicator.locator(`text=${label}`)).toBeVisible();
    }
  });

  test('connector lines are displayed between steps', async ({ page }) => {
    await page.goto('/collaborate');

    // Check that connector lines exist between steps
    const connectors = page.locator('.flex-1.h-0\\.5.mt-6.bg-surface-300');
    await expect(connectors).toHaveCount(3); // Should be n-1 connectors for n steps
  });

  test('step highlighting changes correctly between pages', async ({ page }) => {
    // Start on collaborate page
    await page.goto('/collaborate');
    let stepIndicator = page.getByTestId('step-indicator-Find Collaborators');

    // Second step should be highlighted
    let secondStepIcon = stepIndicator.locator('button').nth(1).locator('span.rounded-full');
    await expect(secondStepIcon).toHaveClass(/bg-primary-500/);

    // First step should not be highlighted
    const firstStepIcon = stepIndicator.locator('button').first().locator('span.rounded-full');
    await expect(firstStepIcon).toHaveClass(/bg-surface-100/);

    // Navigate to analysis page
    await page.goto('/analyze/analysis');
    stepIndicator = page.getByTestId('step-indicator-Analyze with Service Workbench');

    // Fourth step should now be highlighted
    const fourthStepIcon = stepIndicator.locator('button').nth(3).locator('span.rounded-full');
    await expect(fourthStepIcon).toHaveClass(/bg-primary-500/);

    // Second step should no longer be highlighted
    secondStepIcon = stepIndicator.locator('button').nth(1).locator('span.rounded-full');
    await expect(secondStepIcon).toHaveClass(/bg-surface-100/);
  });
});

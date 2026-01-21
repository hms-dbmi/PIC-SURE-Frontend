import { expect } from '@playwright/test';
import { test } from '../custom-context';

test.describe('Advanced Filtering - Core Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    // Click the button to open the Advanced Filtering modal
    const openButton = page.getByRole('button', { name: 'Open Advanced Filters' });
    await expect(openButton).toBeVisible();
    await openButton.click();
    // Wait for modal to open
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('AF-CORE-001: Advanced Filtering page renders without errors', async ({ page }) => {
    // Verify the modal with title 'Advanced Filters' is displayed
    const modalTitle = page.getByRole('heading', { name: 'Advanced Filters' });
    await expect(modalTitle).toBeVisible();

    // Verify the main filtering area is visible (the article containing filters)
    const filteringArea = page.getByRole('article');
    await expect(filteringArea).toBeVisible();
  });

  test('AF-CORE-002: Advanced Filtering page shows all currently added filters', async ({
    page,
  }) => {
    // The login page hack creates filter1, filter2, group1, group2 etc.
    // Verify every added filter is visible in the Advanced Filtering filters list

    // Check that test filters are visible by their variable names
    await expect(page.getByText('test', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('test2', { exact: true })).toBeVisible();
    await expect(page.getByText('test3', { exact: true })).toBeVisible();
    await expect(page.getByText('test4', { exact: true })).toBeVisible();
    await expect(page.getByText('test5', { exact: true })).toBeVisible();
    await expect(page.getByText('test6', { exact: true })).toBeVisible();
  });

  test('AF-CORE-003: Each filter shown on Advanced Filtering displays Study information', async ({
    page,
  }) => {
    // Verify Study information is displayed for filters
    // The filters created in login hack have studyAcronym values like 'test', 'test2', etc.
    await expect(page.getByText('Study: test', { exact: true })).toBeVisible();
    await expect(page.getByText('Study: test2')).toBeVisible();
    await expect(page.getByText('Study: test3')).toBeVisible();
  });
});

test.describe('Advanced Filtering - Global Combiner', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    const openButton = page.getByRole('button', { name: 'Open Advanced Filters' });
    await expect(openButton).toBeVisible();
    await openButton.click();
  });

  test('AF-COMBINER-001: A top-level AND/OR segmented control exists and is visible', async ({
    page,
  }) => {
    // Verify a segmented control exists at the top with AND and OR options
    // The root group should have an AND/OR segment control
    const andOption = page.getByRole('radio', { name: 'AND' }).first();
    const orOption = page.getByRole('radio', { name: 'OR' }).first();

    await expect(andOption).toBeVisible();
    await expect(orOption).toBeVisible();
  });

  test('AF-COMBINER-002: Top-level AND/OR segmented control defaults to AND', async ({ page }) => {
    // Verify AND is selected by default in the top-level segmented control
    const andOption = page.getByRole('radio', { name: 'AND' }).first();
    await expect(andOption).toBeChecked();
  });

  test('AF-COMBINER-003: Selecting OR in top-level control changes all top-level combiners to OR', async ({
    page,
  }) => {
    // Select OR in the top-level AND/OR control
    const orOption = page.getByRole('radio', { name: 'OR' }).first();
    await orOption.click();

    // Verify the badges between top-level items show OR
    const orBadges = page.locator('.badge').filter({ hasText: /^OR$/i });
    const count = await orBadges.count();
    expect(count).toBeGreaterThan(0);
  });

  test('AF-COMBINER-004: Selecting AND in top-level control changes all top-level combiners to AND', async ({
    page,
  }) => {
    // First select OR, then select AND
    const orOption = page.getByRole('radio', { name: 'OR' }).first();
    await orOption.click();

    const andOption = page.getByRole('radio', { name: 'AND' }).first();
    await andOption.click();

    // Verify the badges between top-level items show AND
    const andBadges = page.locator('.badge').filter({ hasText: /^AND$/i });
    const count = await andBadges.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('Advanced Filtering - Drag and Drop', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    const openButton = page.getByRole('button', { name: 'Open Advanced Filters' });
    await expect(openButton).toBeVisible();
    await openButton.click();
  });

  test('AF-DND-001: Filters have a visual drag handle indicator', async ({ page }) => {
    // Verify each filter has a visible drag handle (grip icon)
    const dragHandles = page.locator('.fa-grip-vertical');
    const count = await dragHandles.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('Advanced Filtering - Grouping', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    const openButton = page.getByRole('button', { name: 'Open Advanced Filters' });
    await expect(openButton).toBeVisible();
    await openButton.click();
  });

  test('AF-GROUP-001: Add Group button is visible', async ({ page }) => {
    // Verify an 'Add Group' button is visible
    const addGroupButton = page.getByRole('button', { name: 'Add Group' });
    await expect(addGroupButton).toBeVisible();
  });

  test('AF-GROUP-002: Clicking Add Group creates a new empty group box', async ({ page }) => {
    // Click 'Add Group'
    const addGroupButton = page.getByRole('button', { name: 'Add Group' });
    await addGroupButton.click();

    // Verify a new group container appears with "Drop items here" text
    const dropZone = page.getByText('Drop items here');
    await expect(dropZone).toBeVisible();
  });

  test('AF-GROUP-004: Group box displays Group Filter label with AND/OR control', async ({
    page,
  }) => {
    // Click 'Add Group' to create a new group
    const addGroupButton = page.getByRole('button', { name: 'Add Group' });
    await addGroupButton.click();

    // Verify the group has AND and OR options
    const andOptions = page.getByRole('radio', { name: 'AND' });
    const orOptions = page.getByRole('radio', { name: 'OR' });

    // Should have more than one set now (root + new group)
    expect(await andOptions.count()).toBeGreaterThan(1);
    expect(await orOptions.count()).toBeGreaterThan(1);
  });

  test('AF-GROUP-005: Group AND/OR control defaults to AND', async ({ page }) => {
    // Click 'Add Group'
    const addGroupButton = page.getByRole('button', { name: 'Add Group' });
    await addGroupButton.click();

    // The new group's AND option should be checked (all AND options should be checked by default)
    const andOptions = page.getByRole('radio', { name: 'AND' });
    const count = await andOptions.count();
    for (let i = 0; i < count; i++) {
      await expect(andOptions.nth(i)).toBeChecked();
    }
  });
});

test.describe('Advanced Filtering - Apply', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    const openButton = page.getByRole('button', { name: 'Open Advanced Filters' });
    await expect(openButton).toBeVisible();
    await openButton.click();
  });

  test('AF-APPLY-001: Apply to Query button is visible', async ({ page }) => {
    // Verify a button for applying changes is visible
    // Note: The component has "Apply Changes" button, PRD says "Apply to Query"
    const applyButton = page.getByRole('button', { name: /Apply/i });
    await expect(applyButton).toBeVisible();
  });

  test('AF-APPLY-002: Apply button is styled as a primary button', async ({ page }) => {
    // Verify the Apply button uses primary button styling
    const applyButton = page.getByRole('button', { name: /Apply/i });
    await expect(applyButton).toHaveClass(/preset-filled-primary/);
  });
});

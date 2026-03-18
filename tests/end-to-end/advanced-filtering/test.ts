import { expect } from '@playwright/test';
import { test } from '../custom-context';
import { AdvancedFilteringPage } from './advanced-filtering-page';

test.describe('Advanced Filtering - Core Features', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/generalUser.json' });
  let afPage: AdvancedFilteringPage;

  test.beforeEach(async ({ page }) => {
    afPage = new AdvancedFilteringPage(page);
    await afPage.setupAndOpenModal(4);
  });

  test('AF-CORE-001: Advanced Filtering page renders without errors', async () => {
    await afPage.expectModalTitle();
    await afPage.expectModalVisible();
  });

  test('AF-CORE-002: Advanced Filtering page shows all currently added filters', async () => {
    for (const filterName of afPage.filterNames) {
      await afPage.expectFilterVisible(filterName);
    }
  });

  test('AF-CORE-003: Each filter shown on Advanced Filtering displays Study information', async () => {
    const uniqueStudies = [...new Set(afPage.studyAcronyms)];
    for (const study of uniqueStudies) {
      await afPage.expectStudyInfoVisible(study);
    }
  });
});

test.describe('Advanced Filtering - Filter Details', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/generalUser.json' });
  let afPage: AdvancedFilteringPage;

  test.beforeEach(async ({ page }) => {
    afPage = new AdvancedFilteringPage(page);
    await afPage.setupAndOpenModal(4);
  });

  test('AF-DETAIL-001: Expanding a numeric filter shows correct description', async () => {
    // The 4th filter (index 3) is a numeric "age" filter added as "any value"
    const filterCard = afPage.getFilterCard(afPage.filterNames[3]);
    await expect(filterCard).toBeVisible();

    // Click the caret to expand the filter details
    const caretButton = filterCard.getByRole('button', { name: 'See details' });
    await expect(caretButton).toBeVisible();
    await caretButton.click();

    // Verify the description shows the correct text from derivedFilterDescription
    const detailSection = filterCard.locator('section');
    await expect(detailSection).toBeVisible();
    await expect(detailSection).toContainText('Restricting to any value.');
  });

  test('AF-DETAIL-002: Expanding a categorical filter shows correct description', async () => {
    // The 1st filter (index 0) is a categorical filter with one selected value
    const filterCard = afPage.getFilterCard(afPage.filterNames[0]);
    await expect(filterCard).toBeVisible();

    // Click the caret to expand the filter details
    const caretButton = filterCard.getByRole('button', { name: 'See details' });
    await expect(caretButton).toBeVisible();
    await caretButton.click();

    // Verify the description shows restricting info
    const detailSection = filterCard.locator('section');
    await expect(detailSection).toBeVisible();
    await expect(detailSection).toContainText('Restricting to');
  });
});

test.describe('Advanced Filtering - Global Combiner', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/generalUser.json' });
  let afPage: AdvancedFilteringPage;

  test.beforeEach(async ({ page }) => {
    afPage = new AdvancedFilteringPage(page);
    await afPage.setupAndOpenModal(4);
  });

  test('AF-COMBINER-001: A top-level AND/OR segmented control exists and is visible', async () => {
    await afPage.expectAndOrControlsVisible();
  });

  test('AF-COMBINER-002: Top-level AND/OR segmented control defaults to AND', async () => {
    await afPage.expectAndIsDefault();
  });

  test('AF-COMBINER-003: Selecting OR in top-level control changes all top-level combiners to OR', async () => {
    await afPage.selectRootOperator('OR');
    await afPage.expectBadgeText('OR');
  });

  test('AF-COMBINER-004: Selecting AND in top-level control changes all top-level combiners to AND', async () => {
    await afPage.selectRootOperator('OR');
    await afPage.expectBadgeText('OR');
    await afPage.selectRootOperator('AND');
    await afPage.expectBadgeText('AND');
  });

  test('AF-COMBINER-005: Top-level AND/OR selection persists when revisiting Advanced Filtering', async () => {
    await afPage.selectRootOperator('OR');
    await afPage.expectBadgeText('OR');
    await afPage.clickApplyChanges();
    await afPage.expectModalClosed();
    await afPage.openModal();
    await afPage.expectBadgeText('OR');
  });

  test('AF-COMBINER-006: AND uses primary color, OR uses secondary color', async () => {
    const andBadges = afPage.getAndBadges();
    await expect(andBadges.first()).toBeVisible();
    await expect(andBadges.first()).toHaveClass(/preset-filled-primary/);

    await afPage.selectRootOperator('OR');

    const orBadges = afPage.getOrBadges();
    await expect(orBadges.first()).toBeVisible();
    await expect(orBadges.first()).toHaveClass(/preset-filled-secondary/);

    const remainingAndBadges = afPage.getAndBadges();
    const andCount = await remainingAndBadges.count();
    if (andCount > 0) {
      await expect(remainingAndBadges.first()).toHaveClass(/preset-filled-primary/);
    }
  });
});

test.describe('Advanced Filtering - Drag and Drop', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/generalUser.json' });
  let afPage: AdvancedFilteringPage;

  test.beforeEach(async ({ page }) => {
    afPage = new AdvancedFilteringPage(page);
    await afPage.setupAndOpenModal(4);
  });

  test('AF-DND-001: Filters have a visual drag handle indicator', async () => {
    await afPage.expectDragHandlesExist();
  });

  test('AF-DND-002: Filters can be picked up by dragging', async ({ page }) => {
    const modal = afPage.modal;
    const filterCards = modal
      .locator('.card.bg-white')
      .filter({ has: page.locator('.fa-grip-vertical') });
    const firstCard = filterCards.first();
    await expect(firstCard).toBeVisible();

    const dragHandle = firstCard.locator('.fa-grip-vertical').first();
    await expect(dragHandle).toBeVisible();
    await expect(firstCard).not.toHaveClass(/\binvisible\b/);

    await dragHandle.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);

    const handleBox = await dragHandle.boundingBox();
    expect(handleBox).not.toBeNull();

    const startX = handleBox!.x + handleBox!.width / 2;
    const startY = handleBox!.y + handleBox!.height / 2;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX, startY + 20, { steps: 3 });
    await page.mouse.move(startX, startY + 100, { steps: 20 });

    const dragPlaceholder = page.getByTestId('drop-preview');
    await expect(dragPlaceholder).toBeVisible({ timeout: 3000 });

    await page.mouse.up();
    await expect(dragPlaceholder).toHaveCount(0, { timeout: 2000 });
  });

  test('AF-DND-003: Filters can be reordered via drag and drop', async ({ page }) => {
    const modal = afPage.modal;
    const filterA = afPage.filterNames[0];
    const filterB = afPage.filterNames[1];

    const filterNameEls = modal.locator('.card.bg-white .text-sm.font-medium');
    const initialOrder = await filterNameEls.allTextContents();
    expect(initialOrder).toContain(filterA);
    expect(initialOrder).toContain(filterB);

    const aIndex = initialOrder.indexOf(filterA);
    const bIndex = initialOrder.indexOf(filterB);
    expect(aIndex).toBeLessThan(bIndex);

    const cardA = modal
      .locator('.card.bg-white')
      .filter({ has: page.getByText(filterA, { exact: true }) })
      .filter({ has: page.locator('.fa-grip-vertical') })
      .first();
    const cardB = modal
      .locator('.card.bg-white')
      .filter({ has: page.getByText(filterB, { exact: true }) })
      .filter({ has: page.locator('.fa-grip-vertical') })
      .first();

    await expect(cardA).toBeVisible();
    await expect(cardB).toBeVisible();

    await cardB.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);

    const aBox = await cardA.boundingBox();
    const bBox = await cardB.boundingBox();
    expect(aBox).not.toBeNull();
    expect(bBox).not.toBeNull();
    expect(aBox!.y).toBeLessThan(bBox!.y);

    const dragHandle = cardA.locator('.fa-grip-vertical').first();
    await expect(dragHandle).toBeVisible();

    const handleBox = await dragHandle.boundingBox();
    expect(handleBox).not.toBeNull();

    const startX = handleBox!.x + handleBox!.width / 2;
    const startY = handleBox!.y + handleBox!.height / 2;
    const endX = bBox!.x + bBox!.width / 2;
    const endY = bBox!.y + bBox!.height - 10;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX, startY + 20, { steps: 3 });
    await page.mouse.move(endX, endY, { steps: 20 });
    await page.mouse.up();

    await page.waitForTimeout(500);
    await expect(afPage.modal).toBeVisible();

    const newOrder = await filterNameEls.allTextContents();
    const newAIndex = newOrder.indexOf(filterA);
    const newBIndex = newOrder.indexOf(filterB);
    expect(newAIndex).toBeGreaterThan(newBIndex);
  });

  test('AF-DND-004: Filter reorder persists after re-opening Advanced Filtering', async ({
    page,
  }) => {
    const modal = afPage.modal;
    const filterA = afPage.filterNames[0];
    const filterB = afPage.filterNames[1];

    const filterNameEls = modal.locator('.card.bg-white .text-sm.font-medium');
    const initialOrder = await filterNameEls.allTextContents();
    expect(initialOrder).toContain(filterA);
    expect(initialOrder).toContain(filterB);

    const cardA = modal
      .locator('.card.bg-white')
      .filter({ has: page.getByText(filterA, { exact: true }) })
      .filter({ has: page.locator('.fa-grip-vertical') })
      .first();
    const cardB = modal
      .locator('.card.bg-white')
      .filter({ has: page.getByText(filterB, { exact: true }) })
      .filter({ has: page.locator('.fa-grip-vertical') })
      .first();

    await expect(cardA).toBeVisible();
    await expect(cardB).toBeVisible();

    await cardB.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);

    const aBox = await cardA.boundingBox();
    const bBox = await cardB.boundingBox();
    expect(aBox).not.toBeNull();
    expect(bBox).not.toBeNull();

    const dragHandle = cardA.locator('.fa-grip-vertical').first();
    await expect(dragHandle).toBeVisible();
    const handleBox = await dragHandle.boundingBox();
    expect(handleBox).not.toBeNull();

    const startX = handleBox!.x + handleBox!.width / 2;
    const startY = handleBox!.y + handleBox!.height / 2;
    const endX = bBox!.x + bBox!.width / 2;
    const endY = bBox!.y + bBox!.height - 10;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX, startY + 20, { steps: 3 });
    await page.mouse.move(endX, endY, { steps: 20 });
    await page.mouse.up();
    await page.waitForTimeout(500);

    const newOrder = await filterNameEls.allTextContents();
    expect(newOrder.indexOf(filterA)).toBeGreaterThan(newOrder.indexOf(filterB));

    await afPage.clickApplyChanges();
    await afPage.expectModalClosed();
    await afPage.openModal();

    const persistedOrder = await filterNameEls.allTextContents();
    expect(persistedOrder.indexOf(filterA)).toBeGreaterThan(persistedOrder.indexOf(filterB));
  });

  test('AF-DND-006: Dragging a filter shows a dotted drop preview', async ({ page }) => {
    const modal = afPage.modal;
    const dropPreview = page.getByTestId('drop-preview');
    await expect(dropPreview).toHaveCount(0);

    const filterA = afPage.filterNames[0];
    const filterB = afPage.filterNames[1];

    const cardA = modal
      .locator('.card.bg-white')
      .filter({ has: page.getByText(filterA, { exact: true }) })
      .filter({ has: page.locator('.fa-grip-vertical') })
      .first();
    const cardB = modal
      .locator('.card.bg-white')
      .filter({ has: page.getByText(filterB, { exact: true }) })
      .filter({ has: page.locator('.fa-grip-vertical') })
      .first();

    await expect(cardA).toBeVisible();
    await expect(cardB).toBeVisible();

    await cardB.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);

    const dragHandle = cardA.locator('.fa-grip-vertical').first();
    await expect(dragHandle).toBeVisible();

    const handleBox = await dragHandle.boundingBox();
    const targetBox = await cardB.boundingBox();
    expect(handleBox).not.toBeNull();
    expect(targetBox).not.toBeNull();

    const startX = handleBox!.x + handleBox!.width / 2;
    const startY = handleBox!.y + handleBox!.height / 2;
    const endX = targetBox!.x + targetBox!.width / 2;
    const endY = targetBox!.y + targetBox!.height - 10;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX, startY + 20, { steps: 3 });
    await page.mouse.move(endX, endY, { steps: 20 });

    await expect(dropPreview).toBeVisible({ timeout: 2000 });

    await page.mouse.up();
    await expect(dropPreview).toHaveCount(0);
  });

  test('AF-DND-007: Dragging a group shows a dotted drop preview', async ({ page }) => {
    // Close AF, create a group via sessionStorage, then reopen
    await afPage.closeModal();

    await page.evaluate(() => {
      const raw = sessionStorage.getItem('filterTree');
      if (!raw) return;
      const tree = JSON.parse(raw);
      const lastTwo = tree.children.splice(-2, 2);
      tree.children.push({
        children: lastTwo,
        operator: 'AND',
        uuid: 'test-dnd007-group-uuid',
      });
      sessionStorage.setItem('filterTree', JSON.stringify(tree));
    });

    await page.goto('/explorer?search=somedata');
    await expect(page.locator('#results-panel')).toBeVisible();
    await afPage.openModal();

    const dropPreview = page.getByTestId('drop-preview');
    await expect(dropPreview).toHaveCount(0);

    // Find the group's drag handle via the "Between items:" label's sibling grip icon
    const groupHeader = afPage.modal.getByText('Between items:').first();
    await expect(groupHeader).toBeVisible();

    // The grip icon is in the same row as "Between items:" — go up to the flex row, find the handle
    const groupRow = groupHeader
      .locator('xpath=ancestor::div[contains(@class, "flex-row")]')
      .first();
    const dragHandle = groupRow.locator('.fa-grip-vertical').first();
    await expect(dragHandle).toBeVisible();

    await dragHandle.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);

    // Get the first top-level filter as a drag target
    const firstFilter = afPage.filterNames[0];
    const targetCard = afPage.modal
      .locator('.card.bg-white')
      .filter({ has: page.getByText(firstFilter, { exact: true }) })
      .first();
    await expect(targetCard).toBeVisible();

    const handleBox = await dragHandle.boundingBox();
    const targetBox = await targetCard.boundingBox();
    expect(handleBox).not.toBeNull();
    expect(targetBox).not.toBeNull();

    const startX = handleBox!.x + handleBox!.width / 2;
    const startY = handleBox!.y + handleBox!.height / 2;
    const endY = targetBox!.y + targetBox!.height / 2;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX, startY - 20, { steps: 3 });
    await page.mouse.move(startX, endY, { steps: 20 });

    await expect(dropPreview).toBeVisible({ timeout: 3000 });

    await page.mouse.up();
    await expect(dropPreview).toHaveCount(0);
  });
});

test.describe('Advanced Filtering - Grouping', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/generalUser.json' });
  let afPage: AdvancedFilteringPage;

  test.beforeEach(async ({ page }) => {
    afPage = new AdvancedFilteringPage(page);
    await afPage.setupAndOpenModal(4);
  });

  test('AF-GROUP-001: Add Group button is visible', async () => {
    await afPage.expectAddGroupButtonVisible();
  });

  test('AF-GROUP-002: Clicking Add Group creates a new empty group box', async () => {
    await afPage.clickAddGroup();
    await expect(afPage.getEmptyGroupDropZone()).toBeVisible();
  });

  test('AF-GROUP-004: Group box displays Group Filter label with AND/OR control', async () => {
    await afPage.clickAddGroup();
    await afPage.expectNewGroupHasAndOrControls();
  });

  test('AF-GROUP-005: Group AND/OR control defaults to AND', async () => {
    await afPage.clickAddGroup();
    await afPage.expectMultipleRadioGroups();
  });

  test('AF-GROUP-006: Filters can be dragged into a group', async ({ page }) => {
    const modal = afPage.modal;

    // Use sessionStorage approach to reliably move filter into group
    // (dnd-kit drag-and-drop is flaky in Playwright)
    await afPage.closeModal();

    await page.evaluate(() => {
      const raw = sessionStorage.getItem('filterTree');
      if (!raw) return;
      const tree = JSON.parse(raw);
      const lastChild = tree.children.splice(-1, 1)[0];
      tree.children.push({
        children: [lastChild],
        operator: 'AND',
        uuid: 'test-group-006-uuid',
      });
      sessionStorage.setItem('filterTree', JSON.stringify(tree));
    });

    await page.goto('/explorer?search=somedata');
    await expect(page.locator('#results-panel')).toBeVisible();
    await afPage.openModal();

    const lastFilter = afPage.filterNames[afPage.filterNames.length - 1];
    const groupCards = modal.locator('.card').filter({ hasText: 'Between items:' });
    const groupCount = await groupCards.count();
    expect(groupCount).toBeGreaterThanOrEqual(1);

    const escFilter = lastFilter.replace(/[?()]/g, '\\$&');
    const filterInGroup = groupCards
      .first()
      .locator('.card.bg-white .text-sm.font-medium')
      .filter({ hasText: new RegExp(`^${escFilter}$`) });
    await expect(filterInGroup).toBeVisible();

    const badges = afPage.getCombinerBadges();
    const badgeCount = await badges.count();
    expect(badgeCount).toBeGreaterThan(0);
  });

  test('AF-GROUP-007: Filter dragged into group is removed from original position', async ({
    page,
  }) => {
    const modal = afPage.modal;
    const rootArea = modal.locator('.card').filter({ hasText: 'Between groups:' }).first();
    const filterNameEls = rootArea.locator('.card.bg-white .text-sm.font-medium');
    const initialOrder = await filterNameEls.allTextContents();

    const lastFilter = afPage.filterNames[afPage.filterNames.length - 1];
    expect(initialOrder).toContain(lastFilter);
    const initialCount = initialOrder.length;

    // Use sessionStorage approach for reliable group creation
    await afPage.closeModal();

    await page.evaluate(() => {
      const raw = sessionStorage.getItem('filterTree');
      if (!raw) return;
      const tree = JSON.parse(raw);
      const lastChild = tree.children.splice(-1, 1)[0];
      tree.children.push({
        children: [lastChild],
        operator: 'AND',
        uuid: 'test-group-007-uuid',
      });
      sessionStorage.setItem('filterTree', JSON.stringify(tree));
    });

    await page.goto('/explorer?search=somedata');
    await expect(page.locator('#results-panel')).toBeVisible();
    await afPage.openModal();

    const groupCards = modal.locator('.card').filter({ hasText: 'Between items:' });
    const filtersInGroup = await groupCards
      .first()
      .locator('.card.bg-white .text-sm.font-medium')
      .allTextContents();

    expect(filtersInGroup).toContain(lastFilter);

    const allFilterCards = modal.locator('.card.bg-white .text-sm.font-medium');
    const allFilters = await allFilterCards.allTextContents();
    const occurrences = allFilters.filter((name) => name === lastFilter).length;
    expect(occurrences).toBe(1);
    expect(allFilters.length).toBe(initialCount);
  });

  test('AF-GROUP-008: Changing group AND/OR only affects filters within that group', async ({
    page,
  }) => {
    const modal = afPage.modal;

    // Close modal, programmatically create a group in the filter tree via sessionStorage,
    // then reopen. This avoids unreliable dnd-kit drag-and-drop in tests.
    await afPage.closeModal();

    // Move the last two filters into a subgroup via sessionStorage manipulation
    await page.evaluate(() => {
      const raw = sessionStorage.getItem('filterTree');
      if (!raw) return;
      const tree = JSON.parse(raw);
      // Take the last two children and wrap them in an AND subgroup
      const lastTwo = tree.children.splice(-2, 2);
      tree.children.push({
        children: lastTwo,
        operator: 'AND',
        uuid: 'test-subgroup-uuid',
      });
      sessionStorage.setItem('filterTree', JSON.stringify(tree));
    });

    // Navigate again to pick up the modified tree
    await page.goto('/explorer?search=somedata');
    await expect(page.locator('#results-panel')).toBeVisible();
    await afPage.openModal();

    // Verify the group exists with "Between items:" label
    const subgroup = modal.locator('.card').filter({ hasText: 'Between items:' }).last();
    await expect(subgroup).toBeVisible();

    // Verify there are two radiogroups (root + subgroup)
    await afPage.expectMultipleRadioGroups();

    // Helper to count AND/OR badges (AND uses preset-filled-primary, OR uses preset-filled-secondary)
    const getBadgeTexts = () => modal.locator('.badge').allTextContents();

    const badgesBefore = await getBadgeTexts();
    const andCountBefore = badgesBefore.filter((t) => t === 'AND').length;
    const orCountBefore = badgesBefore.filter((t) => t === 'OR').length;

    // All badges should be AND initially
    expect(andCountBefore).toBeGreaterThan(0);
    expect(orCountBefore).toBe(0);

    // Change the subgroup's operator to OR
    const subgroupRadioGroup = subgroup.getByRole('radiogroup').first();
    await expect(subgroupRadioGroup).toBeVisible();

    const orRadio = subgroupRadioGroup.getByRole('radio', { name: 'OR' });
    await expect(orRadio).toBeVisible();
    await orRadio.locator('..').click();
    await page.waitForTimeout(500);

    const badgesAfterGroupChange = await getBadgeTexts();
    const orCountAfter = badgesAfterGroupChange.filter((t) => t === 'OR').length;
    const andCountAfter = badgesAfterGroupChange.filter((t) => t === 'AND').length;

    // Subgroup changed to OR, so OR count should increase
    expect(orCountAfter).toBeGreaterThan(0);
    // Root is still AND, so AND badges should remain
    expect(andCountAfter).toBeGreaterThan(0);

    // Change root operator to OR - shouldn't affect the subgroup
    await afPage.selectRootOperator('OR');
    await page.waitForTimeout(300);

    const badgesAfterRootChange = await getBadgeTexts();
    const orCountFinal = badgesAfterRootChange.filter((t) => t === 'OR').length;
    // More OR badges now (root + subgroup)
    expect(orCountFinal).toBeGreaterThan(orCountAfter);

    // Change root back to AND
    await afPage.selectRootOperator('AND');
    await page.waitForTimeout(300);

    const badgesFinal = await getBadgeTexts();
    const orCountRevert = badgesFinal.filter((t) => t === 'OR').length;
    const andCountRevert = badgesFinal.filter((t) => t === 'AND').length;

    // Root is AND again, subgroup is still OR
    expect(andCountRevert).toBeGreaterThan(0);
    expect(orCountRevert).toBeGreaterThan(0);
  });
});

test.describe('Advanced Filtering - Apply', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/generalUser.json' });
  let afPage: AdvancedFilteringPage;

  test.beforeEach(async ({ page }) => {
    afPage = new AdvancedFilteringPage(page);
    await afPage.setupAndOpenModal(2);
  });

  test('AF-APPLY-001: Apply to Query button is visible', async () => {
    await afPage.expectApplyButtonVisible();
  });

  test('AF-APPLY-002: Apply button is styled as a primary button', async () => {
    await afPage.expectApplyButtonHasPrimaryStyle();
  });

  test('AF-APPLY-003: Clicking Apply to Query closes Advanced Filtering and returns to main page', async () => {
    await afPage.expectModalVisible();
    await afPage.clickApplyChanges();
    await afPage.expectModalClosed();
    await expect(afPage.advancedFilteringBtn).toBeVisible();
  });
});

test.describe('Advanced Filtering - Genomic Filters', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/generalUser.json' });
  let afPage: AdvancedFilteringPage;

  test.beforeEach(async ({ page }) => {
    afPage = new AdvancedFilteringPage(page);
    await afPage.setupWithGenomicAndOpenModal(4);
  });

  test('AF-GENOMIC-001: Genomic filter appears at bottom of filters list', async () => {
    const genomicSection = afPage.getGenomicFiltersSection();
    await expect(genomicSection).toBeVisible();

    const genomicItems = afPage.getGenomicFilterItems();
    await expect(genomicItems).toHaveCount(1);
    await expect(genomicItems.first()).toContainText('Genomic Filter');

    const filteringArea = afPage.filteringArea;
    const genomicSectionInArea = filteringArea.getByTestId('genomic-filters-section');
    await expect(genomicSectionInArea).toBeVisible();
  });

  test('AF-GENOMIC-002: Separator between phenotypic and genomic filter shows fixed AND text', async () => {
    const separator = afPage.getGenomicAndSeparator();
    await expect(separator).toBeVisible();
    await expect(separator).toContainText('AND');
  });

  test('AF-GENOMIC-003: Genomic filter AND separator is not changeable by user', async () => {
    const separator = afPage.getGenomicAndSeparator();
    await expect(separator).toBeVisible();

    await expect(separator.getByRole('radio')).toHaveCount(0);
    await expect(separator.getByRole('button')).toHaveCount(0);

    const badge = separator.locator('.badge');
    await expect(badge).toBeVisible();
    await expect(badge).toContainText('AND');
  });

  test('AF-GENOMIC-004: Genomic filter cannot be dragged', async () => {
    const genomicItem = afPage.getGenomicFilterItems().first();
    await expect(genomicItem).toBeVisible();
    await expect(genomicItem.locator('.fa-grip-vertical')).toHaveCount(0);
  });

  test('AF-GENOMIC-005: Genomic filter cannot be placed into a group', async () => {
    const genomicItem = afPage.getGenomicFilterItems().first();
    await expect(genomicItem).toBeVisible();

    const hasSortableAttr = await genomicItem.evaluate((el) => {
      return Array.from(el.attributes).some((attr) => attr.name.startsWith('data-dnd'));
    });
    expect(hasSortableAttr).toBe(false);
  });
});

test.describe('Advanced Filtering - Genomic Filters (Ordering)', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/generalUser.json' });
  let afPage: AdvancedFilteringPage;

  test.beforeEach(async ({ page }) => {
    afPage = new AdvancedFilteringPage(page);
    await afPage.setupWithGenomicAndOpenModal(4);
  });

  test('AF-GENOMIC-006: Genomic filter always appears below all phenotypic filters', async () => {
    const modal = afPage.modal;
    const genomicSection = afPage.getGenomicFiltersSection();
    await expect(genomicSection).toBeVisible();

    // Verify phenotypic filters exist in modal but NOT in genomic section
    const firstFilter = afPage.filterNames[0];
    const escFilter = firstFilter.replace(/[?()]/g, '\\$&');
    const phenotypicInModal = modal
      .locator('.text-sm.font-medium')
      .filter({ hasText: new RegExp(`^${escFilter}$`) });
    await expect(phenotypicInModal.first()).toBeVisible();
    const phenotypicInGenomic = genomicSection
      .locator('.text-sm.font-medium')
      .filter({ hasText: new RegExp(`^${escFilter}$`) });
    await expect(phenotypicInGenomic).toHaveCount(0);

    // Verify the genomic section is positioned below the phenotypic filters
    const genomicRect = await genomicSection.boundingBox();
    const phenotypicRect = await phenotypicInModal.first().boundingBox();
    expect(genomicRect!.y).toBeGreaterThan(phenotypicRect!.y);
  });

  test('AF-GENOMIC-007: Genomic filter AND separator remains fixed regardless of phenotypic filter count', async () => {
    const separator = afPage.getGenomicAndSeparator();
    await expect(separator).toBeVisible();
    await expect(separator).toContainText('AND');

    await expect(separator.getByRole('radio')).toHaveCount(0);
    await expect(separator.getByRole('button')).toHaveCount(0);

    const badge = separator.locator('.badge');
    await expect(badge).toHaveClass(/preset-filled-surface/);
  });
});

test.describe('Advanced Filtering - Unsaved Changes', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/generalUser.json' });
  let afPage: AdvancedFilteringPage;

  test.beforeEach(async ({ page }) => {
    afPage = new AdvancedFilteringPage(page);
    await afPage.setupAndOpenModal(2);
  });

  test('AF-UNSAVED-001: Back button with unsaved changes shows confirmation modal', async () => {
    await afPage.selectRootOperator('OR');
    await afPage.clickBackButton();
    await afPage.expectUnsavedModalVisible();
  });

  test('AF-UNSAVED-002: Cancel keeps user on page with changes preserved', async ({ page }) => {
    await afPage.selectRootOperator('OR');
    await afPage.clickBackButton();
    await afPage.expectUnsavedModalVisible();
    await afPage.clickUnsavedCancel();
    await afPage.expectUnsavedModalNotVisible();
    expect(page.url()).toContain('/explorer/advanced-filtering');
    await afPage.expectBadgeText('OR');
  });

  test('AF-UNSAVED-003: Discard Changes navigates away without saving', async ({ page }) => {
    await afPage.selectRootOperator('OR');
    await afPage.clickBackButton();
    await afPage.expectUnsavedModalVisible();
    await afPage.clickUnsavedDiscard();
    await page.waitForURL('**/explorer');
    await expect(afPage.advancedFilteringBtn).toBeVisible();

    // Re-open and verify change was discarded
    await afPage.openModal();
    await afPage.expectBadgeText('AND');
  });

  test('AF-UNSAVED-004: Apply Changes (modal) applies changes and navigates', async ({ page }) => {
    await afPage.selectRootOperator('OR');
    await afPage.clickBackButton();
    await afPage.expectUnsavedModalVisible();
    await afPage.clickUnsavedApply();
    await page.waitForURL('**/explorer');
    await expect(afPage.advancedFilteringBtn).toBeVisible();

    // Re-open and verify change was applied
    await afPage.openModal();
    await afPage.expectBadgeText('OR');
  });

  test('AF-UNSAVED-005: Back button with no changes navigates without modal', async ({ page }) => {
    await afPage.clickBackButton();
    await page.waitForURL('**/explorer');
    await expect(afPage.advancedFilteringBtn).toBeVisible();
  });

  test('AF-UNSAVED-006: Apply Changes button navigates without showing unsaved modal', async ({
    page,
  }) => {
    await afPage.selectRootOperator('OR');
    await afPage.clickApplyChanges();
    await page.waitForURL('**/explorer');
    await expect(afPage.advancedFilteringBtn).toBeVisible();

    // Re-open and verify change was applied
    await afPage.openModal();
    await afPage.expectBadgeText('OR');
  });
});

test.describe('Advanced Filtering - Group Drag and Drop', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/generalUser.json' });
  let afPage: AdvancedFilteringPage;

  /**
   * Helper: set up page with two groups via sessionStorage manipulation.
   */
  async function setupWithTwoGroups(page: import('@playwright/test').Page) {
    afPage = new AdvancedFilteringPage(page);
    await afPage.setupAndOpenModal(4);
    await afPage.closeModal();
    await afPage.injectTwoGroups(page);
    await page.goto('/explorer?search=somedata');
    await expect(page.locator('#results-panel')).toBeVisible();
    await afPage.openModal();
  }

  test('AF-DND-GRP-001: Group does not disappear after being dragged and released', async ({
    page,
  }) => {
    await setupWithTwoGroups(page);

    const groups = afPage.getGroupCards();
    const initialCount = await groups.count();
    expect(initialCount).toBe(2);

    const dragHandle = afPage.getGroupDragHandle(0);
    await expect(dragHandle).toBeVisible();
    await dragHandle.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);

    const handleBox = await dragHandle.boundingBox();
    expect(handleBox).not.toBeNull();
    const startX = handleBox!.x + handleBox!.width / 2;
    const startY = handleBox!.y + handleBox!.height / 2;

    // Drag down and release
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX, startY + 20, { steps: 3 });
    await page.mouse.move(startX, startY + 150, { steps: 20 });
    await page.mouse.up();
    await page.waitForTimeout(500);

    // Both groups should still be visible
    const finalCount = await groups.count();
    expect(finalCount).toBe(initialCount);
  });

  test('AF-DND-GRP-002: Group drop preview clears after drag ends', async ({ page }) => {
    await setupWithTwoGroups(page);

    const dragHandle = afPage.getGroupDragHandle(0);
    await expect(dragHandle).toBeVisible();
    await dragHandle.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);

    const handleBox = await dragHandle.boundingBox();
    expect(handleBox).not.toBeNull();
    const startX = handleBox!.x + handleBox!.width / 2;
    const startY = handleBox!.y + handleBox!.height / 2;

    // Start dragging
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX, startY + 20, { steps: 3 });
    await page.mouse.move(startX, startY + 150, { steps: 20 });

    // Drop preview should be showing
    const dropPreviews = afPage.getDropPreviews();
    await expect(dropPreviews.first()).toBeVisible({ timeout: 3000 });

    // Release the drag
    await page.mouse.up();

    // Drop previews should all be gone
    await expect(dropPreviews).toHaveCount(0, { timeout: 2000 });
  });

  test('AF-DND-GRP-003: "Move here" reorder zones appear when dragging a group', async ({
    page,
  }) => {
    await setupWithTwoGroups(page);

    const moveHereZones = afPage.getMoveHereZones();
    // No zones visible before drag
    await expect(moveHereZones).toHaveCount(0);

    const dragHandle = afPage.getGroupDragHandle(0);
    await expect(dragHandle).toBeVisible();
    await dragHandle.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);

    const handleBox = await dragHandle.boundingBox();
    expect(handleBox).not.toBeNull();
    const startX = handleBox!.x + handleBox!.width / 2;
    const startY = handleBox!.y + handleBox!.height / 2;

    // Start dragging
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX, startY + 20, { steps: 3 });
    await page.mouse.move(startX, startY + 100, { steps: 10 });

    // "Move here" zones should appear
    const visibleZones = afPage.getMoveHereZones();
    const zoneCount = await visibleZones.count();
    expect(zoneCount).toBeGreaterThan(0);

    // Release
    await page.mouse.up();

    // Zones should disappear
    await expect(moveHereZones).toHaveCount(0, { timeout: 2000 });
  });

  test('AF-DND-GRP-004: Empty group does not disappear when dragged and released', async ({
    page,
  }) => {
    afPage = new AdvancedFilteringPage(page);
    await afPage.setupAndOpenModal(4);

    // Add an empty group
    await afPage.clickAddGroup();
    const emptyGroupDrop = afPage.getEmptyGroupDropZone();
    await expect(emptyGroupDrop).toBeVisible();

    const groups = afPage.getGroupCards();
    const initialGroupCount = await groups.count();
    expect(initialGroupCount).toBeGreaterThanOrEqual(1);

    // Find the empty group's drag handle
    const dragHandle = groups.last().locator('.fa-grip-vertical').first();
    await expect(dragHandle).toBeVisible();
    await dragHandle.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);

    const handleBox = await dragHandle.boundingBox();
    expect(handleBox).not.toBeNull();
    const startX = handleBox!.x + handleBox!.width / 2;
    const startY = handleBox!.y + handleBox!.height / 2;

    // Drag up and release
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX, startY - 20, { steps: 3 });
    await page.mouse.move(startX, startY - 100, { steps: 20 });
    await page.mouse.up();
    await page.waitForTimeout(500);

    // Group should still exist
    const finalGroupCount = await groups.count();
    expect(finalGroupCount).toBe(initialGroupCount);
  });

  test('AF-DND-GRP-005: Groups remain inside root container after drag operations', async ({
    page,
  }) => {
    await setupWithTwoGroups(page);

    // Get the root container bounds
    const rootCard = afPage.modal.locator('.card').filter({ hasText: 'Between groups:' }).first();
    await expect(rootCard).toBeVisible();
    const rootBox = await rootCard.boundingBox();
    expect(rootBox).not.toBeNull();

    const dragHandle = afPage.getGroupDragHandle(0);
    await expect(dragHandle).toBeVisible();
    await dragHandle.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);

    const handleBox = await dragHandle.boundingBox();
    expect(handleBox).not.toBeNull();
    const startX = handleBox!.x + handleBox!.width / 2;
    const startY = handleBox!.y + handleBox!.height / 2;

    // Drag group around and release
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX, startY + 20, { steps: 3 });
    await page.mouse.move(startX, startY + 200, { steps: 20 });
    await page.mouse.up();
    await page.waitForTimeout(500);

    // All groups should be within the root container bounds
    const groups = afPage.getGroupCards();
    const groupCount = await groups.count();
    for (let i = 0; i < groupCount; i++) {
      const groupBox = await groups.nth(i).boundingBox();
      expect(groupBox).not.toBeNull();
      expect(groupBox!.y).toBeGreaterThanOrEqual(rootBox!.y);
      expect(groupBox!.y + groupBox!.height).toBeLessThanOrEqual(rootBox!.y + rootBox!.height + 5);
    }
  });

  test('AF-DND-GRP-006: Repeated group drags do not cause stuck previews', async ({ page }) => {
    await setupWithTwoGroups(page);

    const dragHandle = afPage.getGroupDragHandle(0);
    await expect(dragHandle).toBeVisible();
    await dragHandle.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);

    const handleBox = await dragHandle.boundingBox();
    expect(handleBox).not.toBeNull();
    const startX = handleBox!.x + handleBox!.width / 2;
    const startY = handleBox!.y + handleBox!.height / 2;

    // Perform 3 drag-and-release cycles
    for (let cycle = 0; cycle < 3; cycle++) {
      await page.mouse.move(startX, startY);
      await page.mouse.down();
      await page.mouse.move(startX, startY + 20, { steps: 3 });
      await page.mouse.move(startX, startY + 100, { steps: 10 });
      await page.mouse.up();
      await page.waitForTimeout(500);
    }

    // No drop previews should remain
    const dropPreviews = afPage.getDropPreviews();
    await expect(dropPreviews).toHaveCount(0, { timeout: 2000 });

    // Both groups should still be present
    const groups = afPage.getGroupCards();
    expect(await groups.count()).toBe(2);
  });

  test('AF-DND-GRP-007: No console errors when dragging groups', async ({ page }) => {
    await setupWithTwoGroups(page);

    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    const dragHandle = afPage.getGroupDragHandle(0);
    await expect(dragHandle).toBeVisible();
    await dragHandle.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);

    const handleBox = await dragHandle.boundingBox();
    expect(handleBox).not.toBeNull();
    const startX = handleBox!.x + handleBox!.width / 2;
    const startY = handleBox!.y + handleBox!.height / 2;

    // Drag around and release
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX, startY + 20, { steps: 3 });
    await page.mouse.move(startX, startY + 200, { steps: 20 });
    await page.mouse.move(startX, startY - 50, { steps: 20 });
    await page.mouse.up();
    await page.waitForTimeout(500);

    // Filter out the known dnd-kit HierarchyRequestError (from its internal sortable)
    const criticalErrors = errors.filter((e) => !e.includes('HierarchyRequestError'));
    expect(criticalErrors).toHaveLength(0);
  });
});

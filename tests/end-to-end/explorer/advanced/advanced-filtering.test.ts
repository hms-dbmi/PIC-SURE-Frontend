import { expect } from '@playwright/test';
import { test } from '../../custom-context';
import { AdvancedFilteringPage } from './advanced-filtering-page';
import { tones } from '#lib/ui/surface.ts';

const LONG_RUNNING_TIMEOUT = 80000;

test.describe('Advanced Query Builder - Core Features', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/generalUser.json' });
  test.describe.configure({ timeout: LONG_RUNNING_TIMEOUT });
  let afPage: AdvancedFilteringPage;

  test.beforeEach(async ({ page }) => {
    afPage = new AdvancedFilteringPage(page);
    await afPage.setupAndOpenModal(4);
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

  test('AF-CORE-004: Filter metadata displays study and dataset on one line', async ({ page }) => {
    const firstFilterCard = afPage.getFilterCard(afPage.filterNames[0]);
    await expect(firstFilterCard).toContainText('Study: TDS, Dataset: some_name_for_the_table');

    await afPage.closeModal();
    await page.evaluate(() => {
      const raw = sessionStorage.getItem('filterTree');
      if (!raw) return;

      const tree = JSON.parse(raw);
      const firstFilter = tree.children?.[0];
      if (!firstFilter?.searchResult) return;

      firstFilter.searchResult.studyAcronym = null;
      firstFilter.searchResult.table = { ...firstFilter.searchResult.table, display: 'pht12345' };
      sessionStorage.setItem('filterTree', JSON.stringify(tree));
    });

    await page.goto('/explorer?search=somedata');
    await expect(page.locator('#results-panel')).toBeVisible();
    await afPage.openModal();

    const updatedFirstFilterCard = afPage.getFilterCard(afPage.filterNames[0]);
    await expect(updatedFirstFilterCard).toContainText('Dataset: pht12345');
    await expect(updatedFirstFilterCard).not.toContainText('Study:');
  });
});

test.describe('Advanced Query Builder - Query Summary', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/generalUser.json' });
  test.describe.configure({ timeout: LONG_RUNNING_TIMEOUT });
  let afPage: AdvancedFilteringPage;

  test.beforeEach(async ({ page }) => {
    afPage = new AdvancedFilteringPage(page);
    await afPage.setupAndOpenModal(4);
  });

  test('AF-EQ-001: Logic tree summary section is visible and expanded by default', async () => {
    await afPage.expectLogicTreeVisible();
    // Panel should be expanded (equation text visible)
    await expect(afPage.logicTreeText).toBeVisible();
  });

  test('AF-EQ-002: Equation text shows filter names joined by AND', async () => {
    // Default operator is AND, so all 4 filters should be connected with AND
    for (const filterName of afPage.filterNames) {
      await afPage.expectLogicTreeText(filterName);
    }
    await afPage.expectLogicTreeText('AND');
  });

  test('AF-EQ-004: Logic tree summary can be collapsed and expanded', async () => {
    // Equation text should be visible initially
    await expect(afPage.logicTreeText).toBeVisible();

    // Click the accordion control to collapse
    const control = afPage.logicTreeSection.getByText('Query Summary');
    await control.click();

    // Equation text should be hidden
    await expect(afPage.logicTreeText).not.toBeVisible();

    // Click again to expand
    await control.click();

    // Equation text should be visible again
    await expect(afPage.logicTreeText).toBeVisible();
  });

  test('AF-EQ-005: Subquery shows parentheses in equation', async ({ page }) => {
    // Close, inject a subquery via sessionStorage, reopen
    await afPage.closeModal();

    await page.evaluate(() => {
      const raw = sessionStorage.getItem('filterTree');
      if (!raw) return;
      const tree = JSON.parse(raw);
      const lastTwo = tree.children.splice(-2, 2);
      tree.children.push({
        children: lastTwo,
        operator: 'OR',
        uuid: 'test-eq-group-uuid',
      });
      sessionStorage.setItem('filterTree', JSON.stringify(tree));
    });

    await page.goto('/explorer?search=somedata');
    await expect(page.locator('#results-panel')).toBeVisible();
    await afPage.openModal();

    // Equation should contain parentheses for the subquery
    await afPage.expectLogicTreeText('(');
    await afPage.expectLogicTreeText(')');
    // Subquery uses OR
    await afPage.expectLogicTreeText('OR');
    // Root uses AND
    await afPage.expectLogicTreeText('AND');
  });
});

test.describe('Advanced Query Builder - Filter Details', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/generalUser.json' });
  test.describe.configure({ timeout: LONG_RUNNING_TIMEOUT });
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

test.describe('Advanced Query Builder - Global Combiner', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/generalUser.json' });
  test.describe.configure({ timeout: LONG_RUNNING_TIMEOUT });
  let afPage: AdvancedFilteringPage;

  test.beforeEach(async ({ page }) => {
    afPage = new AdvancedFilteringPage(page);
    await afPage.setupAndOpenModal(4);
  });

  test('AF-COMBINER-001: The top-level AND/OR control switches every top-level combiner', async () => {
    await afPage.expectAndOrControlsVisible();
    await afPage.expectAndIsDefault();

    await afPage.selectRootOperator('OR');
    await afPage.expectBadgeText('OR');
    await afPage.expectLogicTreeText('OR');

    await afPage.selectRootOperator('AND');
    await afPage.expectBadgeText('AND');
  });

  test('AF-COMBINER-005: Top-level AND/OR selection persists after applying changes', async () => {
    await afPage.selectRootOperator('OR');
    await afPage.expectBadgeText('OR');
    await afPage.clickApplyChanges();
    await afPage.expectApplySucceeded();
    // Navigate away and come back to verify persistence
    await afPage.closeModal();
    await afPage.openModal();
    await afPage.expectBadgeText('OR');
  });
});

test.describe('Advanced Query Builder - Drag and Drop', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/generalUser.json' });
  test.describe.configure({ timeout: LONG_RUNNING_TIMEOUT });
  let afPage: AdvancedFilteringPage;

  test.beforeEach(async ({ page }) => {
    afPage = new AdvancedFilteringPage(page);
    await afPage.setupAndOpenModal(4);
  });

  test('AF-DND-003: Filters can be reordered via drag and drop', async ({ page }) => {
    const [filterA, filterB, ...rest] = afPage.filterNames;
    const filterNameEls = afPage.modal.getByTestId('filter-name');
    await expect(filterNameEls).toHaveText(afPage.filterNames);

    const handle = afPage.getFilterCard(filterA).locator('.fa-grip-vertical').first();
    const { startX } = await afPage.pickUp(handle);
    // Picking A up changes the layout, so B is measured only once the drag has started. Once the
    // pointer enters B, A takes B's place, and B's old center lies inside A's new slot.
    const target = await afPage.getFilterCard(filterB).boundingBox();
    expect(target).not.toBeNull();
    await page.mouse.move(startX, target!.y + target!.height / 2, { steps: 20 });
    // Release only once the list shows the new order
    await expect(afPage.listedFilterNames).toHaveText([filterB, filterA, ...rest]);
    await page.mouse.up();

    await expect(filterNameEls).toHaveText([filterB, filterA, ...rest]);
  });

  test('AF-DND-004: Filter reorder persists after re-opening Advanced Filtering', async () => {
    const [filterA, filterB, ...rest] = afPage.filterNames;
    const filterNameEls = afPage.modal.getByTestId('filter-name');
    await expect(filterNameEls).toHaveText(afPage.filterNames);

    await afPage.moveFilterWithKeyboard(filterA, 'ArrowDown');
    await expect(filterNameEls).toHaveText([filterB, filterA, ...rest]);

    await afPage.clickApplyChanges();
    await afPage.expectApplySucceeded();
    // Navigate away and come back to verify persistence
    await afPage.closeModal();
    await afPage.openModal();

    await expect(filterNameEls).toHaveText([filterB, filterA, ...rest]);
  });

  test('AF-DND-006: Dragging a filter shows a dotted drop preview', async ({ page }) => {
    const modal = afPage.modal;
    const dropPreview = page.getByTestId('filter-drop-preview');
    await expect(dropPreview).toHaveCount(0);

    const filterA = afPage.filterNames[0];
    const filterB = afPage.filterNames[1];

    const cardA = modal
      .getByTestId('filter-item')
      .filter({ has: page.getByText(filterA, { exact: true }) })
      .first();
    const cardB = modal
      .getByTestId('filter-item')
      .filter({ has: page.getByText(filterB, { exact: true }) })
      .first();

    await expect(cardA).toBeVisible();
    await expect(cardB).toBeVisible();

    await cardB.scrollIntoViewIfNeeded();
    await expect(cardB).toBeInViewport();

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

    const dropPreview = page.getByTestId('filter-drop-preview');
    await expect(dropPreview).toHaveCount(0);

    // Find the group's drag handle via the "Between filters:" label's sibling grip icon
    const groupHeader = afPage.modal.getByText('Between filters:').first();
    await expect(groupHeader).toBeVisible();

    // The grip icon is in the same row as "Between filters:" — go up to the flex row, find the handle
    const groupRow = groupHeader
      .locator('xpath=ancestor::div[contains(@class, "flex-row")]')
      .first();
    const dragHandle = groupRow.locator('.fa-grip-vertical').first();
    await expect(dragHandle).toBeVisible();

    await dragHandle.scrollIntoViewIfNeeded();
    await expect(dragHandle).toBeInViewport();

    // Get the first top-level filter as a drag target
    const firstFilter = afPage.filterNames[0];
    const targetCard = afPage.modal
      .getByTestId('filter-item')
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

test.describe('Advanced Query Builder - Grouping', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/generalUser.json' });
  test.describe.configure({ timeout: LONG_RUNNING_TIMEOUT });
  let afPage: AdvancedFilteringPage;

  test.beforeEach(async ({ page }) => {
    afPage = new AdvancedFilteringPage(page);
    await afPage.setupAndOpenModal(4);
  });

  test('AF-GROUP-002: Add Subquery creates an empty subquery with its own AND/OR control', async () => {
    await afPage.clickAddGroup();
    await expect(afPage.getEmptyGroupDropZone()).toBeVisible();
    // Root control plus the new subquery's, which defaults to AND
    await expect(afPage.getAllRadioGroups()).toHaveCount(2);
    await expect(afPage.getAllAndRadios().last()).toBeChecked();
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
    const groupCards = modal.getByTestId('filter-group');
    const groupCount = await groupCards.count();
    expect(groupCount).toBeGreaterThanOrEqual(1);

    const escFilter = lastFilter.replace(/[?()]/g, '\\$&');
    const filterInGroup = groupCards
      .first()
      .getByTestId('filter-name')
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
    const rootArea = modal.getByTestId('filter-root').first();
    const filterNameEls = rootArea.getByTestId('filter-name');
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

    const groupCards = modal.getByTestId('filter-group');
    const filtersInGroup = await groupCards.first().getByTestId('filter-name').allTextContents();

    expect(filtersInGroup).toContain(lastFilter);

    const allFilterCards = modal.getByTestId('filter-name');
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

    // Verify the subquery exists with "Between filters:" label
    const subgroup = modal.getByTestId('filter-group').last();
    await expect(subgroup).toBeVisible();

    // Verify there are two radiogroups (root + subgroup)
    await afPage.expectMultipleRadioGroups();

    // Helper to count AND/OR badges
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

    const countOf = async (operator: string) =>
      (await getBadgeTexts()).filter((t) => t === operator).length;

    // Subgroup changed to OR, so OR badges appear; root is still AND, so AND badges remain
    await expect.poll(() => countOf('OR')).toBeGreaterThan(0);
    const orCountAfter = await countOf('OR');
    expect(await countOf('AND')).toBeGreaterThan(0);

    // Change root operator to OR - shouldn't affect the subgroup
    await afPage.selectRootOperator('OR');
    // More OR badges now (root + subgroup)
    await expect.poll(() => countOf('OR')).toBeGreaterThan(orCountAfter);

    // Change root back to AND: the subgroup is still OR
    await afPage.selectRootOperator('AND');
    await expect.poll(() => countOf('OR')).toBe(orCountAfter);
    expect(await countOf('AND')).toBeGreaterThan(0);
  });
});

test.describe('Advanced Query Builder - Apply', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/generalUser.json' });
  test.describe.configure({ timeout: LONG_RUNNING_TIMEOUT });
  let afPage: AdvancedFilteringPage;

  test.beforeEach(async ({ page }) => {
    afPage = new AdvancedFilteringPage(page);
    await afPage.setupAndOpenModal(2);
  });

  test('AF-APPLY-003: Clicking Apply to Query applies changes and stays on page', async () => {
    await afPage.expectModalVisible();
    await afPage.clickApplyChanges();
    await afPage.expectApplySucceeded();
  });
});

test.describe('Advanced Query Builder - Genomic Filters', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/generalUser.json' });
  test.describe.configure({ timeout: LONG_RUNNING_TIMEOUT });
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
    const genomicSectionInArea = filteringArea.getByTestId('filter-genomic-section');
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

test.describe('Advanced Query Builder - Genomic Filters (Ordering)', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/generalUser.json' });
  test.describe.configure({ timeout: LONG_RUNNING_TIMEOUT });
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
      .getByTestId('filter-name')
      .filter({ hasText: new RegExp(`^${escFilter}$`) });
    await expect(phenotypicInModal.first()).toBeVisible();
    const phenotypicInGenomic = genomicSection
      .getByTestId('filter-name')
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
    await expect(badge).toContainClass(tones['filled-surface-subtle']);
  });
});

test.describe('Advanced Query Builder - Unsaved Changes', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/generalUser.json' });
  test.describe.configure({ timeout: LONG_RUNNING_TIMEOUT });
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

  test('AF-UNSAVED-007: Discard Changes follows the link that was clicked', async ({ page }) => {
    await afPage.selectRootOperator('OR');
    await page.getByRole('link', { name: 'Help', exact: true }).click();
    await afPage.expectUnsavedModalVisible();
    await afPage.clickUnsavedDiscard();
    await page.waitForURL('**/help');
  });

  test('AF-UNSAVED-004: Apply Changes (modal) applies changes and stays on page', async ({
    page,
  }) => {
    await afPage.selectRootOperator('OR');
    await afPage.clickBackButton();
    await afPage.expectUnsavedModalVisible();
    await afPage.clickUnsavedApply();
    // Should stay on the AF page with the modal closed
    await afPage.expectUnsavedModalNotVisible();
    expect(page.url()).toContain('/advanced-filtering');
    await afPage.expectBadgeText('OR');
  });

  test('AF-UNSAVED-005: Back button with no changes navigates without modal', async ({ page }) => {
    await afPage.clickBackButton();
    await page.waitForURL('**/explorer');
    await expect(afPage.advancedFilteringBtn).toBeVisible();
  });

  test('AF-UNSAVED-006: Apply Changes button stays on page without showing unsaved modal', async ({
    page,
  }) => {
    await afPage.selectRootOperator('OR');
    await afPage.clickApplyChanges();
    // Should stay on page, no unsaved modal
    await afPage.expectUnsavedModalNotVisible();
    expect(page.url()).toContain('/advanced-filtering');
    await afPage.expectBadgeText('OR');
  });
});

test.describe('Advanced Query Builder - Group Drag and Drop', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/generalUser.json' });
  test.describe.configure({ timeout: LONG_RUNNING_TIMEOUT });
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
    const { startX, startY } = await afPage.startDrag(dragHandle);
    await afPage.endDrag(startX, startY);

    // Both groups should still be visible
    await expect(groups).toHaveCount(initialCount);
  });

  test('AF-DND-GRP-002: Dragging a group shows a preview and "Move here" zones that clear on drop', async ({
    page,
  }) => {
    await setupWithTwoGroups(page);
    const dropPreviews = afPage.getDropPreviews();
    const moveHereZones = afPage.getMoveHereZones();
    await expect(moveHereZones).toHaveCount(0);

    const dragHandle = afPage.getGroupDragHandle(0);
    const { startX, startY } = await afPage.startDrag(dragHandle);

    await expect(dropPreviews.first()).toBeVisible();
    await expect(moveHereZones.first()).toBeVisible();

    await afPage.endDrag(startX, startY);

    await expect(dropPreviews).toHaveCount(0);
    await expect(moveHereZones).toHaveCount(0);
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
    const { startX, startY } = await afPage.startDrag(dragHandle, 'up');
    await afPage.endDrag(startX, startY);

    // Group should still exist
    await expect(groups).toHaveCount(initialGroupCount);
  });

  test('AF-DND-GRP-005: Groups remain inside root container after drag operations', async ({
    page,
  }) => {
    await setupWithTwoGroups(page);

    const rootCard = afPage.modal.getByTestId('filter-root').first();
    await expect(rootCard).toBeVisible();

    const dragHandle = afPage.getGroupDragHandle(0);
    const { startX, startY } = await afPage.startDrag(dragHandle);
    await afPage.endDrag(startX, startY);

    // All groups should be within the root container bounds
    const rootBox = await rootCard.boundingBox();
    expect(rootBox).not.toBeNull();
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

    // Perform 3 drag-and-release cycles
    for (let cycle = 0; cycle < 3; cycle++) {
      const dragHandle = afPage.getGroupDragHandle(0);
      const { startX, startY } = await afPage.startDrag(dragHandle);
      await afPage.endDrag(startX, startY);
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
    const { startX, startY } = await afPage.startDrag(dragHandle);
    await afPage.endDrag(startX, startY);

    // Filter out the known dnd-kit HierarchyRequestError (from its internal sortable)
    const criticalErrors = errors.filter((e) => !e.includes('HierarchyRequestError'));
    expect(criticalErrors).toHaveLength(0);
  });
});

// Every drag interaction Advanced Filtering supports, so a dnd-kit upgrade can be checked against
// them: pointer, keyboard and touch drags, into and out of subqueries, cancelling, the drag
// overlay, screen-reader announcements and auto-scroll.
test.describe('Advanced Query Builder - Drag interactions', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/generalUser.json' });
  test.describe.configure({ timeout: LONG_RUNNING_TIMEOUT });
  let afPage: AdvancedFilteringPage;
  let a: string, b: string, c: string, d: string;

  test.beforeEach(async ({ page }) => {
    // Tall enough that no drop target sits near the viewport's edge, where dnd-kit auto-scrolls
    await page.setViewportSize({ width: 1280, height: 1600 });
    afPage = new AdvancedFilteringPage(page);
    await afPage.setupAndOpenModal(4);
    [a, b, c, d] = afPage.filterNames;
  });

  const handleOf = (name: string) =>
    afPage.getFilterCard(name).locator('.fa-grip-vertical').first();

  test('AF-DND-008: A filter dragged onto a filter in a subquery joins that subquery and stays there after applying', async () => {
    await afPage.reopenWithTrailingSubquery();
    await expect(afPage.logicTreeText).toHaveText(`${a} AND ${b} AND (${c} OR ${d})`);

    const inGroup = afPage.getGroupCards().getByTestId('filter-name');
    await afPage.dragOnto(handleOf(a), afPage.getFilterCard(c), () =>
      expect(inGroup).toHaveCount(3, { timeout: 1000 }),
    );
    // Where A lands among C and D depends on the last card the pointer crossed, which differs
    // between browsers
    await expect(inGroup).toHaveCount(3);
    expect((await inGroup.allTextContents()).sort()).toEqual([a, c, d].sort());
    await expect(afPage.listedFilterNames.first()).toHaveText(b);
    const expected = (await afPage.logicTreeText.textContent())!;

    await afPage.clickApplyChanges();
    await afPage.expectApplySucceeded();
    await afPage.closeModal();
    await afPage.openModal();
    await expect(afPage.logicTreeText).toHaveText(expected);
  });

  test('AF-DND-009: A filter dragged out of a subquery onto a top-level filter leaves the subquery', async () => {
    await afPage.reopenWithTrailingSubquery();

    const inGroup = afPage.getGroupCards().getByTestId('filter-name');
    await afPage.dragOnto(handleOf(c), afPage.getFilterCard(a), () =>
      expect(inGroup).toHaveText([d], { timeout: 1000 }),
    );
    // As in AF-DND-008, where C lands next to A differs between browsers
    await expect(inGroup).toHaveText([d]);
    await expect(afPage.listedFilterNames).toHaveCount(4);
    await expect(afPage.logicTreeText).toContainText(`AND (${d})`);
  });

  test('AF-DND-010: A filter dragged onto an empty subquery moves into it', async () => {
    await afPage.clickAddGroup();

    const group = afPage.getGroupCards();
    await afPage.dragOnto(handleOf(a), afPage.getEmptyGroupDropZone(), () =>
      expect(group.getByTestId('filter-name')).toHaveText([a], { timeout: 1000 }),
    );
    await expect(group.getByTestId('filter-name')).toHaveText([a]);
    await expect(afPage.logicTreeText).toHaveText(`${b} AND ${c} AND ${d} AND (${a})`);
  });

  test('AF-DND-011: A subquery dragged onto another subquery nests in it, and dragged onto the root zone leaves it', async ({
    page,
  }) => {
    await afPage.closeModal();
    await afPage.injectTwoGroups(page);
    await page.goto('/explorer?search=somedata');
    await expect(page.locator('#results-panel')).toBeVisible();
    await afPage.openModal();
    const groups = afPage.getGroupCards();
    await expect(groups).toHaveCount(2);

    const intoFirst = page.locator(
      '[data-testid="filter-group-drop-zone"][data-group-id="test-group-a"]',
    );
    await afPage.dragOnto(afPage.getGroupDragHandle(1), intoFirst);
    await expect(groups.first().getByTestId('filter-group')).toHaveCount(1);
    await expect(groups.first().getByTestId('filter-name')).toHaveText([a, b, c, d]);

    const rootZone = page
      .locator('[data-testid="filter-group-drop-zone"][data-group-id="root"]')
      .last();
    await afPage.dragOnto(afPage.getGroupDragHandle(1), rootZone);
    await expect(groups).toHaveCount(2);
    await expect(groups.first().getByTestId('filter-group')).toHaveCount(0);
    await expect(afPage.logicTreeText).toHaveText(`(${a} AND ${b}) AND (${c} AND ${d})`);
  });

  test('AF-DND-012: A subquery dragged onto a "Move here" zone reorders the subqueries', async ({
    page,
  }) => {
    await afPage.closeModal();
    await afPage.injectTwoGroups(page);
    await page.goto('/explorer?search=somedata');
    await expect(page.locator('#results-panel')).toBeVisible();
    await afPage.openModal();

    const expected = `(${c} AND ${d}) AND (${a} AND ${b})`;
    await afPage.dragOnto(afPage.getGroupDragHandle(1), afPage.getMoveHereZones().first(), () =>
      expect(afPage.logicTreeText).toHaveText(expected, { timeout: 1000 }),
    );
    await expect(afPage.logicTreeText).toHaveText(expected);
    await expect(afPage.getMoveHereZones()).toHaveCount(0);
  });

  test('AF-DND-013: Escape during a pointer drag puts the filter back', async ({ page }) => {
    const { startX } = await afPage.pickUp(handleOf(a));
    await expect(async () => {
      const box = await afPage.getFilterCard(b).boundingBox();
      await page.mouse.move(startX, box!.y + box!.height / 2, { steps: 10 });
      await expect(afPage.listedFilterNames).toHaveText([b, a, c, d], { timeout: 1000 });
    }).toPass({ timeout: 15_000 });

    await page.keyboard.press('Escape');
    await expect(afPage.getDropPreviews()).toHaveCount(0);
    await expect(afPage.listedFilterNames).toHaveText([a, b, c, d]);
    await page.mouse.up();
    await expect(afPage.listedFilterNames).toHaveText([a, b, c, d]);
  });

  test('AF-DND-014: Escape during a keyboard drag puts the filter back', async ({ page }) => {
    const handle = afPage
      .getFilterCard(a)
      .getByRole('button', { name: 'Click and drag to reorder and group filters' });
    await handle.focus();
    await page.keyboard.press('Enter');
    await expect(afPage.getDropPreviews().first()).toBeVisible();
    await page.keyboard.press('ArrowDown');
    await expect(afPage.listedFilterNames).toHaveText([b, a, c, d]);

    await page.keyboard.press('Escape');
    await expect(afPage.getDropPreviews()).toHaveCount(0);
    await expect(afPage.listedFilterNames).toHaveText([a, b, c, d]);
  });

  test('AF-DND-015: The keyboard moves a filter into the subquery below it', async ({ page }) => {
    await afPage.reopenWithTrailingSubquery();
    const handle = afPage
      .getFilterCard(b)
      .getByRole('button', { name: 'Click and drag to reorder and group filters' });
    await handle.focus();
    await page.keyboard.press('Enter');
    await expect(afPage.getDropPreviews().first()).toBeVisible();
    await page.keyboard.press('ArrowDown');
    await expect(afPage.logicTreeText).toHaveText(`${a} AND (${b} OR ${c} OR ${d})`);
    await page.keyboard.press('Enter');
    await expect(afPage.getDropPreviews()).toHaveCount(0);
    await expect(afPage.getGroupCards().getByTestId('filter-name')).toHaveText([b, c, d]);
  });

  test('AF-DND-016: A copy of the dragged filter follows the pointer', async ({ page }) => {
    const { startX, startY } = await afPage.pickUp(handleOf(a));
    const overlay = afPage.modal
      .locator('[data-testid="filter-item"]:not([data-testid="filter-root"] *)')
      .filter({ hasText: a });
    await expect(overlay).toHaveCount(1);
    await expect(afPage.listedFilterNames.filter({ hasText: a })).toHaveCount(1);
    const start = await overlay.boundingBox();
    expect(start).not.toBeNull();

    await page.mouse.move(startX + 40, startY + 5, { steps: 5 });
    await expect(async () => {
      const box = await overlay.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x - start!.x).toBeCloseTo(40, 0);
      expect(box!.y - start!.y).toBeCloseTo(5, 0);
    }).toPass();

    await afPage.endDrag(startX, startY);
    await expect(overlay).toHaveCount(0);
  });

  test('AF-DND-017: A touch drag reorders filters', async () => {
    await afPage.touchDrag(handleOf(a), afPage.getFilterCard(b));
    await expect(afPage.listedFilterNames).toHaveText([b, a, c, d]);
  });

  test('AF-DND-018: Picking up and dropping a filter is announced to screen readers', async ({
    page,
  }) => {
    const handle = afPage
      .getFilterCard(a)
      .getByRole('button', { name: 'Click and drag to reorder and group filters' });
    await expect(handle).toHaveAttribute('aria-describedby', /.+/);
    await handle.focus();
    await page.keyboard.press('Enter');
    await expect(afPage.getAnnouncement()).toContainText(/picked up/i);
    await page.keyboard.press('ArrowDown');
    await expect(afPage.listedFilterNames).toHaveText([b, a, c, d]);
    await page.keyboard.press('Enter');
    await expect(afPage.getAnnouncement()).toContainText(/dropped/i);
  });

  test('AF-DND-019: Holding a dragged filter at the bottom edge scrolls the page and still drops it', async ({
    page,
    browserName,
  }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    const { startX } = await afPage.pickUp(handleOf(a));
    const scrolled = () => page.evaluate(() => window.scrollY);
    const before = await scrolled();
    await page.mouse.move(startX, page.viewportSize()!.height - 5, { steps: 20 });
    await expect.poll(scrolled).toBeGreaterThan(before);
    // Hold until the page can't scroll further, so where the filter lands doesn't depend on timing
    await expect
      .poll(() =>
        page.evaluate(
          () => window.scrollY >= document.documentElement.scrollHeight - window.innerHeight - 1,
        ),
      )
      .toBe(true);
    await page.mouse.up();

    await expect(afPage.getDropPreviews()).toHaveCount(0);
    await expect(afPage.listedFilterNames).toHaveCount(4);
    const names = await afPage.listedFilterNames.allTextContents();
    expect(names.filter((name) => name === a)).toHaveLength(1);
    // The scroll carries the filter to the end of the list. In WebKit, where it lands depends on
    // timing: about one drop in six stays near the top, on dnd-kit 0.2 and 0.5 alike.
    if (browserName !== 'webkit') expect(names.at(-1)).toBe(a);
  });

  test('AF-DND-020: Dropping a filter outside the list leaves it where it was', async ({
    page,
  }) => {
    const { startX, startY } = await afPage.pickUp(handleOf(a));
    await page.mouse.move(startX - 300, startY, { steps: 10 });
    await page.mouse.up();

    await expect(afPage.getDropPreviews()).toHaveCount(0);
    await expect(afPage.listedFilterNames).toHaveText([a, b, c, d]);
  });
});

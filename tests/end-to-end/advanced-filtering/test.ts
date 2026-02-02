import { expect } from '@playwright/test';
import { test } from '../custom-context';
import { AdvancedFilteringPage } from './advanced-filtering-page';

test.describe('Advanced Filtering - Core Features', () => {
  let afPage: AdvancedFilteringPage;

  test.beforeEach(async ({ page }) => {
    afPage = new AdvancedFilteringPage(page);
    await afPage.setupAndOpenModal();
  });

  test('AF-CORE-001: Advanced Filtering page renders without errors', async () => {
    await afPage.expectModalTitle();
    await afPage.expectModalVisible();
  });

  test('AF-CORE-002: Advanced Filtering page shows all currently added filters', async () => {
    const testFilters = ['test', 'test2', 'test3', 'test4', 'test5', 'test6'];
    for (const filterName of testFilters) {
      await afPage.expectFilterVisible(filterName);
    }
  });

  test('AF-CORE-003: Each filter shown on Advanced Filtering displays Study information', async () => {
    const studies = ['test', 'test2', 'test3'];
    for (const study of studies) {
      await afPage.expectStudyInfoVisible(study);
    }
  });
});

test.describe('Advanced Filtering - Global Combiner', () => {
  let afPage: AdvancedFilteringPage;

  test.beforeEach(async ({ page }) => {
    afPage = new AdvancedFilteringPage(page);
    await afPage.setupAndOpenModal();
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
    // First select OR
    await afPage.selectRootOperator('OR');
    await afPage.expectBadgeText('OR');

    // Then select AND
    await afPage.selectRootOperator('AND');
    await afPage.expectBadgeText('AND');
  });

  test('AF-COMBINER-005: Top-level AND/OR selection persists when revisiting Advanced Filtering', async () => {
    // Select OR
    await afPage.selectRootOperator('OR');
    await afPage.expectBadgeText('OR');

    // Click Apply Changes to save the state
    await afPage.clickApplyChanges();

    // Close and reopen the modal
    await afPage.closeModal();
    await afPage.openModal();

    // Verify OR badges are still visible after reopening (proves persistence)
    await afPage.expectBadgeText('OR');
  });
});

test.describe('Advanced Filtering - Drag and Drop', () => {
  let afPage: AdvancedFilteringPage;

  test.beforeEach(async ({ page }) => {
    afPage = new AdvancedFilteringPage(page);
    await afPage.setupAndOpenModal();
  });

  test('AF-DND-001: Filters have a visual drag handle indicator', async () => {
    await afPage.expectDragHandlesExist();
  });

  test('AF-DND-002: Filters can be picked up by dragging', async ({ page }) => {
    // Get filter cards (items with white background that have drag handles)
    const filterCards = page.locator('.card.bg-white').filter({ has: page.locator('.fa-grip-vertical') });
    const firstCard = filterCards.first();
    await expect(firstCard).toBeVisible();

    // Get the drag handle within the first card
    const dragHandle = firstCard.locator('.fa-grip-vertical').first();
    await expect(dragHandle).toBeVisible();

    // Before dragging, verify the card is NOT invisible
    await expect(firstCard).not.toHaveClass(/\binvisible\b/);

    // Get the bounding box of the drag handle
    const handleBox = await dragHandle.boundingBox();
    expect(handleBox).not.toBeNull();

    // Perform the drag operation using Playwright's mouse API
    const centerX = handleBox!.x + handleBox!.width / 2;
    const centerY = handleBox!.y + handleBox!.height / 2;
    
    await page.mouse.move(centerX, centerY);
    await page.mouse.down();
    
    // Move enough to trigger drag state (move down by 50px)
    await page.mouse.move(centerX, centerY + 50, { steps: 5 });

    // When dragging, the original card should become invisible (dragging state)
    // AND a placeholder with dashed border should appear
    const dragPlaceholder = page.locator('.border-dashed.border-primary-500');
    await expect(dragPlaceholder).toBeVisible({ timeout: 2000 });

    // Release the drag
    await page.mouse.up();

    // After releasing, the placeholder should disappear
    await expect(dragPlaceholder).not.toBeVisible({ timeout: 2000 });
  });

  test('AF-DND-003: Filters can be reordered via drag and drop', async ({ page }) => {
    // Get the filter name elements (all visible filter names in order)
    const filterNames = page.locator('.card.bg-white .text-sm.font-medium');
    
    // Get initial order of all visible filter names
    const initialOrder = await filterNames.allTextContents();
    console.log('[AF-DND-003] Initial order:', initialOrder);
    
    // Initial order should be: test5, test6, test3, test4, test2, test
    // test2 is at index 4 (second to last), test is at index 5 (last)
    expect(initialOrder).toContain('test');
    expect(initialOrder).toContain('test2');
    
    // Find test2 and test filter name elements by exact text content
    // We need to get the cards containing these specific names
    const test2Index = initialOrder.indexOf('test2');
    const testIndex = initialOrder.indexOf('test');
    
    console.log('[AF-DND-003] test2 index:', test2Index, 'test index:', testIndex);
    
    // Get the Nth filter card elements (bg-white cards with drag handles)
    const allFilterCards = page.locator('.card.bg-white').filter({ has: page.locator('.fa-grip-vertical') });
    
    // The last individual filters are test2 and test - find them by getting their name elements
    const test2NameEl = filterNames.filter({ hasText: /^test2$/ });
    const testNameEl = filterNames.filter({ hasText: /^test$/ });
    
    await expect(test2NameEl).toBeVisible();
    await expect(testNameEl).toBeVisible();
    
    // Get the card containing test2 by going up to ancestor
    const test2Card = page.locator('.card.bg-white').filter({ has: page.getByText('test2', { exact: true }) }).filter({ has: page.locator('.fa-grip-vertical') });
    const testCard = page.locator('.card.bg-white').filter({ has: page.getByText('test', { exact: true }) }).filter({ has: page.locator('.fa-grip-vertical') }).last();
    
    // Debug: log the count of matches
    console.log('[AF-DND-003] test2Card count:', await test2Card.count());
    console.log('[AF-DND-003] testCard count:', await testCard.count());
    
    await expect(test2Card.first()).toBeVisible();
    await expect(testCard).toBeVisible();
    
    // Scroll the test card into view to ensure it's visible in the modal
    await testCard.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    
    // Get positions after scroll
    const test2Box = await test2Card.first().boundingBox();
    const testBox = await testCard.boundingBox();
    expect(test2Box).not.toBeNull();
    expect(testBox).not.toBeNull();
    
    console.log('[AF-DND-003] test2 card Y:', test2Box!.y);
    console.log('[AF-DND-003] test card Y:', testBox!.y);
    
    // test2 should be above test (lower Y value)
    expect(test2Box!.y).toBeLessThan(testBox!.y);
    
    // Get drag handle of test2 card (we'll drag it below test)
    const dragHandle = test2Card.first().locator('.fa-grip-vertical').first();
    await expect(dragHandle).toBeVisible();
    
    const handleBox = await dragHandle.boundingBox();
    expect(handleBox).not.toBeNull();
    
    // Perform drag: pick up test2 and move it to swap with test
    // Instead of dragging far below, drag to the center of the test card
    // This should trigger a reorder while staying within the modal
    const startX = handleBox!.x + handleBox!.width / 2;
    const startY = handleBox!.y + handleBox!.height / 2;
    const endX = testBox!.x + testBox!.width / 2;
    // Drop at the lower half of the test card to indicate "drop after"
    const endY = testBox!.y + testBox!.height - 10;
    
    console.log(`[AF-DND-003] Dragging from (${startX.toFixed(0)}, ${startY.toFixed(0)}) to (${endX.toFixed(0)}, ${endY.toFixed(0)})`);
    
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    // Move in more gradual steps to properly trigger drop targets
    await page.mouse.move(startX, startY + 20, { steps: 3 });
    await page.mouse.move(endX, endY, { steps: 20 });
    await page.mouse.up();
    
    // Wait for reorder to take effect
    await page.waitForTimeout(500);
    
    // Verify the modal is still open
    await expect(afPage.modal).toBeVisible();
    
    // Get the new order
    const newOrder = await filterNames.allTextContents();
    console.log('[AF-DND-003] New order:', newOrder);
    
    // After dragging test2 below test, the order should change
    // test2 should now be at a higher index (later) than test
    const newTest2Index = newOrder.indexOf('test2');
    const newTestIndex = newOrder.indexOf('test');
    
    console.log('[AF-DND-003] New test2 index:', newTest2Index, 'New test index:', newTestIndex);
    
    // test2 should now come after test
    expect(newTest2Index).toBeGreaterThan(newTestIndex);
    
    // Verify the combiner badges still exist
    const badges = afPage.getCombinerBadges();
    const badgeCount = await badges.count();
    expect(badgeCount).toBeGreaterThan(0);
  });

  test('AF-DND-004: Filter reorder persists after re-opening Advanced Filtering', async ({ page }) => {
    // Get the filter name elements (all visible filter names in order)
    const filterNames = page.locator('.card.bg-white .text-sm.font-medium');
    
    // Get initial order of all visible filter names
    const initialOrder = await filterNames.allTextContents();
    console.log('[AF-DND-004] Initial order:', initialOrder);
    
    // Initial order should be: test5, test6, test3, test4, test2, test
    expect(initialOrder).toContain('test');
    expect(initialOrder).toContain('test2');
    
    // Get the card containing test2 and test
    const test2Card = page.locator('.card.bg-white').filter({ has: page.getByText('test2', { exact: true }) }).filter({ has: page.locator('.fa-grip-vertical') });
    const testCard = page.locator('.card.bg-white').filter({ has: page.getByText('test', { exact: true }) }).filter({ has: page.locator('.fa-grip-vertical') }).last();
    
    await expect(test2Card.first()).toBeVisible();
    await expect(testCard).toBeVisible();
    
    // Scroll the test card into view
    await testCard.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    
    // Get positions
    const test2Box = await test2Card.first().boundingBox();
    const testBox = await testCard.boundingBox();
    expect(test2Box).not.toBeNull();
    expect(testBox).not.toBeNull();
    
    // Perform the drag to reorder test2 below test
    const dragHandle = test2Card.first().locator('.fa-grip-vertical').first();
    await expect(dragHandle).toBeVisible();
    
    const handleBox = await dragHandle.boundingBox();
    expect(handleBox).not.toBeNull();
    
    const startX = handleBox!.x + handleBox!.width / 2;
    const startY = handleBox!.y + handleBox!.height / 2;
    const endX = testBox!.x + testBox!.width / 2;
    const endY = testBox!.y + testBox!.height - 10;
    
    console.log(`[AF-DND-004] Dragging from (${startX.toFixed(0)}, ${startY.toFixed(0)}) to (${endX.toFixed(0)}, ${endY.toFixed(0)})`);
    
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX, startY + 20, { steps: 3 });
    await page.mouse.move(endX, endY, { steps: 20 });
    await page.mouse.up();
    
    // Wait for reorder to take effect
    await page.waitForTimeout(500);
    
    // Verify the new order - test2 should now come after test
    const newOrder = await filterNames.allTextContents();
    console.log('[AF-DND-004] Order after drag:', newOrder);
    const newTest2Index = newOrder.indexOf('test2');
    const newTestIndex = newOrder.indexOf('test');
    expect(newTest2Index).toBeGreaterThan(newTestIndex);
    
    // Click Apply Changes to persist the reorder
    await afPage.clickApplyChanges();
    console.log('[AF-DND-004] Clicked Apply Changes');
    
    // Close the modal
    await afPage.closeModal();
    console.log('[AF-DND-004] Modal closed');
    
    // Re-open the modal
    await afPage.openModal();
    console.log('[AF-DND-004] Modal re-opened');
    
    // Check the order - it should still have test before test2
    const persistedOrder = await filterNames.allTextContents();
    console.log('[AF-DND-004] Persisted order:', persistedOrder);
    
    const persistedTest2Index = persistedOrder.indexOf('test2');
    const persistedTestIndex = persistedOrder.indexOf('test');
    
    console.log('[AF-DND-004] Persisted test2 index:', persistedTest2Index, 'Persisted test index:', persistedTestIndex);
    
    // Verify the reorder persisted: test2 should still come after test
    expect(persistedTest2Index).toBeGreaterThan(persistedTestIndex);
  });
});

test.describe('Advanced Filtering - Grouping', () => {
  let afPage: AdvancedFilteringPage;

  test.beforeEach(async ({ page }) => {
    afPage = new AdvancedFilteringPage(page);
    await afPage.setupAndOpenModal();
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
    // Get the initial filter count at the top level
    const filterNames = page.locator('.card.bg-white .text-sm.font-medium');
    const initialOrder = await filterNames.allTextContents();
    console.log('[AF-GROUP-006] Initial filters:', initialOrder);
    
    // Create a group
    await afPage.clickAddGroup();
    
    // Verify the empty group drop zone is visible
    const dropZone = afPage.getEmptyGroupDropZone();
    await expect(dropZone).toBeVisible();
    
    // Get a filter card to drag (use the last one "test" to avoid conflicts)
    const testCard = page.locator('.card.bg-white').filter({ has: page.getByText('test', { exact: true }) }).filter({ has: page.locator('.fa-grip-vertical') }).last();
    await expect(testCard).toBeVisible();
    
    // Scroll the test card into view
    await testCard.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    
    // Get the drag handle from the filter
    const dragHandle = testCard.locator('.fa-grip-vertical').first();
    await expect(dragHandle).toBeVisible();
    
    const handleBox = await dragHandle.boundingBox();
    expect(handleBox).not.toBeNull();
    
    // Get the drop zone bounding box (the empty group area)
    const dropZoneBox = await dropZone.boundingBox();
    expect(dropZoneBox).not.toBeNull();
    
    console.log('[AF-GROUP-006] Handle box:', handleBox);
    console.log('[AF-GROUP-006] Drop zone box:', dropZoneBox);
    
    // Drag from the filter card to the empty group drop zone
    const startX = handleBox!.x + handleBox!.width / 2;
    const startY = handleBox!.y + handleBox!.height / 2;
    const endX = dropZoneBox!.x + dropZoneBox!.width / 2;
    const endY = dropZoneBox!.y + dropZoneBox!.height / 2;
    
    console.log(`[AF-GROUP-006] Dragging from (${startX.toFixed(0)}, ${startY.toFixed(0)}) to (${endX.toFixed(0)}, ${endY.toFixed(0)})`);
    
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX, startY + 20, { steps: 3 });
    await page.mouse.move(endX, endY, { steps: 20 });
    await page.mouse.up();
    
    // Wait for the drop to complete
    await page.waitForTimeout(500);
    
    // Verify the filter is now inside the group (the "Drop items here" should be gone)
    await expect(dropZone).not.toBeVisible({ timeout: 2000 });
    
    // The filter "test" should now be inside the nested card (the group)
    // Groups have "Between items:" text, look for the filter inside a group
    const groupCards = page.locator('.card').filter({ hasText: 'Between items:' });
    const groupCount = await groupCards.count();
    console.log('[AF-GROUP-006] Group card count:', groupCount);
    expect(groupCount).toBeGreaterThanOrEqual(1);
    
    // Verify "test" filter is inside a group card (not at root level with "Between groups:" label)
    const filterInGroup = groupCards.first().locator('.card.bg-white .text-sm.font-medium').filter({ hasText: /^test$/ });
    await expect(filterInGroup).toBeVisible();
    console.log('[AF-GROUP-006] Filter "test" is now inside a group');
    
    // Verify the combiner badges still exist  
    const badges = afPage.getCombinerBadges();
    const badgeCount = await badges.count();
    expect(badgeCount).toBeGreaterThan(0);
  });

  test('AF-GROUP-007: Filter dragged into group is removed from original position', async ({ page }) => {
    // Get the initial filter names at the root level (cards in the root area with "Between groups:" context)
    const rootArea = page.locator('.card').filter({ hasText: 'Between groups:' }).first();
    const filterNames = rootArea.locator('.card.bg-white .text-sm.font-medium');
    const initialOrder = await filterNames.allTextContents();
    console.log('[AF-GROUP-007] Initial filters at root:', initialOrder);
    
    // Initial order should contain "test" 
    expect(initialOrder).toContain('test');
    const initialCount = initialOrder.length;
    console.log('[AF-GROUP-007] Initial filter count at root:', initialCount);
    
    // Create a group
    await afPage.clickAddGroup();
    
    // Verify the empty group drop zone is visible
    const dropZone = afPage.getEmptyGroupDropZone();
    await expect(dropZone).toBeVisible();
    
    // Get a filter card to drag (use "test" to match AF-GROUP-006)
    const testCard = page.locator('.card.bg-white').filter({ has: page.getByText('test', { exact: true }) }).filter({ has: page.locator('.fa-grip-vertical') }).last();
    await expect(testCard).toBeVisible();
    
    // Scroll the test card into view
    await testCard.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    
    // Get the drag handle from the filter
    const dragHandle = testCard.locator('.fa-grip-vertical').first();
    await expect(dragHandle).toBeVisible();
    
    const handleBox = await dragHandle.boundingBox();
    expect(handleBox).not.toBeNull();
    
    // Get the drop zone bounding box (the empty group area)
    const dropZoneBox = await dropZone.boundingBox();
    expect(dropZoneBox).not.toBeNull();
    
    // Drag from the filter card to the empty group drop zone
    const startX = handleBox!.x + handleBox!.width / 2;
    const startY = handleBox!.y + handleBox!.height / 2;
    const endX = dropZoneBox!.x + dropZoneBox!.width / 2;
    const endY = dropZoneBox!.y + dropZoneBox!.height / 2;
    
    console.log(`[AF-GROUP-007] Dragging from (${startX.toFixed(0)}, ${startY.toFixed(0)}) to (${endX.toFixed(0)}, ${endY.toFixed(0)})`);
    
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX, startY + 20, { steps: 3 });
    await page.mouse.move(endX, endY, { steps: 20 });
    await page.mouse.up();
    
    // Wait for the drop to complete
    await page.waitForTimeout(500);
    
    // Get the new filter order at the root level (excluding filters inside groups)
    // The root area still shows "Between groups:" but individual filters at root level 
    // should exclude the "test" filter which is now inside a group
    
    // Filters at root level are those that are direct children of the root area
    // and NOT inside a group (which has "Between items:" text)
    const groupCards = page.locator('.card').filter({ hasText: 'Between items:' });
    const groupCount = await groupCards.count();
    console.log('[AF-GROUP-007] Number of groups:', groupCount);
    
    // Get filter names still at root level (not inside any group with "Between items:")
    // Root-level filters are in the area with "Between groups:" but not nested in "Between items:"
    // We count all filter cards, then subtract those inside groups
    const allFilterCards = page.locator('.card.bg-white .text-sm.font-medium');
    const allFilters = await allFilterCards.allTextContents();
    console.log('[AF-GROUP-007] All filters found:', allFilters);
    
    // Filters inside the group
    const filtersInGroup = await groupCards.first().locator('.card.bg-white .text-sm.font-medium').allTextContents();
    console.log('[AF-GROUP-007] Filters inside group:', filtersInGroup);
    
    // Verify "test" is ONLY in the group, not at root level
    expect(filtersInGroup).toContain('test');
    
    // The remaining filters at root should be: test5, test6, test3, test4, test2 (5 filters)
    // The "test" filter should only appear once (inside the group)
    const testOccurrences = allFilters.filter(name => name === 'test').length;
    console.log('[AF-GROUP-007] "test" occurrences in all filters:', testOccurrences);
    expect(testOccurrences).toBe(1); // Should only appear once (inside the group)
    
    // Verify total filter count is still the same (6 filters total)
    expect(allFilters.length).toBe(initialCount);
    console.log('[AF-GROUP-007] Total filter count unchanged:', allFilters.length);
  });
});

test.describe('Advanced Filtering - Apply', () => {
  let afPage: AdvancedFilteringPage;

  test.beforeEach(async ({ page }) => {
    afPage = new AdvancedFilteringPage(page);
    await afPage.setupAndOpenModal();
  });

  test('AF-APPLY-001: Apply to Query button is visible', async () => {
    await afPage.expectApplyButtonVisible();
  });

  test('AF-APPLY-002: Apply button is styled as a primary button', async () => {
    await afPage.expectApplyButtonHasPrimaryStyle();
  });
});

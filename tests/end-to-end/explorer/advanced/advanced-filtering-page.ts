import { expect, type Locator, type Page } from '@playwright/test';
import { mockApiSuccess, mockApiConfig } from '../../custom-context';
import {
  searchResults as mockData,
  searchResultPath,
  facetResultPath,
  facetsResponse,
  conceptsDetailPath,
  detailResponseCat,
  detailResponseCatSameDataset,
  detailResponseCat2,
  detailResForAge,
} from '../../../support/mock-data';
import { clickNthFilterIcon, getOption, userIsLoggedIn } from '../../utils';

const SYNC_URL = '*/**/picsure/hpds/auth/query/sync';

/**
 * Page Object Model for the Advanced Filtering feature.
 * Navigates to the explorer, adds filters through the UI,
 * then opens the Advanced Filtering page from the Tool Suite.
 */
export class AdvancedFilteringPage {
  readonly page: Page;

  // Page content area (was modal when AF was a dialog)
  readonly modal: Locator;
  readonly modalTitle: Locator;
  readonly filteringArea: Locator;

  // Buttons
  readonly advancedFilteringBtn: Locator;
  readonly addGroupButton: Locator;
  readonly applyChangesButton: Locator;

  // Root group controls
  readonly rootAndOrSegment: Locator;
  // Names in the list itself, without the copy in the drag preview
  readonly listedFilterNames: Locator;

  // Equation Summary
  readonly logicTreeSection: Locator;
  readonly logicTreeText: Locator;

  /**
   * The display names of filters added during setup, in order.
   * Tests can reference these instead of hardcoded filter names.
   */
  filterNames: string[] = [];

  /**
   * Study acronyms of the filters added during setup.
   */
  studyAcronyms: string[] = [];

  constructor(page: Page) {
    this.page = page;

    // Page content area — Advanced Filtering is now a route, not a dialog
    this.modal = page.locator('.main-content');
    this.modalTitle = page.getByRole('heading', { name: 'Advanced Query Builder' });
    this.filteringArea = page.locator('.main-content');

    // Buttons
    this.advancedFilteringBtn = page.getByTestId('results-advanced-filtering-open');
    this.addGroupButton = page.getByRole('button', { name: 'Add Subquery' });
    this.applyChangesButton = page.getByRole('button', { name: 'Apply Changes' });

    // Root group AND/OR segment (first one on the page)
    this.rootAndOrSegment = this.modal.getByRole('radiogroup').first();
    this.listedFilterNames = this.modal.getByTestId('filter-root').getByTestId('filter-name');

    // Equation Summary
    this.logicTreeSection = page.getByTestId('filter-logic-summary');
    this.logicTreeText = page.getByTestId('filter-logic-text');
  }

  // ==================== Setup ====================

  /**
   * Mock all required API endpoints for the explorer page.
   */
  async mockApis() {
    await mockApiConfig(this.page);
    await mockApiSuccess(this.page, searchResultPath, mockData);
    await mockApiSuccess(this.page, facetResultPath, facetsResponse);
    await mockApiSuccess(this.page, SYNC_URL, '9999');
  }

  /**
   * Add a categorical filter by clicking the filter icon on a search result row,
   * selecting the first option, and clicking "Add Filter".
   */
  async addCategoricalFilter(
    rowIndex: number,
    detailResponse: Record<string, unknown>,
    selectAll = false,
  ) {
    await mockApiSuccess(
      this.page,
      `${conceptsDetailPath}/${(detailResponse as { dataset: string }).dataset}`,
      detailResponse,
    );
    await clickNthFilterIcon(this.page, rowIndex);
    if (selectAll) {
      const selectAllButton = this.page.getByTestId('ui-options-selection-list-select-all');
      await selectAllButton.click();
    } else {
      const firstItem = await getOption(this.page);
      await firstItem.click();
    }
    await this.page.getByTestId('filter-add').click();
  }

  /**
   * Add a numeric filter by clicking the filter icon on a search result row
   * and clicking "Add Filter" (any value).
   */
  async addNumericFilter(rowIndex: number) {
    await clickNthFilterIcon(this.page, rowIndex);
    await this.page.getByTestId('filter-add').click();
  }

  /**
   * Standard setup: navigate to explorer, add filters, open the Advanced Filtering page.
   */
  async setupAndOpenModal(filterCount: number = 4) {
    this.filterNames = [];
    this.studyAcronyms = [];
    await this.mockApis();
    await this.page.goto('/explorer?search=somedata');
    await userIsLoggedIn(this.page);

    // Add up to filterCount filters
    const addSteps: Array<() => Promise<void>> = [
      // Row 0: categorical "Any family with heart attack?" (TDS)
      async () => {
        await this.addCategoricalFilter(0, detailResponseCat);
        this.filterNames.push('Any family with heart attack?');
        this.studyAcronyms.push('TDS');
      },
      // Row 1: categorical "Are you dead from a heart attack?" (TDS)
      async () => {
        await this.addCategoricalFilter(1, detailResponseCatSameDataset);
        this.filterNames.push('Are you dead from a heart attack?');
        this.studyAcronyms.push('TDS');
      },
      // Row 2: categorical "Any tests today?" (TDS)
      async () => {
        await this.addCategoricalFilter(2, detailResponseCat2);
        this.filterNames.push('Any tests today?');
        this.studyAcronyms.push('TDS');
      },
      // Row 3: numeric "age" (TDS)
      async () => {
        await this.addNumericFilter(3);
        this.filterNames.push('age');
        this.studyAcronyms.push('TDS');
      },
      // Row 5: categorical "age" (Test PSH / phs123)
      async () => {
        await this.addCategoricalFilter(5, detailResForAge, true);
        this.filterNames.push('age');
        this.studyAcronyms.push('Test PSH');
      },
      // Row 7: numeric "West" (Test direction / phs009)
      async () => {
        await this.addNumericFilter(7);
        this.filterNames.push('West');
        this.studyAcronyms.push('Test direction');
      },
    ];

    for (let i = 0; i < Math.min(filterCount, addSteps.length); i++) {
      await addSteps[i]();
    }

    // Wait for results panel to be visible
    await expect(this.page.locator('#results-panel')).toBeVisible();

    // Click the Advanced Filtering button in the Tool Suite
    await expect(this.advancedFilteringBtn).toBeEnabled();
    await this.advancedFilteringBtn.click();

    // Verify the page navigated to Advanced Filtering
    await expect(this.modal).toBeVisible();
    await expect(this.modalTitle).toBeVisible();
    // Wait for filter cards to finish rendering before returning
    if (this.filterNames.length > 0) {
      await this.expectFilterVisible(this.filterNames[0]);
    }
  }

  /**
   * Inject a genomic filter into sessionStorage before navigating.
   * Must be called before navigating to the explorer page.
   */
  async injectGenomicFilter() {
    const genomicFilter = {
      id: 'genomic-test-filter',
      uuid: 'genomic-test-uuid',
      filterType: 'genomic',
      variableName: 'Genomic Filter',
      description: 'Test genomic filter',
      searchResult: null,
      isHarmonized: false,
      categoryValues: [],
    };
    await this.page.addInitScript(
      (filterJson: string) => {
        sessionStorage.setItem('genomicFilters', filterJson);
      },
      JSON.stringify([genomicFilter]),
    );
  }

  /**
   * Setup with genomic filter included.
   */
  async setupWithGenomicAndOpenModal(filterCount: number = 4) {
    await this.injectGenomicFilter();
    await this.setupAndOpenModal(filterCount);
  }

  // ==================== Navigation ====================

  async openModal() {
    await expect(this.advancedFilteringBtn).toBeEnabled();
    await this.advancedFilteringBtn.click();
    await expect(this.modal).toBeVisible();
    await expect(this.modalTitle).toBeVisible();
  }

  async closeModal() {
    await this.clickBackButton();
    await this.page.waitForURL(/\/explorer(\?|$)/);
  }

  // ==================== Filter Locators ====================

  getFilterByName(name: string): Locator {
    return this.modal
      .getByTestId('filter-name')
      .filter({ hasText: new RegExp(`^${name.replace(/[?()]/g, '\\$&')}$`) });
  }

  /** Returns the draggable filter card for a given filter name. */
  getFilterCard(name: string): Locator {
    return this.modal
      .getByTestId('filter-item')
      .filter({ has: this.page.getByText(name, { exact: true }) })
      .first();
  }

  getFilterByStudy(studyName: string): Locator {
    return this.modal.getByText(`Study: ${studyName}`).first();
  }

  getAllDragHandles(): Locator {
    return this.modal.locator('.fa-grip-vertical');
  }

  getAllBadges(): Locator {
    return this.modal.locator('.badge');
  }

  // ==================== AND/OR Segment Controls ====================

  getAndRadio(): Locator {
    return this.modal.getByRole('radio', { name: 'AND' }).first();
  }

  getOrRadio(): Locator {
    return this.modal.getByRole('radio', { name: 'OR' }).first();
  }

  getAllAndRadios(): Locator {
    return this.modal.getByRole('radio', { name: 'AND' });
  }

  getAllOrRadios(): Locator {
    return this.modal.getByRole('radio', { name: 'OR' });
  }

  getAllRadioGroups(): Locator {
    return this.modal.getByRole('radiogroup');
  }

  getRootOperatorRadio(operator: 'AND' | 'OR'): Locator {
    return this.rootAndOrSegment.getByRole('radio', { name: operator });
  }

  async selectRootOperator(operator: 'AND' | 'OR') {
    const radioToClick = this.getRootOperatorRadio(operator);
    await expect(radioToClick).toBeVisible();
    await radioToClick.locator('..').click();

    const expectedBadge = this.getCombinerBadges().filter({
      hasText: new RegExp(`^${operator}$`, 'i'),
    });
    await expect(expectedBadge.first()).toBeVisible();
  }

  getCombinerBadges(): Locator {
    return this.filteringArea.locator('.badge');
  }

  // ==================== Group Operations ====================

  async clickAddGroup() {
    await this.addGroupButton.click();
    await expect(this.getEmptyGroupDropZone()).toBeVisible();
  }

  getEmptyGroupDropZone(): Locator {
    return this.page.getByText('Drop items here');
  }

  async getGroupCount(): Promise<number> {
    return await this.getAllRadioGroups().count();
  }

  // ==================== Apply Changes ====================

  async clickApplyChanges() {
    await this.applyChangesButton.click();
  }

  // ==================== Assertions ====================

  async expectModalVisible() {
    await expect(this.modal).toBeVisible();
  }

  async expectFilterVisible(filterName: string) {
    await expect(this.getFilterByName(filterName)).toBeVisible();
  }

  async expectStudyInfoVisible(studyName: string) {
    await expect(this.getFilterByStudy(studyName)).toBeVisible();
  }

  async expectAndOrControlsVisible() {
    await expect(this.getAndRadio()).toBeVisible();
    await expect(this.getOrRadio()).toBeVisible();
  }

  async expectAndIsDefault() {
    await this.expectBadgeText('AND');
  }

  async expectBadgeText(expectedText: 'AND' | 'OR') {
    const badges = this.getCombinerBadges().filter({
      hasText: new RegExp(`^${expectedText}$`, 'i'),
    });
    await expect(badges.first()).toBeVisible();
  }

  async expectModalClosed() {
    await this.page.waitForURL(/\/explorer(\?|$)/);
    await expect(this.advancedFilteringBtn).toBeVisible();
  }

  async expectApplySucceeded() {
    // User should still be on the advanced-filtering page
    expect(this.page.url()).toContain('/advanced-filtering');
    // The sidebar should have opened (panelOpen auto-opens on filter change)
    await expect(this.page.locator('#results-side-panel')).toBeVisible();
  }

  async expectAddGroupButtonVisible() {
    await expect(this.addGroupButton).toBeVisible();
  }

  async expectMultipleRadioGroups() {
    const groupCount = await this.getAllRadioGroups().count();
    expect(groupCount).toBeGreaterThan(1);
  }

  async expectLogicTreeVisible() {
    await expect(this.logicTreeSection).toBeVisible();
  }

  async expectLogicTreeText(expected: string) {
    await expect(this.logicTreeText).toContainText(expected);
  }

  // ==================== Unsaved Changes Modal ====================

  getUnsavedModal(): Locator {
    return this.page.getByRole('dialog').filter({ hasText: 'Unsaved Changes' });
  }

  getBackButton(): Locator {
    return this.page.getByRole('button', { name: /back to explore/i });
  }

  async clickBackButton() {
    await this.getBackButton().click();
  }

  async expectUnsavedModalVisible() {
    await expect(this.getUnsavedModal()).toBeVisible();
  }

  async expectUnsavedModalNotVisible() {
    await expect(this.getUnsavedModal()).not.toBeVisible();
  }

  async clickUnsavedCancel() {
    await this.getUnsavedModal().getByTestId('ui-modal-close').click();
  }

  async clickUnsavedDiscard() {
    await this.getUnsavedModal().getByRole('button', { name: 'Discard Changes' }).click();
  }

  async clickUnsavedApply() {
    await this.getUnsavedModal().getByRole('button', { name: 'Apply Changes' }).click();
  }

  // ==================== Group DnD Helpers ====================

  /**
   * Create a tree with two groups via sessionStorage.
   * Must be called after closeModal() and before re-navigating.
   * Returns the group UUIDs for later reference.
   */
  async injectTwoGroups(page: import('@playwright/test').Page) {
    await page.evaluate(() => {
      const raw = sessionStorage.getItem('filterTree');
      if (!raw) return;
      const tree = JSON.parse(raw);
      // Split children into two groups of ~equal size
      const half = Math.ceil(tree.children.length / 2);
      const firstHalf = tree.children.splice(0, half);
      const secondHalf = tree.children.splice(0);
      tree.children = [
        { children: firstHalf, operator: 'AND', uuid: 'test-group-a' },
        { children: secondHalf, operator: 'AND', uuid: 'test-group-b' },
      ];
      sessionStorage.setItem('filterTree', JSON.stringify(tree));
    });
  }

  getGroupCards(): Locator {
    return this.modal.getByTestId('filter-group');
  }

  getGroupDragHandle(groupIndex: number): Locator {
    const group = this.getGroupCards().nth(groupIndex);
    return group.locator('.fa-grip-vertical').first();
  }

  getDropPreviews(): Locator {
    return this.page.getByTestId('filter-drop-preview');
  }

  getMoveHereZones(): Locator {
    return this.page.getByTestId('filter-group-drop-zone').filter({ hasText: 'Move here' });
  }

  /**
   * Get a drag handle ready: wait for the previous drop to finish (a press during its animation
   * doesn't start a new drag), center the handle in its scroll container and wait for it to hold
   * still for a frame. dnd-kit scrolls during a drag when the card nears the container's edge (the
   * pointer sensor auto-scrolls within 20% of it, the keyboard sensor scrolls the card into view on
   * pickup and after each move), which moves the cards under a position Playwright holds still, so
   * where the card lands would depend on how fast the machine scrolls. Playwright's actionability
   * checks aren't used to wait: they scroll the container back to the top.
   */
  private async readyToDrag(handle: Locator) {
    await expect(this.page.locator('[data-dnd-dragging]')).toHaveCount(0);
    await expect(handle).toBeVisible();
    await handle.evaluate((el) => {
      el.scrollIntoView({ block: 'center' });
      return new Promise<void>((resolve) => {
        let last = '';
        const tick = () => {
          const { x, y } = el.getBoundingClientRect();
          if (`${x},${y}` === last) return resolve();
          last = `${x},${y}`;
          requestAnimationFrame(tick);
        };
        tick();
      });
    });
  }

  /**
   * Move a filter with dnd-kit's keyboard sensor: pick up, arrow keys, drop. Assumes a flat list,
   * where each press moves the filter one place.
   */
  async moveFilterWithKeyboard(filterName: string, key: 'ArrowDown' | 'ArrowUp', presses = 1) {
    const handle = this.getFilterCard(filterName).getByRole('button', {
      name: 'Click and drag to reorder and group filters',
    });
    await this.readyToDrag(handle);
    const names = this.listedFilterNames;
    const from = (await names.allTextContents()).indexOf(filterName);
    await handle.focus();
    await this.page.keyboard.press('Enter');
    await expect(this.getDropPreviews().first()).toBeVisible();
    for (let i = 0; i < presses; i++) await this.page.keyboard.press(key);
    // Drop only once the move shows
    await expect(names.nth(from + (key === 'ArrowDown' ? presses : -presses))).toHaveText(
      filterName,
    );
    await this.page.keyboard.press('Enter');
  }

  /**
   * Press the pointer on a drag handle and resolve once dnd-kit has started the drag. A mouse press
   * on a handle activates immediately, so the pointer hasn't moved and nothing has been reordered
   * yet: other cards can be measured in the drag layout and approached from where they are.
   */
  async pickUp(handle: Locator): Promise<{ startX: number; startY: number }> {
    await this.readyToDrag(handle);

    const handleBox = await handle.boundingBox();
    expect(handleBox).not.toBeNull();
    const startX = handleBox!.x + handleBox!.width / 2;
    const startY = handleBox!.y + handleBox!.height / 2;

    await this.page.mouse.move(startX, startY);
    await this.page.mouse.down();
    await expect(this.getDropPreviews().first()).toBeVisible();

    return { startX, startY };
  }

  /**
   * Pick up a handle and drag it `distance` pixels up or down, clamped to the filter list's box.
   *
   * Returns the start coordinates so callers can release at a known position.
   */
  async startDrag(
    handle: Locator,
    direction: 'down' | 'up' = 'down',
    distance = 80,
  ): Promise<{ startX: number; startY: number }> {
    const { startX, startY } = await this.pickUp(handle);

    const containerBox = await this.modal.locator('.overflow-auto').first().boundingBox();
    if (containerBox) {
      const maxDown = containerBox.y + containerBox.height - startY - 10;
      const maxUp = startY - containerBox.y - 10;
      if (direction === 'down') {
        distance = Math.min(distance, maxDown);
      } else {
        distance = Math.min(distance, maxUp);
      }
    }
    distance = Math.max(distance, 30);

    const sign = direction === 'down' ? 1 : -1;
    await this.page.mouse.move(startX, startY + sign * 20, { steps: 3 });
    await this.page.mouse.move(startX, startY + sign * distance, { steps: 10 });

    return { startX, startY };
  }

  /**
   * Release the drag. Moves the pointer back to the start position first so
   * the pointerup event lands on an element dnd-kit is listening on.
   */
  async endDrag(startX: number, startY: number) {
    await this.page.mouse.move(startX, startY, { steps: 5 });
    await this.page.mouse.up();
    await expect(this.getDropPreviews()).toHaveCount(0);
  }

  // ==================== Genomic Filter Locators ====================

  getGenomicFiltersSection(): Locator {
    return this.page.getByTestId('filter-genomic-section');
  }

  getGenomicFilterItems(): Locator {
    return this.page.getByTestId('filter-genomic-item');
  }

  getGenomicAndSeparator(): Locator {
    return this.page.getByTestId('filter-genomic-separator');
  }
}

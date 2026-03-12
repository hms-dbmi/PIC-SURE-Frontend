import { expect, type Locator, type Page } from '@playwright/test';
import { mockApiSuccess } from '../custom-context';
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
} from '../mock-data';
import { clickNthFilterIcon, getOption } from '../utils';

const SYNC_URL = '*/**/picsure/v3/query/sync';

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
    this.modalTitle = page.getByRole('heading', { name: 'Advanced Filtering' });
    this.filteringArea = page.locator('.main-content');

    // Buttons
    this.advancedFilteringBtn = page.getByTestId('advanced-filtering-btn');
    this.addGroupButton = page.getByRole('button', { name: 'Add Group' });
    this.applyChangesButton = page.getByRole('button', { name: 'Apply Changes' });

    // Root group AND/OR segment (first one on the page)
    this.rootAndOrSegment = this.modal.getByRole('radiogroup').first();
  }

  // ==================== Setup ====================

  /**
   * Mock all required API endpoints for the explorer page.
   */
  async mockApis() {
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
      const selectAllButton = this.page.locator('#select-all');
      await selectAllButton.click();
    } else {
      const firstItem = await getOption(this.page);
      await firstItem.click();
    }
    await this.page.getByTestId('add-filter').click();
  }

  /**
   * Add a numeric filter by clicking the filter icon on a search result row
   * and clicking "Add Filter" (any value).
   */
  async addNumericFilter(rowIndex: number) {
    await clickNthFilterIcon(this.page, rowIndex);
    await this.page.getByTestId('add-filter').click();
  }

  /**
   * Standard setup: navigate to explorer, add filters, open the Advanced Filtering page.
   */
  async setupAndOpenModal(filterCount: number = 4) {
    await this.mockApis();
    await this.page.goto('/explorer?search=somedata');

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
      .locator('.text-sm.font-medium')
      .filter({ hasText: new RegExp(`^${name.replace(/[?()]/g, '\\$&')}$`) });
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

  getAndBadges(): Locator {
    return this.filteringArea.locator('.badge').filter({ hasText: /^AND$/i });
  }

  getOrBadges(): Locator {
    return this.filteringArea.locator('.badge').filter({ hasText: /^OR$/i });
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

  async expectModalTitle() {
    await expect(this.modalTitle).toBeVisible();
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

  async expectDragHandlesExist() {
    const count = await this.getAllDragHandles().count();
    expect(count).toBeGreaterThan(0);
  }

  async expectAndIsDefault() {
    const andBadges = this.getAndBadges();
    const count = await andBadges.count();
    expect(count).toBeGreaterThan(0);
  }

  async expectBadgeText(expectedText: 'AND' | 'OR') {
    const badges = this.getCombinerBadges().filter({
      hasText: new RegExp(`^${expectedText}$`, 'i'),
    });
    await expect(badges.first()).toBeVisible();
  }

  async expectApplyButtonVisible() {
    await expect(this.applyChangesButton).toBeVisible();
  }

  async expectApplyButtonHasPrimaryStyle() {
    await expect(this.applyChangesButton).toHaveClass(/preset-filled-primary/);
  }

  async expectModalClosed() {
    await this.page.waitForURL(/\/explorer(\?|$)/);
    await expect(this.advancedFilteringBtn).toBeVisible();
  }

  async expectAddGroupButtonVisible() {
    await expect(this.addGroupButton).toBeVisible();
  }

  async expectNewGroupHasAndOrControls() {
    const andOptions = this.getAllAndRadios();
    const orOptions = this.getAllOrRadios();

    const andCount = await andOptions.count();
    const orCount = await orOptions.count();

    // Should have more than one set (root + new group)
    expect(andCount).toBeGreaterThan(1);
    expect(orCount).toBeGreaterThan(1);
  }

  async expectMultipleRadioGroups() {
    const groupCount = await this.getAllRadioGroups().count();
    expect(groupCount).toBeGreaterThan(1);
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
    await this.getUnsavedModal().getByTestId('modal-close-button').click();
  }

  async clickUnsavedDiscard() {
    await this.getUnsavedModal().getByRole('button', { name: 'Discard Changes' }).click();
  }

  async clickUnsavedApply() {
    await this.getUnsavedModal().getByRole('button', { name: 'Apply Changes' }).click();
  }

  // ==================== Genomic Filter Locators ====================

  getGenomicFiltersSection(): Locator {
    return this.page.getByTestId('genomic-filters-section');
  }

  getGenomicFilterItems(): Locator {
    return this.page.getByTestId('genomic-filter-item');
  }

  getGenomicAndSeparator(): Locator {
    return this.page.getByTestId('genomic-and-separator');
  }
}

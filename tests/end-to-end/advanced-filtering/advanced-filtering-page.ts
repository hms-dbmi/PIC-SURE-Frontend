import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Page Object Model for the Advanced Filtering feature.
 * Provides reusable locators and helper methods for testing the Advanced Filtering modal.
 *
 * Usage:
 *   const afPage = new AdvancedFilteringPage(page);
 *   await afPage.openModal();
 *   await afPage.clickAddGroup();
 */
export class AdvancedFilteringPage {
  readonly page: Page;

  // Modal elements
  readonly modal: Locator;
  readonly modalTitle: Locator;
  readonly filteringArea: Locator;

  // Buttons
  readonly openModalButton: Locator;
  readonly addGroupButton: Locator;
  readonly applyChangesButton: Locator;
  readonly consentButton: Locator;

  // Root group controls
  readonly rootAndOrSegment: Locator;

  // Dynamic locators (methods that return locators)
  constructor(page: Page) {
    this.page = page;

    // Modal structure
    this.modal = page.getByRole('dialog');
    this.modalTitle = page.getByRole('heading', { name: 'Advanced Filters' });
    this.filteringArea = page.getByRole('article');

    // Buttons
    this.consentButton = page.getByTestId('acceptGoogleConsent');
    this.openModalButton = page.getByRole('button', { name: 'Open Advanced Filters' });
    this.addGroupButton = page.getByRole('button', { name: 'Add Group' });
    this.applyChangesButton = this.filteringArea.getByRole('button', { name: 'Apply Changes' });

    // Root group AND/OR segment (first one on the page)
    this.rootAndOrSegment = page.getByRole('radiogroup').first();
  }

  // ==================== Navigation ====================

  async goto() {
    console.log('[AF] Navigating to /login');
    await this.page.goto('/login');
  }

  async acceptConsent() {
    console.log('[AF] Clicking consent button');
    await this.consentButton.click();
  }

  async openModal() {
    console.log('[AF] Opening Advanced Filters modal');
    await expect(this.openModalButton).toBeVisible();
    await this.openModalButton.click();
    await expect(this.modal).toBeVisible();
    console.log('[AF] Modal opened successfully');
  }

  async closeModal() {
    console.log('[AF] Closing modal');
    await this.page.keyboard.press('Escape');
    await expect(this.modal).not.toBeVisible();
    console.log('[AF] Modal closed');
  }

  async setupAndOpenModal() {
    await this.goto();
    await this.acceptConsent();
    await this.openModal();
  }

  // ==================== Filter Locators ====================

  getFilterByName(name: string): Locator {
    return this.page.getByText(name, { exact: true });
  }

  getFilterByStudy(studyName: string): Locator {
    return this.page.getByText(`Study: ${studyName}`, { exact: true });
  }

  getAllDragHandles(): Locator {
    return this.page.locator('.fa-grip-vertical');
  }

  getAllBadges(): Locator {
    return this.page.locator('.badge');
  }

  getAndBadges(): Locator {
    return this.filteringArea.locator('.badge').filter({ hasText: /^AND$/i });
  }

  getOrBadges(): Locator {
    return this.filteringArea.locator('.badge').filter({ hasText: /^OR$/i });
  }

  // ==================== AND/OR Segment Controls ====================

  getAndRadio(): Locator {
    return this.page.getByRole('radio', { name: 'AND' }).first();
  }

  getOrRadio(): Locator {
    return this.page.getByRole('radio', { name: 'OR' }).first();
  }

  getAllAndRadios(): Locator {
    return this.page.getByRole('radio', { name: 'AND' });
  }

  getAllOrRadios(): Locator {
    return this.page.getByRole('radio', { name: 'OR' });
  }

  getAllRadioGroups(): Locator {
    return this.page.getByRole('radiogroup');
  }

  getRootOperatorRadio(operator: 'AND' | 'OR'): Locator {
    return this.rootAndOrSegment.getByRole('radio', { name: operator });
  }

  async selectRootOperator(operator: 'AND' | 'OR') {
    console.log(`[AF] Selecting root operator: ${operator}`);

    const radioToClick = this.getRootOperatorRadio(operator);
    await expect(radioToClick).toBeVisible();

    // Click the parent container of the radio (the clickable segment item)
    await radioToClick.locator('..').click();

    // Wait for UI to update - verify the combiner badges changed
    console.log(`[AF] Waiting for badges to update to ${operator}`);
    const expectedBadge = this.getCombinerBadges().filter({
      hasText: new RegExp(`^${operator}$`, 'i'),
    });
    await expect(expectedBadge.first()).toBeVisible();
    console.log(`[AF] Root operator set to ${operator}`);
  }

  getCombinerBadges(): Locator {
    return this.filteringArea.locator('.badge');
  }

  // ==================== Group Operations ====================

  async clickAddGroup() {
    console.log('[AF] Clicking Add Group button');
    await this.addGroupButton.click();
    // Wait for the drop zone to appear
    await expect(this.getEmptyGroupDropZone()).toBeVisible();
    console.log('[AF] New group added');
  }

  getEmptyGroupDropZone(): Locator {
    return this.page.getByText('Drop items here');
  }

  async getGroupCount(): Promise<number> {
    const count = await this.getAllRadioGroups().count();
    console.log(`[AF] Current group count: ${count}`);
    return count;
  }

  // ==================== Apply Changes ====================

  async clickApplyChanges() {
    console.log('[AF] Clicking Apply Changes');
    await this.applyChangesButton.click();
  }

  // ==================== Assertions ====================

  async expectModalVisible() {
    console.log('[AF] Asserting modal is visible');
    await expect(this.modal).toBeVisible();
  }

  async expectModalTitle() {
    console.log('[AF] Asserting modal title');
    await expect(this.modalTitle).toBeVisible();
  }

  async expectFilterVisible(filterName: string) {
    console.log(`[AF] Asserting filter "${filterName}" is visible`);
    await expect(this.getFilterByName(filterName)).toBeVisible();
  }

  async expectStudyInfoVisible(studyName: string) {
    console.log(`[AF] Asserting study info "${studyName}" is visible`);
    await expect(this.getFilterByStudy(studyName)).toBeVisible();
  }

  async expectAndOrControlsVisible() {
    console.log('[AF] Asserting AND/OR controls are visible');
    await expect(this.getAndRadio()).toBeVisible();
    await expect(this.getOrRadio()).toBeVisible();
  }

  async expectDragHandlesExist() {
    console.log('[AF] Asserting drag handles exist');
    const count = await this.getAllDragHandles().count();
    console.log(`[AF] Found ${count} drag handles`);
    expect(count).toBeGreaterThan(0);
  }

  async expectAndIsDefault() {
    console.log('[AF] Asserting AND is the default combiner');
    const andBadges = this.getAndBadges();
    const count = await andBadges.count();
    console.log(`[AF] Found ${count} AND badges`);
    expect(count).toBeGreaterThan(0);
  }

  async expectBadgeText(expectedText: 'AND' | 'OR') {
    console.log(`[AF] Asserting combiner badges show ${expectedText}`);
    const badges = this.getCombinerBadges().filter({
      hasText: new RegExp(`^${expectedText}$`, 'i'),
    });
    await expect(badges.first()).toBeVisible();
    console.log(`[AF] Badge text verified as ${expectedText}`);
  }

  async expectApplyButtonVisible() {
    console.log('[AF] Asserting Apply Changes button is visible');
    await expect(this.applyChangesButton).toBeVisible();
  }

  async expectApplyButtonHasPrimaryStyle() {
    console.log('[AF] Asserting Apply Changes button has primary style');
    await expect(this.applyChangesButton).toHaveClass(/preset-filled-primary/);
  }

  async expectAddGroupButtonVisible() {
    console.log('[AF] Asserting Add Group button is visible');
    await expect(this.addGroupButton).toBeVisible();
  }

  async expectNewGroupHasAndOrControls() {
    console.log('[AF] Asserting new group has AND/OR controls');
    const andOptions = this.getAllAndRadios();
    const orOptions = this.getAllOrRadios();

    const andCount = await andOptions.count();
    const orCount = await orOptions.count();

    console.log(`[AF] AND radios: ${andCount}, OR radios: ${orCount}`);

    // Should have more than one set (root + new group)
    expect(andCount).toBeGreaterThan(1);
    expect(orCount).toBeGreaterThan(1);
  }

  async expectMultipleRadioGroups() {
    console.log('[AF] Asserting multiple radio groups exist');
    const groupCount = await this.getAllRadioGroups().count();
    console.log(`[AF] Found ${groupCount} radio groups`);
    expect(groupCount).toBeGreaterThan(1);
  }

  // ==================== Debug Helpers ====================

  async logCurrentState() {
    console.log('[AF] === Current State ===');
    console.log(`[AF] Modal visible: ${await this.modal.isVisible()}`);
    console.log(`[AF] Total combiner badges: ${await this.getCombinerBadges().count()}`);
    console.log(`[AF] AND badges: ${await this.getAndBadges().count()}`);
    console.log(`[AF] OR badges: ${await this.getOrBadges().count()}`);
    console.log(`[AF] Drag handles: ${await this.getAllDragHandles().count()}`);
    console.log(`[AF] Radio groups: ${await this.getAllRadioGroups().count()}`);
    console.log('[AF] === End State ===');
  }
}

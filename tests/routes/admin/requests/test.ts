import { expect } from '@playwright/test';
import { test, mockApiSuccess, mockApiFail } from '../../../custom-context';
import {
  sites as mockSites,
  status as mockStatus,
  metadata as mockMetadata,
} from '../../../mock-data';

const dummyUuid = '6d405d0f-8243-4494-8bd3-8820cd33d836';
const dummyDate = '2024-01-01';

test.describe('data requests', () => {
  test.beforeEach(async ({ context }) => {
    await mockApiSuccess(context, '*/**/picsure/proxy/uploader/sites', mockSites);
  });
  test.describe('step 1', () => {
    test('Should load step 1 on landing', async ({ page }) => {
      // Given
      await page.goto('/admin/requests');

      // Then
      await expect(page.getByTestId('v-stepper-step-1')).toBeVisible();
    });
    test('Should be active step', async ({ page }) => {
      // Given
      await page.goto('/admin/requests');

      // Then
      await expect(page.getByTestId('v-stepper-step-1')).toHaveAttribute('aria-current', 'step');
    });
    test('Should validate uuid provided', async ({ page }) => {
      // Given
      await page.goto('/admin/requests');

      // When
      await page.getByLabel('Dataset Id').fill('cvfbfbd');

      // Then
      const invalid = await page
        .getByLabel('Dataset Id')
        .evaluate((element: HTMLInputElement) => element.validationMessage);
      await expect(invalid).toContain('Please match the requested format.');
    });
    test('Should not advance to step 2 when api status request fails', async ({ page }) => {
      // Given
      await mockApiFail(page, `*/**/picsure/proxy/uploader/status/${dummyUuid}`, 'failed');
      await page.goto('/admin/requests');
      await page.getByLabel('Dataset Id').fill(dummyUuid);

      // Then
      await expect(page.getByTestId('v-stepper-step-2')).not.toBeVisible();
      await expect(page.getByTestId('v-stepper-step-1')).toHaveAttribute('aria-current', 'step');
    });
    test('Should not advance to step 2 when api metadata request fails', async ({ page }) => {
      // Given
      await mockApiSuccess(page, `*/**/picsure/proxy/uploader/status/${dummyUuid}`, mockStatus);
      await mockApiFail(page, `*/**/picsure/query/${dummyUuid}/metadata`, 'failed');
      await page.goto('/admin/requests');
      await page.getByLabel('Dataset Id').fill(dummyUuid);

      // Then
      await expect(page.getByTestId('v-stepper-step-2')).not.toBeVisible();
      await expect(page.getByTestId('v-stepper-step-1')).toHaveAttribute('aria-current', 'step');
    });
    test('Should populate error if status fails', async ({ page }) => {
      // Given
      await mockApiFail(page, `*/**/picsure/proxy/uploader/status/${dummyUuid}`, 'failed');
      await page.goto('/admin/requests');
      await page.getByLabel('Dataset Id').fill(dummyUuid);

      // Then
      await expect(page.locator('.snackbar-wrapper .variant-filled-error')).toBeVisible();
    });
    test('Should populate error if metadata fails', async ({ page }) => {
      // Given
      await mockApiSuccess(page, `*/**/picsure/proxy/uploader/status/${dummyUuid}`, mockStatus);
      await mockApiFail(page, `*/**/picsure/query/${dummyUuid}/metadata`, 'failed');
      await page.goto('/admin/requests');
      await page.getByLabel('Dataset Id').fill(dummyUuid);

      // Then
      await expect(page.locator('.snackbar-wrapper .variant-filled-error')).toBeVisible();
    });
  });
  test.describe('step 2', () => {
    test.beforeEach(async ({ page }) => {
      await mockApiSuccess(page, `*/**/picsure/proxy/uploader/status/${dummyUuid}`, mockStatus);
      await mockApiSuccess(page, `*/**/picsure/query/${dummyUuid}/metadata`, mockMetadata);
    });
    test('Should load step 2 when valid uuid provided', async ({ page }) => {
      // Given
      await page.goto('/admin/requests');

      // When
      await page.getByLabel('Dataset Id').fill(dummyUuid);

      // Then
      await expect(page.getByTestId('v-stepper-step-2')).toBeVisible();
    });
    test('Should be active step', async ({ page }) => {
      // Given
      await page.goto('/admin/requests');
      await page.getByLabel('Dataset Id').fill(dummyUuid);

      // Then
      await expect(page.getByTestId('v-stepper-step-2')).toBeVisible();
      await expect(page.getByTestId('v-stepper-step-2')).toHaveAttribute('aria-current', 'step');
    });
    test('Should show data request summary modal', async ({ page }) => {
      // Given
      await page.goto('/admin/requests');
      await page.getByLabel('Dataset Id').fill(dummyUuid);

      // When
      await page.getByTestId('data-request-btn').click();

      // Then
      const modal = page.getByTestId('modal-component');
      await expect(modal).toBeVisible();
      await expect(modal.getByTestId('modal-wrapper-header')).toContainText('Data Request Summary');
    });
  });
  test.describe('step 3', () => {
    test.beforeEach(async ({ page }) => {
      await mockApiSuccess(page, `*/**/picsure/proxy/uploader/status/${dummyUuid}`, mockStatus);
      await mockApiSuccess(page, `*/**/picsure/query/${dummyUuid}/metadata`, mockMetadata);
      await mockApiSuccess(
        page,
        `*/**/picsure/proxy/uploader/status/${dummyUuid}/approve?date=${dummyDate}`,
        {
          ...mockStatus,
          approved: dummyDate,
        },
      );
    });
    test('Should load step 3 when approval date is provided', async ({ page }) => {
      // Given
      await page.goto('/admin/requests');
      await page.getByLabel('Dataset Id').fill(dummyUuid);

      // When
      await expect(page.getByTestId('v-stepper-step-2')).toBeVisible();
      await page.getByLabel('Date approved').fill(dummyDate);

      // Then
      await expect(page.getByTestId('v-stepper-step-3')).toBeVisible();
    });
    test('Should be active step', async ({ page }) => {
      // Given
      await page.goto('/admin/requests');
      await page.getByLabel('Dataset Id').fill(dummyUuid);

      // When
      await page.getByLabel('Date approved').fill(dummyDate);

      // Then
      await expect(page.getByTestId('v-stepper-step-3')).toHaveAttribute('aria-current', 'step');
    });
    test('Should show Data Storage Location info modal', async ({ page }) => {
      // Given
      await page.goto('/admin/requests');
      await page.getByLabel('Dataset Id').fill(dummyUuid);
      await page.getByLabel('Date approved').fill(dummyDate);

      // When
      await page.getByTestId('data-loc-modal-btn').click();

      // Then
      const modal = page.getByTestId('modal-component');
      await expect(modal).toBeVisible();
      await expect(modal.getByTestId('modal-wrapper-header')).toContainText(
        'Data Storage Location',
      );
    });
    test('Should pre-select home site in options', async ({ page }) => {
      // Given
      await page.goto('/admin/requests');
      await page.getByLabel('Dataset Id').fill(dummyUuid);
      await page.getByLabel('Date approved').fill(dummyDate);

      // Then
      await expect(page.getByTestId('selected-site')).toHaveValue(mockSites.homeSite);
      await expect(page.getByTestId('selected-site').getByRole('option')).toHaveCount(
        mockSites.sites.length,
      );
    });
    test('Should show data types modal', async ({ page }) => {
      // Given
      await page.goto('/admin/requests');
      await page.getByLabel('Dataset Id').fill(dummyUuid);
      await page.getByLabel('Date approved').fill(dummyDate);

      // When
      await page.getByTestId('data-type-modal-btn').click();

      // Then
      const modal = page.getByTestId('modal-component');
      await expect(modal).toBeVisible();
      await expect(modal.getByTestId('modal-wrapper-header')).toContainText('Data Types');
    });
    test('Should not allow send data button click if no data type selected', async ({ page }) => {
      // Given
      await page.goto('/admin/requests');
      await page.getByLabel('Dataset Id').fill(dummyUuid);
      await page.getByLabel('Date approved').fill(dummyDate);

      // Then
      await expect(page.getByTestId('send-data-btn')).toBeDisabled();
    });
    test('Should allow send data button on geno or pheno data selection', async ({ page }) => {
      // Given
      await page.goto('/admin/requests');
      await page.getByLabel('Dataset Id').fill(dummyUuid);
      await expect(page.getByTestId('v-stepper-step-2')).toBeVisible();
      await page.getByLabel('Date approved').fill(dummyDate);

      // Then
      await page.getByTestId('data-geno-checkbox').check();
      await expect(page.getByTestId('send-data-btn')).not.toBeDisabled();
    });
    test('Should ask user to confirm on send data button press', async ({ page }) => {
      // Given
      await page.goto('/admin/requests');
      await page.getByLabel('Dataset Id').fill(dummyUuid);
      await page.getByLabel('Date approved').fill(dummyDate);
      await page.getByTestId('data-pheno-checkbox').check();

      // When
      await page.getByTestId('send-data-btn').click();

      // Then
      const modal = page.getByTestId('modal-component');
      await expect(modal).toBeVisible();
      await expect(modal.getByTestId('send-data-modal-confirm-btn')).toBeVisible();
    });
    test('Should show default status Unsent', async ({ page }) => {
      // Given
      await page.goto('/admin/requests');
      await page.getByLabel('Dataset Id').fill(dummyUuid);
      await page.getByLabel('Date approved').fill(dummyDate);

      // Then
      await expect(page.getByTestId('status-pheno')).toContainText('Unsent');
    });
    test('Should update values on status refresh', async ({ page }) => {
      // Given
      await mockApiSuccess(
        page,
        `*/**/picsure/proxy/uploader/upload/${encodeURIComponent(
          mockSites.homeSite,
        )}?dataType=Phenotypic`,
        {
          ...mockStatus,
          phenotypic: 'Querying',
        },
      );
      await page.goto('/admin/requests');
      await page.getByLabel('Dataset Id').fill(dummyUuid);
      await page.getByLabel('Date approved').fill(dummyDate);
      await page.getByTestId('data-pheno-checkbox').check();
      await page.getByTestId('send-data-btn').click();
      await page.getByTestId('send-data-modal-confirm-btn').click();

      // When
      await mockApiSuccess(page, `*/**/picsure/proxy/uploader/status/${dummyUuid}`, {
        ...mockStatus,
        phenotypic: 'Uploaded',
      });
      await page.getByTestId('status-refresh-btn').click();

      // Then
      await expect(page.getByTestId('status-pheno')).toContainText('Upload Successful');
    });
    test('Should allow send data button when new type selected on previous send', async ({
      page,
    }) => {
      // Given
      await mockApiSuccess(
        page,
        `*/**/picsure/proxy/uploader/upload/${encodeURIComponent(
          mockSites.homeSite,
        )}?dataType=Phenotypic`,
        {
          ...mockStatus,
          phenotypic: 'Querying',
        },
      );
      await page.goto('/admin/requests');
      await page.getByLabel('Dataset Id').fill(dummyUuid);
      await page.getByLabel('Date approved').fill(dummyDate);
      await page.getByTestId('data-pheno-checkbox').check();
      await page.getByTestId('send-data-btn').click();
      await page.getByTestId('send-data-remember-checkbox').check();
      await page.getByTestId('send-data-modal-confirm-btn').click();

      // When
      await page.getByTestId('data-geno-checkbox').check();

      // Then
      await expect(page.getByTestId('send-data-btn')).toBeEnabled();
    });
    test('Should not ask user to confirm on send data button when remembered', async ({ page }) => {
      // Given
      await mockApiSuccess(
        page,
        `*/**/picsure/proxy/uploader/upload/${encodeURIComponent(
          mockSites.homeSite,
        )}?dataType=Phenotypic`,
        {
          ...mockStatus,
          phenotypic: 'Querying',
        },
      );
      await mockApiSuccess(
        page,
        `*/**/picsure/proxy/uploader/upload/${encodeURIComponent(
          mockSites.homeSite,
        )}?dataType=Genomic`,
        {
          ...mockStatus,
          phenotypic: 'Uploaded',
          genomic: 'Querying',
        },
      );
      await page.goto('/admin/requests');
      await page.getByLabel('Dataset Id').fill(dummyUuid);
      await page.getByLabel('Date approved').fill(dummyDate);
      await page.getByTestId('data-pheno-checkbox').check();
      await page.getByTestId('send-data-btn').click();
      await page.getByTestId('send-data-remember-checkbox').check();
      await page.getByTestId('send-data-modal-confirm-btn').click();

      // When
      await page.getByTestId('data-geno-checkbox').check();
      await page.getByTestId('send-data-btn').click();

      // Then
      await expect(page.getByTestId('modal-component')).not.toBeVisible();
    });
    test('Should not allow send data button when geno & pheno selection was sent', async ({
      page,
    }) => {
      // Given
      await mockApiSuccess(
        page,
        `*/**/picsure/proxy/uploader/upload/${encodeURIComponent(
          mockSites.homeSite,
        )}?dataType=Phenotypic`,
        {
          ...mockStatus,
          phenotypic: 'Querying',
        },
      );
      await mockApiSuccess(
        page,
        `*/**/picsure/proxy/uploader/upload/${encodeURIComponent(
          mockSites.homeSite,
        )}?dataType=Genomic`,
        {
          ...mockStatus,
          phenotypic: 'Uploaded',
          genomic: 'Querying',
        },
      );
      await page.goto('/admin/requests');
      await page.getByLabel('Dataset Id').fill(dummyUuid);
      await page.getByLabel('Date approved').fill(dummyDate);
      await page.getByTestId('data-pheno-checkbox').check();
      await page.getByTestId('data-geno-checkbox').check();

      // When
      await page.getByTestId('send-data-btn').click();
      await page.getByTestId('send-data-modal-confirm-btn').click();

      // Then
      await expect(page.getByTestId('send-data-btn')).not.toBeEnabled();
    });
  });
  test('Should load all previously provided values when known query id is provided', async ({
    page,
  }) => {
    // Given
    await mockApiSuccess(page, `*/**/picsure/proxy/uploader/status/${dummyUuid}`, {
      ...mockStatus,
      approved: dummyDate,
      site: mockSites.sites[1],
      genomic: 'Error',
    });
    await mockApiSuccess(page, `*/**/picsure/query/${dummyUuid}/metadata`, mockMetadata);
    await page.goto('/admin/requests');

    // When
    await page.getByLabel('Dataset Id').fill(dummyUuid);

    // Then
    await expect(page.getByTestId('v-stepper-step-1')).toBeVisible();
    await expect(page.getByTestId('v-stepper-step-1')).not.toHaveAttribute('aria-current', 'step');
    await expect(page.getByTestId('v-stepper-step-2')).toBeVisible();
    await expect(page.getByTestId('v-stepper-step-2')).not.toHaveAttribute('aria-current', 'step');
    await expect(page.getByTestId('data-approved-date')).not.toBeEnabled();
    await expect(page.getByTestId('v-stepper-step-3')).toBeVisible();
    await expect(page.getByTestId('v-stepper-step-3')).toHaveAttribute('aria-current', 'step');
    await expect(page.getByTestId('selected-site')).toHaveValue(mockSites.sites[1]);
    await expect(page.getByTestId('data-geno-checkbox')).toBeChecked();
    await expect(page.getByTestId('send-data-btn')).not.toBeEnabled();
    await expect(page.getByTestId('status-geno')).toContainText('Upload Failed');
  });
  test('Should reset back to step 1 on reset button press', async ({ page }) => {
    // Given
    await mockApiSuccess(page, `*/**/picsure/proxy/uploader/status/${dummyUuid}`, {
      ...mockStatus,
      approved: dummyDate,
      site: mockSites.sites[1],
      genomic: 'Error',
    });
    await mockApiSuccess(page, `*/**/picsure/query/${dummyUuid}/metadata`, mockMetadata);
    await page.goto('/admin/requests');
    await page.getByLabel('Dataset Id').fill(dummyUuid);

    // When
    await page.getByTestId('reset-btn').click();

    // Then
    await expect(page.getByTestId('v-stepper-step-1')).toBeVisible();
    await expect(page.getByTestId('v-stepper-step-1')).toHaveAttribute('aria-current', 'step');
    await expect(page.getByTestId('v-stepper-step-2')).not.toBeVisible();
    await expect(page.getByTestId('v-stepper-step-3')).not.toBeVisible();
  });
});

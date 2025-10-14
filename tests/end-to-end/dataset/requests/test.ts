import { expect } from '@playwright/test';
import { test, mockApiSuccess, mockApiFail } from '../../custom-context';
import {
  sites as mockSites,
  status as mockStatus,
  metadata as mockMetadata,
} from '../../mock-data';

const dummyUuid = '6d405d0f-8243-4494-8bd3-8820cd33d836';
const dummyDate = '2024-01-01';
const debounceTime = 1020;

const validateUUIDMessage = /([Pp]lease )?[Mm]atch the requested format.?/;

test.use({ storageState: 'tests/end-to-end/.auth/dataUser.json' });

test.describe('data requests', () => {
  test.beforeEach(async ({ context }) => {
    await mockApiSuccess(context, '*/**/picsure/proxy/uploader/sites', mockSites);
  });
  test.describe('step 1', () => {
    test('Should load step 1 on landing', async ({ page }) => {
      // Given
      await page.goto('/dataset/request');

      // Then
      await expect(page.getByTestId('v-stepper-step-1')).toBeVisible();
    });
    test('Should be active step', async ({ page }) => {
      // Given
      await page.goto('/dataset/request');

      // Then
      await expect(page.getByTestId('v-stepper-step-1')).toHaveAttribute('aria-current', 'step');
    });
    test('Should validate uuid provided', async ({ page }) => {
      // Given
      await page.goto('/dataset/request');

      // When
      await page.getByLabel('Dataset Id').fill('cvfbfbd');

      // Then
      const invalid = await page
        .getByLabel('Dataset Id')
        .evaluate((element: HTMLInputElement) => element.validationMessage);
      expect(invalid).toMatch(validateUUIDMessage);
    });
    test('Should not advance to step 2 when api status request fails', async ({ page }) => {
      // Given
      await mockApiFail(page, `*/**/picsure/proxy/uploader/status/${dummyUuid}`, 'failed');
      await page.goto('/dataset/request');
      await page.getByLabel('Dataset Id').pressSequentially(dummyUuid);
      await page.getByTestId('search-dataset-btn').click();
      await page.waitForTimeout(debounceTime); // Wait for debounce

      // Then
      await expect(page.getByTestId('v-stepper-step-2')).not.toBeVisible();
      await expect(page.getByTestId('v-stepper-step-1')).toHaveAttribute('aria-current', 'step');
    });
    test('Should not advance to step 2 when api metadata request fails', async ({ page }) => {
      // Given
      await mockApiSuccess(page, `*/**/picsure/proxy/uploader/status/${dummyUuid}`, mockStatus);
      await mockApiFail(page, `*/**/picsure/query/${dummyUuid}/metadata`, 'failed');
      await page.goto('/dataset/request');
      await page.getByLabel('Dataset Id').pressSequentially(dummyUuid);
      await page.getByTestId('search-dataset-btn').click();
      await page.waitForTimeout(debounceTime); // Wait for debounce

      // Then
      await expect(page.getByTestId('v-stepper-step-2')).not.toBeVisible();
      await expect(page.getByTestId('v-stepper-step-1')).toHaveAttribute('aria-current', 'step');
    });
    test('Should populate error if status fails', async ({ page }) => {
      // Given
      await mockApiFail(page, `*/**/picsure/proxy/uploader/status/${dummyUuid}`, 'failed');
      await page.goto('/dataset/request');
      await page.getByLabel('Dataset Id').pressSequentially(dummyUuid);
      await page.getByTestId('search-dataset-btn').click();
      await page.waitForTimeout(debounceTime); // Wait for debounce
    });
    test('Should populate error if metadata fails', async ({ page }) => {
      // Given
      await mockApiSuccess(page, `*/**/picsure/proxy/uploader/status/${dummyUuid}`, mockStatus);
      await mockApiFail(page, `*/**/picsure/query/${dummyUuid}/metadata`, 'failed');
      await page.goto('/dataset/request');
      await page.getByLabel('Dataset Id').pressSequentially(dummyUuid);
      await page.getByTestId('search-dataset-btn').click();
      await page.waitForTimeout(debounceTime); // Wait for debounce

      // Then
      await expect(page.getByTestId('error-from-search')).toBeVisible();
    });
    test('Should populate error if metadata fails with expected text', async ({ page }) => {
      // Given
      await mockApiSuccess(page, `*/**/picsure/proxy/uploader/status/${dummyUuid}`, mockStatus);
      await mockApiSuccess(page, `*/**/picsure/query/${dummyUuid}/metadata`, {
        status: 'UNSENT',
        resourceID: 'abc',
        resourceStatus: null,
        picsureResultId: dummyUuid,
        resourceResultId: dummyUuid,
        resultMetadata: null,
        sizeInBytes: 0,
        startTime: 1752624000000,
        duration: 0,
        expiration: 0,
      });
      await page.goto('/dataset/request');
      await page.getByLabel('Dataset Id').pressSequentially(dummyUuid);
      await page.getByTestId('search-dataset-btn').click();
      await page.waitForTimeout(debounceTime); // Wait for debounce

      // Then
      await expect(page.getByTestId('error-from-search')).toBeVisible();
      await expect(page.getByTestId('error-from-search')).toContainText(
        "We couldn't find any matching results. Please check to ensure the information you have entered is correct or try searching for a different Dataset Request ID.",
      );
    });
  });
  test.describe('step 2', () => {
    test.beforeEach(async ({ page }) => {
      await mockApiSuccess(page, `*/**/picsure/proxy/uploader/status/${dummyUuid}`, mockStatus);
      await mockApiSuccess(page, `*/**/picsure/query/${dummyUuid}/metadata`, mockMetadata);
    });
    test('Should load step 2 when valid uuid provided', async ({ page }) => {
      // Given
      await page.goto('/dataset/request');

      // When
      await page.getByLabel('Dataset Id').pressSequentially(dummyUuid);
      await page.getByTestId('search-dataset-btn').click();
      await page.waitForTimeout(debounceTime); // Wait for debounce

      // Then
      await expect(page.getByTestId('v-stepper-step-2')).toBeVisible();
    });
    test('Should be active step', async ({ page }) => {
      // Given
      await page.goto('/dataset/request');
      await page.getByLabel('Dataset Id').pressSequentially(dummyUuid);
      await page.getByTestId('search-dataset-btn').click();
      await page.waitForTimeout(debounceTime); // Wait for debounce

      // Then
      await expect(page.getByTestId('v-stepper-step-2')).toBeVisible();
      await expect(page.getByTestId('v-stepper-step-2')).toHaveAttribute('aria-current', 'step');
    });
    test('Should show data request summary modal', async ({ page }) => {
      // Given
      await page.goto('/dataset/request');
      await page.getByLabel('Dataset Id').pressSequentially(dummyUuid);
      await page.getByTestId('search-dataset-btn').click();
      await page.waitForTimeout(debounceTime); // Wait for debounce

      // When
      await page.getByTestId('data-request-btn').click();

      // Then
      const modal = page.locator('#modal-component');
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
      await page.goto('/dataset/request');
      await page.getByLabel('Dataset Id').pressSequentially(dummyUuid);
      await page.getByTestId('search-dataset-btn').click();
      await page.waitForTimeout(debounceTime); // Wait for debounce

      // When
      await expect(page.getByTestId('v-stepper-step-2')).toBeVisible();
      await page.getByLabel('Date approved').fill(dummyDate);

      // Then
      await expect(page.getByTestId('v-stepper-step-3')).toBeVisible();
    });
    test('Should be active step', async ({ page }) => {
      // Given
      await page.goto('/dataset/request');
      await page.getByLabel('Dataset Id').pressSequentially(dummyUuid);
      await page.getByTestId('search-dataset-btn').click();
      await page.waitForTimeout(debounceTime); // Wait for debounce

      // When
      await page.getByLabel('Date approved').fill(dummyDate);

      // Then
      await expect(page.getByTestId('v-stepper-step-3')).toHaveAttribute('aria-current', 'step');
    });
    test('Should show Data Storage Location info modal', async ({ page }) => {
      // Given
      await page.goto('/dataset/request');
      await page.getByLabel('Dataset Id').pressSequentially(dummyUuid);
      await page.getByTestId('search-dataset-btn').click();
      await page.waitForTimeout(debounceTime); // Wait for debounce
      await expect(page.getByTestId('v-stepper-step-2')).toBeVisible();
      await page.getByLabel('Date approved').fill(dummyDate);

      // When
      await page.getByTestId('data-loc-modal').click();
      await page.waitForTimeout(debounceTime);
      // Then
      await expect(page.getByTestId('data-loc-modal-content')).toBeVisible();
    });
    test('Should show placeholder as default value', async ({ page }) => {
      // Given
      await page.goto('/dataset/request');
      await page.getByLabel('Dataset Id').pressSequentially(dummyUuid);
      await page.getByTestId('search-dataset-btn').click();
      await page.waitForTimeout(debounceTime); // Wait for debounce
      await page.getByLabel('Date approved').fill(dummyDate);

      // Then
      await expect(page.getByTestId('selected-site')).toHaveValue('');
      await expect(page.getByTestId('selected-site')).toContainText('Select a site');
      await expect(page.getByTestId('selected-site').getByRole('option')).toHaveCount(
        mockSites.sites.length + 1,
      );
    });
    test('Should show data types modal', async ({ page }) => {
      // Given
      await page.goto('/dataset/request');
      await page.getByLabel('Dataset Id').pressSequentially(dummyUuid);
      await page.getByTestId('search-dataset-btn').click();
      await page.waitForTimeout(debounceTime); // Wait for debounce
      await page.getByLabel('Date approved').fill(dummyDate);

      // When
      await page.getByTestId('data-type-modal').click();
      // Then
      await expect(page.getByTestId('data-type-modal-content')).toBeVisible();
    });
    test('Should not allow send data button click if no data type selected', async ({ page }) => {
      // Given
      await page.goto('/dataset/request');
      await page.getByLabel('Dataset Id').pressSequentially(dummyUuid);
      await page.getByTestId('search-dataset-btn').click();
      await page.waitForTimeout(debounceTime); // Wait for debounce
      await page.getByLabel('Date approved').fill(dummyDate);

      // Then
      await expect(page.getByTestId('send-data-btn')).toBeDisabled();
    });
    test('Should allow send data button on geno or pheno data selection', async ({ page }) => {
      // Given
      await page.goto('/dataset/request');
      await page.getByLabel('Dataset Id').pressSequentially(dummyUuid);
      await page.getByTestId('search-dataset-btn').click();
      await page.waitForTimeout(debounceTime); // Wait for debounce
      await expect(page.getByTestId('v-stepper-step-2')).toBeVisible();
      await page.getByLabel('Date approved').fill(dummyDate);
      await page.getByTestId('selected-site').click();
      await page.getByTestId('selected-site').selectOption(mockSites.sites[0]);

      // Then
      await page.getByTestId('data-geno-checkbox').check();
      await expect(page.getByTestId('send-data-btn')).not.toBeDisabled();
    });
    test('Should ask user to confirm on send data button press', async ({ page }) => {
      // Given
      await page.goto('/dataset/request');
      await page.getByLabel('Dataset Id').pressSequentially(dummyUuid);
      await page.getByTestId('search-dataset-btn').click();
      await page.waitForTimeout(debounceTime); // Wait for debounce
      await page.getByLabel('Date approved').fill(dummyDate);

      // When
      await page.getByTestId('selected-site').click();
      await page.getByTestId('selected-site').selectOption(mockSites.sites[0]);
      await page.getByTestId('data-pheno-checkbox').check();
      await page.getByTestId('send-data-btn').click();

      // Then
      const modal = page.locator('#modal-component');
      await expect(modal).toBeVisible();
      await expect(modal.getByTestId('send-data-modal-confirm-btn')).toBeVisible();
    });
    test('Should show default status Unsent', async ({ page }) => {
      // Given
      await page.goto('/dataset/request');
      await page.getByLabel('Dataset Id').pressSequentially(dummyUuid);
      await page.getByTestId('search-dataset-btn').click();
      await page.waitForTimeout(debounceTime); // Wait for debounce
      await page.getByLabel('Date approved').fill(dummyDate);

      // Then
      await expect(
        page.getByTestId('status-indicator-phenotypic-data').getByTestId('status-indicator-icon'),
      ).toHaveAttribute('title', 'Unsent');
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
      await page.goto('/dataset/request');
      await page.getByLabel('Dataset Id').pressSequentially(dummyUuid);
      await page.getByTestId('search-dataset-btn').click();
      await page.waitForTimeout(debounceTime); // Wait for debounce
      await page.getByLabel('Date approved').fill(dummyDate);
      await page.getByTestId('selected-site').click();
      await page.getByTestId('selected-site').selectOption(mockSites.sites[0]);
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
      await expect(
        page.getByTestId('status-indicator-phenotypic-data').getByTestId('status-indicator-icon'),
      ).toHaveAttribute('title', 'Uploaded');
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
      await page.goto('/dataset/request');
      await page.getByLabel('Dataset Id').pressSequentially(dummyUuid);
      await page.getByTestId('search-dataset-btn').click();
      await page.waitForTimeout(debounceTime); // Wait for debounce
      await page.getByLabel('Date approved').fill(dummyDate);
      await page.getByTestId('selected-site').click();
      await page.getByTestId('selected-site').selectOption(mockSites.sites[0]);
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
      await page.goto('/dataset/request');
      await page.getByLabel('Dataset Id').pressSequentially(dummyUuid);
      await page.getByTestId('search-dataset-btn').click();
      await page.waitForTimeout(debounceTime); // Wait for debounce
      await page.getByLabel('Date approved').fill(dummyDate);
      await page.getByTestId('selected-site').click();
      await page.getByTestId('selected-site').selectOption(mockSites.sites[0]);
      await page.getByTestId('data-pheno-checkbox').check();
      await page.getByTestId('send-data-btn').click();
      await page.getByTestId('send-data-remember-checkbox').check();
      await page.getByTestId('send-data-modal-confirm-btn').click();

      // When
      await page.getByTestId('data-geno-checkbox').check();
      await page.getByTestId('send-data-btn').click();

      // Then
      await expect(page.locator('#modal-component')).not.toBeVisible();
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
      await page.goto('/dataset/request');
      await page.getByLabel('Dataset Id').pressSequentially(dummyUuid);
      await page.getByTestId('search-dataset-btn').click();
      await page.waitForTimeout(debounceTime); // Wait for debounce
      await page.getByLabel('Date approved').fill(dummyDate);
      await page.getByTestId('selected-site').click();
      await page.getByTestId('selected-site').selectOption(mockSites.sites[0]);
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
    await page.goto('/dataset/request');

    // When
    await page.getByLabel('Dataset Id').pressSequentially(dummyUuid);
    await page.getByTestId('search-dataset-btn').click();
    await page.waitForTimeout(debounceTime); // Wait for debounce

    // Then
    await expect(page.getByTestId('v-stepper-step-1')).toBeVisible();
    await expect(page.getByTestId('v-stepper-step-1')).not.toHaveAttribute('aria-current', 'step');
    await expect(page.getByTestId('v-stepper-step-2')).toBeVisible();
    await expect(page.getByTestId('v-stepper-step-2')).not.toHaveAttribute('aria-current', 'step');
    await expect(page.getByTestId('v-stepper-step-3')).toBeVisible();
    await expect(page.getByTestId('v-stepper-step-3')).toHaveAttribute('aria-current', 'step');
    await expect(page.getByTestId('selected-site')).toHaveValue(mockSites.sites[1]);
    await expect(page.getByTestId('data-geno-checkbox')).toBeChecked();
    await expect(page.getByTestId('send-data-btn')).not.toBeEnabled();
    await expect(
      page
        .getByTestId('status-indicator-annotated-variant-data-for-selected-genes')
        .getByTestId('status-indicator-icon'),
    ).toHaveAttribute('title', 'Error');
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
    await page.goto('/dataset/request');
    await page.getByLabel('Dataset Id').pressSequentially(dummyUuid);
    await page.getByTestId('search-dataset-btn').click();
    await page.waitForTimeout(debounceTime); // Wait for debounce

    // When
    await page.getByTestId('reset-btn').click();

    // Then
    await expect(page.getByTestId('v-stepper-step-1')).toBeVisible();
    await expect(page.getByTestId('v-stepper-step-1')).toHaveAttribute('aria-current', 'step');
    await expect(page.getByTestId('v-stepper-step-2')).not.toBeVisible();
    await expect(page.getByTestId('v-stepper-step-3')).not.toBeVisible();
  });
});

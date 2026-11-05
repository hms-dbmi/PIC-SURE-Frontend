import { expect, type Page } from '@playwright/test';
import { test, mockApiSuccess, mockApiConfig } from '../../custom-context';
import { searchResults, facetsResponse, searchResultPath, facetResultPath } from '../../mock-data';
import { userIsLoggedIn } from '../../utils';

const chatPath = '**/picsure/ai/chat';
const facet = { category: 'study_ids_dataset_ids', name: 'study2' };

test.use({ storageState: 'tests/end-to-end/.auth/generalUser.json' });

async function openChat(page: Page) {
  await page.goto('/explorer');
  await userIsLoggedIn(page);
  await page.getByTestId('chat-toggle').click();
}

async function ask(page: Page, message: string) {
  await page.getByTestId('chat-input').fill(message);
  await page.getByTestId('chat-send').click();
}

test.describe('Assisted search', () => {
  test.beforeEach(async ({ page }) => {
    await mockApiConfig(page, { features: [{ name: 'ENABLE_ASSISTED_SEARCH', value: 'true' }] });
    await mockApiSuccess(page, facetResultPath, facetsResponse);
    await mockApiSuccess(page, searchResultPath, searchResults);
  });

  test('a facet in the reply is selected in the facet sidebar, and undo clears it', async ({
    page,
  }) => {
    let request: { facets: unknown[]; message: string } | undefined;
    await page.route(chatPath, async (route) => {
      request = route.request().postDataJSON();
      await route.fulfill({ json: { response: 'Showing **NHANES**.', facets: [facet] } });
    });
    await openChat(page);

    await ask(page, 'show me NHANES');

    const checkbox = page.locator(`input[id="${facet.name}"]`);
    await expect(page.getByTestId('chat-message-text')).toContainText('Showing NHANES');
    await expect(checkbox).toBeChecked();
    expect(request).toMatchObject({ message: 'show me NHANES', facets: [] });

    await page.getByTestId('chat-undo').click();
    await expect(checkbox).not.toBeChecked();
    await expect(page.getByTestId('chat-undone')).toBeVisible();
  });

  test('a search term in the reply runs the search', async ({ page }) => {
    await page.route(chatPath, (route) =>
      route.fulfill({ json: { response: 'Searching for age.', search: 'age' } }),
    );
    await openChat(page);

    const searched = page.waitForRequest(
      (r) => r.url().includes('/picsure/dictionary/concepts') && r.postDataJSON().search === 'age',
    );
    await ask(page, 'find age variables');
    await searched;
    await expect(page.getByTestId('chat-changed')).toHaveText('Updated search');
    await expect(page).toHaveURL(/\/explorer\?search=age$/);

    await page.getByTestId('chat-undo').click();
    await expect(page).toHaveURL(/\/explorer$/);
  });

  for (const fullScreen of [false, true]) {
    test(`a link in a reply asks before leaving the site${fullScreen ? ' (full screen)' : ''}`, async ({
      page,
    }) => {
      await mockApiConfig(page, {
        features: [
          { name: 'ENABLE_ASSISTED_SEARCH', value: 'true' },
          { name: 'CONFIRM_EXTERNAL_NAVIGATION', value: 'true' },
        ],
      });
      await page.route(chatPath, (route) =>
        route.fulfill({ json: { response: 'See [the docs](https://example.org/docs).' } }),
      );
      await openChat(page);
      if (fullScreen) await page.getByTestId('chat-expand').click();

      await ask(page, 'where is the documentation?');
      const popup = page.waitForEvent('popup', { timeout: 1500 }).catch(() => null);
      await page.getByRole('link', { name: 'the docs' }).click();

      await expect(page.getByTestId('external-link-warning')).toBeVisible();
      expect(await popup).toBeNull();
    });
  }

  test('a prose-only reply leaves the facets alone', async ({ page }) => {
    await page.route(chatPath, (route) => route.fulfill({ json: { response: 'Just an answer.' } }));
    await openChat(page);

    await ask(page, 'what is NHANES?');

    await expect(page.getByTestId('chat-message-text')).toContainText('Just an answer.');
    await expect(page.getByTestId('chat-undo')).toHaveCount(0);
    await expect(page.locator('input[type="checkbox"]:checked')).toHaveCount(0);
  });

  test('is hidden unless the feature is on', async ({ page }) => {
    await mockApiConfig(page, { features: [] });
    await page.goto('/explorer');
    await userIsLoggedIn(page);
    await expect(page.getByTestId('search-box')).toBeVisible();
    await expect(page.getByTestId('chat-toggle')).toHaveCount(0);
  });
});

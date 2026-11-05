import { expect, type Page } from '@playwright/test';
import { test, mockApiSuccess, mockApiConfig } from '../../custom-context';
import {
  searchResults,
  facetsResponse,
  searchResultPath,
  facetResultPath,
  conceptsDetailPath,
  detailResponseCat,
  countResultPath,
} from '../../mock-data';
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

  test('the chat sits above the search box, which stays on screen', async ({ page }) => {
    await page.route(chatPath, (route) =>
      route.fulfill({ json: { response: 'Searching.', search: 'age' } }),
    );
    await openChat(page);
    await expect(page.getByTestId('search-box')).toBeVisible();

    await ask(page, 'find age');
    await expect(page.getByTestId('chat-changed')).toBeVisible();
    await expect(page.getByTestId('search-box')).toHaveValue('age');

    const chatBox = await page.getByTestId('chat-window').boundingBox();
    const searchBox = await page.getByTestId('search-box').boundingBox();
    expect(chatBox!.y + chatBox!.height).toBeLessThanOrEqual(searchBox!.y);
  });

  test('the chat band sits above the page content, and full screen swaps it for the modal', async ({
    page,
  }) => {
    await openChat(page);

    const band = page.locator('#assisted-search');
    await expect(band).toBeVisible();
    const bandBox = await band.boundingBox();
    const contentBox = await page.locator('main#page-content').boundingBox();
    expect(bandBox!.y + bandBox!.height).toBeLessThanOrEqual(contentBox!.y);
    await expect(page.locator('main#page-content #assisted-search')).toHaveCount(0);

    await page.getByTestId('chat-expand').click();
    await expect(page.getByTestId('chat-modal')).toBeVisible();
    await expect(band).toHaveCount(0);

    await page.getByTestId('chat-expand').click();
    await expect(page.getByTestId('chat-modal')).toHaveCount(0);
    await expect(band).toBeVisible();

    await page.getByTestId('chat-expand').click();
    await page.getByTestId('modal-close-button').click();
    await expect(band).toBeVisible();
  });

  test('the band only shows while the chat is open', async ({ page }) => {
    await openChat(page);
    await expect(page.locator('#assisted-search')).toBeVisible();
    await page.getByTestId('chat-toggle').click();
    await expect(page.locator('#assisted-search')).toHaveCount(0);
  });

  test('shows the service’s message, not its raw JSON, when the model is unavailable', async ({
    page,
  }) => {
    await page.route(chatPath, (route) =>
      route.fulfill({
        status: 503,
        json: {
          errorType: 'model_unavailable',
          message: 'The AI model is currently unavailable. Please try again.',
          requestId: '192bda05-f0a6-4254-9a89-ac0d09aa318d',
        },
      }),
    );
    await openChat(page);
    await ask(page, 'hello');

    const reply = page.getByTestId('chat-message-text');
    await expect(reply).toHaveText('The AI model is currently unavailable. Please try again.');
    await expect(reply).not.toContainText('errorType');
  });

  test('a refresh keeps the conversation, and resetting the search does not end it', async ({
    page,
  }) => {
    const conversations: string[] = [];
    await page.route(chatPath, async (route) => {
      conversations.push(route.request().postDataJSON().conversationId);
      await route.fulfill({
        json: { response: `Answer ${conversations.length}`, search: 'age' },
      });
    });
    await openChat(page);
    await ask(page, 'first question');
    await expect(page.getByTestId('chat-message-text')).toHaveText('Answer 1');

    await page.reload();
    await userIsLoggedIn(page);
    await expect(page.getByTestId('chat-window')).toBeVisible();
    await expect(page.getByTestId('chat-message-user')).toHaveText('first question');
    await expect(page.getByTestId('chat-message-text')).toHaveText('Answer 1');

    await ask(page, 'second question');
    await expect(page.getByTestId('chat-message-text')).toHaveCount(2);
    expect(conversations[1]).toBe(conversations[0]);

    await page.getByLabel('You are on the reset button').click();
    await expect(page.getByTestId('search-box')).toHaveValue('');
    await expect(page.getByTestId('chat-message-user')).toHaveCount(2);

    await page.reload();
    await userIsLoggedIn(page);
    await expect(page.getByTestId('chat-message-user')).toHaveCount(2);
    await ask(page, 'third question');
    await expect(page.getByTestId('chat-message-text')).toHaveCount(3);
    expect(conversations[2]).toBe(conversations[0]);
  });

  test.describe('Clear all filters', () => {
    const filterQuery = {
      select: [],
      phenotypicClause: {
        phenotypicFilterType: 'REQUIRED',
        conceptPath: detailResponseCat.conceptPath,
      },
      genomicFilters: [],
    };

    async function haveFilterAndConversation(page: Page) {
      await mockApiSuccess(page, `${conceptsDetailPath}/*`, detailResponseCat);
      await mockApiSuccess(page, countResultPath, '9999');
      await page.route(chatPath, (route) =>
        route.fulfill({ json: { response: 'Added it.', query: filterQuery } }),
      );
      await openChat(page);
      await ask(page, 'add the heart attack filter');
      await expect(page.getByTestId('chat-changed')).toBeVisible();
      await expect(page.getByTestId('clear-all-results-btn')).toBeVisible();
    }

    test('warns that the conversation goes too, and clears it on Yes', async ({ page }) => {
      await haveFilterAndConversation(page);

      await page.getByTestId('clear-all-results-btn').click();
      const dialog = page.locator('#modal-component');
      await expect(dialog.getByTestId('clear-all-chat-note')).toHaveText(
        'This will also clear your conversation with the search assistant.',
      );
      await dialog.getByRole('button', { name: 'Yes' }).click();

      await expect(page.getByText('No filters added')).toBeVisible();
      await expect(page.getByTestId('chat-message-user')).toHaveCount(0);
      await expect(page.locator('#assisted-search')).toBeVisible();
    });

    test('keeps the conversation on No', async ({ page }) => {
      await haveFilterAndConversation(page);

      await page.getByTestId('clear-all-results-btn').click();
      await page.locator('#modal-component').getByRole('button', { name: 'No' }).click();

      await expect(page.getByTestId('chat-message-user')).toHaveCount(1);
    });

    test('says nothing about a conversation when there is none', async ({ page }) => {
      await mockApiSuccess(page, `${conceptsDetailPath}/*`, detailResponseCat);
      await mockApiSuccess(page, countResultPath, '9999');
      await page.route(chatPath, (route) =>
        route.fulfill({ json: { response: 'Added it.', query: filterQuery } }),
      );
      await openChat(page);
      await ask(page, 'add the heart attack filter');
      await expect(page.getByTestId('clear-all-results-btn')).toBeVisible();
      await page.getByTestId('chat-new').click();

      await page.getByTestId('clear-all-results-btn').click();
      await expect(page.locator('#modal-component')).toContainText('clear all filters');
      await expect(page.getByTestId('clear-all-chat-note')).toHaveCount(0);
    });
  });

  test('New conversation clears the thread and starts a new conversation id', async ({ page }) => {
    const conversations: string[] = [];
    await page.route(chatPath, async (route) => {
      conversations.push(route.request().postDataJSON().conversationId);
      await route.fulfill({ json: { response: 'ok' } });
    });
    await openChat(page);
    await expect(page.getByTestId('chat-new')).toBeDisabled();
    await ask(page, 'one');
    await expect(page.getByTestId('chat-message-text')).toHaveCount(1);

    await page.getByTestId('chat-new').click();
    await expect(page.getByTestId('chat-message-user')).toHaveCount(0);
    await ask(page, 'two');
    await expect(page.getByTestId('chat-message-text')).toHaveCount(1);
    expect(conversations[1]).not.toBe(conversations[0]);
  });

  test('a refresh while a reply is pending picks the reply up', async ({ page }) => {
    let release!: () => void;
    const held = new Promise<void>((resolve) => (release = resolve));
    await page.route(`${chatPath}/*`, (route) =>
      route.fulfill({ json: { response: 'Here it is after the refresh.' } }),
    );
    await page.route(chatPath, async (route) => {
      await held;
      await route.abort();
    });
    await openChat(page);
    await ask(page, 'slow question');
    await expect(page.getByTestId('chat-stop')).toBeVisible();

    await page.unroute(chatPath);
    await page.reload();
    release();
    await userIsLoggedIn(page);

    await expect(page.getByTestId('chat-message-user')).toHaveText('slow question');
    await expect(page.getByTestId('chat-message-text')).toHaveText(
      'Here it is after the refresh.',
      { timeout: 10000 },
    );
  });

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

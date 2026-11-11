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
} from '../../../support/mock-data';
import { userIsLoggedIn } from '../../utils';

const chatPath = '**/picsure/ai/chat';
const facet = { category: 'study_ids_dataset_ids', name: 'study2' };

test.use({ storageState: 'tests/end-to-end/.auth/assistantUser.json' });

async function openChat(page: Page) {
  await page.goto('/explorer');
  await userIsLoggedIn(page);
  await page.getByTestId('explorer-assistant-toggle').click();
}

async function ask(page: Page, message: string) {
  await page.getByTestId('explorer-assistant-input').fill(message);
  await page.getByTestId('explorer-assistant-send').click();
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

    const checkbox = page.getByTestId(`explorer-facet-label-${facet.name}`).getByRole('checkbox');
    await expect(page.getByTestId('explorer-assistant-message-text')).toContainText(
      'Showing NHANES',
    );
    await expect(checkbox).toBeChecked();
    expect(request).toMatchObject({ message: 'show me NHANES', facets: [] });

    await page.getByTestId('explorer-assistant-undo').click();
    await expect(checkbox).not.toBeChecked();
    await expect(page.getByTestId('explorer-assistant-undone')).toBeVisible();
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
    await expect(page.getByTestId('explorer-assistant-changed')).toHaveText('Updated search');
    await expect(page).toHaveURL(/\/explorer\?search=age$/);

    await page.getByTestId('explorer-assistant-undo').click();
    await expect(page).toHaveURL(/\/explorer$/);
  });

  for (const tall of [false, true]) {
    test(`a link in a reply asks before leaving the site${tall ? ' (expanded)' : ''}`, async ({
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
      if (tall) await page.getByTestId('explorer-assistant-expand').click();

      await ask(page, 'where is the documentation?');
      const popup = page.waitForEvent('popup', { timeout: 1500 }).catch(() => null);
      await page.getByRole('link', { name: 'the docs' }).click();

      await expect(page.getByTestId('app-external-link-warning')).toBeVisible();
      expect(await popup).toBeNull();
    });
  }

  test('the chat sits above the search box, which stays on screen', async ({ page }) => {
    await page.route(chatPath, (route) =>
      route.fulfill({ json: { response: 'Searching.', search: 'age' } }),
    );
    await openChat(page);
    await expect(page.getByTestId('ui-search-input')).toBeVisible();

    await ask(page, 'find age');
    await expect(page.getByTestId('explorer-assistant-changed')).toBeVisible();
    await expect(page.getByTestId('ui-search-input')).toHaveValue('age');

    const chatBox = await page.getByTestId('explorer-assistant-window').boundingBox();
    const searchBox = await page.getByTestId('ui-search-input').boundingBox();
    expect(chatBox!.y + chatBox!.height).toBeLessThanOrEqual(searchBox!.y);
  });

  test('the chat band sits above the page content, and expanding keeps it in place', async ({
    page,
  }) => {
    await openChat(page);

    const band = page.locator('#explorer-assistant');
    await expect(band).toBeVisible();
    const bandBox = await band.boundingBox();
    const contentBox = await page.locator('main#app-page-content').boundingBox();
    expect(bandBox!.y + bandBox!.height).toBeLessThanOrEqual(contentBox!.y);
    await expect(page.locator('main#app-page-content #explorer-assistant')).toHaveCount(0);

    await page.getByTestId('explorer-assistant-expand').click();
    await expect(page.getByTestId('explorer-assistant-expand')).toHaveText('Compact');
    await expect(band).toBeVisible();
    await expect(page.getByTestId('ui-search-input')).toBeVisible();

    await page.getByTestId('explorer-assistant-expand').click();
    await expect(page.getByTestId('explorer-assistant-expand')).toHaveText('Expand');
  });

  test('the toggle keeps its label and width, and the close button hides the panel', async ({
    page,
  }) => {
    await openChat(page);
    const toggle = page.getByTestId('explorer-assistant-toggle');
    await expect(toggle).toHaveText('Assistant');
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');

    await page.getByTestId('explorer-assistant-close').click();
    await expect(page.locator('#explorer-assistant')).toHaveCount(0);
    await expect(toggle).toHaveText('Assistant');
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  });

  test('undo is disabled once the researcher changes the search', async ({ page }) => {
    await page.route(chatPath, (route) =>
      route.fulfill({ json: { response: 'Searching.', search: 'age' } }),
    );
    await openChat(page);
    await ask(page, 'find age');
    await expect(page.getByTestId('explorer-assistant-undo')).toBeEnabled();

    await page.getByTestId('ui-search-input').fill('height');
    await page.getByTestId('ui-search-input').press('Enter');
    await expect(page.getByTestId('explorer-assistant-undo')).toBeDisabled();
    await expect(page.getByTestId('explorer-assistant-undo')).toHaveAttribute(
      'title',
      'Disabled after you changed the screen',
    );
  });

  test('filters the assistant adds can each be removed', async ({ page }) => {
    const leaf = (n: number) => ({
      phenotypicFilterType: 'REQUIRED',
      conceptPath: `\\SOMEDATA\\questionnaire\\disease\\${n}\\`,
    });
    await mockApiSuccess(page, `${conceptsDetailPath}/*`, detailResponseCat);
    await mockApiSuccess(page, countResultPath, '9999');
    await page.route(chatPath, (route) =>
      route.fulfill({
        json: {
          response: 'Added three.',
          query: {
            select: [],
            genomicFilters: [],
            phenotypicClause: { phenotypicClauses: [leaf(1), leaf(2), leaf(3)], operator: 'AND' },
          },
        },
      }),
    );
    await openChat(page);
    await ask(page, 'add three filters');

    const filters = page.locator('[data-testid^="results-filter-item-"]');
    await expect(filters).toHaveCount(3);
    for (const remaining of [2, 1, 0]) {
      await page.getByTitle('Remove Filter').first().click();
      await expect(filters).toHaveCount(remaining);
    }
  });

  test('the band only shows while the chat is open', async ({ page }) => {
    await openChat(page);
    await expect(page.locator('#explorer-assistant')).toBeVisible();
    await page.getByTestId('explorer-assistant-toggle').click();
    await expect(page.locator('#explorer-assistant')).toHaveCount(0);
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

    const reply = page.getByTestId('explorer-assistant-message-text');
    await expect(reply).toHaveText('The AI model is currently unavailable. Please try again.');
    await expect(reply).not.toContainText('errorType');
  });

  test('a refresh keeps the conversation, and resetting the search ends it', async ({ page }) => {
    const conversations: string[] = [];
    await page.route(chatPath, async (route) => {
      conversations.push(route.request().postDataJSON().conversationId);
      await route.fulfill({
        json: { response: `Answer ${conversations.length}`, search: 'age' },
      });
    });
    await openChat(page);
    await ask(page, 'first question');
    await expect(page.getByTestId('explorer-assistant-message-text')).toHaveText('Answer 1');

    await page.reload();
    await userIsLoggedIn(page);
    await expect(page.getByTestId('explorer-assistant-window')).toBeVisible();
    await expect(page.getByTestId('explorer-assistant-message-user')).toHaveText('first question');
    await expect(page.getByTestId('explorer-assistant-message-text')).toHaveText('Answer 1');

    await ask(page, 'second question');
    await expect(page.getByTestId('explorer-assistant-message-text')).toHaveCount(2);
    expect(conversations[1]).toBe(conversations[0]);

    await page.getByLabel('You are on the reset button').click();
    await expect(page.getByTestId('ui-search-input')).toHaveValue('');
    await expect(page.getByTestId('explorer-assistant-message-user')).toHaveCount(0);
    await expect(page.getByTestId('explorer-assistant-message-assistant')).toHaveCount(0);
    // Reset starts the conversation over but leaves the panel showing.
    await expect(page.getByTestId('explorer-assistant-window')).toBeVisible();

    await page.reload();
    await userIsLoggedIn(page);
    await expect(page.getByTestId('explorer-assistant-window')).toBeVisible();
    await expect(page.getByTestId('explorer-assistant-message-user')).toHaveCount(0);
    await ask(page, 'third question');
    await expect(page.getByTestId('explorer-assistant-message-text')).toHaveCount(1);
    expect(conversations[2]).not.toBe(conversations[0]);
  });

  test('Reset stops a reply that is still pending and clears it', async ({ page }) => {
    let release!: () => void;
    const held = new Promise<void>((resolve) => (release = resolve));
    await page.route(chatPath, async (route) => {
      await held;
      await route.fulfill({ json: { response: 'Too late.', search: 'late' } }).catch(() => {});
    });
    await openChat(page);
    await page.getByTestId('ui-search-input').fill('age');
    await page.getByTestId('ui-search-input').press('Enter');
    await ask(page, 'slow question');
    await expect(page.getByTestId('explorer-assistant-stop')).toBeVisible();

    await page.getByLabel('You are on the reset button').click();
    await expect(page.getByTestId('explorer-assistant-stop')).toHaveCount(0);
    await expect(page.getByTestId('explorer-assistant-thinking')).toHaveCount(0);
    await expect(page.getByTestId('explorer-assistant-message-user')).toHaveCount(0);

    release();
    await expect(page.getByTestId('explorer-assistant-message-text')).toHaveCount(0);
    await expect(page.getByTestId('ui-search-input')).toHaveValue('');
  });

  test('closing, reopening, expanding and collapsing keep the conversation', async ({ page }) => {
    const conversations: string[] = [];
    await page.route(chatPath, async (route) => {
      conversations.push(route.request().postDataJSON().conversationId);
      await route.fulfill({ json: { response: `Answer ${conversations.length}` } });
    });
    await openChat(page);
    await ask(page, 'first question');
    await expect(page.getByTestId('explorer-assistant-message-text')).toHaveText('Answer 1');

    await page.getByTestId('explorer-assistant-expand').click();
    await page.getByTestId('explorer-assistant-expand').click();
    await expect(page.getByTestId('explorer-assistant-message-user')).toHaveText('first question');

    await page.getByTestId('explorer-assistant-close').click();
    await expect(page.getByTestId('explorer-assistant-window')).toHaveCount(0);
    await page.getByTestId('explorer-assistant-toggle').click();
    await expect(page.getByTestId('explorer-assistant-message-user')).toHaveText('first question');

    await page.getByTestId('explorer-assistant-toggle').click();
    await page.getByTestId('explorer-assistant-toggle').click();
    await expect(page.getByTestId('explorer-assistant-message-text')).toHaveText('Answer 1');

    await ask(page, 'second question');
    await expect(page.getByTestId('explorer-assistant-message-text')).toHaveCount(2);
    expect(conversations[1]).toBe(conversations[0]);
  });

  test('a failure with no message from the service says so plainly, with no retry button', async ({
    page,
  }) => {
    await page.route(chatPath, (route) => route.fulfill({ status: 500, body: '' }));
    await openChat(page);
    await ask(page, 'hello');

    await expect(page.getByTestId('explorer-assistant-message-text')).toHaveText(
      'Sorry, the assistant could not answer that. You can send your message again, or put it another way.',
    );
    await expect(page.getByTestId('explorer-assistant-stop')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /retry|try again/i })).toHaveCount(0);
    await expect(page.getByTestId('explorer-assistant-input')).toBeEditable();
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
      await expect(page.getByTestId('explorer-assistant-changed')).toBeVisible();
      await expect(page.getByTestId('results-reset')).toBeVisible();
    }

    test('warns that the conversation goes too, and clears it on Yes', async ({ page }) => {
      await haveFilterAndConversation(page);

      await page.getByTestId('results-reset').click();
      const dialog = page.getByRole('dialog');
      await expect(dialog.getByTestId('results-reset-assistant-note')).toHaveText(
        'This will also clear your conversation with the search assistant.',
      );
      await dialog.getByRole('button', { name: 'Yes' }).click();

      await expect(page.getByText('No filters added')).toBeVisible();
      await expect(page.getByTestId('explorer-assistant-message-user')).toHaveCount(0);
      await expect(page.locator('#explorer-assistant')).toBeVisible();
    });

    test('keeps the conversation on No', async ({ page }) => {
      await haveFilterAndConversation(page);

      await page.getByTestId('results-reset').click();
      await page.getByRole('dialog').getByRole('button', { name: 'No' }).click();

      await expect(page.getByTestId('explorer-assistant-message-user')).toHaveCount(1);
    });

    test('says nothing about a conversation when there is none', async ({ page }) => {
      await mockApiSuccess(page, `${conceptsDetailPath}/*`, detailResponseCat);
      await mockApiSuccess(page, countResultPath, '9999');
      await page.route(chatPath, (route) =>
        route.fulfill({ json: { response: 'Added it.', query: filterQuery } }),
      );
      await openChat(page);
      await ask(page, 'add the heart attack filter');
      await expect(page.getByTestId('results-reset')).toBeVisible();
      await page.getByTestId('explorer-assistant-new').click();
      await page.getByRole('button', { name: 'Start new' }).click();
      await expect(page.getByRole('dialog')).toHaveCount(0);

      await page.getByTestId('results-reset').click();
      await expect(page.getByRole('dialog')).toContainText('clear all filters');
      await expect(page.getByTestId('results-reset-assistant-note')).toHaveCount(0);
    });
  });

  test('New conversation clears the thread and starts a new conversation id', async ({ page }) => {
    const conversations: string[] = [];
    await page.route(chatPath, async (route) => {
      conversations.push(route.request().postDataJSON().conversationId);
      await route.fulfill({ json: { response: 'ok' } });
    });
    await openChat(page);
    await expect(page.getByTestId('explorer-assistant-new')).toBeDisabled();
    await ask(page, 'one');
    await expect(page.getByTestId('explorer-assistant-message-text')).toHaveCount(1);

    await page.getByTestId('explorer-assistant-new').click();
    await page.getByRole('button', { name: 'Start new' }).click();
    await expect(page.getByTestId('explorer-assistant-message-user')).toHaveCount(0);
    await ask(page, 'two');
    await expect(page.getByTestId('explorer-assistant-message-text')).toHaveCount(1);
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
    await expect(page.getByTestId('explorer-assistant-stop')).toBeVisible();

    await page.unroute(chatPath);
    await page.reload();
    release();
    await userIsLoggedIn(page);

    await expect(page.getByTestId('explorer-assistant-message-user')).toHaveText('slow question');
    await expect(page.getByTestId('explorer-assistant-message-text')).toHaveText(
      'Here it is after the refresh.',
      { timeout: 10000 },
    );
  });

  test('a prose-only reply leaves the facets alone', async ({ page }) => {
    await page.route(chatPath, (route) => route.fulfill({ json: { response: 'Just an answer.' } }));
    await openChat(page);

    await ask(page, 'what is NHANES?');

    await expect(page.getByTestId('explorer-assistant-message-text')).toContainText(
      'Just an answer.',
    );
    await expect(page.getByTestId('explorer-assistant-undo')).toHaveCount(0);
    await expect(page.locator('input[type="checkbox"]:checked')).toHaveCount(0);
  });

  test('is hidden unless the deployment turns the feature on, whatever the user holds', async ({
    page,
  }) => {
    await mockApiConfig(page, { features: [] });
    await page.goto('/explorer');
    await userIsLoggedIn(page);
    await expect(page.getByTestId('ui-search-input')).toBeVisible();
    await expect(page.getByTestId('explorer-assistant-toggle')).toHaveCount(0);
  });
});

test.describe('Assisted search without the privilege', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/generalUser.json' });

  test('is hidden from a user who lacks the Explorer privilege', async ({ page }) => {
    await mockApiConfig(page, { features: [{ name: 'ENABLE_ASSISTED_SEARCH', value: 'true' }] });
    await page.goto('/explorer');
    await userIsLoggedIn(page);
    await expect(page.getByTestId('ui-search-input')).toBeVisible();
    await expect(page.getByTestId('explorer-assistant-toggle')).toHaveCount(0);
    await expect(page.getByTestId('explorer-assistant-window')).toHaveCount(0);
    await expect(page.locator('#explorer-assistant')).toHaveCount(0);
  });
});

test.describe('Assisted search per page', () => {
  const discoverFeatures = [
    { name: 'OPEN', value: 'true' },
    { name: 'DISCOVER', value: 'true' },
    { name: 'OPEN_EXPLORER', value: 'false' },
  ];
  const auth = (user: string) => `tests/end-to-end/.auth/${user}.json`;

  const bothFlags = [
    ...discoverFeatures,
    { name: 'ENABLE_ASSISTED_SEARCH', value: 'true' },
    { name: 'ENABLE_ASSISTED_SEARCH_DISCOVER', value: 'true' },
  ];

  test.beforeEach(async ({ page }) => {
    await mockApiSuccess(page, facetResultPath, facetsResponse);
    await mockApiSuccess(page, searchResultPath, searchResults);
    await mockApiConfig(page, { features: bothFlags });
  });

  test.describe('with the privilege on both pages', () => {
    test.use({ storageState: auth('assistantUser') });

    test('shows the toggle on Discover and on Explorer', async ({ page }) => {
      await page.goto('/discover');
      await expect(page.getByTestId('explorer-assistant-toggle')).toBeVisible();

      await page.goto('/explorer');
      await userIsLoggedIn(page);
      await expect(page.getByTestId('explorer-assistant-toggle')).toBeVisible();
    });
  });

  test.describe('with the privilege but only the Explorer flag', () => {
    test.use({ storageState: auth('assistantUser') });

    test('leaves Discover without the assistant', async ({ page }) => {
      await mockApiConfig(page, {
        features: [...discoverFeatures, { name: 'ENABLE_ASSISTED_SEARCH', value: 'true' }],
      });
      await page.goto('/discover');
      await expect(page.getByTestId('ui-search-input')).toBeVisible();
      await expect(page.getByTestId('explorer-assistant-toggle')).toHaveCount(0);
    });
  });

  test.describe('without the privilege', () => {
    test.use({ storageState: auth('generalUser') });

    test('keeps the assistant off Discover', async ({ page }) => {
      await page.goto('/discover');
      await expect(page.getByTestId('ui-search-input')).toBeVisible();
      await expect(page.getByTestId('explorer-assistant-toggle')).toHaveCount(0);
    });
  });
});

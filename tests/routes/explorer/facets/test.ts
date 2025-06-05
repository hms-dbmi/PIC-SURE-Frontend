import { expect, type Route } from '@playwright/test';
import { mockApiFail, test } from '../../../custom-context';
import {
  searchResults,
  facetsResponse,
  searchResultPath,
  facetResultPath,
  nestedFacetsResponse,
  facetsResponseToTestZeroCount,
} from '../../../mock-data';

const MAX_FACETS_TO_SHOW = 5;

test.use({ storageState: 'tests/.auth/generalUser.json' });

test.describe('Facet Side Bar', () => {
  test('Facet Side Bar is shown after loading', async ({ page }) => {
    // Given
    await page.route(searchResultPath, async (route: Route) =>
      route.fulfill({ json: searchResults }),
    );
    await page.route(facetResultPath, async (route: Route) =>
      route.fulfill({ json: facetsResponse }),
    );
    await page.goto('/explorer?search=age');
    //When
    const facetSideBar = page.locator('#facet-side-bar');

    await expect(facetSideBar).toBeVisible();
  });
  test("Facet Side Bar shows error when it doesn't load data", async ({ page }) => {
    // Given
    await page.route(searchResultPath, async (route: Route) =>
      route.fulfill({ json: searchResults }),
    );
    await mockApiFail(page, facetResultPath, 'aborted');
    await page.goto('/explorer?search=age');
    const facetSideBar = page.locator('#facet-side-bar');
    const errorAlert = page.getByTestId('error-alert');
    //When

    await expect(facetSideBar).toBeVisible();
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toHaveText(
      'Something went wrong loading your search options. Please wait a moment, refresh the page, and try again.',
    );
  });
  test('Facet Side Bar showes all categories', async ({ page }) => {
    // Given
    await page.route(searchResultPath, async (route: Route) =>
      route.fulfill({ json: searchResults }),
    );
    await page.route(facetResultPath, async (route: Route) =>
      route.fulfill({ json: facetsResponse }),
    );

    //When
    await page.goto('/explorer?search=age');
    const facetSideBar = page.locator('#facet-side-bar');
    await expect(facetSideBar).toBeVisible();
    const accordionDiv = facetSideBar.getByTestId('accordion');
    await expect(accordionDiv).toBeVisible();
    const facetCategoryElement = await facetSideBar.getByTestId('accordion-item').all();
    expect(facetCategoryElement).toHaveLength(facetsResponse.length);

    // Then
    const checkboxes = page.getByTestId('accordion-item').nth(1).locator('label');
    for (let i = 0; i < facetsResponse[1].facets.length; i++) {
      await expect(checkboxes.nth(i)).toContainText(facetsResponse[1].facets[i].display);
    }
  });
  test('Facet Side Bar categories are all open', async ({ page }) => {
    // Given
    await page.route(searchResultPath, async (route: Route) =>
      route.fulfill({ json: searchResults }),
    );
    await page.route(facetResultPath, async (route: Route) =>
      route.fulfill({ json: facetsResponse }),
    );

    //When
    await page.goto('/explorer?search=age');
    const facetSideBar = page.locator('#facet-side-bar');
    await expect(facetSideBar).toBeVisible();
    const accordionDiv = facetSideBar.getByTestId('accordion');
    await expect(accordionDiv).toBeVisible();
    const facetCategoryElement = await facetSideBar.getByTestId('accordion-item').all();
    expect(facetCategoryElement).toHaveLength(facetsResponse.length);

    // Then
    for (let i = 0; i < facetCategoryElement.length; i++) {
      const facetCount = facetsResponse[i].facets.reduce((sum, facet) => sum + facet.count, 0);
      await expect(facetCategoryElement[i]).toHaveAttribute(
        'data-state',
        facetCount > 0 ? 'open' : 'closed',
      );
    }
  });
});

test.describe('Facet Categories', () => {
  test('Facet Category has a title', async ({ page }) => {
    // Given
    await page.route(searchResultPath, async (route: Route) =>
      route.fulfill({ json: searchResults }),
    );
    await page.route(facetResultPath, async (route: Route) =>
      route.fulfill({ json: facetsResponse }),
    );
    await page.goto('/explorer?search=age');

    //When
    const facetCategoryElement = page
      .getByTestId('accordion-item')
      .nth(0)
      .getByRole('button')
      .getByTestId('accordion-control');

    // Then
    await expect(facetCategoryElement).toBeVisible();
    await expect(facetCategoryElement).toHaveText(facetsResponse[0].display);
  });
  test('Facet Category has facets listed', async ({ page }) => {
    // Given
    await page.route(searchResultPath, async (route: Route) =>
      route.fulfill({ json: searchResults }),
    );
    await page.route(facetResultPath, async (route: Route) =>
      route.fulfill({ json: facetsResponse }),
    );
    await page.goto('/explorer?search=age');
    const facetSideBar = page.locator('#facet-side-bar');
    await expect(facetSideBar).toBeVisible();

    for (let i = 0; i < facetsResponse.length; i++) {
      //When
      const facetList = page.getByTestId('accordion-item').nth(i);
      const facetItems = await facetList.locator('label').all();
      const numFacets = facetsResponse[i].facets.length;
      // Then
      if (numFacets > MAX_FACETS_TO_SHOW) {
        expect(facetItems).toHaveLength(MAX_FACETS_TO_SHOW);
      } else {
        const facetsToExpect = facetsResponse[i].facets.filter((facet) => facet.count > 0);
        expect(facetItems).toHaveLength(facetsToExpect.length);
      }
    }
  });
  test(`If facet category has over ${MAX_FACETS_TO_SHOW} facets then we show the more button`, async ({
    page,
  }) => {
    // Given
    await page.route(searchResultPath, async (route: Route) =>
      route.fulfill({ json: searchResults }),
    );
    await page.route(facetResultPath, async (route: Route) =>
      route.fulfill({ json: facetsResponse }),
    );
    await page.goto('/explorer?search=age');
    const facetSideBar = page.locator('#facet-side-bar');
    await expect(facetSideBar).toBeVisible();

    for (let i = 0; i < facetsResponse.length; i++) {
      //When
      const facetList = page.getByTestId('accordion-item').nth(i);
      const numFacets = facetsResponse[i].facets.length;
      // Then
      if (numFacets > MAX_FACETS_TO_SHOW) {
        const moreButton = facetList.getByTestId('show-more-facets');
        const moreButtonIcon = moreButton.locator('i');
        await expect(moreButton).toBeVisible();
        await expect(moreButton).toHaveText('Show More');
        await expect(moreButtonIcon).toHaveClass(/fa-angle-down/);
      }
    }
  });
  test(`If facet category has less than ${MAX_FACETS_TO_SHOW} facets then we don't show the more button`, async ({
    page,
  }) => {
    // Given
    await page.route(searchResultPath, async (route: Route) =>
      route.fulfill({ json: searchResults }),
    );
    await page.route(facetResultPath, async (route: Route) =>
      route.fulfill({ json: facetsResponseToTestZeroCount }),
    );
    await page.goto('/explorer?search=age');
    const facetSideBar = page.locator('#facet-side-bar');
    await expect(facetSideBar).toBeVisible();

    for (let i = 0; i < facetsResponseToTestZeroCount.length; i++) {
      //When
      const facetList = page.getByTestId('accordion-item').nth(i);
      // Then
      const moreButton = facetList.getByTestId('show-more-facets');
      await expect(moreButton).not.toBeVisible();
    }
  });
  test(`Clicking Show More shows more`, async ({ page }) => {
    // Given
    await page.route(searchResultPath, async (route: Route) =>
      route.fulfill({ json: searchResults }),
    );
    await page.route(facetResultPath, async (route: Route) =>
      route.fulfill({ json: facetsResponse }),
    );
    await page.goto('/explorer?search=age');
    const facetSideBar = page.locator('#facet-side-bar');
    await expect(facetSideBar).toBeVisible();

    for (let i = 0; i < facetsResponse.length; i++) {
      //When
      const facetList = page.getByTestId('accordion-item').nth(i);
      const numFacets = facetsResponse[i].facets.length;
      // Then
      if (numFacets > MAX_FACETS_TO_SHOW) {
        const moreButton = facetList.getByTestId('show-more-facets');
        await expect(moreButton).toBeVisible();
        await moreButton.click();
        const facetItems = await page.getByTestId('accordion-item').nth(i).locator('label').all();
        const facetsToExpect = facetsResponse[i].facets.filter((facet) => facet.count > 0);
        expect(facetItems).toHaveLength(facetsToExpect.length);
      }
    }
  });
  test(`Clicking Show More toggles text to Show Less`, async ({ page }) => {
    // Given
    await page.route(searchResultPath, async (route: Route) =>
      route.fulfill({ json: searchResults }),
    );
    await page.route(facetResultPath, async (route: Route) =>
      route.fulfill({ json: facetsResponse }),
    );
    await page.goto('/explorer?search=age');
    const facetSideBar = page.locator('#facet-side-bar');
    await expect(facetSideBar).toBeVisible();

    for (let i = 0; i < facetsResponse.length; i++) {
      //When
      const facetList = page.getByTestId('accordion-item').nth(i);
      const numFacets = facetsResponse[i].facets.length;
      // Then
      if (numFacets > MAX_FACETS_TO_SHOW) {
        const moreButton = facetList.getByTestId('show-more-facets');
        await expect(moreButton).toBeVisible();
        await moreButton.click();
        await expect(moreButton).toHaveText('Show Less');
        const moreButtonIcon = moreButton.locator('i');
        await expect(moreButtonIcon).toHaveClass(/fa-angle-up/);
      }
    }
  });
  test(`Clicking Show Less shows less`, async ({ page }) => {
    // Given
    await page.route(searchResultPath, async (route: Route) =>
      route.fulfill({ json: searchResults }),
    );
    await page.route(facetResultPath, async (route: Route) =>
      route.fulfill({ json: facetsResponse }),
    );
    await page.goto('/explorer?search=age');
    const facetSideBar = page.locator('#facet-side-bar');
    await expect(facetSideBar).toBeVisible();

    for (let i = 0; i < facetsResponse.length; i++) {
      //When
      const facetList = page.getByTestId('accordion-item').nth(i);
      const numFacets = facetsResponse[i].facets.length;
      // Then
      if (numFacets > MAX_FACETS_TO_SHOW) {
        const moreButton = facetList.getByTestId('show-more-facets');
        await expect(moreButton).toBeVisible();
        await moreButton.click();
        await expect(moreButton).toHaveText('Show Less');
        await moreButton.click();
        const facetItems = await page.getByTestId('accordion-item').nth(i).locator('label').all();
        expect(facetItems).toHaveLength(MAX_FACETS_TO_SHOW);
        await expect(moreButton).toHaveText('Show More');
      }
    }
  });
  test('Clicking a facet category header closes the category', async ({ page }) => {
    // Given
    await page.route(searchResultPath, async (route: Route) =>
      route.fulfill({ json: searchResults }),
    );
    await page.route(facetResultPath, async (route: Route) =>
      route.fulfill({ json: facetsResponse }),
    );
    await page.goto('/explorer?search=age');
    const facetSideBar = page.locator('#facet-side-bar');
    await expect(facetSideBar).toBeVisible();

    //When
    const facetCategory = page.getByTestId('accordion-item').first();
    const facetPanel = facetCategory.getByTestId('accordion-panel');
    const facetCategoryHeader = facetCategory.getByRole('button').getByTestId('accordion-control');
    await facetCategoryHeader.click();

    // Then
    await expect(facetPanel).not.toBeVisible();
  });
  test('Clicking a closed facet category header opens the category', async ({ page }) => {
    // Given
    await page.route(searchResultPath, async (route: Route) =>
      route.fulfill({ json: searchResults }),
    );
    await page.route(facetResultPath, async (route: Route) =>
      route.fulfill({ json: facetsResponse }),
    );
    await page.goto('/explorer?search=age');
    const facetSideBar = page.locator('#facet-side-bar');
    await expect(facetSideBar).toBeVisible();

    //When
    const facetCategory = page.getByTestId('accordion-item').first();
    const facetPanel = facetCategory.getByTestId('accordion-panel');
    const facetCategoryHeader = facetCategory.getByRole('button').getByTestId('accordion-control');
    await facetCategoryHeader.click();
    await expect(facetPanel).not.toBeVisible();
    await facetCategoryHeader.click();

    // Then
    await expect(facetPanel).toBeVisible();
  });
  test(`Facet category has search input when facets are more than ${MAX_FACETS_TO_SHOW}`, async ({
    page,
  }) => {
    // Given
    await page.route(searchResultPath, async (route: Route) =>
      route.fulfill({ json: searchResults }),
    );
    await page.route(facetResultPath, async (route: Route) =>
      route.fulfill({ json: facetsResponse }),
    );
    await page.goto('/explorer?search=age');
    const facetSideBar = page.locator('#facet-side-bar');
    await expect(facetSideBar).toBeVisible();

    // When
    for (let i = 0; i < facetsResponse.length; i++) {
      const facetList = page.getByTestId('accordion-item').nth(i);
      const numFacets = facetsResponse[i].facets.length;
      if (numFacets > MAX_FACETS_TO_SHOW) {
        const searchInput = facetList.locator('input[type="search"]');
        await expect(searchInput).toBeVisible();
      }
    }
  });
  test(`Facet search filters facets`, async ({ page }) => {
    // Given
    await page.route(searchResultPath, async (route: Route) =>
      route.fulfill({ json: searchResults }),
    );
    await page.route(facetResultPath, async (route: Route) =>
      route.fulfill({ json: facetsResponse }),
    );
    await page.goto('/explorer?search=age');
    const facetSideBar = page.locator('#facet-side-bar');
    await expect(facetSideBar).toBeVisible();

    // When
    for (let i = 0; i < facetsResponse.length; i++) {
      const facetList = page.getByTestId('accordion-item').nth(i);
      const numFacets = facetsResponse[i].facets.length;
      if (numFacets > MAX_FACETS_TO_SHOW) {
        const searchInput = facetList.locator('input[type="search"]');
        await expect(searchInput).toBeVisible();
        await searchInput.fill('Study Display');
        await expect(searchInput).toHaveValue('Study Display');
        const facetItems = await facetList.locator('label').all();
        for (const facetItem of facetItems) {
          const facetItemText = await facetItem.textContent();
          expect(facetItemText).toContain('Study Display');
        }
      }
    }
  });
  test(`Facet search filters facets includes full name`, async ({ page }) => {
    // Given
    await page.route(searchResultPath, async (route: Route) =>
      route.fulfill({ json: searchResults }),
    );
    await page.route(facetResultPath, async (route: Route) =>
      route.fulfill({ json: facetsResponse }),
    );
    await page.goto('/explorer?search=age');
    const facetSideBar = page.locator('#facet-side-bar');
    await expect(facetSideBar).toBeVisible();

    // When
    for (let i = 0; i < facetsResponse.length; i++) {
      const facetList = page.getByTestId('accordion-item').nth(i);
      const numFacets = facetsResponse[i].facets.length;
      if (numFacets > MAX_FACETS_TO_SHOW) {
        const searchInput = facetList.locator('input[type="search"]');
        await expect(searchInput).toBeVisible();
        await searchInput.fill('NSRR CFS full name');
        await expect(searchInput).toHaveValue('NSRR CFS full name');
        const facetItems = await facetList.locator('label').all();
        facetItems.forEach(async (facetItem) => {
          const facetItemText = await facetItem.textContent();
          expect(facetItemText).toContain('NSRR CFS');
        });
      }
    }
  });
});

test.describe('Facet & search', () => {
  test('Facet toggles included icon on', async ({ page }) => {
    // Given
    await page.route(searchResultPath, async (route: Route) =>
      route.fulfill({ json: searchResults }),
    );
    await page.route(facetResultPath, async (route: Route) =>
      route.fulfill({ json: facetsResponse }),
    );
    await page.goto('/explorer?search=age');
    const firstCheckName = facetsResponse[0].facets[0].name;
    const facetCheckBox = page.locator('input#' + firstCheckName);
    await expect(facetCheckBox).toBeVisible();

    // When
    await facetCheckBox.click(); // to Included state

    // Then
    await expect(facetCheckBox).toBeVisible();
    await expect(facetCheckBox).toHaveAttribute('aria-checked', 'true');
  });
  test('Facet toggle adds badge', async ({ page }) => {
    // Given
    await page.route(searchResultPath, async (route: Route) =>
      route.fulfill({ json: searchResults }),
    );
    await page.route(facetResultPath, async (route: Route) =>
      route.fulfill({ json: facetsResponse }),
    );
    await page.goto('/explorer?search=age');
    const firstCheckName = facetsResponse[0].facets[0].name;
    const facetCheckBox = page.locator('input#' + firstCheckName);
    await expect(facetCheckBox).toBeVisible();

    // When
    await facetCheckBox.click(); // to Included state

    const badge = page.locator(`#${facetsResponse[0].facets[0].name}.badge`);
    // Then
    await expect(badge).toBeVisible();
  });
  test('Facet toggles included icon off', async ({ page }) => {
    // Given
    await page.route(searchResultPath, async (route: Route) =>
      route.fulfill({ json: searchResults }),
    );
    await page.route(facetResultPath, async (route: Route) =>
      route.fulfill({ json: facetsResponse }),
    );
    await page.goto('/explorer?search=age');
    const firstCheckName = facetsResponse[0].facets[0].name;
    const facetCheckBox = page.locator('input#' + firstCheckName);
    await facetCheckBox.click(); // to Included state
    await expect(facetCheckBox).toBeVisible();

    //When
    await facetCheckBox.click(); // to Default state

    // Then
    await expect(facetCheckBox).toHaveAttribute('aria-checked', 'false');
  });
  test('Unselecting  ', async ({ page }) => {
    // Given
    await page.route(searchResultPath, async (route: Route) =>
      route.fulfill({ json: searchResults }),
    );
    await page.route(facetResultPath, async (route: Route) =>
      route.fulfill({ json: facetsResponse }),
    );
    await page.goto('/explorer?search=age');
    const firstCheckName = facetsResponse[0].facets[0].name;
    const facetCheckBox = page.locator('input#' + firstCheckName);
    await facetCheckBox.click(); // to Included state
    const badge = page.locator(`#${facetsResponse[0].facets[0].name}.badge`);
    await expect(facetCheckBox).toBeVisible();
    await expect(badge).toBeVisible();

    //When
    await facetCheckBox.click(); // to Default state

    await expect(badge).not.toBeVisible();
    // Then
  });
  test('Facet toggles included', async ({ page }) => {
    // Given
    await page.route(searchResultPath, async (route: Route) =>
      route.fulfill({ json: searchResults }),
    );
    await page.route(facetResultPath, async (route: Route) =>
      route.fulfill({ json: facetsResponse }),
    );
    await page.goto('/explorer?search=age');
    const firstCheckName = facetsResponse[0].facets[0].name;
    const facetCheckBox = page.locator('input#' + firstCheckName);
    await facetCheckBox.click(); // to Included state
    await expect(facetCheckBox).toBeVisible();

    //When
    await facetCheckBox.click(); // to Default state

    // Then
    await expect(facetCheckBox).toHaveAttribute('aria-checked', 'false');
  });
  test('Facets have counts', async ({ page }) => {
    // Given
    await page.route(searchResultPath, async (route: Route) =>
      route.fulfill({ json: searchResults }),
    );
    await page.route(facetResultPath, async (route: Route) =>
      route.fulfill({ json: facetsResponse }),
    );
    await page.goto('/explorer?search=age');

    //When
    const firstCheckName = facetsResponse[0].facets[0].name;
    const facetCheckBox = page.getByTestId(`facet-${firstCheckName}-label`);
    const spanInInput = facetCheckBox.locator('span');
    await expect(spanInInput).toBeVisible();

    // Then
    await expect(spanInInput).toContainText(facetsResponse[0].facets[0].count.toString());
  });
  test('Selected facet is not disabled when 0 count', async ({ page }) => {
    // Given
    await page.route(searchResultPath, async (route: Route) =>
      route.fulfill({ json: searchResults }),
    );
    await page.route(facetResultPath, async (route: Route) =>
      route.fulfill({
        json: [
          {
            ...facetsResponse[0],
            facets: [facetsResponse[0].facets[0], facetsResponse[0].facets[1]],
          },
          facetsResponse[1],
        ],
      }),
    );
    await page.goto('/explorer');
    await page.route(searchResultPath, async (route: Route) =>
      route.fulfill({
        json: {
          ...searchResults,
          totalElements: 0,
          content: [],
        },
      }),
    );
    await page.route(facetResultPath, async (route: Route) =>
      route.fulfill({
        json: [
          {
            ...facetsResponse[0],
            facets: [
              {
                ...facetsResponse[0].facets[0],
                count: 0,
              },
              facetsResponse[0].facets[1],
            ],
          },
          facetsResponse[1],
        ],
      }),
    );

    const firstCheckName = facetsResponse[0].facets[0].name;
    const facetCheckBox = page.getByTestId(`facet-${firstCheckName}-label`);
    await facetCheckBox.click();

    // When
    await page.getByTestId('search-box').fill('hsfgoisdhf');
    await page.locator('#search-button').click();

    // Then
    await expect(facetCheckBox).not.toBeDisabled();
  });
});

test.describe('Nested Facets', () => {
  test('Nested facets are displayed', async ({ page }) => {
    // Given
    await page.route(searchResultPath, async (route: Route) =>
      route.fulfill({ json: searchResults }),
    );
    await page.route(facetResultPath, async (route: Route) =>
      route.fulfill({ json: nestedFacetsResponse }),
    );
    await page.goto('/explorer?search=age');

    // When
    const nestedCategory = page.getByText('Nested Category');
    const nestedFacetArrow = page.getByTestId('facet-nested_facet-arrow');

    // Then
    await expect(nestedCategory).toBeVisible();
    await expect(nestedFacetArrow).toBeVisible();
  });
  test('Nested facets are toggleable', async ({ page }) => {
    // Given
    await page.route(searchResultPath, async (route: Route) =>
      route.fulfill({ json: searchResults }),
    );
    await page.route(facetResultPath, async (route: Route) =>
      route.fulfill({ json: nestedFacetsResponse }),
    );
    await page.goto('/explorer?search=age');

    // When
    const nestedFacetArrow = page.getByTestId('facet-nested_facet-arrow');
    await nestedFacetArrow.click();

    // Then
    const nestedFacetChildren = page.getByTestId('facet-nested_facet-children');
    await expect(nestedFacetChildren).toBeVisible();
    await nestedFacetArrow.click();
    await expect(nestedFacetChildren).not.toBeVisible();
  });
});
test.describe('Hidden Facets', () => {
  test('Facets with zero counts are not displayed', async ({ page }) => {
    // Given
    await page.route(searchResultPath, async (route: Route) =>
      route.fulfill({ json: searchResults }),
    );
    await page.route(facetResultPath, async (route: Route) =>
      route.fulfill({ json: facetsResponseToTestZeroCount }),
    );
    await page.goto('/explorer?search=age');
    const facetSideBar = page.locator('#facet-side-bar');
    await expect(facetSideBar).toBeVisible();

    //When
    const studyCategoryPanel = page.getByTestId('accordion-item').first();

    // Then - Verify that facets with count=0 are not shown
    for (const facet of facetsResponseToTestZeroCount[0].facets) {
      if (facet.count === 0) {
        const facetCheckBox = studyCategoryPanel.locator(`#${facet.name}`);
        await expect(facetCheckBox).not.toBeVisible();
      } else {
        const facetCheckBox = studyCategoryPanel.locator(`#${facet.name}`);
        await expect(facetCheckBox).toBeVisible();
      }
    }
  });
  test('Hidden facets are correctly identified when facets are updated', async ({ page }) => {
    // Given - Start with facets that have non-zero counts
    await page.route(searchResultPath, async (route: Route) =>
      route.fulfill({ json: searchResults }),
    );
    await page.route(facetResultPath, async (route: Route) =>
      route.fulfill({ json: facetsResponse }),
    );
    await page.goto('/explorer?search=age');

    // When - Perform a search that returns facets with zero counts
    await page.route(facetResultPath, async (route: Route) =>
      route.fulfill({ json: facetsResponseToTestZeroCount }),
    );
    await page.getByTestId('search-box').fill('new search term');
    await page.locator('#search-button').click();

    // Then - Zero count facets from the second response should be hidden
    const studyCategoryPanel = page.getByTestId('accordion-item').first();
    for (const facet of facetsResponseToTestZeroCount[0].facets) {
      if (facet.count === 0) {
        const facetCheckBox = studyCategoryPanel.locator(`#${facet.name}`);
        await expect(facetCheckBox).not.toBeVisible();
      }
    }
  });
  test('Empty category is still displayed but with no facets', async ({ page }) => {
    // Given
    await page.route(searchResultPath, async (route: Route) =>
      route.fulfill({ json: searchResults }),
    );
    await page.route(facetResultPath, async (route: Route) =>
      route.fulfill({ json: facetsResponseToTestZeroCount }),
    );
    await page.goto('/explorer?search=age');

    // When - Find the "Empty Category" section
    const emptyCategory = page.getByTestId('accordion-item').getByText('Empty Category');

    // Then - Category should exist but its panel should have no facets
    await expect(emptyCategory).toBeVisible();
    await emptyCategory.click();

    const emptyPanel = emptyCategory.locator('xpath=..').getByTestId('accordion-item');
    const facetsInEmptyPanel = await emptyPanel.locator('label').all();
    expect(facetsInEmptyPanel).toHaveLength(0);
  });
});

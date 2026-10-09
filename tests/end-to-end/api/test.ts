import { expect, type Page } from '@playwright/test';
import { test, mockApiFail, mockApiSuccess, mockApiConfig } from '../custom-context';
import { picsureUser, roles as mockRoles, mockExpiredToken, mockToken } from '../mock-data';
import { userIsLoggedIn } from '../utils';
import type { Branding } from '../../../src/lib/models/Configuration';
import brandingJson from '../../../src/lib/assets/configuration.json' with { type: 'json' };
const branding: Branding = JSON.parse(JSON.stringify(brandingJson));

const capabilities = branding?.apiPage?.capabilities || [];

async function expectSectionAligned(page: Page, id: string) {
  await expect
    .poll(() =>
      page.evaluate((sectionId) => {
        const scroller = document.getElementById('page')!;
        const section = document.getElementById(sectionId)!;
        const sectionTop =
          section.getBoundingClientRect().top -
          scroller.getBoundingClientRect().top +
          scroller.scrollTop;
        const destination = Math.min(sectionTop, scroller.scrollHeight - scroller.clientHeight);
        return Math.abs(scroller.scrollTop - destination);
      }, id),
    )
    .toBeLessThan(4);
}

// A JWT whose exp claim is the given number of days from now. The page only
// decodes the payload, so the signature is a placeholder.
function tokenExpiringInDays(days: number) {
  const encode = (part: object) => Buffer.from(JSON.stringify(part)).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + days * 24 * 60 * 60;
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: '1234567890', exp })}.signature`;
}

const placeHolderDots =
  '••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••';

test.use({ storageState: 'tests/end-to-end/.auth/generalUser.json' });

test.describe('API page', () => {
  test.beforeEach(async ({ context }) => {
    // The client code supports_genomic assertions depend on the gene/SNP flags.
    await mockApiConfig(context, {
      features: [
        { name: 'REQUIRE_CONSENTS', value: 'true' },
        { name: 'ENABLE_GENE_QUERY', value: 'true' },
        { name: 'ENABLE_SNP_QUERY', value: 'true' },
      ],
    });
    await mockApiSuccess(context, '*/**/psama/role', mockRoles);
    const user = picsureUser;
    user.token = mockExpiredToken;
    await mockApiSuccess(context, '*/**/psama/user/me?hasToken', user);
  });

  test('Has expected error message', async ({ page }) => {
    // Given
    await mockApiFail(page, '*/**/psama/user/me?hasToken', 'accessdenied');
    await page.goto('/api');
    await userIsLoggedIn(page);

    // When
    const errorAlert = page.locator('[data-testid=error-alert]');

    // Then
    await expect(errorAlert).toBeVisible();
  });

  test('Has expected header content', async ({ page }) => {
    // Given
    await page.goto('/api');
    await userIsLoggedIn(page);

    // Then
    await expect(page.locator('h1')).toHaveText('Programmatic Access with the PIC-SURE API');
    await expect(
      page.getByText('Search data and build cohorts directly with Python, R, or any HTTP client.'),
    ).toBeVisible();
  });

  test('Choose Your Workflow starts with every option collapsed', async ({ page }) => {
    // Given
    await page.goto('/api');
    await userIsLoggedIn(page);

    // When
    const python = page.getByTestId('workflow-python');
    const r = page.getByTestId('workflow-r');
    const http = page.getByTestId('workflow-http');

    // Then
    await expect(page.locator('#choose-your-workflow h2')).toHaveText('Choose Your Workflow');
    await expect(python.getByRole('button')).toHaveText(
      /Python Client\s*Recommended\s*Best if you work in Python or Jupyter Notebooks\.\s*Python 3\.10\+/,
    );
    await expect(r.getByRole('button')).toHaveText(
      /R Client\s*Recommended\s*Best if you work in R, Jupyter Notebooks, or RStudio\.\s*R 4\.1\+/,
    );
    await expect(http.getByRole('button')).toHaveText(
      /Direct API Access\s*Advanced\s*Best if you call PIC-SURE endpoints from a custom HTTP client\.\s*Any HTTP client/,
    );
    for (const item of [python, r, http]) {
      await expect(item.getByRole('button')).toHaveAttribute('aria-expanded', 'false');
    }
    await expect(page.locator('#choose-your-workflow [data-testid="accordion-panel"]')).toHaveCount(
      0,
    );
    for (const item of [python, r]) {
      const badge = item.getByRole('heading', { level: 3 }).locator('.badge');
      await expect(badge).toBeVisible();
      await expect(badge).toHaveText('Recommended');
      await expect(badge).toHaveClass(/preset-tonal-primary/);
    }
    const advanced = http.getByRole('heading', { level: 3 }).locator('.badge');
    await expect(advanced).toBeVisible();
    await expect(advanced).toHaveText('Advanced');
    await expect(advanced).toHaveClass(/preset-tonal-warning/);
  });

  test('Opening one option closes the other, and clicking the open header closes it', async ({
    page,
  }) => {
    // Given
    await page.goto('/api');
    await userIsLoggedIn(page);
    const pythonHeader = page
      .getByTestId('workflow-python')
      .getByRole('heading', { level: 3 })
      .getByRole('button');
    const rHeader = page
      .getByTestId('workflow-r')
      .getByRole('heading', { level: 3 })
      .getByRole('button');

    // When
    await pythonHeader.click();

    // Then
    await expect(pythonHeader).toHaveAttribute('aria-expanded', 'true');
    await expect(rHeader).toHaveAttribute('aria-expanded', 'false');

    // When
    await rHeader.click();

    // Then
    await expect(pythonHeader).toHaveAttribute('aria-expanded', 'false');
    await expect(rHeader).toHaveAttribute('aria-expanded', 'true');

    // When
    await rHeader.click();

    // Then
    await expect(rHeader).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('#choose-your-workflow [data-testid="accordion-panel"]')).toHaveCount(
      0,
    );
  });

  for (const { id, title, code, absent, platformPath, docsLabel, docsUrl } of [
    {
      id: 'python',
      title: 'Python Client',
      code: [
        '%pip install picsure',
        'include_consents=True',
        'requires_auth=True',
        'supports_genomic=True',
      ],
      absent: ['sys.executable', 'github.com'],
      platformPath: '',
      docsLabel: 'Python client documentation',
      docsUrl: 'https://github.com/hms-dbmi/pic-sure-python-adapter-hpds',
    },
    {
      id: 'r',
      title: 'R Client',
      code: [
        'pic-sure-r-adapter-hpds',
        'include_consents=TRUE',
        'requires_auth=TRUE',
        'supports_genomic=TRUE',
      ],
      absent: [],
      platformPath: '/picsure',
      docsLabel: 'R client documentation',
      docsUrl: 'https://github.com/hms-dbmi/pic-sure-r-adapter-hpds',
    },
  ]) {
    test(`Open ${title} shows the token step, authorized code, and more info`, async ({ page }) => {
      // Given
      await page.goto('/api');
      await userIsLoggedIn(page);
      const item = page.getByTestId(`workflow-${id}`);

      // When
      await item.getByRole('heading', { level: 3 }).getByRole('button').click();

      // Then
      const panel = item.getByTestId('accordion-panel');
      await expect(panel.locator('p').first()).toHaveText(
        "Copy your token above, paste it into a file named token.txt, and save it in the same folder as your code. Don't share this file or commit it to GitHub.",
      );
      await expect(panel.locator('p').first()).toHaveClass(/preset-tonal-primary/);
      const codeBlock = panel.locator('.code-block');
      await expect(codeBlock).toContainText('token.txt');
      for (const snippet of code) await expect(codeBlock).toContainText(snippet);
      for (const snippet of absent) await expect(codeBlock).not.toContainText(snippet);
      const origin = new URL(page.url()).origin;
      await expect(codeBlock).toContainText(`platform="${origin}${platformPath}"`);
      await expect(codeBlock.getByTestId('code-block-copy-btn')).toBeVisible();
      await expect(panel.getByText('More info', { exact: true })).toBeVisible();
      const docsLink = panel.getByRole('link', { name: docsLabel });
      await expect(docsLink).toHaveAttribute('href', docsUrl);
      await expect(docsLink).toHaveAttribute('target', '_blank');
      await expect(panel).toContainText(
        'Looking for example notebooks? Check out the public GitHub repository.',
      );
      await expect(panel.getByRole('link', { name: 'public GitHub repository' })).toHaveAttribute(
        'href',
        'https://github.com/hms-dbmi/Access-to-Data-using-PIC-SURE-API',
      );
    });
  }

  test('Open Direct API Access shows the token step, curl example, and API reference link', async ({
    page,
  }) => {
    // Given
    await page.goto('/api');
    await userIsLoggedIn(page);
    const item = page.getByTestId('workflow-http');

    // When
    await item.getByRole('heading', { level: 3 }).getByRole('button').click();

    // Then
    const panel = item.getByTestId('accordion-panel');
    await expect(panel.locator('p').first()).toHaveText(
      "Copy your token above, paste it into a file named token.txt, and save it in your working directory. Don't share this file or commit it to GitHub.",
    );
    const codeBlock = panel.locator('.code-block');
    await expect(codeBlock).toContainText('TOKEN=$(cat token.txt)');
    await expect(codeBlock).toContainText('Authorization: Bearer $TOKEN');
    await expect(codeBlock.getByTestId('code-block-copy-btn')).toBeVisible();
    await expect(panel).not.toContainText('Looking for example notebooks?');

    // When
    await panel.getByRole('link', { name: 'API reference' }).click();

    // Then
    await expect(page).toHaveURL(/#api-access$/);
    await expect(
      page.getByRole('heading', { name: 'API Documentation', exact: true }),
    ).toBeInViewport();
  });

  test('Has API Documentation section', async ({ page }) => {
    // Given
    await page.goto('/api');
    await userIsLoggedIn(page);

    // Then
    await expect(
      page.getByRole('heading', { name: 'API Documentation', exact: true }),
    ).toBeVisible();
    await expect(page.getByText('Browse and use the PIC-SURE API endpoints.')).toBeVisible();
  });

  for (const [state, token, badge] of [
    ['valid', mockToken, /^VALID FOR \d+ MORE DAYS$/],
    ['expiring', tokenExpiringInDays(3), /^EXPIRING SOON$/],
    ['expired', mockExpiredToken, /^EXPIRED$/],
  ] as const) {
    test(`Shows sections in page order when the token is ${state}`, async ({ context, page }) => {
      // Given
      await mockApiSuccess(context, '*/**/psama/user/me?hasToken', { ...picsureUser, token });
      await page.goto('/api');
      await userIsLoggedIn(page);
      await expect(page.getByTestId('expires-badge')).toHaveText(badge);

      // When
      const sectionIds = await page.locator('#api-page section[id]').evaluateAll((sections) =>
        sections
          .map((section) => ({ id: section.id, top: section.getBoundingClientRect().top }))
          .sort((a, b) => a.top - b.top)
          .map(({ id }) => id),
      );

      // Then
      expect(sectionIds).toEqual(['authentication', 'choose-your-workflow', 'api-access']);
      await expect(page.locator('h1#api-header')).toHaveText(
        'Programmatic Access with the PIC-SURE API',
      );
      await expect(page.getByTestId('toc').locator('a')).toHaveText([
        'Authentication',
        'Choose Your Workflow',
        'API Documentation',
      ]);
    });
  }

  test('Shows all capabilities with success icons when logged in', async ({ page }) => {
    // Given
    await page.goto('/api');
    await userIsLoggedIn(page);

    // When
    const items = page.getByTestId('capability-item');

    // Then
    await expect(items).toHaveCount(capabilities.length);
    for (const [index, capability] of capabilities.entries()) {
      await expect(items.nth(index)).toContainText(capability.text);
      await expect(items.nth(index).locator('i.fa-circle-check')).toBeVisible();
      if (capability.requiresLogin) {
        await expect(items.nth(index)).toContainText('(Requires login)');
      }
    }
  });

  test('Shows personal access token card with login confirmed', async ({ page }) => {
    // Given
    await page.goto('/api');
    await userIsLoggedIn(page);

    // Then
    await expect(page.getByText('Personal Access Token').first()).toBeVisible();
    await expect(page.getByText('Login confirmed')).toBeVisible();
    await expect(page.locator('i.fa-user-shield')).toBeVisible();
    await expect(page.getByTestId('public-access-key')).not.toBeVisible();
  });

  test('Has expected content', async ({ page }) => {
    // Given
    await page.goto('/api');
    await userIsLoggedIn(page);

    // When
    const userToken = page.locator('#user-token');

    // Then
    await expect(userToken).toBeVisible();
  });
  test('Has expected badge and expiration', async ({ page }) => {
    // Given
    await page.goto('/api');
    await userIsLoggedIn(page);

    // When
    const expires = page.locator('#expires');
    const badge = page.locator('#expires-badge');

    // Then
    await expect(expires).toBeVisible();
    await expect(badge).toBeVisible();

    await expect(badge).toHaveText('EXPIRED');
    await expect(expires).toContainText('Mon Feb 01 2021');
  });
  test(`User account matches expected email of ${picsureUser.email}`, async ({ page }) => {
    // Given
    await page.goto('/api');
    await userIsLoggedIn(page);

    // When
    const userEmail = page.locator('#account');

    // Then
    await expect(userEmail).toBeVisible();
    await expect(userEmail).toHaveText(picsureUser.email || '');
  });
  test('Token is hidden by default', async ({ page }) => {
    // Given
    await page.goto('/api');
    await userIsLoggedIn(page);

    // When
    const userToken = page.locator('#token');

    // Then
    await expect(userToken).toBeVisible();
    expect(await userToken.innerText()).toBe(placeHolderDots);
  });
  test('Buttons are displayed', async ({ page }) => {
    // Given
    await page.goto('/api');
    await userIsLoggedIn(page);

    // When
    const copyButton = page.getByTestId('copy-btn');
    const refeshButton = page.getByTestId('refresh-btn');
    const revealButton = page.getByTestId('reveal-btn');

    // Then
    await expect(copyButton).toBeVisible();
    await expect(refeshButton).toBeVisible();
    await expect(revealButton).toBeVisible();
  });
  test('Copy button copies token to clipboard', async ({ page }) => {
    // Given
    await page.goto('/api');
    await userIsLoggedIn(page);

    // When
    const copyButton = page.getByTestId('copy-btn');

    // Then
    await expect(copyButton).toBeVisible();
    await expect(copyButton).toContainText('Copy');

    // When
    await copyButton.click();

    // Then
    await expect(copyButton).toContainText('Copied!');
    //expect(await page.evaluate(() => navigator.clipboard.readText())).toEqual(mockUser.token);
  });
  test('Code block copy button copies code and shows confirmation', async ({ page }) => {
    // Given
    await page.goto('/analyze/api');
    await userIsLoggedIn(page);

    // When
    await page
      .getByTestId('workflow-python')
      .getByRole('heading', { level: 3 })
      .getByRole('button')
      .click();
    const copyButton = page.getByTestId('code-block-copy-btn').first();

    // Then
    await expect(copyButton).toBeVisible();
    await expect(copyButton.locator('i')).toHaveClass(/fa-copy/);

    // When
    await copyButton.click();

    // Then
    await expect(copyButton.locator('i')).toHaveClass(/fa-square-check/);
  });
  test('Token is visible when reveal button is clicked', async ({ page }) => {
    // Given
    await page.goto('/api');
    await userIsLoggedIn(page);

    // When
    const revealButton = page.getByTestId('reveal-btn');
    await revealButton.click();
    const userToken = page.locator('#token');

    // Then
    await expect(userToken).toBeVisible();
    expect(await userToken.innerText()).toBe(picsureUser.token);
  });
  test('Reveal button text changes when clicked', async ({ page }) => {
    // Given
    await page.goto('/api');
    await userIsLoggedIn(page);

    // When
    const revealButton = page.getByTestId('reveal-btn');
    await revealButton.click();

    // Then
    expect((await revealButton.innerHTML()).toString()).toBe('Hide');
  });
  test('Refresh button changes token', async ({ page }) => {
    // Given
    await page.goto('/api');
    await userIsLoggedIn(page);

    // When
    const refreshButton = page.getByTestId('refresh-btn');
    const userToken = page.locator('#token');
    await refreshButton.click();

    // Then
    expect(await userToken.innerText()).not.toBe(picsureUser.token);
  });
  test('Refresh button changes expiration, updates button text, disables button', async ({
    page,
  }) => {
    // Given
    await page.goto('/api');
    await userIsLoggedIn(page);
    const newToken = mockToken;
    await mockApiSuccess(page, '*/**/psama/user/me/refresh_long_term_token', {
      userLongTermToken: newToken,
    });
    const revealButton = page.getByTestId('reveal-btn');
    await revealButton.click();

    // When
    const refreshButton = page.getByTestId('refresh-btn');
    const expires = page.locator('#expires');
    await refreshButton.click();
    // Confirm Modal pops up
    const confrimButton = page.locator('button:has-text("Confirm")');
    await confrimButton.click();

    // Then
    await expect(refreshButton).toHaveText('Refreshed!');
    await expect(refreshButton).toBeDisabled();

    const userToken = page.locator('#token');
    await expect(userToken).not.toHaveText(placeHolderDots);
    await expect(userToken).toHaveText(newToken);
    await expect(expires).toContainText('Tue Jul 07 2274');
  });
  test('Canceling confirm modal does nothing to user', async ({ page }) => {
    // Given
    await page.goto('/api');
    await userIsLoggedIn(page);

    // When
    const userToken = page.locator('#token');
    const refreshButton = page.getByTestId('refresh-btn');
    const expires = page.locator('#expires');
    await refreshButton.click();
    // Confirm Modal pops up
    const cancel = page.locator('button:has-text("Cancel")');
    await cancel.click();

    // Then
    await expect(refreshButton).toHaveText('Refresh');
    await expect(refreshButton).not.toBeDisabled();
    expect(await userToken.innerText()).toBe(placeHolderDots);
    expect(await expires.innerText()).toContain('Mon Feb 01 2021');
  });

  for (const [id, other] of [
    ['python', 'r'],
    ['r', 'python'],
    ['http', 'python'],
  ]) {
    test(`Deep link #workflow-${id} opens that option and scrolls it into place`, async ({
      page,
    }) => {
      // Given
      await page.goto(`/api#workflow-${id}`);

      // Then
      await expect(
        page.getByTestId(`workflow-${id}`).getByRole('heading', { level: 3 }).getByRole('button'),
      ).toHaveAttribute('aria-expanded', 'true');
      await expect(
        page
          .getByTestId(`workflow-${other}`)
          .getByRole('heading', { level: 3 })
          .getByRole('button'),
      ).toHaveAttribute('aria-expanded', 'false');
      // The token card above the item loads after the first scroll and grows the page.
      await expect(page.locator('#user-token')).toBeVisible();
      await expect(async () => {
        const offset = await page.evaluate((itemId) => {
          const scroller = document.getElementById('page');
          const item = document.getElementById(itemId);
          if (!scroller || !item) return NaN;
          const itemTop =
            item.getBoundingClientRect().top -
            scroller.getBoundingClientRect().top +
            scroller.scrollTop;
          const maxScrollTop = scroller.scrollHeight - scroller.clientHeight;
          const target = Math.min(itemTop, maxScrollTop);
          return Math.round(scroller.scrollTop - target);
        }, `workflow-${id}`);
        expect(Math.abs(offset)).toBeLessThan(4);
      }).toPass({ timeout: 5000 });
    });
  }

  test('Old #quick-start deep links leave every option collapsed', async ({ page }) => {
    // Given
    await page.goto('/api#quick-start-r');
    await userIsLoggedIn(page);

    // Then
    await expect(
      page.getByTestId('workflow-r').getByRole('heading', { level: 3 }).getByRole('button'),
    ).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('#choose-your-workflow [data-testid="accordion-panel"]')).toHaveCount(
      0,
    );
  });
});

test.describe('Legacy analyze routes redirect to /api', () => {
  test.beforeEach(async ({ context }) => {
    await mockApiSuccess(context, '*/**/psama/role', mockRoles);
    const user = picsureUser;
    user.token = mockExpiredToken;
    await mockApiSuccess(context, '*/**/psama/user/me?hasToken', user);
  });

  ['/analyze/api', '/analyze/api/example', '/analyze'].forEach((legacyPath) => {
    test(`${legacyPath} redirects to /api`, async ({ page }) => {
      // When
      await page.goto(legacyPath);

      // Then
      await page.waitForURL('/api');
      await expect(page).toHaveURL('/api');
    });
  });
});

test.describe('API page logged out', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/unauthenticated.json' });

  test.beforeEach(async ({ page }) => {
    // OPEN keeps the root layout from redirecting anonymous visitors to /login.
    // Gene/SNP stay unset: the open client code asserts supports_genomic false.
    await mockApiConfig(page, { features: [{ name: 'OPEN', value: 'true' }] });
  });

  test('Has API nav link', async ({ page }) => {
    // Given
    await page.goto('/api');

    // When
    const navLink = page.locator('#nav-link-api');

    // Then
    await expect(navLink).toBeVisible();
    await expect(navLink).toHaveText('API');
    await expect(navLink).toHaveAttribute('aria-current', 'page');
  });

  test('Shows public access key card instead of personal access token', async ({ page }) => {
    // Given
    await page.goto('/api');

    // Then
    await expect(page.getByTestId('public-access-key')).toBeVisible();
    await expect(page.locator('#user-token')).not.toBeVisible();
  });

  test('Capabilities requiring login show an x icon and login text', async ({ page }) => {
    // Given
    await page.goto('/api');

    // When
    const items = page.getByTestId('capability-item');

    // Then
    await expect(items).toHaveCount(capabilities.length);
    for (const [index, capability] of capabilities.entries()) {
      await expect(items.nth(index)).toContainText(capability.text);
      if (capability.requiresLogin) {
        await expect(items.nth(index).locator('i.fa-circle-xmark')).toBeVisible();
        await expect(items.nth(index)).toContainText('(Requires login)');
      } else {
        await expect(items.nth(index).locator('i.fa-circle-check')).toBeVisible();
      }
    }
  });

  test('Client code connects to the open platform when logged out', async ({ page }) => {
    // Given
    await page.goto('/api');
    // Clicks before hydration don't open an item; the layout marks the body once mounted.
    await expect(page.locator('body.started')).toBeAttached();

    // When
    await page
      .getByTestId('workflow-python')
      .getByRole('heading', { level: 3 })
      .getByRole('button')
      .click();
    const pythonCode = page.getByTestId('workflow-python').locator('.code-block');

    // Then
    await expect(pythonCode).toContainText('include_consents=False');
    await expect(pythonCode).toContainText('requires_auth=False');
    await expect(pythonCode).toContainText('supports_genomic=False');
    await expect(pythonCode).toContainText('token.txt');

    // When
    await page
      .getByTestId('workflow-r')
      .getByRole('heading', { level: 3 })
      .getByRole('button')
      .click();
    const rCode = page.getByTestId('workflow-r').locator('.code-block');

    // Then
    await expect(rCode).toContainText('include_consents=FALSE');
    await expect(rCode).toContainText('requires_auth=FALSE');
    await expect(rCode).toContainText('supports_genomic=FALSE');
  });

  test('Table of contents lists all page sections', async ({ page }) => {
    // Given
    await page.goto('/api');

    // When
    const links = page.getByTestId('toc').locator('a');

    // Then
    const expected: Array<[string, string]> = [
      ['Authentication', '#authentication'],
      ['Choose Your Workflow', '#choose-your-workflow'],
      ['API Documentation', '#api-access'],
    ];
    await expect(links).toHaveCount(expected.length);
    for (const [index, [label, href]] of expected.entries()) {
      await expect(links.nth(index)).toHaveText(label);
      await expect(links.nth(index)).toHaveAttribute('href', href);
    }
    await expect(page.getByRole('navigation', { name: 'On this page' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Overview', exact: true })).toHaveCount(0);
  });

  test('Each table of contents link scrolls on its first click, including repeat visits', async ({
    page,
  }) => {
    await page.goto('/api');
    await expect(page.locator('body.started')).toBeAttached();
    for (const [name, id] of [
      ['Choose Your Workflow', 'choose-your-workflow'],
      ['Authentication', 'authentication'],
      ['API Documentation', 'api-access'],
      ['Choose Your Workflow', 'choose-your-workflow'],
    ]) {
      await page.getByTestId('toc').getByRole('link', { name, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`#${id}$`));
      await expectSectionAligned(page, id);
      await expect(page.locator(`#${id} h2`).first()).toBeFocused();
    }
  });

  test('Curl example uses the current origin and gateway Dictionary route', async ({ page }) => {
    await page.goto('/api');
    await expect(page.locator('body.started')).toBeAttached();
    await page
      .getByTestId('workflow-http')
      .getByRole('heading', { level: 3 })
      .getByRole('button')
      .click();
    const code = page.getByTestId('workflow-http').locator('.code-block');
    await expect(code).toContainText(
      `${new URL(page.url()).origin}/picsure/dictionary/concepts?page_number=0&page_size=10`,
    );
    await expect(code).not.toContainText('/proxy/');
  });

  test('Table of contents tracks the top, Workflow, and scrollable bottom', async ({ page }) => {
    await page.goto('/api');
    const toc = page.getByTestId('toc');
    const authLink = toc.getByRole('link', { name: 'Authentication' });
    const workflowLink = toc.getByRole('link', { name: 'Choose Your Workflow' });
    const docsLink = toc.getByRole('link', { name: 'API Documentation' });
    await expect(authLink).toHaveAttribute('aria-current', 'true');
    await expect(toc.locator('a[aria-current="true"]')).toHaveCount(1);

    await page.evaluate(() => {
      document.getElementById('choose-your-workflow')!.scrollIntoView({ behavior: 'instant' });
    });
    await expect(workflowLink).toHaveAttribute('aria-current', 'true');
    await expect(authLink).not.toHaveAttribute('aria-current', 'true');

    const hasOverflow = await page.locator('#page').evaluate((scroller) => {
      scroller.scrollTo({ top: scroller.scrollHeight, behavior: 'instant' });
      return scroller.scrollHeight > scroller.clientHeight;
    });
    expect(hasOverflow).toBe(true);
    await expect(docsLink).toHaveAttribute('aria-current', 'true');
    await expect(toc.locator('a[aria-current="true"]')).toHaveCount(1);

    await page.locator('#page').evaluate((scroller) => {
      scroller.scrollTo({ top: 0, behavior: 'instant' });
    });
    await expect(authLink).toHaveAttribute('aria-current', 'true');
    await expect(page).toHaveURL(/\/api$/);
  });

  test('Table of contents is visible at 1280px and hidden at 1279px', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/api');
    await expect(page.getByTestId('toc')).toBeVisible();

    await page.setViewportSize({ width: 1279, height: 800 });
    await expect(page.getByTestId('toc')).toBeHidden();
    await expect(page.locator('#choose-your-workflow h2')).toBeVisible();

    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(page.getByTestId('toc')).toBeVisible();
  });

  test('Table of contents preserves query parameters and restores heading focus through history', async ({
    page,
  }) => {
    await page.goto('/api?source=docs&filter=a%20b');
    await expect(page.locator('body.started')).toBeAttached();
    const toc = page.getByRole('navigation', { name: 'On this page' });
    await toc.getByRole('link', { name: 'Authentication', exact: true }).click();
    await expect(page).toHaveURL(/\/api\?source=docs&filter=a%20b#authentication$/);
    await expect(page.locator('#authentication h2')).toBeFocused();

    await toc.getByRole('link', { name: 'Choose Your Workflow', exact: true }).click();
    await expect(page).toHaveURL(/\/api\?source=docs&filter=a%20b#choose-your-workflow$/);
    await expect(page.locator('#choose-your-workflow h2')).toBeFocused();

    await page.goBack();
    await expect(page).toHaveURL(/\/api\?source=docs&filter=a%20b#authentication$/);
    await expectSectionAligned(page, 'authentication');
    await expect(page.locator('#authentication h2')).toBeFocused();

    await page.goForward();
    await expect(page).toHaveURL(/\/api\?source=docs&filter=a%20b#choose-your-workflow$/);
    await expectSectionAligned(page, 'choose-your-workflow');
    await expect(page.locator('#choose-your-workflow h2')).toBeFocused();
  });

  test('Hero spans the section bands and the right rail stays beside the content while scrolling', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/api');
    const toc = page.getByRole('navigation', { name: 'On this page' });
    await expect(toc).toBeVisible();

    const layout = await page.evaluate(() => {
      const rect = (selector: string) => {
        const { left, right, top, bottom, width } = document
          .querySelector(selector)!
          .getBoundingClientRect();
        return { left, right, top, bottom, width };
      };
      return {
        page: rect('#api-page'),
        hero: rect('#api-page header'),
        title: rect('#api-header'),
        rail: rect('[aria-label="On this page"]'),
        bands: ['authentication', 'choose-your-workflow', 'api-access'].map((id) => ({
          band: rect(`#${id}`),
          heading: rect(`#${id} h2`),
        })),
      };
    });
    expect(layout.hero.width).toBeCloseTo(layout.page.width, 0);
    expect(layout.hero.bottom).toBeLessThanOrEqual(layout.bands[0].band.top + 1);
    expect(layout.rail.top).toBeGreaterThanOrEqual(layout.hero.bottom);
    for (const { band, heading } of layout.bands) {
      expect(band.left).toBeCloseTo(layout.hero.left, 0);
      expect(band.width).toBeCloseTo(layout.hero.width, 0);
      expect(heading.left).toBeCloseTo(layout.title.left, 0);
      expect(heading.right).toBeLessThan(layout.rail.left);
    }

    await page.locator('#choose-your-workflow').evaluate((section) => {
      section.scrollIntoView({ behavior: 'instant' });
    });
    await expect(toc.getByRole('link', { name: 'Choose Your Workflow' })).toHaveAttribute(
      'aria-current',
      'true',
    );
    const before = (await toc.boundingBox())!;
    const scrolledBy = await page.locator('#page').evaluate((scroller) => {
      const before = scroller.scrollTop;
      scroller.scrollBy({ top: 100, behavior: 'instant' });
      return scroller.scrollTop - before;
    });
    expect(scrolledBy).toBeGreaterThan(50);
    await expect
      .poll(async () => Math.abs((await toc.boundingBox())!.y - before.y))
      .toBeLessThan(2);
    expect((await toc.boundingBox())!.x).toBeCloseTo(before.x, 0);
  });

  test('Legacy /analyze/api redirects to /api when logged out', async ({ page }) => {
    // When
    await page.goto('/analyze/api');

    // Then
    await page.waitForURL('/api');
    await expect(page).toHaveURL('/api');
  });
});

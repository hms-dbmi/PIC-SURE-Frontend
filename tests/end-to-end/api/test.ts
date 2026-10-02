import { expect } from '@playwright/test';
import { test, mockApiFail, mockApiSuccess, mockApiConfig } from '../custom-context';
import { picsureUser, roles as mockRoles, mockExpiredToken, mockToken } from '../mock-data';
import { userIsLoggedIn } from '../utils';
import type { Branding } from '../../../src/lib/models/Configuration';
import brandingJson from '../../../src/lib/assets/configuration.json' with { type: 'json' };
const branding: Branding = JSON.parse(JSON.stringify(brandingJson));

const capabilities = branding?.apiPage?.capabilities || [];

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
    // Pre-config-API these came from live VITE_* vars in .env.test; the quick start
    // code block assertions (include_consents/supports_genomic) depend on them.
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
      page.getByText('Search data and build cohorts directly with Python or R.'),
    ).toBeVisible();
    await expect(page.getByText('any HTTP client')).toHaveCount(0);
  });

  test('Choose Your Workflow starts with both clients collapsed', async ({ page }) => {
    // Given
    await page.goto('/api');
    await userIsLoggedIn(page);

    // When
    const python = page.getByTestId('workflow-python');
    const r = page.getByTestId('workflow-r');

    // Then
    await expect(page.locator('#choose-your-workflow h2')).toHaveText('Choose Your Workflow');
    await expect(python.getByRole('button')).toHaveText(
      /Python Client\s*Best if you work in Python or Jupyter Notebooks\.\s*Python 3\.10\+/,
    );
    await expect(r.getByRole('button')).toHaveText(
      /R Client\s*Best if you work in R, Jupyter Notebooks, or RStudio\.\s*R 4\.1\+/,
    );
    await expect(python.getByRole('button')).toHaveAttribute('aria-expanded', 'false');
    await expect(r.getByRole('button')).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('#choose-your-workflow [data-testid="accordion-panel"]')).toHaveCount(
      0,
    );
    await expect(page.locator('#choose-your-workflow .badge')).toHaveCount(0);
    await expect(page.getByText('Direct API Access')).toHaveCount(0);
  });

  test('Opening one client closes the other, and clicking the open header closes it', async ({
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

  for (const { id, title, code, docsLabel, docsUrl } of [
    {
      id: 'python',
      title: 'Python Client',
      code: ['pip install picsure', 'include_consents=True', 'requires_auth=True'],
      docsLabel: 'Python client documentation',
      docsUrl: 'https://github.com/hms-dbmi/pic-sure-python-adapter-hpds',
    },
    {
      id: 'r',
      title: 'R Client',
      code: ['pic-sure-r-adapter-hpds', 'include_consents=TRUE', 'requires_auth=TRUE'],
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
        "Copy your token above, paste it into a file named token.txt, and save it in the same folder as your notebook. Don't share this file or commit it to GitHub.",
      );
      await expect(panel.locator('p').first()).toHaveClass(/preset-tonal-primary/);
      const codeBlock = panel.locator('.code-block');
      await expect(codeBlock).toContainText('token.txt');
      for (const snippet of code) await expect(codeBlock).toContainText(snippet);
      await expect(codeBlock.getByTestId('code-block-copy-btn')).toBeVisible();
      await expect(panel.getByText('More info', { exact: true })).toBeVisible();
      const docsLink = panel.getByRole('link', { name: docsLabel });
      await expect(docsLink).toHaveAttribute('href', docsUrl);
      await expect(docsLink).toHaveAttribute('target', '_blank');
      await expect(panel).toContainText(
        'Looking for example notebooks? Find PIC-SURE tutorials in your Seven Bridges or Terra workspace.',
      );
    });
  }

  test('Hides the API Access section', async ({ page }) => {
    // Given
    await page.goto('/api');
    await userIsLoggedIn(page);

    // Then
    await expect(page.locator('#api-access')).toHaveCount(0);
    await expect(page.getByTestId('api-documentation')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'API Access', exact: true })).toHaveCount(0);
  });

  test('Table of contents lists the visible page sections', async ({ page }) => {
    // Given
    await page.goto('/api');
    await userIsLoggedIn(page);

    // When
    const links = page.getByTestId('toc').locator('a');

    // Then
    const expected: Array<[string, string]> = [
      ['Overview', '#api-header'],
      ['Authentication', '#authentication'],
      ['Choose Your Workflow', '#choose-your-workflow'],
    ];
    await expect(links).toHaveCount(expected.length);
    for (const [index, [label, href]] of expected.entries()) {
      await expect(links.nth(index)).toHaveText(label);
      await expect(links.nth(index)).toHaveAttribute('href', href);
    }
  });

  test('Table of contents marks Choose Your Workflow at the bottom of the page', async ({
    page,
  }) => {
    // Given
    await page.goto('/api');
    await userIsLoggedIn(page);

    // When
    await page.evaluate(() => {
      const scroller = document.getElementById('page');
      if (scroller) scroller.scrollTop = scroller.scrollHeight;
    });

    // Then
    const workflowLink = page
      .getByTestId('toc')
      .getByRole('link', { name: 'Choose Your Workflow' });
    await expect(workflowLink).toHaveAttribute('aria-current', 'true');
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
      expect(sectionIds).toEqual(['api-header', 'authentication', 'choose-your-workflow']);
      await expect(page.getByTestId('toc').locator('a')).toHaveText([
        'Overview',
        'Authentication',
        'Choose Your Workflow',
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
  test('Each table of contents link scrolls on its first click, including repeat visits', async ({
    page,
  }) => {
    await page.goto('/api');
    for (const [name, id] of [
      ['Choose Your Workflow', 'choose-your-workflow'],
      ['Authentication', 'authentication'],
      ['Overview', 'api-header'],
      ['Choose Your Workflow', 'choose-your-workflow'],
    ]) {
      await page.getByTestId('toc').getByRole('link', { name, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`#${id}$`));
      await expect
        .poll(() =>
          page.evaluate((sectionId) => {
            const scroller = document.getElementById('page')!;
            const section = document.getElementById(sectionId)!;
            return Math.abs(
              section.getBoundingClientRect().top - scroller.getBoundingClientRect().top,
            );
          }, id),
        )
        .toBeLessThan(4);
    }
  });

  test('Table of contents indicates the section in view', async ({ page }) => {
    // Given
    await page.goto('/api');
    const toc = page.getByTestId('toc');
    const authLink = toc.getByRole('link', { name: 'Authentication' });
    await expect(toc.getByRole('link', { name: 'Overview' })).toHaveAttribute(
      'aria-current',
      'true',
    );
    await expect(authLink).not.toHaveAttribute('aria-current', 'true');

    // When
    await page.evaluate(() => {
      const scroller = document.getElementById('page');
      const section = document.getElementById('authentication');
      if (!scroller || !section) return;
      scroller.scrollTop +=
        section.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
    });

    // Then
    await expect(authLink).toHaveAttribute('aria-current', 'true');
  });

  for (const [id, other] of [
    ['python', 'r'],
    ['r', 'python'],
  ]) {
    test(`Deep link #workflow-${id} opens that client and scrolls it into place`, async ({
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
      // The last item can't reach the top when the page ends first, so expect the
      // scroll position that aligns it as far as the page allows.
      await expect(async () => {
        const offset = await page.evaluate((itemId) => {
          const scroller = document.getElementById('page');
          const item = document.getElementById(itemId);
          if (!scroller || !item) return NaN;
          const itemTop =
            item.getBoundingClientRect().top -
            scroller.getBoundingClientRect().top +
            scroller.scrollTop;
          const target = Math.min(itemTop, scroller.scrollHeight - scroller.clientHeight);
          return Math.round(scroller.scrollTop - target);
        }, `workflow-${id}`);
        expect(Math.abs(offset)).toBeLessThan(4);
      }).toPass({ timeout: 5000 });
    });
  }

  test('Old #quick-start deep links leave both clients collapsed', async ({ page }) => {
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

  test('Table of contents is hidden on narrow viewports', async ({ page }) => {
    // Given
    await page.setViewportSize({ width: 1024, height: 800 });
    await page.goto('/api');

    // Then
    await expect(page.getByTestId('toc')).toBeHidden();
  });

  test('Leaves the page when the session ends in another tab', async ({ page }) => {
    // Given
    await page.goto('/api');
    await userIsLoggedIn(page);

    // When
    await page.evaluate(() => {
      localStorage.removeItem('token');
      window.dispatchEvent(new StorageEvent('storage', { key: 'token', newValue: null }));
    });

    // Then
    // OPEN is off in this suite, so home sends the logged-out visitor on to /login.
    await page.waitForURL('/login');
    await expect(page).toHaveURL('/login');
  });

  test('Redirects home when navigating to /api with an expired token', async ({ page }) => {
    // Given
    await page.goto('/help');
    await userIsLoggedIn(page);
    await page.evaluate((token) => localStorage.setItem('token', token), mockExpiredToken);

    // When
    await page.locator('#nav-link-api').click();

    // Then
    await page.waitForURL('/');
    await expect(page).toHaveURL('/');
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

// Release 1 hides the API page from logged-out users; restore with the Release 2 discover/open work.
test.describe.skip('API page logged out', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/unauthenticated.json' });

  test.beforeEach(async ({ page }) => {
    // OPEN keeps the root layout from redirecting anonymous visitors to /login.
    // Gene/SNP/consents stay unset: the open quick start asserts them false.
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
      ['Overview', '#api-header'],
      ['Authentication', '#authentication'],
      ['Choose Your Workflow', '#choose-your-workflow'],
      ['API Access', '#api-access'],
    ];
    await expect(links).toHaveCount(expected.length);
    for (const [index, [label, href]] of expected.entries()) {
      await expect(links.nth(index)).toHaveText(label);
      await expect(links.nth(index)).toHaveAttribute('href', href);
    }
  });

  test('Legacy /analyze/api redirects to /api when logged out', async ({ page }) => {
    // When
    await page.goto('/analyze/api');

    // Then
    await page.waitForURL('/api');
    await expect(page).toHaveURL('/api');
  });
});

test.describe('API page logged out (Release 1)', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/unauthenticated.json' });

  test.beforeEach(async ({ page }) => {
    // OPEN keeps the root layout from redirecting anonymous visitors to /login.
    await mockApiConfig(page, { features: [{ name: 'OPEN', value: 'true' }] });
  });

  test('Redirects /api to home', async ({ page }) => {
    // When
    await page.goto('/api');

    // Then
    await page.waitForURL('/');
    await expect(page).toHaveURL('/');
  });

  test('Legacy /analyze/api redirects to home', async ({ page }) => {
    // When
    await page.goto('/analyze/api');

    // Then
    await page.waitForURL('/');
    await expect(page).toHaveURL('/');
  });

  test('Hides the API nav link and landing card', async ({ page }) => {
    // When
    await page.goto('/');

    // Then
    await expect(page.locator('#nav-link-help')).toBeVisible();
    await expect(page.locator('#actions-section')).toBeVisible();
    await expect(page.locator('#nav-link-api')).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Explore the API' })).toHaveCount(0);
  });
});

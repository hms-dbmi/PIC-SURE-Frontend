import { expect, test } from '@playwright/test';
import { TEST_CONFIG_COOKIE } from '../../../../src/lib/testConfig';

// Rendering this route runs the root +layout.server.ts load. Without the test config cookie
// that load falls through to the real getConfig(), which retries with backoff against a
// backend that is not running under test and blocks well past the test timeout. Browser
// tests get this cookie from mockApiConfig; an APIRequestContext has to send it itself.
const testConfig = encodeURIComponent(JSON.stringify({ features: [], settings: [], branding: [] }));

test('retired data request route returns 404', async ({ request }) => {
  const response = await request.get('/dataset/request', {
    headers: { cookie: `${TEST_CONFIG_COOKIE}=${testConfig}` },
  });

  expect(response.status()).toBe(404);
});

import { expect, test } from '@playwright/test';

test('retired data request route returns 404', async ({ request }) => {
  const response = await request.get('/dataset/request');

  expect(response.status()).toBe(404);
});

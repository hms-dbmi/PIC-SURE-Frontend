import { test as base } from '@playwright/test';

export const test = base.extend({
  context: async ({ context }, use) => {
    await context.addInitScript(() => {
      sessionStorage.setItem('token', 'dummy user token');
    });

    use(context);
  },
});

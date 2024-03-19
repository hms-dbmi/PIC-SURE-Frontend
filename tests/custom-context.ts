import { test as base } from '@playwright/test';

export const test = base.extend({
  context: async ({ context }, use) => {
    await context.addInitScript(() => {
      sessionStorage.setItem(
        'token',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZW1haWwiOiJ0Z' +
          'XN0QHBpYy1zdXJlLm9yZyIsImV4cCI6MTYxMjE2NDk4MiwiaWF0IjoxNjA5NTcyOTgyfQ.kzaW-ZkhCPlTgdGQQAz_CA1ZB80PpZ5aiRa2' +
          'lj46hbw',
      );
    });

    use(context);
  },
});

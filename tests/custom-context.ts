import { test as base, type Route, type BrowserContext, type Page } from '@playwright/test';
import { picsureUser } from './mock-data';
import type { User } from '../src/lib/models/User';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mockApiSuccess(context: BrowserContext | Page, path: string, json: any) {
  return context.route(path, async (route: Route) => route.fulfill({ json }));
}

export function mockApiFail(
  context: BrowserContext | Page,
  path: string,
  message:
    | 'aborted'
    | 'accessdenied'
    | 'addressunreachable'
    | 'blockedbyclient'
    | 'blockedbyresponse'
    | 'connectionaborted'
    | 'connectionclosed'
    | 'connectionfailed'
    | 'connectionrefused'
    | 'connectionreset'
    | 'internetdisconnected'
    | 'namenotresolved'
    | 'timedout'
    | 'failed',
) {
  return context.route(path, (route: Route) => route.abort(message));
}

export const unauthedTest = base.extend({
  context: async ({ context }, use) => {
    await context.addInitScript(() => {
      sessionStorage.clear();
    });

    use(context);
  },
});

export const test = base.extend({
  context: async ({ context }, use) => {
    await mockApiSuccess(context, '*/**/psama/user/me?hasToken', picsureUser);
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

export function getUserTest(user: User = picsureUser) {
  return base.extend({
    context: async ({ context }, use) => {
      await context.addInitScript(() => {
        sessionStorage.setItem(
          'token',
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZW1haWwiOiJ0Z' +
            'XN0QHBpYy1zdXJlLm9yZyIsImV4cCI6MTYxMjE2NDk4MiwiaWF0IjoxNjA5NTcyOTgyfQ.kzaW-ZkhCPlTgdGQQAz_CA1ZB80PpZ5aiRa2' +
            'lj46hbw',
        );
      });

      await mockApiSuccess(context, '*/**/psama/authentication', user);
      await mockApiSuccess(context, '*/**/psama/user/me?hasToken', user);

      use(context);
    },
  });
}

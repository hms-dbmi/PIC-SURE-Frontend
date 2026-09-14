# Mock API server

A standalone HTTP server for local dev, backed by the same fixtures Playwright's
per-test route mocking already uses (`tests/end-to-end/mock-data.ts`). It exists because
`vite dev` alone has no backend to talk to - every page that fetches data errors out.
Playwright tests don't use this; they mock each route themselves (see `custom-context.ts`).

## Running it

```sh
npm run mock-api    # starts the mock server on :9000
npm run dev          # separate terminal - vite's dev proxy forwards /picsure and /psama to it
```

The proxy is wired up in `vite.config.ts` and only active outside Playwright's `test` mode,
so it never affects the e2e suite.

**`VITE_ORIGIN` must point at your `vite dev` server** (e.g. `http://localhost:5173`), not
a production-style domain. `src/lib/server/configCache.ts` makes a real server-side `fetch`
to `${VITE_ORIGIN}/picsure/...` on every page load - if that doesn't resolve to the running
dev server, requests never reach the proxy (or the mock) at all, and you'll see
`ECONNREFUSED` in the terminal instead of a 404 in the browser.

## Coverage

Search, facets, dictionary concepts/tree/hierarchy, dashboard, saved datasets, query
execution (cross counts, patient counts, variant export, dataframe export/status/signed-url),
runtime + admin configuration, and the full PSAMA admin surface (roles, privileges,
connections, users, applications, TOS). See `index.ts` for the full route table.

This favors "good enough to click through the app" over exactly replicating backend
business logic - search relevance, filter math, and real query execution aren't reproduced.

## Logging in without a real IDP

Auth0/Okta/Fence/RAS all redirect to a real external identity provider, which no local mock
can stand in for - there's no hosted login page to fake. Two ways around that:

**Option 1: the MOCK auth provider.** `src/lib/auth/MOCK.ts` skips the external redirect
entirely and jumps straight to the same `/login/loading` callback a real provider would
eventually land on, with a fabricated token - the rest of the login pipeline
(`authenticate` -> `psama/authentication/:provider` -> `picsureUser`) runs unmodified
against this mock server. Enable it by pointing a provider's `_TYPE` at `MOCK` in `.env`:

```sh
VITE_AUTH_PROVIDER_MODULE_MOCK=true
VITE_AUTH_PROVIDER_MODULE_MOCK_TYPE=MOCK
VITE_AUTH_PROVIDER_MODULE_MOCK_DESCRIPTION=Mock Login (local dev)
```

(or repoint an existing provider's `_TYPE` from `AUTH0` to `MOCK` to reuse its button/label).

By default this logs you in as the fully-privileged `picsureUser` fixture. To exercise a
different privilege level, add `_PERSONA` alongside the block above:

```sh
VITE_AUTH_PROVIDER_MODULE_MOCK_PERSONA=admin   # admin | super | general | noScope | noTOS
```

`MOCK.ts` sends this to `psama/authentication/mock` when you click the button, and the mock
server remembers it for the `psama/user/me` request that immediately follows.

**Option 2: skip the login UI.** From the browser console:

```js
localStorage.setItem('token', '<mockToken from mock-data.ts>');
```

then reload - `psama/user/me` answers as `picsureUser` regardless of how the token got there.
This path never calls `authenticate`, so pick a persona with `MOCK_USER_PERSONA` before
starting the mock server instead of `_PERSONA` in `.env`:

```sh
MOCK_USER_PERSONA=admin npm run mock-api   # admin | super | general | noScope | noTOS
```

/**
 * Standalone mock API for local dev (`npm run dev`). Playwright tests mock each route
 * themselves per-test (see custom-context.ts) and don't need this - it exists because
 * `vite dev` alone has no backend to talk to, so every page that fetches data errors out.
 *
 * Run with `npm run mock-api`, then enable the matching proxy in vite.config.ts (already
 * wired up) so `/picsure` and `/psama` requests reach this server instead of failing.
 *
 * Responses are built from tests/end-to-end/mock-data.ts so dev and e2e stay backed by the
 * same fixtures. Coverage favors "good enough to click through the app" over exactly
 * replicating backend business logic (search relevance, filter math, real query execution).
 */
import { createServer } from 'node:http';
import { Picsure, Psama } from '../../../src/lib/paths';
import {
  datasetDetails,
  searchResults,
  facetsResponse,
  detailResponseCat,
  hierarchyResponse,
  mockDashboard,
  mockConsents,
  mockToken,
  picsureUser,
  userTypes,
  geneValues,
  geneValuesPage2,
  geneValuesPage3,
  variantDataAggregate,
  variantDataFull,
  newDatasetResponse,
  availableDatasetResponse,
} from '../mock-data';
import { on, json, text, noContent, dispatch } from './router';
import { state, nextId } from './state';
import type { Indexable } from '../../../src/lib/types';

const PORT = Number(process.env.MOCK_API_PORT ?? 9000);

const path = (p: string) => `/${p}`;

// Both Concept.Detail and Concept.Tree key their fixtures by concept path, but the
// request body only sometimes carries one - fall back to matching on :dataset, then to
// a fixed default, so every dataset renders something while browsing locally.
function lookupConcept(
  map: Indexable,
  conceptPath: string | undefined,
  dataset: string,
  fallback: unknown,
) {
  const byPath = conceptPath ? map[conceptPath] : undefined;
  const byDataset = Object.values(map).find((c) => (c as { dataset?: string }).dataset === dataset);
  return byPath ?? byDataset ?? fallback;
}

/* ---------------------------------------------------------------------------------------
 * Dictionary / search / facets
 * ------------------------------------------------------------------------------------- */

on('POST', path(Picsure.Concepts), ({ res }) => {
  // Real relevance ranking/filtering isn't reproduced - always return the same fixture
  // page, which is enough to render the results table while browsing locally.
  json(res, searchResults);
});

on('POST', path(Picsure.Facets), ({ res }) => {
  json(res, facetsResponse);
});

on('POST', path(`${Picsure.Concept.Detail}/:dataset`), ({ params, body, res }) => {
  const conceptPath = typeof body === 'string' ? body : undefined;
  json(res, lookupConcept(datasetDetails.concepts, conceptPath, params.dataset, detailResponseCat));
});

on('POST', path(`${Picsure.Concept.Hierarchy}/:dataset`), ({ res }) => {
  json(res, hierarchyResponse);
});

on('POST', path(`${Picsure.Concept.Tree}/:dataset`), ({ params, body, res }) => {
  const conceptPath = typeof body === 'string' ? body : undefined;
  const fallback = Object.values(datasetDetails.tree)[0];
  json(res, lookupConcept(datasetDetails.tree, conceptPath, params.dataset, fallback));
});

on('GET', path(Picsure.Concept.Tree), ({ res }) => {
  json(res, Object.values(datasetDetails.tree));
});

on('GET', path(`${Picsure.DashboardDrawer}/:datasetId`), ({ params, res }) => {
  const row = mockDashboard.rows.find((r) => r.dataset_id === params.datasetId);
  json(res, row ?? mockDashboard.rows[0]);
});

on('GET', path(Picsure.Dashboard), ({ res }) => {
  json(res, mockDashboard);
});

on('GET', path(Picsure.SearchValues), ({ query, res }) => {
  const page = query.get('page') ?? '1';
  const byPage: Record<string, unknown> = {
    '1': geneValues,
    '2': geneValuesPage2,
    '3': geneValuesPage3,
  };
  json(res, byPage[page] ?? { results: [], page: Number(page), total: geneValues.total });
});

/* ---------------------------------------------------------------------------------------
 * Query execution (cross counts, patient counts, variant counts/export, dataframe export)
 * ------------------------------------------------------------------------------------- */

interface QueryV3SyncBody {
  query?: { expectedResultType?: string };
}

function crossCountMap(): Record<string, string> {
  return {
    '\\_studies_consents\\': '458917 ±3',
    '\\_studies_consents\\open_access-1000Genomes\\': '6267',
    '\\_studies_consents\\phs001\\': '12 ±3',
  };
}

function handleQuerySync({
  body,
  res,
}: {
  body: unknown;
  res: import('node:http').ServerResponse;
}) {
  const expectedResultType = (body as QueryV3SyncBody | undefined)?.query?.expectedResultType;
  switch (expectedResultType) {
    case 'COUNT':
      json(res, 4217);
      return;
    case 'CROSS_COUNT':
    case 'OBSERVATION_CROSS_COUNT':
      json(res, crossCountMap());
      return;
    case 'VARIANT_COUNT_FOR_QUERY':
      json(res, { count: 42 });
      return;
    case 'AGGREGATE_VCF_EXCERPT':
      text(res, variantDataAggregate);
      return;
    case 'VCF_EXCERPT':
      text(res, variantDataFull);
      return;
    default:
      json(res, {});
  }
}

on('POST', path(Picsure.QueryV3Sync), handleQuerySync);
on('POST', path(Picsure.QueryOpenV3Sync), handleQuerySync);

on('POST', path(Picsure.Visualization.Distributions), ({ res }) => {
  json(res, {
    categoricalData: [
      {
        conceptPath: datasetDetails.paths.GENDER,
        title: 'STUDY123: GENDER',
        continuous: false,
        categoricalMap: {
          Male: { count: 120, display: '120', variance: null },
          Female: { count: 130, display: '130', variance: null },
          Undisclosed: { count: 5, display: '5', variance: null },
        },
        obfuscated: false,
        xaxisName: 'GENDER',
        yaxisName: 'Number of Participants',
        chartWidth: 500,
        chartHeight: 600,
      },
    ],
    continuousData: [
      {
        conceptPath: datasetDetails.paths.HEIGHT,
        title: 'STUDY123: HEIGHT',
        continuous: true,
        continuousMap: {
          '0.0 - 100.0': { count: 40, display: '40', variance: null },
          '100.0 - 200.0': { count: 90, display: '90', variance: null },
          '200.0 - 300.0': { count: 35, display: '35', variance: null },
        },
        obfuscated: false,
        xaxisName: 'HEIGHT',
        yaxisName: 'Number of Participants',
        chartWidth: 500,
        chartHeight: 600,
      },
    ],
  });
});

on('POST', path(Picsure.QueryV3), ({ res }) => {
  json(res, { ...newDatasetResponse, picsureResultId: nextId() });
});

on('POST', path(`${Picsure.QueryV3}/:id/status`), ({ res }) => {
  json(res, availableDatasetResponse);
});

on('POST', path(`${Picsure.QueryV3}/:id/result`), ({ res }) => {
  text(res, variantDataAggregate);
});

on('POST', path(`${Picsure.QueryV3}/:id/signed-url`), ({ res }) => {
  json(res, { signedUrl: 'https://example.invalid/mock-export/signed-url' });
});

/* ---------------------------------------------------------------------------------------
 * Saved datasets
 * ------------------------------------------------------------------------------------- */

on('GET', path(Picsure.NamedDataSet), ({ res }) => {
  json(res, state.datasets);
});

on('GET', path(`${Picsure.NamedDataSet}/:uuid`), ({ params, res }) => {
  const found = state.datasets.find((d) => d.uuid === params.uuid);
  json(res, found ?? state.datasets[0]);
});

on('POST', path(Picsure.NamedDataSet), ({ body, res }) => {
  const request = body as { queryId?: string; name?: string };
  const created = structuredClone(state.datasets[0]);
  created.uuid = nextId();
  created.name = request.name ?? created.name;
  created.archived = false;
  state.datasets.push(created);
  json(res, created);
});

on('PUT', path(`${Picsure.NamedDataSet}/:uuid`), ({ params, body, res }) => {
  const index = state.datasets.findIndex((d) => d.uuid === params.uuid);
  const update = body as { name?: string; archived?: boolean };
  if (index === -1) {
    json(res, { error: 'dataset not found' }, 404);
    return;
  }
  state.datasets[index] = {
    ...state.datasets[index],
    ...(update.name !== undefined ? { name: update.name } : {}),
    ...(update.archived !== undefined ? { archived: update.archived } : {}),
  };
  json(res, state.datasets[index]);
});

/* ---------------------------------------------------------------------------------------
 * Configuration (both the runtime config the app reads and the admin CRUD screens)
 * ------------------------------------------------------------------------------------- */

// Empty until an admin row is added below - the app falls back to its baked-in defaults
// and whatever VITE_* env vars are set (see .env.example) until then. Matches how
// Playwright's context-level default mock treats this endpoint (see custom-context.ts).
on('GET', path(Picsure.Configuration.Get), ({ query, res }) => {
  const kind = query.get('kind');
  json(res, kind ? state.configRows.filter((r) => r.kind === kind) : []);
});

on('POST', path(Picsure.Configuration.Admin), ({ body, res }) => {
  const row = body as { name: string; kind: string; value: string; description?: string };
  const created = { ...row, uuid: nextId() };
  state.configRows.push(created);
  json(res, created);
});

on('PATCH', path(`${Picsure.Configuration.Admin}/:uuid`), ({ params, body, res }) => {
  const index = state.configRows.findIndex((r) => r.uuid === params.uuid);
  if (index === -1) {
    json(res, { error: 'config row not found' }, 404);
    return;
  }
  state.configRows[index] = { ...state.configRows[index], ...(body as object) };
  json(res, state.configRows[index]);
});

on('DELETE', path(`${Picsure.Configuration.Admin}/:uuid`), ({ params, res }) => {
  state.configRows = state.configRows.filter((r) => r.uuid !== params.uuid);
  noContent(res);
});

/* ---------------------------------------------------------------------------------------
 * Auth / user session
 *
 * Real OAuth redirects (Auth0/Okta/Fence/RAS) go to a real external IDP and can't be
 * satisfied by a local mock - use the MOCK provider (src/lib/auth/MOCK.ts) instead, or
 * skip the login UI entirely and seed a session from the browser console:
 *   localStorage.setItem('token', '<mockToken from mock-data.ts>')
 * then reload - psama/user/me below will answer as picsureUser either way.
 *
 * To log in as something other than the default fully-privileged picsureUser - useful for
 * exercising admin-only pages or the "no consents" states locally - pick a persona
 * (admin|super|general|noScope|noTOS) one of two ways:
 *   - via the MOCK provider: set VITE_AUTH_PROVIDER_MODULE_<name>_PERSONA in .env
 *   - via the localStorage-token shortcut: set MOCK_USER_PERSONA before `npm run mock-api`
 * ------------------------------------------------------------------------------------- */

const personas: Record<string, unknown> = {
  admin: { ...picsureUser, ...userTypes.adminUser },
  super: { ...picsureUser, ...userTypes.superUser },
  general: { ...picsureUser, ...userTypes.generalUser },
  noScope: { ...picsureUser, ...userTypes.noScopeUser },
  noTOS: { ...picsureUser, ...userTypes.noTOS },
};

function userForPersona(persona: string | undefined | null): unknown {
  const user = (persona && personas[persona]) || picsureUser;
  return state.acceptedTOS ? { ...(user as object), acceptedTOS: true } : user;
}

on('GET', path(Psama.User.Me), ({ query, res }) => {
  json(res, userForPersona(query.get('persona') ?? state.persona));
});

on('GET', path(Psama.User.Refresh), ({ res }) => {
  json(res, { userLongTermToken: mockToken });
});

on('GET', path(Psama.User.Consents), ({ res }) => {
  json(res, { consents: mockConsents });
});

on('GET', path(Psama.User.Logout), ({ res }) => {
  noContent(res);
});

on('POST', path(`${Psama.Auth}/:provider`), ({ body, res }) => {
  const persona = (body as { persona?: string } | undefined)?.persona;
  if (persona) {
    state.persona = persona;
    state.acceptedTOS = false;
  }
  res.setHeader('Authorization', `Bearer ${mockToken}`);
  json(res, userForPersona(persona ?? state.persona));
});

on('GET', path(`${Psama.TOS}/latest`), ({ res }) => {
  text(res, '<p>Mock Terms of Service</p>', 200, 'text/html');
});

on('POST', path(`${Psama.TOS}/accept`), ({ res }) => {
  state.acceptedTOS = true;
  noContent(res);
});

on('POST', path(`${Psama.TOS}/update`), ({ body, res }) => {
  text(res, typeof body === 'string' ? body : '', 200, 'text/html');
});

on('POST', path(Psama.StudyAccess), ({ res }) => {
  json(res, { status: 200 });
});

/* ---------------------------------------------------------------------------------------
 * Admin: roles, privileges, connections, users, applications
 * ------------------------------------------------------------------------------------- */

on('GET', path(Psama.Role), ({ res }) => json(res, state.roles));
on('GET', path(`${Psama.Role}/:uuid`), ({ params, res }) => {
  json(res, state.roles.find((r) => r.uuid === params.uuid) ?? state.roles[0]);
});
on('POST', path(Psama.Role), ({ body, res }) => {
  const [role] = body as { name: string; description: string; privileges: { uuid: string }[] }[];
  const created = { ...role, uuid: nextId() };
  state.roles.push(created);
  json(res, { content: [created] });
});
on('PUT', path(Psama.Role), ({ body, res }) => {
  const [role] = body as { uuid: string }[];
  const index = state.roles.findIndex((r) => r.uuid === role.uuid);
  const updated = { ...(index > -1 ? state.roles[index] : {}), ...role };
  if (index > -1) state.roles[index] = updated;
  else state.roles.push(updated);
  json(res, { content: [updated] });
});
on('DELETE', path(`${Psama.Role}/:uuid`), ({ params, res }) => {
  state.roles = state.roles.filter((r) => r.uuid !== params.uuid);
  noContent(res);
});

on('GET', path(Psama.Priviege), ({ res }) => json(res, state.privileges));
on('GET', path(`${Psama.Priviege}/:uuid`), ({ params, res }) => {
  json(res, state.privileges.find((p) => p.uuid === params.uuid) ?? state.privileges[0]);
});
on('POST', path(Psama.Priviege), ({ body, res }) => {
  const [privilege] = body as { name: string; description: string; application?: unknown }[];
  const created = { ...privilege, uuid: nextId() };
  state.privileges.push(created);
  json(res, [created]);
});
on('PUT', path(Psama.Priviege), ({ body, res }) => {
  const [privilege] = body as { uuid: string }[];
  const index = state.privileges.findIndex((p) => p.uuid === privilege.uuid);
  const updated = { ...(index > -1 ? state.privileges[index] : {}), ...privilege };
  if (index > -1) state.privileges[index] = updated;
  else state.privileges.push(updated);
  noContent(res);
});
on('DELETE', path(`${Psama.Priviege}/:uuid`), ({ params, res }) => {
  state.privileges = state.privileges.filter((p) => p.uuid !== params.uuid);
  noContent(res);
});

on('GET', path(Psama.Connection), ({ res }) => json(res, state.connections));
on('POST', path(Psama.Connection), ({ body, res }) => {
  const [connection] = body as { id: string; label: string }[];
  const created = { ...connection, uuid: nextId() };
  state.connections.push(created);
  json(res, { content: [created] });
});
on('PUT', path(Psama.Connection), ({ body, res }) => {
  const [connection] = body as { uuid: string }[];
  const index = state.connections.findIndex((c) => c.uuid === connection.uuid);
  const updated = { ...(index > -1 ? state.connections[index] : {}), ...connection };
  if (index > -1) state.connections[index] = updated;
  else state.connections.push(updated);
  json(res, [updated]);
});
on('DELETE', path(`${Psama.Connection}/:id`), ({ params, res }) => {
  state.connections = state.connections.filter((c) => c.id !== params.id);
  noContent(res);
});

on('GET', path(Psama.Users), ({ res }) => json(res, state.users));
on('GET', path(`${Psama.Users}/:uuid`), ({ params, res }) => {
  json(res, state.users.find((u) => u.uuid === params.uuid) ?? state.users[0]);
});
on('POST', path(Psama.Users), ({ body, res }) => {
  const [user] = body as { email: string }[];
  const created = { ...user, uuid: nextId() };
  state.users.push(created);
  json(res, [created]);
});
on('PUT', path(Psama.Users), ({ body, res }) => {
  const [user] = body as { uuid: string }[];
  const index = state.users.findIndex((u) => u.uuid === user.uuid);
  const updated = { ...(index > -1 ? state.users[index] : {}), ...user };
  if (index > -1) state.users[index] = updated;
  else state.users.push(updated);
  json(res, [updated]);
});

on('GET', path(Psama.Application), ({ res }) => json(res, state.applications));

/* ---------------------------------------------------------------------------------------
 * Logging - src/routes/api/v1/log forwards here when LOGGING_TARGET points at this server
 * (see .env.example); just swallow the event, nothing reads it back locally.
 * ------------------------------------------------------------------------------------- */

on('POST', path('picsure/logging/audit'), ({ res }) => {
  noContent(res, 202);
});

const server = createServer((req, res) => {
  void dispatch(req, res);
});

server.listen(PORT, () => {
  console.log(`[mock-api] listening on http://localhost:${PORT}`);
  console.log('[mock-api] enable the proxy block in vite.config.ts, then run `npm run dev`');
});

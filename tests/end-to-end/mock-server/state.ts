import { randomUUID } from 'node:crypto';
import {
  datasets as datasetsSeed,
  roles as rolesSeed,
  connections as connectionsSeed,
  privileges as privilegesSeed,
  applications as applicationsSeed,
  users as usersSeed,
} from '../mock-data';

// Loosely typed on purpose: handlers build partial rows (a create request plus a
// generated uuid) that don't match the full fixture shape, and this is a mock, not a
// place that needs compile-time guarantees about PSAMA's actual record shapes.
type Row = Record<string, unknown>;

// Mutable, in-memory copies of the mock-data.ts fixtures. Deep-cloned on boot so admin CRUD
// (add/edit/delete a role, connection, etc.) can mutate freely without touching the shared
// fixtures Playwright tests import from the same file, and resets on every server restart.
export const state = {
  datasets: structuredClone(datasetsSeed) as Row[],
  roles: structuredClone(rolesSeed) as Row[],
  connections: structuredClone(connectionsSeed) as Row[],
  privileges: structuredClone(privilegesSeed) as Row[],
  applications: structuredClone(applicationsSeed) as Row[],
  users: structuredClone(usersSeed) as Row[],
  // Keyed by the raw `kind` string the app sends (e.g. "ui:featureFlag", from
  // VITE_API_CONFIG_FEATURES) rather than 'features'/'settings'/'branding' - that mapping
  // lives in Configuration.ts behind `import.meta.env`, which only Vite resolves, not this
  // plain Node process. Matching the wire string directly sidesteps needing it here.
  configRows: [] as {
    uuid: string;
    name: string;
    kind: string;
    value: string;
    description?: string;
  }[],
  // Set by MOCK.ts's authenticate() call (see index.ts's psama/authentication/:provider
  // handler) and read back by the next psama/user/me request - the two calls have no other
  // shared context, since the app fetches /me generically with no idea which provider (or
  // persona) just logged in. Falls back to MOCK_USER_PERSONA for the "skip the login UI,
  // seed a token by hand" path, where authenticate() never runs at all.
  persona: process.env.MOCK_USER_PERSONA as string | undefined,
  // Set by the psama/terms/accept handler and read back by psama/user/me, so accepting
  // terms as the noTOS persona sticks for the rest of the session instead of reverting to
  // acceptedTOS: false on the next fetch (Terms.svelte reloads the user right after accept).
  // Reset whenever a persona logs in fresh, so the noTOS flow can be exercised again.
  acceptedTOS: false,
};

export function nextId(): string {
  return randomUUID();
}

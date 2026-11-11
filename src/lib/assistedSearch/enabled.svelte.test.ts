import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('$app/env', () => ({ browser: true }));

import { applyConfig, resetConfig } from '#lib/config/config.svelte.ts';
import { session } from '#lib/auth/session.svelte.ts';
import { PicsurePrivileges } from '#lib/auth/model/privilege.ts';
import { assistedSearchEnabled } from './enabled.ts';

const on = (name: string) => ({ name, value: 'true' });

function configure(...flags: string[]) {
  applyConfig({ features: flags.map(on), settings: [], branding: [] });
}

const BOTH = ['ENABLE_ASSISTED_SEARCH', 'ENABLE_ASSISTED_SEARCH_DISCOVER'];

describe('assistedSearchEnabled', () => {
  afterEach(() => session.clear());

  it('is off with the feature flag off, whatever privileges the user holds', () => {
    session.user = {
      privileges: [PicsurePrivileges.ASSISTED_SEARCH],
    };
    expect(assistedSearchEnabled(false)).toBe(false);
    expect(assistedSearchEnabled(true)).toBe(false);
  });

  it('is off for a user without the privilege, and for a logged-out visitor', () => {
    configure(...BOTH);
    session.user = { privileges: [PicsurePrivileges.QUERY] };
    expect(assistedSearchEnabled(false)).toBe(false);
    expect(assistedSearchEnabled(true)).toBe(false);

    session.user = {};
    expect(assistedSearchEnabled(false)).toBe(false);
    expect(assistedSearchEnabled(true)).toBe(false);
  });

  it('needs the flag for the page and the privilege', () => {
    configure('ENABLE_ASSISTED_SEARCH');
    session.user = { privileges: [PicsurePrivileges.ASSISTED_SEARCH] };
    expect(assistedSearchEnabled(false)).toBe(true);
    expect(assistedSearchEnabled(true)).toBe(false);

    // Config applies once per load, so reset before applying the other flag.
    resetConfig();
    configure('ENABLE_ASSISTED_SEARCH_DISCOVER');
    expect(assistedSearchEnabled(true)).toBe(true);
    expect(assistedSearchEnabled(false)).toBe(false);
  });

  it('grants both pages from the one privilege', () => {
    configure(...BOTH);
    session.user = { privileges: [PicsurePrivileges.ASSISTED_SEARCH] };
    expect(assistedSearchEnabled(false)).toBe(true);
    expect(assistedSearchEnabled(true)).toBe(true);
  });

  it('does not let a super admin in without the privilege', () => {
    configure(...BOTH);
    session.user = { privileges: [PicsurePrivileges.SUPER] };
    expect(assistedSearchEnabled(false)).toBe(false);
  });
});

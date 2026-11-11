// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { writable } = require('svelte/store') as typeof import('svelte/store');
  return { user: writable<{ privileges?: string[] }>({}) };
});

vi.mock('$app/environment', () => ({ browser: true }));
vi.mock('$lib/stores/User', () => ({ user: mocks.user }));

import { applyConfig, resetConfig } from '$lib/configuration.svelte';
import { assistedSearchEnabled } from '$lib/assistedSearch/enabled';

const on = (name: string) => ({ name, value: 'true' });

function configure(group?: string) {
  applyConfig({
    features: [on('ENABLE_ASSISTED_SEARCH'), on('ENABLE_ASSISTED_SEARCH_DISCOVER')],
    settings: group === undefined ? [] : [{ name: 'ASSISTED_SEARCH_PRIVILEGES', value: group }],
    branding: [],
  });
}

describe('assistedSearchEnabled', () => {
  afterEach(() => {
    resetConfig();
    mocks.user.set({});
  });

  it('is off with the page flag off, whatever the group', () => {
    mocks.user.set({ privileges: ['SUPER_ADMIN'] });
    expect(assistedSearchEnabled(false)).toBe(false);
    expect(assistedSearchEnabled(true)).toBe(false);
  });

  it('follows the page flag alone when no group is selected', () => {
    configure();
    expect(assistedSearchEnabled(false)).toBe(true);
    expect(assistedSearchEnabled(true)).toBe(true);
  });

  it('treats a blank group as no group', () => {
    configure(' , ');
    expect(assistedSearchEnabled(false)).toBe(true);
  });

  it('is on only for a user holding one of the selected privileges', () => {
    configure('AI_PILOT, NAMED_DATASET');
    mocks.user.set({ privileges: ['PIC_SURE_ANY_QUERY'] });
    expect(assistedSearchEnabled(false)).toBe(false);

    mocks.user.set({ privileges: ['PIC_SURE_ANY_QUERY', 'NAMED_DATASET'] });
    expect(assistedSearchEnabled(false)).toBe(true);
  });

  it('lets a super admin in, and keeps a logged-out visitor out', () => {
    configure('AI_PILOT');
    mocks.user.set({ privileges: ['SUPER_ADMIN'] });
    expect(assistedSearchEnabled(false)).toBe(true);

    mocks.user.set({});
    expect(assistedSearchEnabled(true)).toBe(false);
  });
});

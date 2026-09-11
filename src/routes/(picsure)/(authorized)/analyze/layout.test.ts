import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Redirect } from '@sveltejs/kit';
import { BDCPrivileges, PicsurePrivileges } from '$lib/models/Privilege';

const store = vi.hoisted(() => ({ value: {} as { privileges?: string[] } }));
const mockConfig = vi.hoisted(() => ({ features: { analyzeApi: true } }));

vi.mock('$app/environment', () => ({ browser: true }));
vi.mock('$lib/configuration.svelte', () => ({ config: mockConfig }));
vi.mock('$lib/stores/User', () => ({
  user: {
    subscribe: (fn: (v: unknown) => void) => {
      fn(store.value);
      return () => {};
    },
  },
}));

import { load } from './+layout';

function isRedirect(e: unknown): e is Redirect {
  return typeof e === 'object' && e !== null && 'status' in e && 'location' in e;
}

async function captureRedirect(path: string): Promise<Redirect | null> {
  try {
    await load({
      url: new URL(`http://localhost${path}`),
      parent: vi.fn().mockResolvedValue({}),
    } as unknown as Parameters<typeof load>[0]);
    return null;
  } catch (e) {
    if (isRedirect(e)) return e;
    throw e;
  }
}

beforeEach(() => {
  store.value = {};
  mockConfig.features.analyzeApi = true;
});

describe('analyze layout guard', () => {
  // Each arm is asserted on its own. Testing only one leaves the other free to hold a name that
  // does not match what PSAMA sends, which is exactly how AUTHORIZED_ACCESS came to be broken.
  it('admits a user holding only API_ACCESS', async () => {
    store.value = { privileges: [PicsurePrivileges.API_ACCESS] };

    expect(await captureRedirect('/analyze/api')).toBeNull();
  });

  it('admits a user holding only AUTHORIZED_ACCESS', async () => {
    store.value = { privileges: [BDCPrivileges.AUTHORIZED_ACCESS] };

    expect(await captureRedirect('/analyze/api')).toBeNull();
  });

  it('redirects to / when the user holds neither', async () => {
    store.value = { privileges: ['MANAGED_PRIV_OPEN_ACCESS'] };

    const result = await captureRedirect('/analyze/api');

    expect(result).not.toBeNull();
    expect(result!.location).toBe('/');
  });

  it('redirects to / when the user store is empty', async () => {
    const result = await captureRedirect('/analyze/api');

    expect(result).not.toBeNull();
    expect(result!.location).toBe('/');
  });

  // The privilege check runs before the config read, so an unauthorized user never reaches this.
  it('sends an authorized user from /analyze to /analyze/api', async () => {
    store.value = { privileges: [BDCPrivileges.AUTHORIZED_ACCESS] };

    const result = await captureRedirect('/analyze');

    expect(result).not.toBeNull();
    expect(result!.location).toBe('/analyze/api');
  });

  it('leaves /analyze alone when the analyzeApi feature is off', async () => {
    mockConfig.features.analyzeApi = false;
    store.value = { privileges: [BDCPrivileges.AUTHORIZED_ACCESS] };

    expect(await captureRedirect('/analyze')).toBeNull();
  });
});

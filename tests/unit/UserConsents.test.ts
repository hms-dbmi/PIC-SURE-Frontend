import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';

/**
 * `GET /psama/user/me/consents` is the sole client-side source of study
 * authorizations now that `/user/me/queryTemplate` is deleted.
 *
 * The wire shape is PSAMA's `UserConsentsResponse` contract: `{ userId, consents }`
 * where `consents` is `Map<String, Set<String>>` keyed by CONCEPT PATH — the
 * three keys `BdcConsentsBuilder` writes — and valued with the consent
 * identifiers verbatim (`phs000007.c1`, `open_access-1000Genomes`, …). These
 * tests pin that decoding, because every consent-aware call site in the app
 * reads through it.
 */

vi.mock('$app/environment', () => ({ browser: false }));
vi.mock('$app/state', () => ({ page: { url: new URL('http://localhost') } }));
vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$lib/api', () => ({ get: vi.fn(), post: vi.fn(), put: vi.fn(), del: vi.fn() }));
vi.mock('$lib/logger', () => ({ log: vi.fn(), createLog: vi.fn(), getSessionId: () => 'test' }));

import * as api from '$lib/api';
import {
  CONSENTS_PATH,
  HARMONIZED_CONSENTS_PATH,
  TOPMED_CONSENTS_PATH,
  consentValues,
  type UserConsentsResponse,
} from '$lib/models/UserConsents';
import { getUserConsents } from '$lib/stores/User';
import { Psama } from '$lib/paths';

describe('the consent concept paths', () => {
  it('are the keys BdcConsentsBuilder writes, byte for byte', () => {
    // A drift here silently drops every authorization filter: the server stores
    // the map under these exact strings and a missing key reads as "no consents".
    expect(CONSENTS_PATH).toBe('\\_consents\\');
    expect(HARMONIZED_CONSENTS_PATH).toBe('\\_harmonized_consent\\');
    expect(TOPMED_CONSENTS_PATH).toBe('\\_topmed_consents\\');
  });
});

describe('consentValues', () => {
  it('flattens the map entry to the identifiers the server encoded', () => {
    const consents = {
      [CONSENTS_PATH]: ['phs000007.c1', 'open_access-1000Genomes', 'tutorial-biolincc_framingham'],
    };

    expect(consentValues(consents, CONSENTS_PATH)).toEqual([
      'phs000007.c1',
      'open_access-1000Genomes',
      'tutorial-biolincc_framingham',
    ]);
  });

  it('keeps the three paths independent', () => {
    const consents = {
      [CONSENTS_PATH]: ['phs123.c1', 'phs456.c1'],
      [HARMONIZED_CONSENTS_PATH]: ['phs456.c1'],
      [TOPMED_CONSENTS_PATH]: ['phs789.c1'],
    };

    expect(consentValues(consents, CONSENTS_PATH)).toEqual(['phs123.c1', 'phs456.c1']);
    expect(consentValues(consents, HARMONIZED_CONSENTS_PATH)).toEqual(['phs456.c1']);
    expect(consentValues(consents, TOPMED_CONSENTS_PATH)).toEqual(['phs789.c1']);
  });

  it('reads an empty consents map as nothing authorized, not as an error', () => {
    // The shape a user with no stored record gets: PSAMA returns
    // `{ userId, consents: {} }` instead of failing, so `{}` is a normal answer.
    expect(consentValues({}, CONSENTS_PATH)).toEqual([]);
    expect(consentValues({}, HARMONIZED_CONSENTS_PATH)).toEqual([]);
    expect(consentValues({}, TOPMED_CONSENTS_PATH)).toEqual([]);
  });

  it('reads an absent map the same way', () => {
    expect(consentValues(undefined, CONSENTS_PATH)).toEqual([]);
    expect(consentValues(null, CONSENTS_PATH)).toEqual([]);
  });

  it('reads a present-but-empty list as nothing authorized', () => {
    expect(consentValues({ [CONSENTS_PATH]: [] }, CONSENTS_PATH)).toEqual([]);
  });

  it('reports malformed entries as null, distinct from empty', () => {
    // `consents` and `authorizationFilters[].values` both bind to List<String>,
    // so anything else is a 400 — callers drop the field rather than send it.
    const malformed: unknown[] = [
      { phs000007: 'c1' },
      'phs000007.c1',
      42,
      ['phs000007.c1', 42],
      [null],
    ];
    for (const values of malformed) {
      expect(
        consentValues({ [CONSENTS_PATH]: values } as Record<string, string[]>, CONSENTS_PATH),
      ).toBeNull();
    }
  });
});

describe('getUserConsents', () => {
  const get = api.get as Mock;

  beforeEach(() => {
    get.mockReset();
  });

  it('reads the self-scoped consents endpoint', async () => {
    get.mockResolvedValue({ userId: '1234', consents: {} } satisfies UserConsentsResponse);

    await getUserConsents();

    // Self-scoped: no user id in the path. The subject comes from the token.
    expect(get).toHaveBeenCalledWith(Psama.User.Consents);
    expect(Psama.User.Consents).toBe('psama/user/me/consents');
  });

  it('hands back the map straight off the typed body, with no JSON.parse step', async () => {
    // The template arrived as a JSON STRING under `queryTemplate` and had to be
    // parsed; `/me/consents` answers the typed object directly.
    const consents = { [CONSENTS_PATH]: ['phs000007.c1'] };
    get.mockResolvedValue({ userId: '1234', consents } satisfies UserConsentsResponse);

    expect(await getUserConsents()).toEqual(consents);
  });

  it('returns an empty map for a user with no stored consents', async () => {
    get.mockResolvedValue({ userId: '1234', consents: {} });

    expect(await getUserConsents()).toEqual({});
  });

  it('degrades to an empty map instead of throwing when the request fails', async () => {
    // This runs inside the authorized layout's hydration, where a throw bounces
    // the user to /login. A missing consent list must not cost them the session.
    get.mockRejectedValue(new Error('503'));
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(await getUserConsents()).toEqual({});
    error.mockRestore();
  });
});

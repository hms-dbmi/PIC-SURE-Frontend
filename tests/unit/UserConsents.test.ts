import { describe, it, expect } from 'vitest';

/**
 * `GET /psama/user/me/consents` is the sole client-side source of study
 * authorizations now that `/user/me/queryTemplate` is deleted.
 *
 * The wire shape is PSAMA's `UserConsentsResponse` contract: `{ userId, consents }`
 * where `consents` is `Map<String, Set<String>>` keyed by CONCEPT PATH — the
 * three keys `BdcConsentsBuilder` writes — and valued with the consent
 * identifiers verbatim (`phs000007.c1`, `open_access-1000Genomes`, …). These
 * tests pin that decoding, because every consent-aware call site in the app
 * reads through it. The fetch/retry behavior itself is covered in
 * Consents.test.ts.
 */

import {
  CONSENTS_PATH,
  HARMONIZED_CONSENTS_PATH,
  TOPMED_CONSENTS_PATH,
  consentValues,
} from '$lib/models/UserConsents';
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

describe('the consents endpoint path', () => {
  it('is self-scoped: no user id in the path, the subject comes from the token', () => {
    expect(Psama.User.Consents).toBe('psama/user/me/consents');
  });
});

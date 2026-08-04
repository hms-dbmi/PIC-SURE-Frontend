/**
 * The wire shape of `GET /psama/user/me/consents` — PSAMA's
 * `UserConsentsResponse` contract record.
 *
 * The map is keyed by CONCEPT PATH, not by study accession: PSAMA's
 * `BdcConsentsBuilder` files every authorized consent under `\_consents\`, the
 * harmonized subset under `\_harmonized_consent\` and the genomic subset under
 * `\_topmed_consents\`. The values are the consent identifiers exactly as the
 * server stores them (`phs000007.c1`, `open_access-1000Genomes`, …) — the client
 * never parses or reformats them.
 *
 * This is the same map the deleted `/me/queryTemplate` used to carry as its
 * `categoryFilters`, which is why the migration is a change of source and not a
 * change of shape.
 *
 * A user with no stored consent record gets `{ userId, consents: {} }` rather
 * than an error, so an empty map is a normal, expected answer meaning "nothing
 * authorized" — never a failure to be retried.
 *
 * Two keys, and no more: the response used to be the JPA entity, which also
 * carried the `user_consents` row's own `uuid`. That is PSAMA storage, not
 * answer, and it is off the wire — nothing here may read it back.
 */
export interface UserConsentsResponse {
  userId?: string;
  consents?: ConsentsMap;
}

/** Concept path -> the consent identifiers authorized under it. */
export type ConsentsMap = Record<string, string[]>;

export const CONSENTS_PATH = '\\_consents\\';
export const HARMONIZED_CONSENTS_PATH = '\\_harmonized_consent\\';
export const TOPMED_CONSENTS_PATH = '\\_topmed_consents\\';

/**
 * The consent identifiers stored under `conceptPath`, flattened to the plain
 * `string[]` that both the dictionary's `consents` field and a v3 query's
 * `authorizationFilters.values` expect.
 *
 * Three outcomes, and callers must keep them apart:
 *
 * - `[]`      — the path is absent (or explicitly null). Nothing authorized here.
 * - `string[]` — the authorized identifiers, untouched.
 * - `null`    — the path is PRESENT but malformed (an object, a bare string, a
 *   list with a non-string in it). Both consumers bind to `List<String>` on the
 *   server, so passing malformed data through is a 400 on every affected call.
 *   `null` lets a caller drop the field instead and let the request through
 *   unfiltered, which is the lesser failure — the data problem is not one the
 *   client can fix.
 */
export function consentValues(
  consents: ConsentsMap | undefined | null,
  conceptPath: string,
): string[] | null {
  const values: unknown = consents?.[conceptPath];
  if (values === undefined || values === null) return [];
  if (Array.isArray(values) && values.every((value) => typeof value === 'string')) {
    return values as string[];
  }
  return null;
}

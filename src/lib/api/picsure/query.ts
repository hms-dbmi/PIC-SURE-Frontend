import { request } from '#lib/api/client.ts';
import { Picsure, PicsurePaths } from '#lib/api/paths.ts';
import type { QueryRequestBody, QueryStatus } from '#lib/api/picsure/query.types.ts';
import { isRecord } from '#lib/api/picsure/guards.ts';

/**
 * Runs a query and resolves with HPDS's answer, whose shape depends on the expected result
 * type. HPDS reports some failures as a 200 with an `errorType`; callers check for those.
 */
export function runSyncQuery(
  query: QueryRequestBody,
  { openEndpoint = false, signal }: { openEndpoint?: boolean; signal?: AbortSignal } = {},
): Promise<unknown> {
  return request(PicsurePaths.syncQuery(openEndpoint), {
    method: 'POST',
    body: query,
    auth: 'open',
    signal,
  });
}

/** A COUNT query's patient count. */
export async function runCount(query: QueryRequestBody): Promise<number> {
  const count = await runSyncQuery(query);
  if (typeof count !== 'number') throw new Error('Invalid count response');
  return count;
}

/**
 * A cross-count query's counts by concept path. Entries that aren't numbers, such as an open
 * endpoint's obfuscated `12 ±3` or the fields of an HPDS error answer, are left out.
 */
export async function runCrossCount(query: QueryRequestBody): Promise<Record<string, number>> {
  const response = await runSyncQuery(query);
  if (!isRecord(response)) throw new Error('Invalid cross count response');
  const counts: Record<string, number> = {};
  for (const [conceptPath, value] of Object.entries(response)) {
    const count = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
    if (typeof count === 'number' && Number.isFinite(count)) counts[conceptPath] = count;
  }
  return counts;
}

export async function countVariants(query: QueryRequestBody): Promise<number> {
  const response = await runSyncQuery(query);
  const count = isRecord(response) ? response.count : undefined;
  if (typeof count !== 'number') throw new Error('Invalid variant count response');
  return count;
}

/** A tab-separated VCF excerpt, header line first. */
export async function getVariantExcerpt(query: QueryRequestBody): Promise<string> {
  const response = await runSyncQuery(query);
  if (typeof response !== 'string') throw new Error('Invalid variant excerpt response');
  return response;
}

/** Starts an asynchronous query, the first step of an export. */
export async function submitQuery(query: QueryRequestBody): Promise<QueryStatus> {
  return toQueryStatus(await request(Picsure.Query, { method: 'POST', body: query, auth: 'open' }));
}

export async function getQueryStatus(
  queryId: string,
  query: QueryRequestBody,
): Promise<QueryStatus> {
  return toQueryStatus(
    await request(PicsurePaths.queryStatus(queryId), { method: 'POST', body: query, auth: 'open' }),
  );
}

/** The finished query's data file: CSV text, or the raw bytes of a binary format. */
export function getQueryResult(queryId: string): Promise<ArrayBuffer | string> {
  return request(PicsurePaths.queryResult(queryId), { method: 'POST', body: {}, auth: 'open' });
}

/** A signed URL that lets an external platform fetch the result, or null without one. */
export async function getSignedUrl(
  queryId: string,
  query: QueryRequestBody,
): Promise<string | null> {
  const response = await request(PicsurePaths.querySignedUrl(queryId), {
    method: 'POST',
    body: query,
    auth: 'open',
  });
  const signedUrl = isRecord(response) ? response.signedUrl : undefined;
  return typeof signedUrl === 'string' && signedUrl ? signedUrl : null;
}

function toQueryStatus(response: unknown): QueryStatus {
  if (!isRecord(response)) return {};
  const { picsureResultId, status } = response;
  return {
    picsureResultId: typeof picsureResultId === 'string' ? picsureResultId : undefined,
    status: typeof status === 'string' ? status : undefined,
  };
}

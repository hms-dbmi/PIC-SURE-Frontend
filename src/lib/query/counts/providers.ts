import type { QueryRequest } from '#lib/api/picsure/query.types.ts';
import type { CountValue, PatientCount } from '#lib/query/counts/format.ts';
import { useOpenAccess } from '#lib/explorer/mode.ts';
import { buildRequest } from '#lib/query/build.ts';
import type { QueryDescriptor } from '#lib/query/descriptor.svelte.ts';

/**
 * A count sent as a query. The executor (`QueryCountService`) transports the
 * request, unwraps `{errorType, message}` envelopes BEFORE calling
 * `parse(raw)`, and emits per-request telemetry.
 */
export interface QueryCountProvider {
  id: string;
  /** Whether the descriptor's counts come from the open-access (aggregate) endpoint. */
  openEndpoint(descriptor: QueryDescriptor): boolean;
  buildRequest(descriptor: QueryDescriptor): QueryRequest;
  parse(raw: unknown): CountValue;
}

/** A count that comes from somewhere other than a query (the dictionary, the config). */
export interface FetchCountProvider {
  id: string;
  fetch(descriptor: QueryDescriptor): Promise<CountValue>;
}

export type CountProvider = QueryCountProvider | FetchCountProvider;

export function isQueryProvider(provider: CountProvider): provider is QueryCountProvider {
  return 'buildRequest' in provider;
}

/** Open access asks for the studies-consents cross count; signed-in users get a plain count. */
export function patientCountRequest(descriptor: QueryDescriptor): QueryRequest {
  return buildRequest(descriptor, descriptor.isOpenAccess ? 'CROSS_COUNT' : 'COUNT');
}

export function parsePatientCount(raw: unknown): CountValue {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const map = raw as Record<string, PatientCount>;
    return map['\\_studies_consents\\'] ?? 0;
  }
  return raw as PatientCount;
}

const patientCount: QueryCountProvider = {
  id: 'query:patientCount',
  openEndpoint: (descriptor) => useOpenAccess(descriptor.isOpenAccess),
  buildRequest: patientCountRequest,
  parse: parsePatientCount,
};

export const resultProviders: Record<string, QueryCountProvider> = {
  [patientCount.id]: patientCount,
};

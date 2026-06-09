import type { QueryRequestInterfaceV3 } from '$lib/models/api/Request';
import type { PatientCount, PatientCountMap } from '$lib/models/Stat';
import { Picsure } from '$lib/paths';
import { useOpenAccess } from '$lib/AccessState';
import { buildQueryRequestV3FromDescriptor } from '$lib/utilities/QueryBuilder';
import type { QueryDescriptor } from '$lib/services/counts/queryDescriptor.svelte';

export type CountValue = PatientCount | PatientCountMap;

/**
 * A typed result-count provider. The executor (`QueryCountService`) is
 * responsible for unwrapping `{errorType, message}` envelopes BEFORE calling
 * `parse(raw)`, and for emitting per-request telemetry.
 */
export interface CountProvider {
  id: string;
  path(descriptor: QueryDescriptor): string;
  buildRequest(descriptor: QueryDescriptor, resourceUUID: string): QueryRequestInterfaceV3;
  parse(raw: unknown): CountValue;
}

function resolveCountPath(descriptor: QueryDescriptor): string {
  return useOpenAccess(descriptor.isOpenAccess) ? Picsure.QueryOpenSync : Picsure.QueryV3Sync;
}

const patientCount: CountProvider = {
  id: 'query:patientCount',
  path: resolveCountPath,
  buildRequest(descriptor, resourceUUID) {
    if (descriptor.isOpenAccess) {
      return buildQueryRequestV3FromDescriptor(descriptor, resourceUUID, 'CROSS_COUNT');
    }
    return buildQueryRequestV3FromDescriptor(descriptor, resourceUUID, 'COUNT');
  },
  parse(raw) {
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      const map = raw as Record<string, PatientCount>;
      return map['\\_studies_consents\\'] ?? 0;
    }
    return raw as PatientCount;
  },
};

export const resultProviders: Record<string, CountProvider> = {
  [patientCount.id]: patientCount,
};

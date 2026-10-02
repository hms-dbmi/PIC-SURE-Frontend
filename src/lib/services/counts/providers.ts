import type { QueryRequestInterfaceV3 } from '#lib/models/api/Request.js';
import type { PatientCount, PatientCountMap } from '#lib/models/Stat.js';
import { Picsure } from '#lib/paths.js';
import { useOpenAccess } from '#lib/AccessState.js';
import { buildQueryRequestV3FromDescriptor } from '#lib/utilities/QueryBuilder.js';
import type { QueryDescriptor } from '#lib/services/counts/queryDescriptor.svelte.js';

export type CountValue = PatientCount | PatientCountMap;

/**
 * A typed result-count provider. The executor (`QueryCountService`) is
 * responsible for unwrapping `{errorType, message}` envelopes BEFORE calling
 * `parse(raw)`, and for emitting per-request telemetry.
 */
export interface CountProvider {
  id: string;
  path(descriptor: QueryDescriptor): string;
  buildRequest(descriptor: QueryDescriptor): QueryRequestInterfaceV3;
  parse(raw: unknown): CountValue;
}

function resolveCountPath(descriptor: QueryDescriptor): string {
  return useOpenAccess(descriptor.isOpenAccess) ? Picsure.QueryOpenV3Sync : Picsure.QueryV3Sync;
}

const patientCount: CountProvider = {
  id: 'query:patientCount',
  path: resolveCountPath,
  buildRequest(descriptor) {
    const resultType = descriptor.isOpenAccess ? 'CROSS_COUNT' : 'COUNT';
    return buildQueryRequestV3FromDescriptor(descriptor, resultType);
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

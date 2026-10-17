import type { QueryRequestInterfaceV3 } from '#lib/api/picsure/query.types.ts';
import type { PatientCount, PatientCountMap } from '#lib/query/counts/Stat.ts';
import { useOpenAccess } from '#lib/explorer/mode.ts';
import { buildQueryRequestV3FromDescriptor } from '#lib/query/build.ts';
import type { QueryDescriptor } from '#lib/query/descriptor.svelte.ts';

export type CountValue = PatientCount | PatientCountMap;

/**
 * A typed result-count provider. The executor (`QueryCountService`) is
 * responsible for unwrapping `{errorType, message}` envelopes BEFORE calling
 * `parse(raw)`, and for emitting per-request telemetry.
 */
export interface CountProvider {
  id: string;
  /** Whether the descriptor's counts come from the open-access (aggregate) endpoint. */
  openAccess(descriptor: QueryDescriptor): boolean;
  buildRequest(descriptor: QueryDescriptor): QueryRequestInterfaceV3;
  parse(raw: unknown): CountValue;
}

function usesOpenEndpoint(descriptor: QueryDescriptor): boolean {
  return useOpenAccess(descriptor.isOpenAccess);
}

const patientCount: CountProvider = {
  id: 'query:patientCount',
  openAccess: usesOpenEndpoint,
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

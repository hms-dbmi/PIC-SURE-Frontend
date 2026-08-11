import type { QueryV3 } from '$lib/models/query/Query';

export interface QueryRequestInterfaceV3 {
  resourceUUID: string;
  query: QueryV3;
  '@type'?: string;
  commonAreaUUID?: string;
  institutionOfOrigin?: string;
  requesterEmail?: string;
  resourceCredentials?: Record<string, string>;
}

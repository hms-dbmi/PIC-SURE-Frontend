import type { QueryV2, QueryV3 } from '$lib/models/query/Query';

export interface QueryRequestInterface {
  resourceUUID: string;
  query: QueryV2 | QueryV3;
  '@type'?: string;
  commonAreaUUID?: string;
  institutionOfOrigin?: string;
  requesterEmail?: string;
  resourceCredentials?: Record<string, string>;
}

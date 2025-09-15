import type { Query } from '$lib/models/query/Query';

export interface QueryRequestInterface {
  resourceUUID: string;
  query: Query;
  '@type'?: string;
  commonAreaUUID?: string;
  institutionOfOrigin?: string;
  requesterEmail?: string;
  resourceCredentials?: Record<string, string>;
}

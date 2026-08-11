import type { QueryV2, QueryV3 } from '$lib/models/query/Query';

export interface QueryRequestInterfaceV2 {
  query: QueryV2;
  '@type'?: string;
  commonAreaUUID?: string;
  institutionOfOrigin?: string;
  requesterEmail?: string;
  resourceCredentials?: Record<string, string>;
}

export interface QueryRequestInterfaceV3 {
  query: QueryV3;
  '@type'?: string;
  commonAreaUUID?: string;
  institutionOfOrigin?: string;
  requesterEmail?: string;
  resourceCredentials?: Record<string, string>;
}

export type QueryRequestInterface = QueryRequestInterfaceV2 | QueryRequestInterfaceV3;

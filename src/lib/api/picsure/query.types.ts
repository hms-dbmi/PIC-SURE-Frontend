import type { QueryJson } from '#lib/query/query.ts';

export interface QueryRequest {
  query: QueryJson;
  '@type'?: string;
  commonAreaUUID?: string;
  institutionOfOrigin?: string;
  requesterEmail?: string;
  resourceCredentials?: Record<string, string>;
}

export interface QueryStatus {
  picsureResultId?: string;
  status?: string;
}

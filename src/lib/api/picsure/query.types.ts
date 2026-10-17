import type { QueryInterfaceV3, QueryV3 } from '#lib/query/query.ts';

export interface QueryRequestInterfaceV3 {
  query: QueryV3;
  '@type'?: string;
  commonAreaUUID?: string;
  institutionOfOrigin?: string;
  requesterEmail?: string;
  resourceCredentials?: Record<string, string>;
}

/** An asynchronous query's id and state; exports wait for `AVAILABLE` or `SUCCESS`. */
export interface QueryStatus {
  picsureResultId?: string;
  status?: string;
}

/** What goes on the wire: the query's fields, whether a `QueryV3` or a plain snapshot of one. */
export type QueryRequestBody = Omit<QueryRequestInterfaceV3, 'query'> & { query: QueryInterfaceV3 };

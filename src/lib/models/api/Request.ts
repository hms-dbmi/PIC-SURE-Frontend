import type { Query } from '$lib/models/query/Query';

interface QueryRequestInterface {
  resourceUUID: string;
  query: Query;
}

export type { QueryRequestInterface };

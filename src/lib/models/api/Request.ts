import type { Query } from '../query/Query';

interface QueryRequestInterface {
  resourceUUID: string;
  query: Query;
}

export type { QueryRequestInterface };

import type { Indexable } from '$lib/types';
import { QueryV2, QueryV3 } from '$lib/models/query/Query';

export const QueryVersion = { UNKNOWN: 'UNKNOWN', V2: 'V2', V3: 'V3' };

type MappedQuery = QueryV2 | QueryV3 | null;

// TODO: Replace metadata type
/* eslint-disable @typescript-eslint/no-explicit-any */
export type DataSet = Indexable & {
  version: string;
  uuid: string;
  user: string;
  name: string;
  archived: boolean;
  metadata: any;
  query: MappedQuery;
  queryId: string;
  federated?: any;
  startTime: string;
  rawStartTime: number;
  status: string;
};
/* eslint-enable @typescript-eslint/no-explicit-any */

export interface DataSetResponse {
  picsureResultId?: string;
}

export interface DatasetError {
  message: Message;
}

interface Message {
  errorType: string;
  message: string;
}

function secondsToDate(seconds: number) {
  const dt = new Date(seconds);
  const year = dt.toLocaleString('default', { year: 'numeric' });
  const month = dt.toLocaleString('default', { month: '2-digit' });
  const day = dt.toLocaleString('default', { day: '2-digit' });
  return year + '-' + month + '-' + day;
}

function getQueryVersion(query: string) {
  if (query.includes('phenotypicClause')) return QueryVersion.V3;
  else if (query.includes('categoryFilters')) return QueryVersion.V2;
  else return QueryVersion.UNKNOWN;
}

/**
 * True if `value` is a string that is itself JSON-encoding an object/array —
 * i.e. it's been through an extra JSON.stringify() and needs one more parse.
 * A string that merely parses to a JSON primitive (a number, boolean, null,
 * or quoted string) does NOT count — only object/array results indicate a
 * real extra layer of nesting.
 */
function isDoubleEncoded(value: unknown): value is string {
  if (typeof value !== 'string') return false;

  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    return false; // not valid JSON at all -> not double-encoded
  }

  return parsed !== null && typeof parsed === 'object';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapDataset(data: any) {
  let federated;
  let query: MappedQuery;
  const version = getQueryVersion(data.query.query);
  if (version === QueryVersion.UNKNOWN) query = null;
  else {
    try {
      const jsonQuery = JSON.parse(data.query.query);
      const subquery = isDoubleEncoded(jsonQuery.query)
        ? JSON.parse(jsonQuery.query)
        : jsonQuery.query;
      query =
        version === QueryVersion.V2 ? new QueryV2(subquery) : QueryV3.fromSerialized(subquery);
      if (jsonQuery?.commonAreaUUID) {
        federated = {
          commonId: jsonQuery?.commonAreaUUID,
        };
      }
    } catch {
      query = null;
    }
  }
  const dataset: DataSet = {
    version,
    uuid: data.uuid,
    user: data.user,
    name: data.name,
    archived: data.archived,
    metadata: data.metadata,
    query,
    federated,
    queryId: data.query.uuid,
    startTime: secondsToDate(data.query.startTime),
    rawStartTime: data.query.startTime,
    status: data.query.status || 'UNDEFINED',
  };
  return dataset;
}

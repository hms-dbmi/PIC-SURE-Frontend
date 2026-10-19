import { request } from '#lib/api/client.ts';
import { Picsure, PicsurePaths } from '#lib/api/paths.ts';
import { parseQuery, type Query, type SavedQuery } from '#lib/query/query.ts';
import { parseQueryV2, queryFromV2 } from '#lib/query/v2.ts';

/** The query format a dataset was saved in. */
export const QueryVersion = { UNKNOWN: 'UNKNOWN', V2: 'V2', V3: 'V3' } as const;
export type QueryVersion = (typeof QueryVersion)[keyof typeof QueryVersion];

export interface DataSet {
  uuid: string;
  user: string;
  name: string;
  archived: boolean;
  /** Sent back unchanged when the dataset is updated. */
  metadata: unknown;
  /** The saved query in the current format, or null when it can't be read. */
  query: Query | null;
  /** V2 queries are converted on mapping; this keeps the `restoreV2queries` gate working. */
  sourceVersion: QueryVersion;
  queryId: string;
  federated?: { commonId: string };
  startTime: string;
  rawStartTime: number;
  status: string;
}

function secondsToDate(seconds: number) {
  const dt = new Date(seconds);
  const year = dt.toLocaleString('default', { year: 'numeric' });
  const month = dt.toLocaleString('default', { month: '2-digit' });
  const day = dt.toLocaleString('default', { day: '2-digit' });
  return year + '-' + month + '-' + day;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isSavedQuery(value: unknown): value is SavedQuery {
  return isRecord(value) && 'phenotypicClause' in value;
}

const text = (value: unknown): string => (typeof value === 'string' ? value : '');

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

function mapQuery(rawQuery: unknown): Pick<DataSet, 'query' | 'sourceVersion' | 'federated'> {
  try {
    const jsonQuery: unknown = JSON.parse(text(rawQuery));
    if (!isRecord(jsonQuery)) return { query: null, sourceVersion: QueryVersion.UNKNOWN };

    const federated =
      typeof jsonQuery.commonAreaUUID === 'string'
        ? { commonId: jsonQuery.commonAreaUUID }
        : undefined;
    const subquery: unknown = isDoubleEncoded(jsonQuery.query)
      ? JSON.parse(jsonQuery.query)
      : jsonQuery.query;

    if (isSavedQuery(subquery)) {
      return { query: parseQuery(subquery), sourceVersion: QueryVersion.V3, federated };
    }
    const queryV2 = parseQueryV2(subquery);
    if (queryV2) {
      return { query: queryFromV2(queryV2), sourceVersion: QueryVersion.V2, federated };
    }
    return { query: null, sourceVersion: QueryVersion.UNKNOWN, federated };
  } catch {
    return { query: null, sourceVersion: QueryVersion.UNKNOWN };
  }
}

export function mapDataset(data: unknown): DataSet {
  if (!isRecord(data) || !isRecord(data.query)) throw new Error('Invalid dataset response');
  const { query, sourceVersion, federated } = mapQuery(data.query.query);
  const startTime = typeof data.query.startTime === 'number' ? data.query.startTime : NaN;

  return {
    sourceVersion,
    uuid: text(data.uuid),
    user: text(data.user),
    name: text(data.name),
    archived: data.archived === true,
    metadata: data.metadata,
    query,
    federated,
    queryId: text(data.query.uuid),
    startTime: secondsToDate(startTime),
    rawStartTime: startTime,
    status: text(data.query.status) || 'UNDEFINED',
  };
}

interface DatasetRequest {
  queryId: string;
  name: string;
}

export interface DatasetUpdate extends DatasetRequest {
  metadata: DataSet['metadata'];
  archived: boolean;
}

export async function getDatasets(): Promise<DataSet[]> {
  const records = await request<unknown>(Picsure.NamedDataSet, { auth: 'open' });
  if (!Array.isArray(records)) throw new Error('Invalid dataset list response');
  return records.map(mapDataset);
}

export async function getDataset(uuid: string): Promise<DataSet> {
  return mapDataset(await request<unknown>(PicsurePaths.namedDataSet(uuid), { auth: 'open' }));
}

export async function updateDataset(uuid: string, update: DatasetUpdate): Promise<DataSet> {
  return mapDataset(
    await request<unknown>(PicsurePaths.namedDataSet(uuid), {
      method: 'PUT',
      body: update,
      auth: 'open',
    }),
  );
}

export async function createDatasetName(queryId: string, name: string): Promise<void> {
  if (name.trim() === '') {
    throw 'Please input a Dataset ID name';
  }
  const validName = /^[\w \-\\/?+=[\].():"']+$/g;
  if (!name.match(validName)) {
    throw 'Name can only contain letters, numbers, and these special symbols - ? + = [ ] . ( ) : \' "';
  }

  const body: DatasetRequest = {
    queryId,
    name,
  };
  await request(Picsure.NamedDataSet, { method: 'POST', body, auth: 'open' });
}

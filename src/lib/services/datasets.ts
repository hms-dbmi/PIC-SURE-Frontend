import { isHttpError } from '@sveltejs/kit';
import * as api from '$lib/api';
import { Picsure } from '$lib/paths';
import {
  QueryVersion,
  type DataSet,
  type DataSetResponse,
  type LinkedQuery,
} from '$lib/models/Dataset';
import type { QueryRequestInterfaceV3 } from '$lib/models/api/Request';
import { QueryV3, serializeQueryV3 } from '$lib/models/query/Query';
import { cachedDataset, replaceDataset } from '$lib/stores/Dataset.svelte';

const EXPORT_RESULT_TYPES = ['DATAFRAME', 'DATAFRAME_PFB', 'DATAFRAME_TIMESERIES'] as const;

/** A result type that produces an export file, the only kind a sample can be taken of. */
export type ExportResultType = (typeof EXPORT_RESULT_TYPES)[number];

/** The query that serves one variant of a dataset, and the dataset as it stands afterwards. */
export interface VariantRequest {
  /** The id of the query whose result is the requested variant. */
  queryId: string;
  /**
   * A copy that lists the new link when a query was submitted and linked. Otherwise the dataset
   * passed in: when the variant was already linked, when the server does not link queries, or
   * when the server refused the link.
   */
  dataset: DataSet;
}

interface DatasetRequest {
  queryId: string;
  name: string;
}

export async function createDatasetName(queryId: string, name: string): Promise<DataSet> {
  if (name === '' && name.trim() === '') {
    throw 'Please input a Dataset ID name';
  }
  const validName = /^[\w \-\\/?+=[\].():"']+$/g;
  if (!name.match(validName)) {
    throw 'Name can only contain letters, numbers, and these special symbols - ? + = [ ] . ( ) : \' "';
  }

  const request: DatasetRequest = {
    queryId,
    name,
  };
  return await api.post(Picsure.NamedDataSet, request);
}

/**
 * Reads the stored query of a dataset when it is one a full or sample export can be run from.
 *
 * @param dataset The named dataset.
 * @returns The stored V3 query when its result type is an export type, otherwise undefined.
 */
function storedExportQuery(
  dataset: DataSet,
): (QueryV3 & { expectedResultType: ExportResultType }) | undefined {
  const query = dataset.query;
  if (dataset.version !== QueryVersion.V3 || !(query instanceof QueryV3)) {
    return undefined;
  }
  return isExportResultType(query.expectedResultType)
    ? (query as QueryV3 & { expectedResultType: ExportResultType })
    : undefined;
}

function isExportResultType(resultType: string): resultType is ExportResultType {
  return (EXPORT_RESULT_TYPES as readonly string[]).includes(resultType);
}

/**
 * Tells which export a dataset offers. V2 datasets, and V3 datasets stored with a count or
 * other non-export type, offer none.
 *
 * @param dataset The named dataset.
 * @returns The stored query's result type when it is an export type, otherwise undefined.
 */
export function exportResultType(dataset: DataSet): ExportResultType | undefined {
  return storedExportQuery(dataset)?.expectedResultType;
}

/**
 * Lists the queries linked to a dataset with the query behind its Dataset ID made usable. That
 * query's body is the stored query, so it takes the stored result type when the server sent
 * none, and it is added when the server did not list it.
 *
 * @param dataset The named dataset.
 * @param stored The dataset's stored query.
 * @returns The linked queries, the one behind the Dataset ID included.
 */
function linkedVariants(dataset: DataSet, stored: QueryV3): LinkedQuery[] {
  const listed = dataset.queries.map((linked) =>
    linked.queryId === dataset.queryId && linked.resultType === null
      ? { ...linked, resultType: stored.expectedResultType }
      : linked,
  );
  if (listed.some((linked) => linked.queryId === dataset.queryId)) {
    return listed;
  }
  return [
    ...listed,
    { queryId: dataset.queryId, sample: stored.sample, resultType: stored.expectedResultType },
  ];
}

/**
 * Links a query to a named dataset. The dataset's own query id, shown as its Dataset ID, stays
 * where it is. An answer of 409 means the server refused the link, and nothing was linked.
 *
 * Call this only for a dataset whose `supportsLinkedQueries` is true. A server that does not
 * link queries reads the same request as an order to replace the dataset's own query.
 *
 * @param dataset The dataset to link to. Its name, archived flag and metadata are sent unchanged.
 * @param queryId The id of the query to link.
 * @param signal Cancels the request when it aborts.
 * @returns True once the query is linked, false when the server answered 409.
 * @throws Whatever the request rejects with, other than an HTTP 409.
 */
export async function linkQuery(
  dataset: DataSet,
  queryId: string,
  signal?: AbortSignal,
): Promise<boolean> {
  const request = {
    queryId,
    name: dataset.name,
    archived: dataset.archived,
    metadata: dataset.metadata,
  };
  try {
    await api.put(
      `${Picsure.NamedDataSet}/${dataset.uuid}`,
      request,
      undefined,
      undefined,
      signal ? { signal } : undefined,
    );
    return true;
  } catch (e) {
    if (!isHttpError(e, 409)) {
      throw e;
    }
    return false;
  }
}

/**
 * Finds the query that serves the full or the sample variant of a dataset, creating and linking
 * it on first use. A variant is the pair of `sample` and the dataset's stored result type.
 *
 * A linked query for the variant is reused without a request. Otherwise the stored query is
 * submitted with `sample` set and, like a query built in the explorer, with `picsureId` and
 * `id` null and no authorization filters, so nothing the server filled in on the stored copy
 * is sent back. The body goes through the explorer's own serializer, so it carries no `type`
 * key on any clause. The result is not waited for.
 *
 * The returned query is then linked to the dataset, and the cached dataset is replaced by a
 * copy that lists the link. The link request and that copy take the name, archived flag and
 * metadata of the cached dataset when there is one, so a change made elsewhere in the session
 * is kept. No link is sent when the dataset's `supportsLinkedQueries` is false, and no link is
 * recorded when the server answers the link with 409. The query id is returned either way.
 *
 * @param dataset The named dataset. It is not modified.
 * @param sample True for the sample variant, false for the full one.
 * @param signal Cancels the submit and the link when it aborts.
 * @returns The id of the variant's query, and the dataset as it stands afterwards.
 * @throws An error when the dataset's stored query is not a V3 query of an export type, in
 * which case nothing is sent, when the submit answers without a query id, or whatever the
 * submit or the link rejects with.
 */
export async function requestVariant(
  dataset: DataSet,
  sample: boolean,
  signal?: AbortSignal,
): Promise<VariantRequest> {
  const stored = storedExportQuery(dataset);
  if (!stored) {
    throw new Error('This dataset has no export to request.');
  }
  const resultType = stored.expectedResultType;
  const linked = linkedVariants(dataset, stored).find(
    (candidate) => candidate.sample === sample && candidate.resultType === resultType,
  );
  if (linked) {
    return { queryId: linked.queryId, dataset };
  }

  const request: QueryRequestInterfaceV3 = {
    query: serializeQueryV3(
      new QueryV3({ ...stored, sample, picsureId: null, id: null, authorizationFilters: [] }),
    ),
  };
  const options = signal ? { signal } : undefined;
  const response: DataSetResponse | undefined = await api.post(
    Picsure.Query,
    request,
    undefined,
    undefined,
    options,
  );
  const queryId = response?.picsureResultId;
  if (!queryId) {
    throw new Error('The query submit returned no query id.');
  }
  if (!dataset.supportsLinkedQueries) {
    return { queryId, dataset };
  }
  const current = cachedDataset(dataset.uuid) ?? dataset;
  const linkedNow = await linkQuery(current, queryId, signal);
  if (!linkedNow) {
    return { queryId, dataset };
  }

  const updated: DataSet = {
    ...current,
    queries: [
      ...current.queries.filter((existing) => existing.queryId !== queryId),
      { queryId, sample, resultType },
    ],
  };
  replaceDataset(updated);
  return { queryId, dataset: updated };
}

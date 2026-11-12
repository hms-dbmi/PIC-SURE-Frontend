import * as api from '$lib/api';
import { Picsure } from '$lib/paths';
import { QueryVersion, type DataSet, type DataSetResponse } from '$lib/models/Dataset';
import type { QueryRequestInterfaceV3 } from '$lib/models/api/Request';
import { QueryV3, serializeQueryV3 } from '$lib/models/query/Query';
import { SAMPLE_SAVE_REFUSED_MESSAGE } from '$lib/services/exportStatus';

const EXPORT_RESULT_TYPES = ['DATAFRAME', 'DATAFRAME_PFB', 'DATAFRAME_TIMESERIES'] as const;

/** A result type that produces an export file, the only kind a sample can be taken of. */
export type ExportResultType = (typeof EXPORT_RESULT_TYPES)[number];

interface DatasetRequest {
  queryId: string;
  name: string;
}

/**
 * Saves a query as a named dataset. A sample query is refused here, before the name is checked
 * and before anything is sent, because a named dataset is saved from its full query and the
 * dataset page adds the sample to it afterwards.
 *
 * @param queryId The id of the submitted query the dataset is saved from.
 * @param name The name the user gave the dataset.
 * @param query The query behind `queryId`, when the caller holds it.
 * @returns The saved dataset.
 * @throws The text of {@link SAMPLE_SAVE_REFUSED_MESSAGE} when `query.sample` is true, a text
 * naming what is wrong with `name`, or whatever the request rejects with.
 */
export async function createDatasetName(
  queryId: string,
  name: string,
  query?: { sample?: unknown },
): Promise<DataSet> {
  if (query?.sample === true) {
    throw SAMPLE_SAVE_REFUSED_MESSAGE;
  }
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
 * Finds the query that serves the full or the sample variant of a dataset, submitting it when
 * the dataset does not list one. A variant is the pair of `sample` and the dataset's stored
 * result type.
 *
 * A query the dataset lists for the variant is reused without a request. Otherwise the stored
 * query is submitted with `sample` set and, like a query built in the explorer, with `picsureId`
 * and `id` null and no authorization filters, so nothing the server filled in on the stored copy
 * is sent back. The body goes through the explorer's own serializer, so it carries no `type`
 * key on any clause. The result is not waited for.
 *
 * The submit is the only request. The server associates a submitted query with its dataset, so
 * the dataset is not updated from here, and the copy passed in keeps the list it was read with.
 *
 * @param dataset The named dataset. It is not modified.
 * @param sample True for the sample variant, false for the full one.
 * @param signal Cancels the submit when it aborts.
 * @returns The id of the variant's query: the listed one, or the one the submit answered with.
 * @throws An error when the dataset's stored query is not a V3 query of an export type, in
 * which case nothing is sent, when the submit answers without a query id, or whatever the
 * submit rejects with.
 */
export async function requestVariant(
  dataset: DataSet,
  sample: boolean,
  signal?: AbortSignal,
): Promise<string> {
  const stored = storedExportQuery(dataset);
  if (!stored) {
    throw new Error('This dataset has no export to request.');
  }
  const resultType = stored.expectedResultType;
  const listed = dataset.queries.find(
    (candidate) => candidate.sample === sample && candidate.resultType === resultType,
  );
  if (listed) {
    return listed.queryId;
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
  return queryId;
}

import type { ExpectedResultType } from '$lib/models/query/Query.ts';
import type { QueryRequestInterfaceV3 } from '$lib/models/api/Request';
import { QueryV3, toWireQuery } from '$lib/models/query/Query';

let queryRequest: QueryRequestInterfaceV3 = $state({
  query: new QueryV3(),
});

let activeType: ExpectedResultType | undefined = $state(undefined);
let datasetId: string | undefined = $state(undefined);
let datasetNameInput: string | undefined = $state(undefined);
let lockDownload = $state(true);
let saveable = $state(false);

export function setActiveType(type: ExpectedResultType | undefined) {
  activeType = type;
}

export function getActiveType() {
  return activeType;
}

export function setDatasetId(id: string | undefined) {
  datasetId = id;
}

export function getDatasetId() {
  return datasetId;
}

export function setDatasetNameInput(name: string | undefined) {
  datasetNameInput = name;
}

export function getDatasetNameInput() {
  return datasetNameInput;
}

export function setLockDownload(lock: boolean) {
  lockDownload = lock;
}

export function getLockDownload() {
  return lockDownload;
}

export function getQueryRequest() {
  return queryRequest;
}

export function setQueryRequest(q: QueryRequestInterfaceV3) {
  queryRequest = q;
}

export function setSaveable(canSave: boolean) {
  saveable = canSave;
}

export function getSaveable() {
  return saveable;
}

export function resetExportStepperState() {
  setActiveType(undefined);
  setDatasetId(undefined);
  setDatasetNameInput(undefined);
  setLockDownload(true);
  setSaveable(false);
  setQueryRequest({
    query: new QueryV3(),
  });
}

/**
 * Builds the body the save dataset step posts to create a dataset. The stepper's request is
 * copied, so the added columns never reach the query the stepper holds.
 *
 * @param systemFields Concept paths every export carries, placed before the selected ones.
 * @param exportPaths Concept paths of the variables added for export, placed after them.
 * @returns A copy of the stepper's request whose query is in its request body shape.
 */
export function buildSaveDatasetRequest(systemFields: string[] = [], exportPaths: string[] = []) {
  const request = structuredClone($state.snapshot(queryRequest));
  request.query = toWireQuery({
    ...request.query,
    select: [...systemFields, ...request.query.select, ...exportPaths],
  });
  return request;
}

/**
 * Builds the body the review step posts to count participants per concept.
 *
 * @param request The request whose filters the count is taken under. It is left untouched.
 * @param conceptPaths The concept paths to count, which replace the selected columns.
 * @returns A body holding a cross count copy of the request's query.
 */
export function buildCrossCountRequest(
  request: QueryRequestInterfaceV3,
  conceptPaths: string[],
): { query: QueryV3 } {
  const query = new QueryV3(structuredClone($state.snapshot(request).query));
  query.expectedResultType = 'CROSS_COUNT';
  query.select = conceptPaths;
  return { query };
}

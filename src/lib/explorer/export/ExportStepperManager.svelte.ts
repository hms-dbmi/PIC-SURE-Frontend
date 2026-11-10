import type { ExpectedResultType } from '#lib/query/query.ts';
import type { QueryRequest } from '#lib/api/picsure/query.types.ts';
import { buildRequest } from '#lib/query/build.ts';

let queryRequest: QueryRequest = $state(buildRequest(null));

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

export function setQueryRequest(q: QueryRequest) {
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
  setQueryRequest(buildRequest(null));
}

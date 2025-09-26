import type { ExpectedResultType } from '$lib/models/query/Query.ts';
import type { QueryRequestInterface } from './models/api/Request';
import { Query } from './models/query/Query';

let queryRequest: QueryRequestInterface = $state({
  resourceUUID: '',
  query: new Query(),
});

let activeType: ExpectedResultType | undefined = $state(undefined);
let datasetId: string | undefined = $state(undefined);
let datasetNameInput: string | undefined = $state(undefined);
let lockDownload = $state(true);
let picsureResultId: string | undefined = $state(undefined);
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

export function setPicsureResultId(id: string | undefined) {
  picsureResultId = id;
}

export function getPicsureResultId() {
  return picsureResultId;
}

export function getQueryRequest() {
  return queryRequest;
}

export function setQueryRequest(q: QueryRequestInterface) {
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
  setPicsureResultId(undefined);
  setSaveable(false);
  setQueryRequest({
    resourceUUID: '',
    query: new Query(),
  });
}
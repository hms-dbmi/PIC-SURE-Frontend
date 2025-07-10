import { get, writable, type Writable, type Unsubscriber } from 'svelte/store';

import * as api from '$lib/api';
import { Picsure } from '$lib/paths';
import type { Status, Sites, Metadata, DataType } from '$lib/models/DataRequest';
import { UploadStatus } from '$lib/models/DataRequest';

const valid = {
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
  date: /^\d{4}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])$/,
};

export let unsubscribers: Unsubscriber[] = [];

// Form fields
export const selectedSite: Writable<string> = writable('');
export const dataType: Writable<DataType> = writable({ genomic: false, phenotypic: false });
const _queryId: Writable<string> = writable('');
const _approved: Writable<string> = writable('');

// Only set approved and queryID on valid values
export const queryId = {
  ..._queryId,
  set: (value: string) => {
    if (valid.uuid.test(value)) {
      _queryId.set(value);
    }
  },
};

export const approved = {
  ..._approved,
  set: (value: string) => {
    if (valid.date.test(value)) {
      _approved.set(value);
    }
  },
};

// Response objects
export const error: Writable<string> = writable('');
export const queryError: Writable<boolean> = writable(false);
export const sites: Writable<Sites> = writable(null);
export const metadata: Writable<Metadata> = writable(null);
export const status: Writable<Status> = writable(null);

function setError(message: string, query = false) {
  return function (e: Error) {
    if (query) {
      queryError.set(true);
    }
    console.error(e);
    error.set(message);
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function throwOnErrorValue(value: any) {
  if (value?.error) {
    return Promise.reject(value.error);
  }
  return value;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function updateStatus(response: any) {
  status.set(response ?? UploadStatus.Unsent);

  const approval = get(approved);
  if (response.approved && approval !== response.approved) {
    _approved.set(response.approved);
  }

  const siteList = get(sites);
  if (response.site) {
    selectedSite.set(response.site);
  } 
  // else if (siteList?.homeSite) {
  //   selectedSite.set(siteList.homeSite);
  // }

  dataType.set({
    genomic: !!response.genomic && response.genomic !== UploadStatus.Unsent,
    phenotypic: !!response.phenotypic && response.phenotypic !== UploadStatus.Unsent,
  });
}

export async function refreshStatus() {
  const query = get(queryId);
  await api
    .get(`${Picsure.Uploader.Status}/${query}`)
    .then(throwOnErrorValue)
    .then(updateStatus)
    .catch(setError('Error updating data request status.'));
}

export async function sendData() {
  const query = get(queryId);
  const meta = get(metadata);
  const site = get(selectedSite);
  if (!query || !meta || !site) return;

  const type = get(dataType);
  const stat = get(status);

  const req = (type: 'Genomic' | 'Phenotypic') =>
    api
      .post(`${Picsure.Uploader.Upload}/${site}?` + new URLSearchParams({ dataType: type }), {
        ...meta.resultMetadata.queryJson.query,
        picSureId: query,
      })
      .then(throwOnErrorValue)
      .then(status.set)
      .catch(setError(`Error sending ${type} data request`));

  if (type.phenotypic && stat?.phenotypic === UploadStatus.Unsent) {
    await req('Phenotypic');
  }
  if (type.genomic && stat?.genomic === UploadStatus.Unsent) {
    await req('Genomic');
  }
}

export async function loadSites() {
  if (get(sites)) return;

  await api
    .get(Picsure.Uploader.Sites)
    .then(throwOnErrorValue)
    .then((resp) => {
      sites.set(resp);
    })
    .catch(setError('Error retrieving site list.'));
}

export function loadSubscriptions() {
  unsubscribers.push(
    _queryId.subscribe(async (query) => {
      if (!query) return;

      await api
        .get(`${Picsure.Uploader.Status}/${query}`)
        .then(throwOnErrorValue)
        .then(updateStatus)
        .then(() =>
          api
            .get(`${Picsure.Query}/${query}/metadata`)
            .then(throwOnErrorValue)
            .then(metadata.set)
            .catch(setError(`Metadata for ${query} could not be found.`, true)),
        )
        .catch(
          setError(
            "We couldn't find any matching results. Please check to ensure the value you have entered is correct or " +
              'try searching for a different Dataset Request ID',
            true,
          ),
        );
    }),
  );

  unsubscribers.push(
    _approved.subscribe(async (approval) => {
      const prevApproved = get(approved);
      if (!approval || !!prevApproved) return;

      const query = get(queryId);
      await api
        .get(
          `${Picsure.Uploader.Status}/${query}/approve?` + new URLSearchParams({ date: approval }),
        )
        .then(throwOnErrorValue)
        .then(updateStatus)
        .catch(setError(`Status for ${query} was not found.`));
    }),
  );
}

export function unloadSubscribers() {
  unsubscribers.forEach((unsub) => unsub());
  unsubscribers = [];
}

export function reset() {
  _queryId.set('');
  _approved.set('');
  queryError.set(false);
  dataType.set({ genomic: false, phenotypic: false });
  metadata.set(null);
  status.set(null);
}

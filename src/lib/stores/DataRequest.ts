import { get, writable, type Writable } from 'svelte/store';
import type { Unsubscriber } from 'svelte/motion';

import * as api from '$lib/api';
import type { Status, Sites, Metadata, DataType } from '$lib/models/DataRequest';
import { UploadStatus } from '$lib/models/DataRequest';

const QUERY_URL = 'picsure/query';
const SITES_URL = 'picsure/proxy/uploader/sites';
const STATUS_URL = 'picsure/proxy/uploader/status';
const UPLOAD_URL = 'picsure/proxy/uploader/upload';

const valid = {
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
  date: /^\d{4}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])$/,
};

export let unsubscribers: Unsubscriber[] = [];

// Form fields
export const selectedSite: Writable<string> = writable('');
export const dataType: Writable<DataType> = writable({ genomic: false, phenotypic: false });
export const queryError: Writable<boolean> = writable(false);
const _queryId: Writable<string> = writable('');
const _approved: Writable<string> = writable('');

// Only set approved and queryID on valid values
export const queryId = {
  ..._queryId,
  set: (value: string) => {
    if (valid.uuid.test(value)) {
      console.log('form updated with valid uuid of', value);
      _queryId.set(value);
    }
  },
};

export const approved = {
  ..._approved,
  set: (value: string) => {
    if (valid.date.test(value)) {
      console.log('form updated with valid approval date of', value);
      _approved.set(value);
    }
  },
};

// Response objects
export const error: Writable<string> = writable('');
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
  status.set(response);

  const approval = get(approved);
  if (response.approved && approval !== response.approved) {
    _approved.set(response.approved);
  }

  const siteList = get(sites);
  if (response.site) {
    selectedSite.set(response.site);
  } else if (siteList?.homeSite) {
    selectedSite.set(siteList.homeSite);
  }

  dataType.set({
    genomic: !!response.genomic && response.genomic !== UploadStatus.Unsent,
    phenotypic: !!response.phenotypic && response.phenotypic !== UploadStatus.Unsent,
  });
}

export async function refreshStatus() {
  console.log('refresh status');

  const query = get(queryId);
  await api
    .get(`${STATUS_URL}/${query}`)
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
      .post(`${UPLOAD_URL}/${site}?dataType=${type}`, {
        ...meta.resultMetadata.queryJson.query,
        picSureId: query,
      })
      .then(throwOnErrorValue)
      .then(status.set)
      .catch(setError(`Error sending ${type} data request`));

  console.log('send data request');
  if (type.phenotypic && stat?.phenotypic === UploadStatus.Unsent) {
    await req('Phenotypic');
  }
  if (type.genomic && stat?.genomic === UploadStatus.Unsent) {
    await req('Genomic');
  }
}

export async function loadSites() {
  if (get(sites)) return;

  console.log('load sites');
  await api
    .get(SITES_URL)
    .then(throwOnErrorValue)
    .then((resp) => {
      sites.set(resp);
      selectedSite.set(resp.homeSite);
    })
    .catch(setError('Error retrieving site list.'));
}

export function loadSubscriptions() {
  console.log('load queryId subscription');
  unsubscribers.push(
    _queryId.subscribe(async (query) => {
      if (!query) return;

      console.log('requesting status');
      await api
        .get(`${STATUS_URL}/${query}`)
        .then(throwOnErrorValue)
        .then(updateStatus)
        .then(async () => {
          console.log('requesting metadata');
          await api
            .get(`${QUERY_URL}/${query}/metadata`)
            .then(throwOnErrorValue)
            .then(metadata.set)
            .catch(setError(`Metadata for ${query} could not be found.`, true));
        })
        .catch(
          setError(
            "We couldn't find any matching results. Please check to ensure the value you have entered is correct or " +
              'try searching for a different Dataset Request ID',
            true,
          ),
        );
    }),
  );

  console.log('load approved subscription');
  unsubscribers.push(
    _approved.subscribe(async (approval) => {
      if (!approval) return;

      console.log('requesting status on approval change');
      const query = get(queryId);
      await api
        .get(`${STATUS_URL}/${query}/approve?` + new URLSearchParams({ date: approval }))
        .then(throwOnErrorValue)
        .then(updateStatus)
        .catch(setError(`Status for ${query} was not found.`));
    }),
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const log = (msg: string) => (sub: any) => console.log(msg, sub);
  unsubscribers.push(
    _queryId.subscribe(log('new query id')),
    _approved.subscribe(log('new approved date')),
    error.subscribe(log('new error')),
    sites.subscribe(log('new sites list')),
    metadata.subscribe(log('new metadata')),
    status.subscribe(log('new status')),
    dataType.subscribe(log('new type')),
    selectedSite.subscribe(log('new selected site')),
  );
}

export function unloadSubscribers() {
  console.log('unload subscriptions');
  unsubscribers.forEach((unsub) => unsub());
  unsubscribers = [];
}

export function reset() {
  console.log('reset form values and responses');
  _queryId.set('');
  _approved.set('');
  dataType.set({ genomic: false, phenotypic: false });
  metadata.set(null);
  status.set(null);
}

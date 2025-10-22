import { type Writable, writable, get } from 'svelte/store';
import * as api from '$lib/api';
import { type Status, type Metadata, type Sites } from '$lib/models/DataRequest';
import { Picsure } from '$lib/paths';
import type { QueryInterfaceV2 } from '$lib/models/query/Query';

export async function searchForDataset(queryId: string): Promise<Metadata> {
  try {
    return api.get(`${Picsure.QueryV2}/${queryId}/metadata`);
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Unknown error occurred');
  }
}

export async function getDatasetStatus(queryId: string): Promise<Status> {
  try {
    return api.get(`${Picsure.Uploader.Status}/${queryId}`);
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Unknown error occurred');
  }
}

export async function approveDataset(queryId: string, date: string): Promise<void> {
  try {
    return api.get(`${Picsure.Uploader.Status}/${queryId}/approve?date=${date}`);
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Unknown error occurred');
  }
}

export async function sendData(
  query: QueryInterfaceV2,
  site: string,
  dataType: string,
  queryId: string,
): Promise<Status> {
  try {
    return api.post(`${Picsure.Uploader.Upload}/${site}?dataType=${dataType}`, {
      ...query,
      picSureId: queryId,
    });
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Unknown error occurred');
  }
}

export const sites: Writable<Sites> = writable(null);

export async function loadSites(): Promise<Sites> {
  if (get(sites)) return get(sites);

  return api.get(Picsure.Uploader.Sites).then((resp) => {
    sites.set(resp);
    return resp;
  });
}

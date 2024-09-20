import * as api from '$lib/api';
import { get, writable, type Writable } from 'svelte/store';
import { resources } from '$lib/configuration';
import { getQueryRequest } from '$lib/QueryBuilder';
import { browser } from '$app/environment';
import { getConceptCount, getStudiesCount } from '$lib/services/dictionary';

export const ERROR_VALUE = '-';
type ApiMap = { [key: string]: () => Promise<string> };

export const cachedMap: Writable<Map<string, string>> = writable(new Map());
const isUserLoggedIn = () => {
  if (browser) {
    return !!localStorage.getItem('token');
  }
  return false;
};

const apiMap: ApiMap = {
  'Data Sources': () => getStudiesCount(!isUserLoggedIn()).then((response) => {
    if (response) {
      return response.toLocaleString();
    }
    return ERROR_VALUE;
  }),
  Participants: () =>
    api
      .post(
        'picsure/query/sync',
        getQueryRequest(isUserLoggedIn(), isUserLoggedIn() ? resources.hpds : resources.openHPDS),
      )
      .then((response) => response.toLocaleString()),
  Variables: () =>
    getConceptCount(!isUserLoggedIn()).then((response) => {
      if (response) {
        return response.toLocaleString();
      }
      return ERROR_VALUE;
    }),
};

export async function getOrApi(key: string): Promise<string> {
  return apiMap[key]();
}

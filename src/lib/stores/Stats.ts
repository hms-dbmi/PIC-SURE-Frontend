import * as api from '$lib/api';
import { get, writable, type Writable } from 'svelte/store';
import { resources } from '$lib/configuration';
import { getQueryRequest } from '$lib/QueryBuilder';
import { browser } from '$app/environment';

export const ERROR_VALUE = '-';
type StatMap = { [key: string]: string | undefined };
type ApiMap = { [key: string]: () => Promise<string> };

const cachedMap: Writable<StatMap> = writable({});
const isUserLoggedIn = () => {
  if (browser) {
    return !!localStorage.getItem('token');
  }
  return false;
};

const apiMap: ApiMap = {
  'Data Sources': () => Promise.resolve('1'),
  Participants: () =>
    api
      .post(
        'picsure/query/sync',
        getQueryRequest(isUserLoggedIn(), isUserLoggedIn() ? resources.hpds : resources.openHPDS),
      )
      .then((response) => response.toLocaleString()),
  Variables: () =>
    api
      .post(`picsure/search/${isUserLoggedIn() ? resources.hpds : resources.openHPDS}`, {
        query: '\\',
      })
      .then((response) => {
        //TODO: consents?
        if (response.results) {
          return Object.keys(response.results.phenotypes).length.toLocaleString();
        }
        return ERROR_VALUE;
      }),
};

export async function getOrApi(key: string): Promise<string> {
  const map = get(cachedMap);
  if (map[key] && map[key] !== ERROR_VALUE) {
    // retry on error
    return map[key];
  }
  const resolvedValue = await apiMap[key]().catch((error) => {
    console.error(error);
    return ERROR_VALUE;
  });
  cachedMap.set({
    ...get(cachedMap), // reload map in case of change
    [key]: resolvedValue,
  });
  return resolvedValue;
}

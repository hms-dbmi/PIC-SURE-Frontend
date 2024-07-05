import * as api from '$lib/api';
import { get, writable, type Writable } from 'svelte/store';
import { Query } from '$lib/models/query/Query';
import { resources } from '$lib/configuration';

export const ERROR_VALUE = '-';
type StatMap = { [key: string]: string | undefined };
type ApiMap = { [key: string]: () => Promise<string> };

const cachedMap: Writable<StatMap> = writable({});

const apiMap: ApiMap = {
  'Data Sources': () => Promise.resolve('1'),
  Participants: () =>
    api
      .post('picsure/query/sync', {
        resourceUUID: resources.hpds,
        query: new Query(),
      })
      .then((response) => response.toLocaleString()),
  Variables: () =>
    api.post(`picsure/search/${resources.hpds}`, { query: '\\' }).then((response) => {
      console.log('variables results', Object.keys(response));
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

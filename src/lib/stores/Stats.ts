import { derived, writable, type Readable, type Writable } from 'svelte/store';

import * as api from '$lib/api';
import type { LandingStat, StatField } from '$lib/types';
import type { ExpectedResultType } from '$lib/models/query/Query';
import { getBlankQueryRequest } from '$lib/QueryBuilder';
import { getFacetCategoryCount, getConceptCount } from '$lib/stores/Dictionary';
import { isUserLoggedIn } from '$lib/stores/User';
import { branding, features } from '$lib/configuration';

const QUERY_URL = 'picsure/query/sync';

export const hasError: Writable<boolean> = writable(false);
export const loaded: Writable<boolean> = writable(false);
const statData: Writable<LandingStat[]> = writable([]);
export const stats: Readable<LandingStat[]> = derived(statData, ($s) =>
  $s.filter((stat) => !stat.auth),
);
export const authStats: Readable<LandingStat[]> = derived(statData, ($s) =>
  $s.filter((stat) => stat.auth),
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rejectIfQueryError(result: any) {
  return result?.errorType ? Promise.reject('api error') : result;
}

interface CountMap {
  [concept: string]: number;
}
function getCrossCounts(field: string, resultType: ExpectedResultType) {
  const fields: string[] =
    branding?.landing?.statFields[field]?.map((field) => field.conceptPath) || [];
  if (fields.length === 0) return Promise.reject(`${field} feilds were not configured`);

  const request = getBlankQueryRequest(isUserLoggedIn(), resultType);
  request.query.setCrossCountFields(fields);
  const result: Promise<CountMap> = api.post(QUERY_URL, request);
  return result
    .then(rejectIfQueryError)
    .then((result: CountMap) =>
      Object.values(result).reduce((sum: number, val: number) => sum + val, 0),
    );
}

function getConsentCount() {
  const fields: StatField[] = branding?.landing?.statFields['consent'] || [];
  if (fields.length === 0) return Promise.reject('consent feilds were not configured');

  const categoryMap = fields.reduce(
    (map: { [key: string]: string[] }, field: StatField) => ({
      ...map,
      [field.conceptPath]: [...(map[field.conceptPath] || []), field.id],
    }),
    {},
  );

  const request = getBlankQueryRequest(isUserLoggedIn(), 'COUNT');
  Object.entries(categoryMap).forEach(([conceptPath, fieldList]) =>
    request.query.addCategoryFilter(conceptPath, fieldList),
  );
  return api.post(QUERY_URL, request).then(rejectIfQueryError);
}

const apiMap: { [key: string]: (openAccess: boolean, stat: LandingStat) => Promise<number> } = {
  'dict:facets:dataset_id': (openAccess) => getFacetCategoryCount(openAccess, 'dataset_id'),
  'dict:concepts': (openAccess) => getConceptCount(openAccess),
  'query:blank': (openAccess) =>
    api.post(QUERY_URL, getBlankQueryRequest(openAccess)).then(rejectIfQueryError),
  'query:biosample': () => getCrossCounts('biosample', 'OBSERVATION_CROSS_COUNT'),
  'query:genomic': () => getCrossCounts('genomic', 'CROSS_COUNT'),
  'query:consent': () => getConsentCount(),
  hardcoded: (_openAccess, stat) => Promise.resolve(stat?.value || 0),
};

export async function loadStats() {
  // No stats were configured - unexpected behavior
  const configList: LandingStat[] = branding?.landing?.stats || [];
  if (configList.length === 0) return;

  loaded.set(false);
  hasError.set(false);
  const stats: LandingStat[] = configList
    .filter((stat) => !!apiMap[stat.key]) // key exists in configured api requests
    .reduce((list: LandingStat[], stat: LandingStat) => {
      // If auth is set to false in config, calculate the stat for not logged in users only
      // Likewise, if auth is set to true in config, calculate the stat for logged in users only
      // Otherwise, calculate the stat as if user is both logged in and not logged in

      const statList = [...list];
      const authUsers = stat?.auth === undefined ? true : stat.auth;
      const openUsers = stat?.auth === undefined ? true : !stat.auth;

      if (authUsers && isUserLoggedIn()) {
        statList.push({ ...stat, auth: true, value: apiMap[stat.key](false, stat) });
      }

      if (features.login.open && openUsers) {
        statList.push({ ...stat, auth: false, value: apiMap[stat.key](true, stat) });
      }

      return statList;
    }, []);
  statData.set(stats);

  Promise.allSettled(stats.map((stat) => stat.value)).then((results) => {
    if (results.some((result) => result.status === 'rejected')) {
      hasError.set(true);
    }
    loaded.set(true);
  });
}

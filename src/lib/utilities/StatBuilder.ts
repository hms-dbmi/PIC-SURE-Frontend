import * as api from '$lib/api';
import { branding, features } from '$lib/configuration';
import { Picsure } from '$lib/paths';

import type { ExpectedResultType } from '$lib/models/query/Query';
import type {
  DictionaryConceptResult,
  DictionaryFacetResult,
  DictionarySearchRequest,
} from '$lib/models/api/Dictionary';
import type {
  StatConfig,
  StatResult,
  StatValue,
  StatResultMap,
  StatField,
  PatientCount,
  PatientCountMap,
  RequestMapOptions,
} from '$lib/models/Stat';

import { loadAllConcepts } from '$lib/services/hpds';
import { isUserLoggedIn } from '$lib/stores/User';
import { addConsents } from '$lib/stores/Dictionary';
import { getQueryResources } from '$lib/stores/Resources';
import { getBlankQueryRequest } from '$lib/utilities/QueryBuilder';
import { getQueryRequest } from '$lib/utilities/QueryBuilder';
import { countResult } from '$lib/utilities/PatientCount';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rejectIfQueryError(result: any) {
  return result?.errorType ? Promise.reject('api error') : result;
}

export const StatPromise = {
  list: (stat: StatResult): Promise<StatValue>[] => Object.values(stat.result),
  rejected: (result: PromiseSettledResult<StatValue>) => result.status === 'rejected',
  fullfiled: (result: PromiseSettledResult<StatValue>) => result.status === 'fulfilled',
  valueOrZero: (result: PromiseSettledResult<StatValue>): StatValue =>
    result.status === 'fulfilled' ? result.value : 0,
};

export function getStatFields(key: string): StatField[] {
  const statFieldMap: { [key: string]: StatField[] } = {
    _: [],
    'query:biosample': branding?.statFields?.biosample || [],
    'query:genomic': branding?.statFields?.genomic || [],
    'query:consent': branding?.statFields?.consent || [],
  };
  const statKeys = Object.keys(statFieldMap);

  return statFieldMap[statKeys.includes(key) ? key : '_'];
}

function dictionaryRequest(isOpenAccess: boolean = false): DictionarySearchRequest {
  const request: DictionarySearchRequest = { facets: [], search: '', consents: [] };
  return !isOpenAccess ? addConsents(request) : request;
}

function getFacetCategoryCount(category: string) {
  return function ({ isOpenAccess }: RequestMapOptions): Promise<PatientCount> {
    const request: DictionarySearchRequest = dictionaryRequest(isOpenAccess);
    return api
      .post(Picsure.Facets, request)
      .then((res: DictionaryFacetResult[]) => {
        const facetCat = res.find((facetCat) => facetCat.name === category);
        if (!facetCat) {
          return 0;
        }
        if (isOpenAccess) {
          return facetCat.facets.length;
        }
        const facetsForUser = facetCat.facets.filter((facet) => facet.count > 0);
        return facetsForUser.length;
      })
      .then(rejectIfQueryError);
  };
}

function getConceptCount({ isOpenAccess }: RequestMapOptions): Promise<PatientCount> {
  const request: DictionarySearchRequest = dictionaryRequest(isOpenAccess);
  return api
    .post(`${Picsure.Concepts}?page_number=1&page_size=1`, request)
    .then((res: DictionaryConceptResult) => {
      return res.totalElements || Promise.reject('total not found');
    });
}

function blank({ request }: RequestMapOptions): Promise<PatientCount> {
  return api.post(Picsure.QuerySync, request).then(rejectIfQueryError);
}

function hardcoded({ stat }: RequestMapOptions) {
  return Promise.resolve((stat?.value as PatientCount) || 0);
}

async function getOpenCount(options: RequestMapOptions): Promise<PatientCount> {
  const request = { ...options.request };
  request.query.expectedResultType = 'CROSS_COUNT';
  const concepts = await loadAllConcepts();
  request.query.setCrossCountFields(concepts);
  return api
    .post(Picsure.QuerySync, request)
    .then(rejectIfQueryError)
    .then((counts) => countResult([counts['\\_studies_consents\\'] || 0]));
}

function getAuthCount(options: RequestMapOptions): Promise<PatientCount> {
  const request = { ...options.request };
  request.query.expectedResultType = 'COUNT';
  return api.post(Picsure.QuerySync, request).then(rejectIfQueryError);
}

function patientCount(options: RequestMapOptions): Promise<PatientCount> {
  return options.isOpenAccess ? getOpenCount(options) : getAuthCount(options);
}

function getCrossCounts(field: string, type: ExpectedResultType) {
  return function (options: RequestMapOptions): Promise<PatientCountMap> {
    const fields: string[] = getStatFields(field).map((f) => f.conceptPath);
    if (fields.length === 0) return Promise.reject(`${field} feilds were not configured`);

    const request = { ...options.request };
    request.query.expectedResultType = type;
    request.query.setCrossCountFields(fields);
    return api.post(Picsure.QuerySync, request).then(rejectIfQueryError);
  };
}

function getConsentCount(type: ExpectedResultType) {
  return function (options: RequestMapOptions): Promise<PatientCount> {
    const fields: StatField[] = getStatFields('query:consent');
    if (fields.length === 0) return Promise.reject('consent feilds were not configured');

    const categoryMap = fields.reduce(
      (map: { [key: string]: string[] }, field: StatField) => ({
        ...map,
        [field.conceptPath]: [...(map[field.conceptPath] || []), field.id],
      }),
      {},
    );

    const request = { ...options.request };
    request.query.expectedResultType = type;
    Object.entries(categoryMap).forEach(([conceptPath, fieldList]) =>
      request.query.addCategoryFilter(conceptPath, fieldList),
    );
    return api.post(Picsure.QuerySync, request).then(rejectIfQueryError);
  };
}

const requestMap: { [key: string]: (options: RequestMapOptions) => Promise<StatValue> } = {
  'dict:facets:dataset_id': getFacetCategoryCount('dataset_id'),
  'dict:concepts': getConceptCount,
  'query:blank': blank,
  'query:biosample': getCrossCounts('query:biosample', 'OBSERVATION_CROSS_COUNT'),
  'query:genomic': getCrossCounts('query:genomic', 'CROSS_COUNT'),
  'query:consent': getConsentCount('COUNT'),
  'query:patientCount': patientCount,
  hardcoded,
};

export function getStatList(list: StatConfig[]): StatResult[] {
  const validStats = list.filter((stat) => !!requestMap[stat.key]);

  // No stats were configured - unexpected behavior
  if (list.length === 0) return [];

  return validStats.reduce((list: StatResult[], stat: StatConfig) => {
    const statList = [...list];
    // If auth is set to false in config, calculate the stat for not logged in users only
    // Likewise, if auth is set to true in config, calculate the stat for logged in users only
    // Otherwise, calculate the stat as if user is both logged in and not logged in
    const authUsers = stat?.auth === undefined ? true : stat.auth;
    const openUsers = stat?.auth === undefined ? true : !stat.auth;

    const request = (isOpenAccess: boolean) =>
      getQueryResources(isOpenAccess).reduce((statMap: StatResultMap, { name, uuid }) => {
        const newMap = { ...statMap };
        newMap[name] = requestMap[stat.key]({
          isOpenAccess,
          stat,
          request: getBlankQueryRequest(isUserLoggedIn(), uuid),
        });
        return newMap;
      }, {});

    if (authUsers && isUserLoggedIn()) {
      statList.push({
        ...stat,
        auth: true,
        result: request(false),
      });
    }

    if (features.login.open && openUsers) {
      statList.push({
        ...stat,
        auth: false,
        result: request(true),
      });
    }

    return statList;
  }, []);
}

export function getResultList(isOpenAccess: boolean, list: StatConfig[]): StatResult[] {
  const validStats = list.filter((stat) => !!requestMap[stat.key]);

  // No stats were configured - unexpected behavior
  if (validStats.length === 0) return [];

  return validStats.reduce((list: StatResult[], stat: StatConfig) => {
    const statList = [...list];
    statList.push({
      ...stat,
      auth: !isOpenAccess,
      result: getQueryResources(isOpenAccess).reduce((statMap: StatResultMap, { name, uuid }) => {
        const newMap = { ...statMap };
        newMap[name] = requestMap[stat.key]({
          isOpenAccess,
          stat,
          request: getQueryRequest(isOpenAccess, uuid),
        });
        return newMap;
      }, {}),
    });
    return statList;
  }, []);
}

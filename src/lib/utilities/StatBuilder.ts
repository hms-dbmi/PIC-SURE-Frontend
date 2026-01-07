import { get } from 'svelte/store';
import * as api from '$lib/api';
import { branding, features } from '$lib/configuration';
import { Picsure } from '$lib/paths';

import {
  type ExpectedResultType,
  type QueryV3,
  type PhenotypicFilterInterface,
} from '$lib/models/query/Query';
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
import { getQueryResources, resources } from '$lib/stores/Resources';
import { getQueryRequestV3, getBlankQueryRequestV3 } from '$lib/utilities/QueryBuilder';
import { countResult } from '$lib/utilities/PatientCount';
import type { QueryRequestInterface } from '$lib/models/api/Request';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rejectIfQueryError(result: any) {
  return result?.errorType ? Promise.reject('api error') : result;
}

export interface StatPromiseWithResource {
  promise: Promise<StatValue>;
  resourceName: string;
}

export const StatPromise = {
  list: (stat: StatResult): StatPromiseWithResource[] =>
    Object.entries(stat.result).map(([resourceName, promise]) => ({
      promise,
      resourceName,
    })),
  rejected: (result: PromiseSettledResult<StatValue>) => result.status === 'rejected',
  fullfiled: (result: PromiseSettledResult<StatValue>) => result.status === 'fulfilled',
  valueOrZero: (result: PromiseSettledResult<StatValue>): StatValue =>
    result.status === 'fulfilled' ? result.value : 0,
};

export function getStatFields(key: string): StatField[] {
  const statKeys = branding?.statFields ? Object.keys(branding?.statFields) : [];
  return statKeys.includes(key) ? branding?.statFields[key] : [];
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

function blank({ addFilters, isOpenAccess, resource }: RequestMapOptions): Promise<PatientCount> {
  const request = addFilters
    ? getQueryRequestV3(!isOpenAccess, resource, 'COUNT')
    : getBlankQueryRequestV3(isOpenAccess, resource, 'COUNT');
  return api.post(Picsure.QueryV3Sync, request).then(rejectIfQueryError);
}

function hardcoded({ stat }: RequestMapOptions) {
  return Promise.resolve((stat?.value as PatientCount) || 0);
}

interface CategoryMap {
  [key: string]: string[];
}
const queryMappers = {
  addCrossCountFields: (concepts: string[]) => (query: QueryV3) => {
    query.select = concepts;
    return query;
  },
  addCategoryMap: (map: CategoryMap) => (query: QueryV3) => {
    const clauses: PhenotypicFilterInterface[] = [];
    Object.entries(map).forEach(([conceptPath, fieldList]) => {
      const clause: PhenotypicFilterInterface = {
        type: 'PhenotypicFilter',
        phenotypicFilterType: 'FILTER',
        conceptPath,
        not: false,
      };
      if (!fieldList?.length) {
        clause.phenotypicFilterType = 'REQUIRED';
      } else {
        clause.values = fieldList;
      }
      clauses.push(clause);
    });
    query.addClauses(clauses);
    return query;
  },
};

async function getOpenPatientCount({
  addFilters,
  isOpenAccess,
}: RequestMapOptions): Promise<PatientCount> {
  const concepts = await loadAllConcepts();
  const mapper = queryMappers.addCrossCountFields(concepts);
  const resource = get(resources).hpdsOpenV3;
  const request: QueryRequestInterface = addFilters
    ? getQueryRequestV3(!isOpenAccess, resource, 'CROSS_COUNT', mapper)
    : getBlankQueryRequestV3(isOpenAccess, resource, 'CROSS_COUNT', mapper);
  return api
    .post(Picsure.QueryV3Sync, request)
    .then(rejectIfQueryError)
    .then((counts) => countResult([counts['\\_studies_consents\\'] || 0]));
}

function getAuthPatientCount({
  addFilters,
  isOpenAccess,
  resource,
}: RequestMapOptions): Promise<PatientCount> {
  const request = addFilters
    ? getQueryRequestV3(!isOpenAccess, resource, 'COUNT')
    : getBlankQueryRequestV3(isOpenAccess, resource, 'COUNT');
  return api.post(Picsure.QueryV3Sync, request).then(rejectIfQueryError);
}

function patientCount(options: RequestMapOptions): Promise<PatientCount> {
  return options.isOpenAccess ? getOpenPatientCount(options) : getAuthPatientCount(options);
}

function getCrossCounts(field: string, type: ExpectedResultType) {
  return function ({
    addFilters,
    isOpenAccess,
    resource,
  }: RequestMapOptions): Promise<PatientCountMap> {
    const fields: string[] = getStatFields(field).map((f) => f.conceptPath);
    if (fields.length === 0) return Promise.reject(`${field} feilds were not configured`);
    const mapper = queryMappers.addCrossCountFields(fields);
    const request = addFilters
      ? getQueryRequestV3(!isOpenAccess, resource, type, mapper)
      : getBlankQueryRequestV3(isOpenAccess, resource, type, mapper);
    return api.post(Picsure.QueryV3Sync, request).then(rejectIfQueryError);
  };
}

function getConsentCount(type: ExpectedResultType) {
  return function ({
    addFilters,
    isOpenAccess,
    resource,
  }: RequestMapOptions): Promise<PatientCount> {
    const fields: StatField[] = getStatFields('query:consent');
    if (fields.length === 0) return Promise.reject('consent feilds were not configured');

    const categoryMap = fields.reduce(
      (map: CategoryMap, field: StatField) => ({
        ...map,
        [field.conceptPath]: [...(map[field.conceptPath] || []), field.id],
      }),
      {},
    );

    const mapper = queryMappers.addCategoryMap(categoryMap);
    const request = addFilters
      ? getQueryRequestV3(!isOpenAccess, resource, type, mapper)
      : getBlankQueryRequestV3(isOpenAccess, resource, type, mapper);
    return api.post(Picsure.QueryV3Sync, request).then(rejectIfQueryError);
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

export function getValidStatList(list: StatConfig[]): StatResult[] {
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

    if (authUsers && isUserLoggedIn()) {
      statList.push({
        ...stat,
        auth: true,
        result: {},
      });
    }

    if (features.login.open && openUsers) {
      statList.push({
        ...stat,
        auth: false,
        result: {},
      });
    }

    return statList;
  }, []);
}

export function populateStatRequests(validStats: StatResult[]): StatResult[] {
  return validStats.map((stat: StatResult) => {
    const isOpenAccess = !stat.auth;
    return {
      ...stat,
      result: getQueryResources(isOpenAccess).reduce((statMap: StatResultMap, { name, uuid }) => {
        const newMap = { ...statMap };
        newMap[name] = requestMap[stat.key]({
          isOpenAccess,
          stat,
          resource: uuid,
          addFilters: false,
        });
        return newMap;
      }, {}),
    };
  });
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
          resource: uuid,
          addFilters: true,
        });
        return newMap;
      }, {}),
    });
    return statList;
  }, []);
}

import { get } from 'svelte/store';
import * as api from '$lib/api';
import { branding, features } from '$lib/configuration';
import { Picsure } from '$lib/paths';
import type { Stat, StatField, PatientCount, CountMap } from '$lib/types';
import type { ExpectedResultType } from '$lib/models/query/Query';
import type { QueryRequestInterface } from '$lib/models/api/Request';
import { loadAllConcepts } from '$lib/services/hpds';
import { getFacetCategoryCount, getConceptCount } from '$lib/stores/Dictionary';
import { isUserLoggedIn } from '$lib/stores/User';
import { resources as resourceStore } from '$lib/stores/Resources';
import { getBlankQueryRequest } from '$lib/utilities/QueryBuilder';
import { getQueryRequest } from '$lib/utilities/QueryBuilder';
import { countResult } from '$lib/utilities/PatientCount';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rejectIfQueryError(result: any) {
  return result?.errorType ? Promise.reject('api error') : result;
}

export function promiseList(stat: Stat): Promise<PatientCount>[] {
  // You have to do this stuff to ensure a list of type Promise<PatientCount>[]
  return Array.isArray(stat.value)
    ? stat.value
    : [Promise.resolve(stat.value !== undefined ? stat.value : 0)];
}

function blank(request: QueryRequestInterface): Promise<PatientCount> {
  return api.post(Picsure.QuerySync, request).then(rejectIfQueryError);
}

async function getOpenCount(request: QueryRequestInterface): Promise<PatientCount> {
  request.query.expectedResultType = 'CROSS_COUNT';
  const concepts = await loadAllConcepts();
  request.query.setCrossCountFields(concepts);
  const count = await api.post(Picsure.QuerySync, request);

  // All this below is to parse the number as an integer so we can add commas
  const openPatients: PatientCount = String(count['\\_studies_consents\\']);
  if (openPatients.includes(' \u00B1')) {
    const [patients, suffix] = openPatients.split(' ');
    return parseInt(patients).toLocaleString() + ' ' + suffix;
  } else {
    return Number.isInteger(openPatients) ? openPatients.toLocaleString() : openPatients;
  }
}

async function getAuthCount(request: QueryRequestInterface): Promise<PatientCount> {
  request.query.expectedResultType = 'COUNT';
  const count: PatientCount = await api.post(Picsure.QuerySync, request);

  return count;
}

function patientCount(
  isOpenAccess: boolean,
  request: QueryRequestInterface,
): Promise<PatientCount> {
  return isOpenAccess ? getOpenCount(request) : getAuthCount(request);
}

function getCrossCounts(
  field: string,
  type: ExpectedResultType,
  request: QueryRequestInterface,
): Promise<PatientCount> {
  const fields: string[] = branding?.statFields[field]?.map((field) => field.conceptPath) || [];
  if (fields.length === 0) return Promise.reject(`${field} feilds were not configured`);

  request.query.expectedResultType = type;
  request.query.setCrossCountFields(fields);
  const result: Promise<CountMap> = api.post(Picsure.QuerySync, request);
  return result.then(rejectIfQueryError).then(countResult);
}

function getConsentCount(
  type: ExpectedResultType,
  request: QueryRequestInterface,
): Promise<PatientCount> {
  const fields: StatField[] = branding?.statFields['consent'] || [];
  if (fields.length === 0) return Promise.reject('consent feilds were not configured');

  const categoryMap = fields.reduce(
    (map: { [key: string]: string[] }, field: StatField) => ({
      ...map,
      [field.conceptPath]: [...(map[field.conceptPath] || []), field.id],
    }),
    {},
  );

  request.query.expectedResultType = type;
  Object.entries(categoryMap).forEach(([conceptPath, fieldList]) =>
    request.query.addCategoryFilter(conceptPath, fieldList),
  );
  return api.post(Picsure.QuerySync, request).then(rejectIfQueryError);
}

interface RequestMapOptions {
  isOpenAccess: boolean;
  stat: Stat;
  request: QueryRequestInterface;
}

const requestMap: {
  [key: string]: (options: RequestMapOptions) => Promise<PatientCount>;
} = {
  'dict:facets:dataset_id': ({ isOpenAccess }) => getFacetCategoryCount(isOpenAccess, 'dataset_id'),
  'dict:concepts': ({ isOpenAccess }) => getConceptCount(isOpenAccess),
  'query:blank': ({ request }) => blank(request),
  'query:biosample': ({ request }) =>
    getCrossCounts('biosample', 'OBSERVATION_CROSS_COUNT', request),
  'query:genomic': ({ request }) => getCrossCounts('genomic', 'CROSS_COUNT', request),
  'query:consent': ({ request }) => getConsentCount('COUNT', request),
  'query:patientCount': ({ isOpenAccess, request }) => patientCount(isOpenAccess, request),
  hardcoded: ({ stat }: RequestMapOptions) => Promise.resolve((stat?.value as PatientCount) || 0),
};

export function getStatList(list: Stat[]): Stat[] {
  // No stats were configured - unexpected behavior
  if (list.length === 0) return [];

  const resources = get(resourceStore);
  return list
    .filter((stat) => !!requestMap[stat.key]) // key exists in configured api requests
    .reduce((list: Stat[], stat: Stat) => {
      const statList = [...list];
      // If auth is set to false in config, calculate the stat for not logged in users only
      // Likewise, if auth is set to true in config, calculate the stat for logged in users only
      // Otherwise, calculate the stat as if user is both logged in and not logged in
      const authUsers = stat?.auth === undefined ? true : stat.auth;
      const openUsers = stat?.auth === undefined ? true : !stat.auth;

      const request = (isOpenAccess: boolean) => {
        const resourceList = features.federated
          ? resources.query.map(({ uuid }) => uuid)
          : [isOpenAccess ? resources.hpdsOpen : resources.hpdsAuth];
        return resourceList.map((uuid) =>
          requestMap[stat.key]({
            isOpenAccess,
            stat,
            request: getBlankQueryRequest(isUserLoggedIn(), uuid),
          }),
        );
      };

      if (authUsers && isUserLoggedIn()) {
        statList.push({
          ...stat,
          auth: true,
          value: request(false),
        });
      }

      if (features.login.open && openUsers) {
        statList.push({
          ...stat,
          auth: false,
          value: request(true),
        });
      }

      return statList;
    }, []);
}

export function getResultList(isOpenAccess: boolean, list: Stat[]): Stat[] {
  // No stats were configured - unexpected behavior
  if (list.length === 0) return [];

  const resources = get(resourceStore);
  const resourceList = features.federated
    ? resources.query.map(({ uuid }) => uuid)
    : [isOpenAccess ? resources.hpdsOpen : resources.hpdsAuth];
  return list
    .filter((stat) => !!requestMap[stat.key]) // key exists in configured api requests
    .reduce((list: Stat[], stat: Stat) => {
      const statList = [...list];
      statList.push({
        ...stat,
        auth: !isOpenAccess,
        value: resourceList.map((uuid) =>
          requestMap[stat.key]({
            isOpenAccess,
            stat,
            request: getQueryRequest(isOpenAccess, uuid),
          }),
        ),
      });
      return statList;
    }, []);
}

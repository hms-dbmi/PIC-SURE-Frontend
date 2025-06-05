import { get, writable, type Writable } from 'svelte/store';

import * as api from '$lib/api';
import { toaster } from '$lib/toaster';
import { branding } from '$lib/configuration';

import type { QueryRequestInterface } from '$lib/models/api/Request';
import type { ExpectedResultType } from '$lib/models/query/Query';
import { loadAllConcepts } from '$lib/services/hpds';
import { filters } from '$lib/stores/Filter';
import { getQueryRequest } from '$lib/utilities/QueryBuilder';

export const ERROR_VALUE = 'N/A';
export type PatientCount = string | number | typeof ERROR_VALUE;
let currentRequestID = 0;

export const totalParticipants: Writable<number | string> = writable(0);

export async function getPatientCount(
  isOpenAccess: boolean,
  resource: string,
  type: ExpectedResultType,
): Promise<{suffix: string, count: PatientCount}> {
  let totalPatients: PatientCount = 0;
  let suffix = '';
  const requestID = ++currentRequestID;
  let request: QueryRequestInterface = getQueryRequest(isOpenAccess, resource, type);
  try {
    if (isOpenAccess) {
      const concepts = await loadAllConcepts();
      request.query.setCrossCountFields(concepts);
    }
    const count = await api.post('picsure/query/sync', request);
    if (requestID !== currentRequestID) {
      return { suffix, count: 0 };
    }
    if (isOpenAccess) {
      let openTotalPatients = String(count['\\_studies_consents\\']);
      if (openTotalPatients.includes(' \u00B1')) {
        totalPatients = parseInt(openTotalPatients.split(' ')[0]);
        suffix = openTotalPatients.split(' ')[1];
        totalParticipants.set(totalPatients);
      } else {
        totalPatients = openTotalPatients;
        totalParticipants.set(openTotalPatients);
      }
    } else {
      totalParticipants.set(count);
      totalPatients = count;
    }
  } catch (error) {
    if (get(filters).length !== 0) {
      toaster.error({ description: branding?.explorePage?.filterErrorText, closable: false });
    } else {
      toaster.error({ title: branding?.explorePage?.queryErrorText });
    }
    totalPatients = ERROR_VALUE;
  } finally {
    return { suffix, count: totalPatients };
  }
}

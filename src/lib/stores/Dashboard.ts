import { writable, type Writable } from 'svelte/store';

import * as api from '$lib/api';
import type { Column } from '$lib/models/Tables';
import { user } from '$lib/stores/User';
import { get } from 'svelte/store';
import type { User } from '$lib/models/User';
import { browser } from '$app/environment';

export const columns: Writable<Column[]> = writable([]);

export type DashboardRow = Record<string, string | number | boolean | null>;
export const rows: Writable<DashboardRow[]> = writable([]);

export type DashboardColumn = {
  label: string;
  dataElement: string;
};

export type DashboardResp = {
  columns: DashboardColumn[];
  rows: DashboardRow[];
};

function fetchDashboard(): Promise<DashboardResp> {
  return api.get('picsure/proxy/dictionary-api/dashboard');
}

function isUserLoggedIn() {
  if (browser) {
    return !!localStorage.getItem('token');
  }
  return false;
}

export async function loadDashboardData() {
  const dashboardData = await fetchDashboard();
  columns.set(dashboardData.columns);
  const loggedInUser: User = get(user);
  if (isUserLoggedIn() && loggedInUser && loggedInUser.queryTemplate) {
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const filters = loggedInUser.queryTemplate.categoryFilters as any;
    const consents = filters['\\_consents\\'] as string[];
    dashboardData.rows.forEach((row) => {
      if (row?.accession) {
        const accessionRegex = /^phs\d+\.v\d+\.p\d+\.c\d+$/;
        if (accessionRegex.test(row.accession as string)) {
          const accessionBase = (row.accession as string).replace(/\.v\d+\.p\d+/, '');
          console.log(accessionBase);
          row.consentGranted = consents.includes(accessionBase);
        } else {
          try {
            row.consentGranted = consents.includes(row?.accession.toLocaleString());
          } catch (e) {
            console.error(e);
            row.consentGranted = false;
          }
        }
      } else {
        row.consentGranted = false;
      }
    });
  }
  const consentGrantedRows = dashboardData.rows.filter((row) => row.consentGranted);
  const nonConsentGrantedRows = dashboardData.rows.filter((row) => !row.consentGranted);

  const sortByAbbreviation = (a: DashboardRow, b: DashboardRow) => {
    if (typeof a.abbreviation === 'string' && typeof b.abbreviation === 'string') {
      return a.abbreviation.localeCompare(b.abbreviation);
    }
    if (typeof a.abbreviation === 'string') return -1;
    if (typeof b.abbreviation === 'string') return 1;
    return 0;
  };

  const sortedConsentGrantedRows = consentGrantedRows.sort(sortByAbbreviation);
  const sortedNonConsentGrantedRows = nonConsentGrantedRows.sort(sortByAbbreviation);

  rows.set([...sortedConsentGrantedRows, ...sortedNonConsentGrantedRows]);
}

import { writable, type Writable } from 'svelte/store';

import * as api from '$lib/api';
import type { Column } from '$lib/models/Tables';
import { user } from '$lib/stores/User';
import { get } from 'svelte/store';
import type { User } from '$lib/models/User';
import { browser } from '$app/environment';
import { features } from '$lib/configuration';
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
  const useConsents = features.useQueryTemplate && isUserLoggedIn() && loggedInUser?.queryTemplate;

  let consents: string[] = [];
  if (useConsents) {
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    consents = (loggedInUser.queryTemplate?.categoryFilters as any)?.['\\_consents\\'] || [];
  }

  const processedRows = dashboardData.rows.map(processRow(consents));

  const sortedRows = processedRows.sort((a, b) => {
    const aIsAnvil = (a.program_name?.toString().toLowerCase() || '') === 'anvil';
    const bIsAnvil = (b.program_name?.toString().toLowerCase() || '') === 'anvil';
    if (aIsAnvil !== bIsAnvil) {
      return aIsAnvil ? 1 : -1;
    }
    if (a.consentGranted === b.consentGranted) {
      return sortByAbbreviation(a, b);
    }
    return a.consentGranted ? -1 : 1;
  });

  rows.set(sortedRows);
}

function processRow(consents: string[]) {
  return (row: DashboardRow): DashboardRow => {
    if (!row.accession) {
      return { ...row, consentGranted: false };
    }

    const accession = row.accession.toString();
    const accessionRegex = /^phs\d+\.v\d+\.p\d+\.c\d+$/;

    if (accessionRegex.test(accession)) {
      const accessionBase = accession.replace(/\.v\d+\.p\d+/, '');
      return { ...row, consentGranted: consents.includes(accessionBase) };
    }

    return { ...row, consentGranted: consents.includes(accession) };
  };
}

function sortByAbbreviation(a: DashboardRow, b: DashboardRow): number {
  const aAbbr = a.abbreviation?.toString() || '';
  const bAbbr = b.abbreviation?.toString() || '';
  return aAbbr.localeCompare(bAbbr);
}

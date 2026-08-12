import { writable, type Writable } from 'svelte/store';

import * as api from '$lib/api';
import { Picsure } from '$lib/paths';
import type { Column } from '$lib/components/datatable/types';
import {
  accessUnavailable,
  consentedStudies,
  consentsSettled,
  showAccessUnavailable,
} from '$lib/stores/User';
import { get } from 'svelte/store';
export const columns: Writable<Column[]> = writable([]);

export type DashboardRow = Record<string, string | number | boolean | null>;
export const rows: Writable<DashboardRow[]> = writable([]);
export const activeRow: Writable<DashboardRow> = writable({});

export type DashboardColumn = {
  label: string;
  dataElement: string;
};

export type DashboardResp = {
  columns: DashboardColumn[];
  rows: DashboardRow[];
};

function fetchDashboard(): Promise<DashboardResp> {
  return api.get(Picsure.Dashboard);
}

export async function loadDashboardData() {
  // Computed once, so wait rather than render an all-denied column that never corrects itself.
  const [dashboardData] = await Promise.all([fetchDashboard(), consentsSettled()]);
  columns.set(dashboardData.columns);

  // All-denied is indistinguishable from having no access, so say why.
  if (get(accessUnavailable)) showAccessUnavailable();

  const processedRows = dashboardData.rows.map(processRow(get(consentedStudies)));

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

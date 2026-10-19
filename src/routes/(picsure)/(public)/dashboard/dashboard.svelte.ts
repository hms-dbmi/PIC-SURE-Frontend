import { getDashboard } from '#lib/api/picsure/dictionary.ts';
import type { DashboardRow } from '#lib/api/picsure/dictionary.types.ts';
import type { Column } from '#lib/ui/datatable/types.ts';
import { session } from '#lib/auth/session.svelte.ts';
import { showAccessUnavailable } from '#lib/auth/accessUnavailable.ts';

export type { DashboardRow };

/** The dashboard table, created by the page. */
export class Dashboard {
  columns = $state.raw<Column[]>([]);
  rows = $state.raw<DashboardRow[]>([]);

  async load() {
    // Computed once, so wait rather than render an all-denied column that never corrects itself.
    const [dashboardData] = await Promise.all([getDashboard(), session.consentsSettled()]);
    this.columns = dashboardData.columns;

    // All-denied is indistinguishable from having no access, so say why.
    if (session.accessUnavailable) showAccessUnavailable();

    this.rows = dashboardData.rows.map(processRow(session.consentedStudies)).sort(byAccess);
  }
}

function byAccess(a: DashboardRow, b: DashboardRow): number {
  const aIsAnvil = (a.program_name?.toString().toLowerCase() || '') === 'anvil';
  const bIsAnvil = (b.program_name?.toString().toLowerCase() || '') === 'anvil';
  if (aIsAnvil !== bIsAnvil) {
    return aIsAnvil ? 1 : -1;
  }
  if (a.consentGranted === b.consentGranted) {
    return sortByAbbreviation(a, b);
  }
  return a.consentGranted ? -1 : 1;
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

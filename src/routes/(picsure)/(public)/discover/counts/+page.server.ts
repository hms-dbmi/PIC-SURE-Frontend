import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { Picsure } from '$lib/paths';
import type { DashboardRow } from '$lib/stores/Dashboard';
import type { CleanedStudyData } from '$lib/models/api/Studies';

interface StudyData {
  datasetId: number;
  studyFullname: string;
  studyAbbreviation: string;
  consentGroups: string[];
  studySummary: string;
  studyFocus: string[];
  studyDesign: string;
  sponsor: string | null;
}

let cachedData: CleanedStudyData[] | null = null;

const ACCESSION_PATTERN = /(\.v\d+)(\.p\d+)?(\.c\d+)?$/;

export const load: PageServerLoad<{ studies: CleanedStudyData[] }> = async ({ url }) => {
  try {
    const options = {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    };
    if (!cachedData) {
      const [drawerRes, dashboardRes] = await Promise.all([
        fetch(`${url.origin}/${Picsure.DashboardDrawer}`, options),
        fetch(`${url.origin}/${Picsure.Dashboard}`, options),
      ]);

      if (!drawerRes.ok) throw new Error(`Drawer request failed: ${drawerRes.status}`);
      if (!dashboardRes.ok) throw new Error(`Dashboard request failed: ${dashboardRes.status}`);

      const rawData: StudyData[] = await drawerRes.json();

      if (!rawData || !Array.isArray(rawData)) throw new Error('Invalid drawer data format');

      const { rows }: { rows: DashboardRow[] } = await dashboardRes.json();

      if (!rows) throw new Error('Missing row data');
      if (!Array.isArray(rows)) throw new Error('Invalid dashboard data format');

      cachedData = cleanData(rawData, rows);
    }

    return {
      studies: cachedData
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Error fetching studies data:', err);
    throw error(500, `Failed to fetch studies data: ${message}`);
  }
};

const cleanData = (data: StudyData[], rowData: DashboardRow[]): CleanedStudyData[] => {
  const drawerDataMap = new Map<number, StudyData>(data.map((study) => [study.datasetId, study]));

  const groupedRows = new Map<string, DashboardRow[]>();
  for (const row of rowData) {
    if (!row.abbreviation) continue;
    const abbreviation = String(row.abbreviation);
    if (!groupedRows.has(abbreviation)) {
      groupedRows.set(abbreviation, []);
    }
    groupedRows.get(abbreviation)!.push(row);
  }

  return Array.from(groupedRows.entries())
    .map(([abbreviation, rows]) => {
      if (rows.length === 0) return null;

      const firstRow = rows[0];
      const datasetId = Number(firstRow.dataset_id);
      if (isNaN(datasetId)) {
        console.warn(`Invalid dataset_id for abbreviation ${abbreviation}: ${firstRow.dataset_id}`);
        return null;
      }

      const drawerData = drawerDataMap.get(datasetId);
      if (!drawerData) {
        console.warn(`No drawer data found for dataset_id: ${datasetId}`);
        return null;
      }

      const accession = String(firstRow.accession ?? '');
      const baseAccession = normalizeAccession(accession);

      return {
        abbreviation,
        name: drawerData.studyFullname,
        countsByConsent: drawerData.consentGroups.map(cleanConsentGroupCode),
        accession: baseAccession,
        additional_info_link: String(firstRow.additional_info_link ?? ''),
      };
    })
    .filter((item): item is CleanedStudyData => item !== null);
};

function normalizeAccession(accession: string): string {
  return accession.replace(ACCESSION_PATTERN, '');
}

function cleanConsentGroupCode(consentGroup: string): string {
  // Extract text from the last set of parentheses
  const match = consentGroup.match(/\(([^)]+)\)$/);
  return match ? match[1] : consentGroup;
}
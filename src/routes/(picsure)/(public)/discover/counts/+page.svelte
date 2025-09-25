<script lang="ts">

  import { branding } from '$lib/configuration';
  import Content from '$lib/components/Content.svelte';
  import Loading from '$lib/components/Loading.svelte';
  import StaticTable from '$lib/components/datatable/StaticTable.svelte';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import AccessCell from '$lib/components/studycounts/AccessCell.svelte';
  import ConsentCounts from '$lib/components/studycounts/ConsetCounts.svelte';

  import type { Column } from '$lib/components/datatable/types';
  import { goto } from '$app/navigation';
  import { totalParticipants } from '$lib/stores/ResultStore';
  import { loadResources } from '$lib/stores/Resources';
  import type { CleanedStudyData } from '$lib/models/api/Studies';
  import { user, isUserLoggedIn } from '$lib/stores/User';
  import { features } from '$lib/configuration';
  import { lastStudyCrossCount } from '$lib/stores/ResultStore';
  import type { PageProps } from './$types';

  let { data: pageData }: PageProps = $props();

  let shouldShowLowCounts = $state(false);

  const columns: Column[] = [
    { dataElement: 'abbreviation', label: 'Abbreviation', class: 'font-medium' },
    { dataElement: 'accession', label: 'Accession' },
    { dataElement: 'name', label: 'Name', class: 'w-96' },
    { dataElement: 'countsByConsentMap', label: 'Counts by Consent Code' },
    { dataElement: 'access', label: 'Access', class: 'text-center' },
  ];
  
  const studyDataPromise = loadStudyData();

  async function loadStudyData(): Promise<CleanedStudyData[]> {
    loadResources();
    
    // If no cohort, cohort has 0 participants, or cohort is too small (< 10), redirect back to discover
    if (!$totalParticipants || $totalParticipants === 0 || $totalParticipants < 10) {
      await goto('/discover', { replaceState: true });
      return [];
    }

    const studies = pageData.studies || [];
    let userConsents: string[] = [];
    const useConsents = features.useQueryTemplate && isUserLoggedIn() && $user?.queryTemplate;
    if (useConsents) {
      userConsents = ($user?.queryTemplate?.categoryFilters as any)?.['\\_consents\\'] || [];
    }
    
    if ($lastStudyCrossCount) {
      const map: Map<string, Map<string, string>> = new Map();

      Object.entries($lastStudyCrossCount).forEach(([key, count]) => {
        // Parse the consent name to extract study accession and consent code
        // Format: "\\_studies_consents\\phs001612\\HMB-IRB-NPU\\" or "\\_studies_consents\\phs003703\\"
        const [prefix, accession, consent] = String(key)
          .replace(/^\\+|\\+$/g, '') // trim leading/trailing backslashes
          .split('\\');

        if (prefix === '_studies_consents' && accession) {
          const studyAccession = accession; // e.g., "phs001612"
          const consentCode = consent || '-1'; // e.g., "HMB-IRB-NPU" or "-1" if no consent code
          
          if (!map.get(studyAccession)) {
            map.set(studyAccession, new Map());
          } else if (consentCode === '-1' && map.get(studyAccession)?.get('GRU')) {
            if (map.get(studyAccession)?.get('GRU') === count) {
              return;
            }
          } else if (consentCode === 'GRU' && map.get(studyAccession)?.get('-1')) {
            if (map.get(studyAccession)?.get('-1') === count) {
              map.get(studyAccession)?.set(consentCode, count);
              map.get(studyAccession)?.delete('-1');
            }
          }
          map.get(studyAccession)?.set(consentCode, count);
        }
      });

      const normalizeCountForSort = (value: string | number | undefined): number => {
        if (value === undefined || value === null) return 0;
        if (typeof value === 'number') return value < 10 ? 10 : value;
        const trimmed = value.trim();
        if (trimmed.startsWith('<')) return 10;
        const match = trimmed.match(/\d+/);
        const parsed = match ? Number(match[0]) : NaN;
        return Number.isNaN(parsed) ? 0 : parsed;
      };

      const consentifyAccession = (accession: string) => {
        return accession.replace(/\.v\d+\.p\d+/, '');
      };

      studies.forEach((study) => {
        study.hasAccess = userConsents.some((consent) => consentifyAccession(study.fullAccession).includes(consent));
        const m = map.get(study.accession);
        study.countsByConsentMap = m
          ? Object.fromEntries(Array.from(m.entries()))
          : undefined;
        study.totalCountSort = normalizeCountForSort(study.countsByConsentMap?.['-1']);
      });
      studies.sort((a, b) => (b.totalCountSort ?? 0) - (a.totalCountSort ?? 0));
      return studies;
    }
    throw new Error('No Counts Found');
  }
</script>

<svelte:head>
  <title>{branding.applicationName} | Participant Counts by Study</title>
</svelte:head>

<Content full backUrl="/discover" backTitle="Back to Discover" title="Participant Counts by Study">
  <div class="mb-6">
    <p class="text-center">
      The following obfuscation techniques are used to protect participant-level data:
    </p>
    <ul class="list-disc list-inside mt-4 text-sm text-surface-700 max-w-2xl mx-auto">
      <li>
        If the consents or studies are less than 10, the count will be displayed as "&lt; 10".
      </li>
      <li>
        If the consent results are less than 10 and the total study count is greater than 10, the
        total count will be obfuscated by +/- 3.
      </li>
    </ul>
  </div>

  {#await studyDataPromise}
    <Loading ring size="medium" />
  {:then studies}
    {#if studies.length === 0}
    <div class="text-center py-8">
      <p class="text-surface-600">No study data available.</p>
    </div>
    {:else}
    <StaticTable
      tableName="StudyCountsTable"
      data={
        shouldShowLowCounts
          ? studies.filter(
              (study) =>
                Object.values(study.countsByConsentMap || {}).some((v) => v !== '< 10')
            )
          : studies
      }
      {columns}
      cellOverides={{
        access: AccessCell,
        countsByConsentMap: ConsentCounts,
      }}
      searchable={true}
      showPagination={true}
      fullWidth={false}
    />
    <div class="flex justify-end m-4">
      <button
        class="btn preset-filled-primary-500"
        onclick={() => (shouldShowLowCounts = !shouldShowLowCounts)}
      >
        {shouldShowLowCounts ? 'Hide studies with counts < 10' : 'Show studies with counts < 10'}
      </button>
    </div>
    {/if}
  {:catch error}
    <ErrorAlert title="Error loading study data" color="error">
      {error instanceof Error ? error.message : 'Failed to load study data'}
    </ErrorAlert>
  {/await}
</Content>

<script lang="ts">
  import { onMount } from 'svelte';

  import { branding } from '$lib/configuration';
  import Content from '$lib/components/Content.svelte';
  import Loading from '$lib/components/Loading.svelte';
  import StaticTable from '$lib/components/datatable/StaticTable.svelte';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import AccessionCell from '$lib/components/studycounts/AccessionCell.svelte';
  import AccessCell from '$lib/components/studycounts/AccessCell.svelte';
  import ConsentCounts from '$lib/components/studycounts/ConsetnCounts.svelte';

  import type { Column } from '$lib/components/datatable/types';
  import { goto } from '$app/navigation';
  import { totalParticipants } from '$lib/stores/ResultStore';
  import { loadResources } from '$lib/stores/Resources';
  import type { CleanedStudyData } from '$lib/models/api/Studies';
  import { user, isUserLoggedIn } from '$lib/stores/User';
  import { get } from 'svelte/store';
  import { features } from '$lib/configuration';
  import type { User } from '$lib/models/User';
  import type { PageProps } from './$types';

  interface ComponentProps {
    counts: { name: string; count: string }[];
  }

  const props = $props<PageProps & ComponentProps>();
  const { counts, data: pageData } = props;

  const countMap = $derived(() => {
    const map: { [studyAccession: string]: { [consentCode: string]: string } } = {};

    counts.forEach((count: { name: string; count: string }) => {
      // Parse the consent name to extract study accession and consent code
      // Format: "\\_studies_consents\\phs001612\\HMB-IRB-NPU\\" or "\\_studies_consents\\phs003703\\"
      const match = count.name.match(
        /\\\\_studies_consents\\\\([^\\\\]+)(?:\\\\([^\\\\]+)\\)?\\\\/,
      );

      if (match) {
        const studyAccession = match[1]; // e.g., "phs001612"
        const consentCode = match[2] || '-1'; // e.g., "HMB-IRB-NPU" or "-1" if no consent code

        if (!map[studyAccession]) {
          map[studyAccession] = {};
        } else if (consentCode === '-1' && map[studyAccession]['GRU']) {
          if (map[studyAccession]['GRU'] === count.count) {
            return;
          }
        } else if (consentCode === 'GRU' && map[studyAccession]['-1']) {
          if (map[studyAccession]['-1'] === count.count) {
            map[studyAccession][consentCode] = count.count;
            delete map[studyAccession]['-1'];
          }
        }
        map[studyAccession][consentCode] = count.count;
      }
    });

    return map;
  });
  let isLoading = $state(true);
  let error = $state<string | null>(null);
  let studies = $state<CleanedStudyData[]>([]);
  let userConsents = $state<string[]>([]);
  let showLowCounts = $state(false);
  const loggedInUser: User = get(user);
  const useConsents =
    features.useQueryTemplate && isUserLoggedIn() && loggedInUser && loggedInUser?.queryTemplate;

  const columns: Column[] = [
    { dataElement: 'abbreviation', label: 'Abbreviation', class: 'font-medium' },
    { dataElement: 'accession', label: 'Accession' },
    { dataElement: 'name', label: 'Name' },
    { dataElement: 'countsByConsent', label: 'Counts by Consent Code' },
    { dataElement: 'access', label: 'Access', class: 'text-center' },
  ];

  let tableData = $derived.by(() => {
    studies.forEach((study) => {
      study.hasAccess = userConsents.some((consent) => study.countsByConsent.includes(consent));
      study.countsByConsentMap = countMap()[study.accession] || {};
    });
    return studies;
  });

  onMount(async () => {
    console.log('onMount counts', counts);
    console.log('onMount pageData', pageData);
    loadResources();

    if (useConsents) {
      userConsents = (loggedInUser.queryTemplate?.categoryFilters as any)?.['\\_consents\\'] || [];
    }

    // If no cohort, cohort has 0 participants, or cohort is too small (< 10), redirect back to discover
    if (!$totalParticipants || $totalParticipants === 0 || $totalParticipants < 10) {
      await goto('/discover', { replaceState: true });
      return;
    }

    try {
      isLoading = true;
      error = null;
      console.log('onMount pageData', pageData);
      studies = pageData.studies || [];
    } catch (err) {
      console.error('Error loading study counts:', err);
      error = err instanceof Error ? err.message : 'Failed to load study counts data';
    } finally {
      isLoading = false;
    }
  });
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
        total count will be obfuscated by +/- 3%.
      </li>
    </ul>
  </div>

  {#if error}
    <ErrorAlert title="Error loading study data" color="error">
      {error}
    </ErrorAlert>
  {:else if isLoading}
    <Loading ring size="medium" />
  {:else if tableData.length === 0}
    <div class="text-center py-8">
      <p class="text-surface-600">No study data available.</p>
    </div>
  {:else}
    <!-- Show/Hide Low Counts Toggle -->
    <div class="flex justify-end mb-4">
      <button
        class="btn preset-filled-primary-500"
        onclick={() => (showLowCounts = !showLowCounts)}
      >
        {showLowCounts ? 'Hide studies with counts < 10' : 'Show studies with counts < 10'}
      </button>
    </div>

    <!-- Data Table -->
    <StaticTable
      tableName="StudyCountsTable"
      data={tableData}
      {columns}
      cellOverides={{
        accession: AccessionCell,
        access: AccessCell,
        countsByConsent: ConsentCounts,
      }}
      searchable={false}
      showPagination={true}
      title=""
      fullWidth={true}
    />
  {/if}
</Content>

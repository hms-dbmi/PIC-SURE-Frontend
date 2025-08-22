<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';

  import { branding } from '$lib/configuration';
  import Content from '$lib/components/Content.svelte';
  import Loading from '$lib/components/Loading.svelte';
  import StaticTable from '$lib/components/datatable/StaticTable.svelte';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import AccessionCell from '$lib/components/studycounts/AccessionCell.svelte';
  import AccessCell from '$lib/components/studycounts/AccessCell.svelte';

  import { loadStudyCounts, filterStudiesByCount } from '$lib/services/studycounts';
  import type { StudyCountsData } from '$lib/models/StudyCounts';
  import type { Column } from '$lib/components/datatable/types';
  import { goto } from '$app/navigation';
  import { totalParticipants } from '$lib/stores/ResultStore';

  let isLoading = $state(true);
  let error = $state<string | null>(null);
  let studies = $state<StudyCountsData[]>([]);
  let filteredStudies = $state<StudyCountsData[]>([]);
  let showLowCounts = $state(false);

  $effect(() => {
    filteredStudies = filterStudiesByCount(studies, showLowCounts);
  });

  // Check if there's a valid cohort when component mounts
  onMount(async () => {
    // Wait a bit for the ResultStore to initialize
    await new Promise(resolve => setTimeout(resolve, 100));

    // If no cohort, cohort has 0 participants, or cohort is too small (< 10), redirect back to discover
    if (!$totalParticipants || $totalParticipants === 0 || $totalParticipants < 10) {
      await goto('/discover', { replaceState: true });
      return;
    }

    // Continue with normal loading
    try {
      isLoading = true;
      error = null;
      studies = await loadStudyCounts(true);
    } catch (err) {
      console.error('Error loading study counts:', err);
      error = err instanceof Error ? err.message : 'Failed to load study counts data';
    } finally {
      isLoading = false;
    }
  });

  // Get all unique consent codes across all studies
  function getAllConsentCodes(): string[] {
    const consentCodes = new Set<string>();
    studies.forEach(study => {
      Object.keys(study.countsByConsent).forEach(code => {
        consentCodes.add(code);
      });
    });
    return Array.from(consentCodes).sort();
  }

  // Format count display
  function formatCount(count: number | string): string {
    if (typeof count === 'string') {
      return count;
    }
    return count.toLocaleString();
  }

  // Generate table data for StaticTable
  function generateTableData() {
    const consentCodes = getAllConsentCodes();

    return filteredStudies.map(study => ({
      abbreviation: study.abbreviation,
      accession: study.accession,
      name: study.name,
      ...Object.fromEntries(
        consentCodes.map(code => [
          code,
          study.countsByConsent[code] !== undefined ? formatCount(study.countsByConsent[code]) : '-'
        ])
      ),
      totalCount: formatCount(study.totalCount),
      access: study.isPublic ? 'Public' : 'Request'
    }));
  }

  // Generate table columns
  function generateTableColumns(): Column[] {
    const consentCodes = getAllConsentCodes();
    const columns: Column[] = [
      { dataElement: 'abbreviation', label: 'Abbreviation', class: 'font-medium' },
      { dataElement: 'accession', label: 'Accession' },
      { dataElement: 'name', label: 'Name' },
      ...consentCodes.map(code => ({
        dataElement: code,
        label: code,
        class: 'text-center'
      })),
      {
        dataElement: 'totalCount',
        label: 'Total',
        class: 'text-center font-medium'
      },
      { dataElement: 'access', label: 'Access', class: 'text-center' }
    ];
    return columns;
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
      <li>If the consents or studies are less than 10, the count will be displayed as "&lt; 10".</li>
      <li>If the consent results are less than 10 and the total study count is greater than 10, the total count will be obfuscated by +/- 3%.</li>
    </ul>
  </div>

  {#if error}
    <ErrorAlert title="Error loading study data" color="error">
      {error}
    </ErrorAlert>
  {:else if isLoading}
    <Loading ring size="large" />
  {:else if filteredStudies.length === 0}
    <div class="text-center py-8">
      <p class="text-surface-600">No study data available.</p>
    </div>
  {:else}
    <!-- Show/Hide Low Counts Toggle -->
    <div class="flex justify-end mb-4">
      <button
        class="btn preset-filled-primary-500"
        onclick={() => showLowCounts = !showLowCounts}
      >
        {showLowCounts ? 'Hide studies with counts < 10' : 'Show studies with counts < 10'}
      </button>
    </div>

    <!-- Data Table -->
    <StaticTable
      tableName="StudyCountsTable"
      data={generateTableData()}
      columns={generateTableColumns()}
      cellOverides={{
        accession: AccessionCell,
        access: AccessCell
      }}
      searchable={false}
      showPagination={true}
      title=""
      fullWidth={true}
    />
  {/if}
</Content>

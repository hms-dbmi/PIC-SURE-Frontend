<script lang="ts">
  import { onMount } from 'svelte';

  import { branding } from '$lib/configuration';
  import { uuidInput } from '$lib/utilities/Forms';
  import { toaster } from '$lib/toaster';

  import Content from '$lib/components/Content.svelte';
  import Step from '$lib/components/steppers/vertical/Step.svelte';
  import Grid from '$lib/components/request/Grid.svelte';
  import GridCell from '$lib/components/request/GridCell.svelte';
  import DataSummary from '$lib/components/request/modals/DataSummary.svelte';
  import DataLocModal from '$lib/components/request/modals/DataLocModal.svelte';
  import DataTypeModal from '$lib/components/request/modals/DataTypeModal.svelte';
  import SendDataModal from '$lib/components/request/modals/SendDataModal.svelte';
  import Modal from '$lib/components/Modal.svelte';
  import HelpInfoPopup from '$lib/components/HelpInfoPopup.svelte';

  import { UploadStatus } from '$lib/models/DataRequest';
  import {
    queryId,
    queryError,
    metadata,
    approved,
    error,
    dataType,
    sites,
    selectedSite,
    status,
    reset,
    refreshStatus,
    loadSites,
    loadSubscriptions,
    unloadSubscribers,
    unsubscribers,
  } from '$lib/stores/DataRequest';

  // Steps
  let search = $derived({
    show: true,
    active: $queryError || (!$queryId && !$approved),
  });
  let review = $derived({
    show: !$queryError && !!$queryId,
    active: !$queryError && !!$queryId && !$approved,
    leadPi: ($metadata?.resultMetadata.queryJson.query as any)?.requesterEmail || 'Unknown',
  });
  let share = $derived({
    show: !$queryError && !!$queryId && !!$approved,
    active: !$queryError && !!$queryId && !!$approved,
  });
  let sendEnabled = $derived(
    ($dataType.genomic && $status?.genomic === UploadStatus.Unsent) ||
      ($dataType.phenotypic && $status?.phenotypic === UploadStatus.Unsent),
  );
  let modalOpen = $state({
    summary: false,
    location: false,
    type: false,
  });

  // Status icons
  function statusIcon(status: UploadStatus) {
    return (
      [
        {
          progress: [UploadStatus.Uploaded],
          icon: 'fa-regular fa-circle-check text-success-600-400',
          label: 'Upload Successful',
        },
        {
          progress: [UploadStatus.Queued, UploadStatus.Querying, UploadStatus.Uploading],
          icon: 'fa-regular fa-paper-plane text-tertiary-600-400',
          label: 'Uploading...',
        },
        {
          progress: [UploadStatus.Error, UploadStatus.Unknown],
          icon: 'fa-solid fa-circle-xmark text-error-600-400',
          label: 'Upload Failed',
        },
      ].find(({ progress }) => progress.includes(status)) || {
        icon: 'fa-regular fa-circle-xmark text-primary-600-400',
        label: 'Unsent',
      }
    );
  }
  let statusInfo = $derived({
    genomic: statusIcon($status?.genomic || UploadStatus.Unsent),
    phenotypic: statusIcon($status?.phenotypic || UploadStatus.Unsent),
  });

  onMount(() => {
    loadSubscriptions();
    unsubscribers.push(
      error.subscribe((error) => {
        if (error) {
          toaster.error({ title: error });
        }
      }),
    );
    loadSites();

    // Unmount
    return () => {
      reset();
      unloadSubscribers();
    };
  });

  let datasetId: string = $state('');
  $effect(() => {
    console.log('UploadStatus: ', $status);
    console.log('SelectedSite: ', $selectedSite);
  });
</script>

<svelte:head>
  <title>{branding.applicationName} | Data Requests</title>
</svelte:head>
<!-- 002c990a-2441-4454-86cd-71b4fe34fbcf -->
<Content title="Data Requests">
  <Step step={1} title="Search for Dataset Request ID" active={search.active} showLine>
    <div class="flex flex-col items-center gap-3 mt-2 p-4 rounded bg-surface-100">
      <p>This should have some text about what this id is and what it is used for, how to find it, etc.</p>
      <div class="flex flex-row items-start gap-3">
        <label class="label required flex flex-row items-center w-fit" for="dataset-id">
          <span class="mr-2 font-bold">Dataset ID:</span>
          <input
            id="dataset-id"
            class="input bg-surface-50 w-[375px]"
            placeholder="001234567-89ab-cdef-fedc-98765432100"
            bind:value={datasetId}
            pattern={uuidInput}
            disabled={!search.active}
            required
          />
        </label>
        <button
          type="button"
          class="btn preset-filled-primary-500"
          disabled={!search.active || !datasetId.trim()}
          data-testid="search-dataset-btn"
          onclick={() => ($queryId = datasetId)}
        >
          <span>Search</span>
        </button>
      </div>
    </div>
  </Step>
  <Step step={2} title="Review Dataset Request" show={review.show} active={review.active}>
    <div class="p-4 rounded bg-surface-100">
      <Grid columns={2}>
        <GridCell title="View Dataset Information">
          <div class="flex flex-row gap-2 mb-2">
            <label class="label flex flex-row items-center gap-2" for="lead-pi">
              <span class="font-bold">Lead PI:</span>
              <span>{review.leadPi}</span>
            </label>
          </div>
          <Modal
            title="Data Request Summary"
            data-testid="data-request"
            open={modalOpen.summary}
            withDefault={false}
          >
            {#snippet trigger()}
              <button type="button" data-testid="data-request-summary-btn" class="btn preset-filled-primary-500">
                <span>View Data Request Summary</span>
              </button>
            {/snippet}
            <DataSummary />
          </Modal>
        </GridCell>
        <GridCell title="Data Request Approval">
          <label class="flex flex-col items-center gap-2">
            <div>Date approved by {$sites?.homeDisplay} SDAC</div>
            <input
              class="input bg-surface-50 w-48 mt-1"
              data-testid="data-approved-date"
              type="date"
              bind:value={$approved}
              disabled={!review.active}
            />
          </label>
        </GridCell>
      </Grid>
    </div>
  </Step>
  <Step step={3} title="Share Patient-Level Data" show={share.show} active={share.active} complete={statusInfo.phenotypic.label === UploadStatus.Uploaded || statusInfo.genomic.label === UploadStatus.Uploaded} isFinal={true}>
    <div class="p-4 rounded bg-surface-100">
      <Grid columns={3}>
        <GridCell title="Data Storage Location">
          {#snippet help()}
            <HelpInfoPopup text="Data Storage Location" id="data-loc-modal">
              <DataLocModal />
            </HelpInfoPopup>
          {/snippet}
          <select
            id="selected-site"
            data-testid="selected-site"
            class="select bg-surface-50"
            bind:value={$selectedSite}
            disabled={!!$status?.site}
            required
          >
            <option value="" disabled selected>Select a site</option>
            {#each $sites?.sites || [] as site}
              <option value={site}>{site}</option>
            {/each}
          </select>
        </GridCell>
        <GridCell title="Select & Send Data">
          {#snippet help()}
            <Modal
              title="Data Types"
              data-testid="data-type-modal"
              open={modalOpen.type}
              withDefault={false}
            >
              {#snippet trigger()}
                <i class="fa-regular fa-circle-question fa-sm text-primary-500"></i>
              {/snippet}
              <DataTypeModal />
            </Modal>
          {/snippet}
          <label class="flex items-center space-x-2 my-2">
            <input
              type="checkbox"
              data-testid="data-pheno-checkbox"
              class="checkbox flex-none"
              disabled={$status?.phenotypic !== UploadStatus.Unsent}
              bind:checked={$dataType.phenotypic}
            />
            <div>Phenotypic Data</div>
          </label>
          <label class="flex space-x-2 my-2 align-top">
            <input
              type="checkbox"
              data-testid="data-geno-checkbox"
              class="checkbox flex-none"
              disabled={$status?.genomic !== UploadStatus.Unsent}
              bind:checked={$dataType.genomic}
            />
            <div class="text-left flex-auto">Annotated variant data for selected genes</div>
          </label>
          <SendDataModal {sendEnabled} />
        </GridCell>
        <GridCell title="Status">
          {#snippet help()}
            <button
              type="button"
              data-testid="status-refresh-btn"
              title="Refresh"
              class="text-primary-500 disabled:text-secondary-500"
              onclick={refreshStatus}
            >
              <i class="fa-solid fa-arrows-rotate fa-sm"></i>
              <span class="sr-only">Refresh</span>
            </button>
          {/snippet}
          <div class="flex space-x-2 my-2 align-top">
            <i class={`${statusInfo.phenotypic.icon} flex-none`}></i>
            <div class="text-left flex-auto">
              Phenotypic Data: <span data-testid="status-pheno">{statusInfo.phenotypic.label}</span>
            </div>
          </div>
          <div class="flex space-x-2 my-2 align-top">
            <i class={`${statusInfo.genomic.icon} flex-none`}></i>
            <div class="text-left flex-auto">
              Annotated variant data for selected genes: <span data-testid="status-geno"
                >{statusInfo.genomic.label}</span
              >
            </div>
          </div>
        </GridCell>
      </Grid>
    </div>
  </Step>
  <div class="flex justify-end mt-4">
    <button
      type="button"
      data-testid="reset-btn"
      class="btn preset-tonal-secondary border border-secondary-500 mx-4"
      onclick={reset}
      disabled={!review.show && !share.show}
    >
      Reset
    </button>
  </div>
</Content>

<style>
  #selected-site:invalid,
  #selected-site option[value='']:checked {
    color: var(--color-gray-500);
  }

  #selected-site option:not([value='']) {
    color: inherit;
  }
</style>
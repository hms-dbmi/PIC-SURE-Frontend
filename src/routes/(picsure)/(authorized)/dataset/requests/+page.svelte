<script lang="ts">
  import { onMount } from 'svelte';

  import { branding } from '$lib/configuration';
  import { uuidInput, debounce } from '$lib/utilities/Forms';
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

  import { UploadStatus } from '$lib/models/DataRequest';
  import {
    queryId,
    queryError,
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
</script>

<svelte:head>
  <title>{branding.applicationName} | Data Requests</title>
</svelte:head>

<Content title="Data Requests">
  <Step step={1} title="Search for Dataset Request ID" inline active={search.active}>
    <label class="inline label required">
      <span class="sr-only">Dataset Id:</span>
      <input
        class="input w-3/4"
        placeholder="001234567-89ab-cdef-fedc-98765432100"
        bind:value={datasetId}
        onkeyup={debounce(() => ($queryId = datasetId), 500)}
        pattern={uuidInput}
        disabled={!search.active}
      />
    </label>
  </Step>
  <Step step={2} title="Review Dataset Request" show={review.show} active={review.active}>
    <Grid columns={2}>
      <GridCell title="View Dataset Information">
        <div>
          <Modal
            title="Data Request Summary"
            data-testid="data-request"
            open={modalOpen.summary}
            withDefault={false}
          >
            {#snippet trigger()}
              <i class="fa-regular fa-2xl fa-file-pdf"></i>
              <span>Data Request Summary</span>
            {/snippet}
            <DataSummary />
          </Modal>
        </div>
      </GridCell>
      <GridCell title="Data Request Approval">
        <label>
          <div>Date approved by {$sites?.homeDisplay} SDAC</div>
          <input
            class="input w-48 mt-1"
            data-testid="data-approved-date"
            type="date"
            bind:value={$approved}
            disabled={!review.active}
          />
        </label>
      </GridCell>
    </Grid>
  </Step>
  <Step step={3} title="Share Patient-Level Data" show={share.show} active={share.active}>
    <Grid columns={3}>
      <GridCell title="Data Storage Location">
        {#snippet help()}
          <Modal
            title="Data Storage Location"
            data-testid="data-loc-modal"
            open={modalOpen.location}
            withDefault={false}
          >
            {#snippet trigger()}
              <i class="fa-regular fa-circle-question fa-sm text-primary-500"></i>
            {/snippet}
            <DataLocModal />
          </Modal>
        {/snippet}
        <select
          data-testid="selected-site"
          class="select"
          bind:value={$selectedSite}
          disabled={!!$status?.site}
        >
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
  </Step>
  {#if review.show || share.show}
    <button
      type="button"
      data-testid="reset-btn"
      class="btn preset-tonal-secondary border border-secondary-500 float-right"
      onclick={reset}>Reset</button
    >
  {/if}
</Content>

<script lang="ts">
  import { onMount } from 'svelte';
  import { config } from '$lib/configuration.svelte';
  import { uuidInput } from '$lib/utilities/Forms';
  import type { QueryInterfaceV2 } from '$lib/models/query/Query';
  import { type Status, type Metadata, type DataType, UploadStatus } from '$lib/models/DataRequest';
  import {
    searchForDataset,
    getDatasetStatus,
    approveDataset,
    sendData,
    loadSites,
    sites,
  } from '$lib/services/datarequest';

  import Content from '$lib/components/Content.svelte';
  import DataSummary from '$lib/components/request/modals/DataSummary.svelte';
  import DataLocModal from '$lib/components/request/modals/DataLocModal.svelte';
  import DataTypeModal from '$lib/components/request/modals/DataTypeModal.svelte';
  import Grid from '$lib/components/request/Grid.svelte';
  import GridCell from '$lib/components/request/GridCell.svelte';
  import HelpInfoPopup from '$lib/components/HelpInfoPopup.svelte';
  import Loading from '$lib/components/Loading.svelte';
  import Modal from '$lib/components/Modal.svelte';
  import StatusIndicator from '$lib/components/request/StatusIndicator.svelte';
  import SendDataModal from '$lib/components/request/modals/SendDataModal.svelte';
  import Step from '$lib/components/steppers/vertical/Step.svelte';

  let datasetId: string = $state('');
  let metadata: Metadata | undefined = $state(undefined);
  let query: QueryInterfaceV2 | undefined = $state(undefined);
  let approved: string | null = $state(null); // As a date string
  let requesterEmail: string | undefined = $state(undefined);
  let datasetStorageLocation: string | undefined = $state(undefined);
  let errorFromSearch: string | undefined = $state(undefined);
  let errorFromApprove: string | undefined = $state(undefined);
  let selectedSite: string | undefined = $state(undefined);
  let searched: boolean = $state(false);
  let isDataSent: boolean = $state(false);
  let isRefreshing: boolean = $state(false);
  let isComplete: boolean = $state(false);
  let statusPromise: Promise<Status> | null = $state(null);
  let updatedStatus: Promise<Status> | null = $state(null);
  let dataType: DataType = $state({
    genomic: false,
    phenotypic: false,
    patient: false,
  });
  let sentSelections: { site: string | undefined; dataType: DataType } | null = $state(null);
  const summaryModalOpen = $state(false);
  let isSearchActive = $derived(errorFromSearch || !searched);
  let isReviewActive = $derived(approved === null);
  let showStep2 = $derived(!!datasetId && metadata !== undefined);
  let enableCheckboxes = $derived(selectedSite !== undefined && selectedSite !== '');
  let sendEnabled = $derived(
    enableCheckboxes &&
      (dataType.phenotypic || dataType.genomic || dataType.patient) &&
      !isDataSent,
  );

  function updateStateFromInitialStatus(status: Status) {
    if (status) {
      dataType = {
        genomic: status.genomic !== undefined && status.genomic !== UploadStatus.Unsent,
        phenotypic: status.phenotypic !== undefined && status.phenotypic !== UploadStatus.Unsent,
        patient: status.patient !== undefined && status.patient !== UploadStatus.Unsent,
      };
      if (
        (status.genomic !== undefined && status.genomic !== UploadStatus.Unsent) ||
        (status.phenotypic !== undefined && status.phenotypic !== UploadStatus.Unsent) ||
        (status.patient !== undefined && status.patient !== UploadStatus.Unsent)
      ) {
        isDataSent = true;
      }
      statusPromise = Promise.resolve(status);
      approved = status.approved;
      selectedSite = status.site;
    }
  }

  async function search() {
    approved = null;
    errorFromSearch = undefined;
    searched = true;
    try {
      statusPromise = getDatasetStatus(datasetId).then((status) => {
        updateStateFromInitialStatus(status);
        return status;
      });
    } catch (error) {
      errorFromSearch = `Error searching for dataset: ${error instanceof Error ? error.message : 'Unknown error'}`;
      return;
    }

    try {
      metadata = await searchForDataset(datasetId);
      if (!metadata || !metadata.resultMetadata || !metadata.resultMetadata.queryJson) {
        errorFromSearch =
          "We couldn't find any matching results. Please check to ensure the information you have entered is correct or try searching for a different Dataset Request ID.";
        return;
      }
      if (metadata.resultMetadata.queryJson) {
        query = metadata.resultMetadata.queryJson.query as QueryInterfaceV2;
        requesterEmail = metadata.resultMetadata.queryJson.requesterEmail;
        datasetStorageLocation = metadata.resultMetadata.queryJson.commonAreaUUID;
      }
    } catch (error) {
      errorFromSearch = `Error searching for dataset metadata: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
    return {
      approved,
      metadata,
      requesterEmail,
    };
  }

  function refreshStatus() {
    isRefreshing = true;

    const minSpinTime = new Promise((resolve) => setTimeout(resolve, 800));

    updatedStatus = Promise.all([getDatasetStatus(datasetId), minSpinTime])
      .then(([status]) => {
        statusPromise = updatedStatus; // Makes status refreshable
        return status;
      })
      .catch((error) => {
        console.error('Failed to refresh status:', error);
        throw error;
      })
      .finally(() => {
        isRefreshing = false;
        updatedStatus = null;
      });
  }

  async function approve() {
    errorFromApprove = undefined;
    try {
      if (approved) {
        return approveDataset(datasetId, approved);
      }
    } catch (error) {
      errorFromApprove = `Error approving dataset: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  async function handleSendData() {
    if (!query) {
      console.error('No query available for sending data');
      return;
    }

    const dataTypesToSend: string[] = Object.entries(dataType)
      .filter(([, value]) => value)
      .map(([key]) => key.charAt(0).toUpperCase() + key.slice(1));

    updatedStatus = (async () => {
      let finalStatus: Status | null = null;
      for (const type of dataTypesToSend) {
        try {
          finalStatus = await sendData(query, selectedSite || '', type, datasetId || '');
        } catch (error) {
          console.error('Failed to send data type:', type, error);
          throw error;
        }
      }
      // Save the selections that were used for sending data
      sentSelections = {
        site: selectedSite,
        dataType: { ...dataType },
      };
      isDataSent = true;
      statusPromise = updatedStatus; // Makes status refreshable
      return finalStatus;
    })();
  }

  function reset() {
    searched = false;
    datasetId = '';
    approved = null;
    metadata = undefined;
    requesterEmail = undefined;
    selectedSite = undefined;
    dataType = {
      genomic: false,
      phenotypic: false,
      patient: false,
    };
    isDataSent = false;
    isComplete = false;
    statusPromise = null;
    isRefreshing = false;
    isReviewActive = false;
    isSearchActive = true;
    errorFromSearch = undefined;
    errorFromApprove = undefined;
    sentSelections = null;
  }

  $effect(() => {
    if (!statusPromise) {
      isComplete = false;
      return;
    }

    statusPromise
      .then((status) => {
        const selectedDataTypes = Object.entries(dataType)
          .filter(([, value]) => value)
          .map(([key]) => key as keyof Status);

        isComplete =
          !!status &&
          selectedDataTypes.length > 0 &&
          selectedDataTypes.every((type) => {
            const uploadStatus = status[type];
            return uploadStatus === UploadStatus.Uploaded || uploadStatus === UploadStatus.Error;
          });
      })
      .catch(() => {
        isComplete = false;
      });
  });

  $effect(() => {
    if (isDataSent && sentSelections) {
      const selectionsChanged =
        selectedSite !== sentSelections.site ||
        dataType.genomic !== sentSelections.dataType.genomic ||
        dataType.phenotypic !== sentSelections.dataType.phenotypic ||
        dataType.patient !== sentSelections.dataType.patient;

      if (selectionsChanged) {
        isDataSent = false;
      }
    }
  });

  onMount(async () => {
    await loadSites();
  });
</script>

<svelte:head>
  <title>{config.branding.applicationName} | Data Requests</title>
</svelte:head>

<Content title="Data Requests">
  <Step step={1} title="Search for Dataset ID" active={isSearchActive} showLine>
    <div class="flex flex-col items-center gap-3 mt-2 p-4 rounded bg-surface-100">
      <p>
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html config.branding.datasetRequestPage.searchIntro ||
          'Search for a dataset request ID to continue.'}
      </p>
      <div class="flex flex-row items-start gap-3">
        <label class="label required flex flex-row items-center w-fit" for="dataset-id">
          <span class="mr-2 font-bold">Dataset ID:</span>
          <input
            id="dataset-id"
            class="input bg-surface-50 w-[375px]"
            placeholder="001234567-89ab-cdef-fedc-98765432100"
            bind:value={datasetId}
            pattern={uuidInput}
            disabled={!isSearchActive}
            required
          />
        </label>
        <button
          type="button"
          class="btn preset-filled-primary-500"
          disabled={!isSearchActive || !datasetId.trim()}
          data-testid="search-dataset-btn"
          onclick={search}
        >
          <span>Search</span>
        </button>
      </div>
      {#if errorFromSearch}
        <div class="flex flex-row items-center gap-3">
          <p class="text-error-500" data-testid="error-from-search">{errorFromSearch}</p>
        </div>
      {/if}
    </div>
  </Step>
  <Step step={2} title="Review Dataset Request" show={showStep2} active={isReviewActive}>
    <div class="p-4 rounded bg-surface-100">
      <Grid columns={2}>
        <GridCell title="View Dataset Information">
          <div class="flex flex-row gap-2 mb-2">
            <label class="label flex flex-row items-center gap-2" for="requester">
              <span class="font-bold">Requester:</span>
              <span>{requesterEmail}</span>
            </label>
          </div>
          <div class="flex flex-row gap-2 mb-2">
            <label class="label" for="storage-location">
              <span class="font-bold">Storage Location:</span>
              <span>{datasetStorageLocation}</span>
            </label>
          </div>
          <Modal
            title="Data Request Summary"
            data-testid="data-request"
            open={summaryModalOpen}
            withDefault={false}
          >
            {#snippet trigger()}
              <button
                type="button"
                data-testid="data-request-summary-btn"
                class="btn preset-filled-primary-500"
              >
                <span>View Data Request Summary</span>
              </button>
            {/snippet}
            <DataSummary {metadata} />
          </Modal>
        </GridCell>
        <GridCell title="Data Request Approval">
          <label class="flex flex-col items-center gap-2">
            <div>Date approved by {$sites?.homeDisplay} SDAC</div>
            <input
              class="input bg-surface-50 w-48 mt-1"
              data-testid="data-approved-date"
              type="date"
              bind:value={approved}
              oninput={approve}
            />
          </label>
        </GridCell>
      </Grid>
      {#if errorFromApprove}
        <div class="flex flex-row items-center gap-3">
          <p class="text-error-500" data-testid="error-from-approve">{errorFromApprove}</p>
        </div>
      {/if}
    </div>
  </Step>
  <Step
    step={3}
    title="Share Patient-Level Data"
    show={showStep2 && approved !== null}
    active={true}
    complete={isComplete}
    isFinal={true}
  >
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
            style="background-color: white;"
            aria-label="Select a site"
            bind:value={selectedSite}
            disabled={isDataSent}
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
            <HelpInfoPopup text="Data Types" id="data-type-modal">
              <DataTypeModal />
            </HelpInfoPopup>
          {/snippet}
          <label class="flex items-center space-x-2 my-2">
            <input
              type="checkbox"
              data-testid="data-pheno-checkbox"
              class="checkbox flex-none"
              disabled={!enableCheckboxes}
              bind:checked={dataType.phenotypic}
            />
            <div>Phenotypic Data</div>
          </label>
          <label class="flex space-x-2 my-2 align-top">
            <input
              type="checkbox"
              data-testid="data-geno-checkbox"
              class="checkbox flex-none"
              disabled={!enableCheckboxes}
              bind:checked={dataType.genomic}
            />
            <div class="text-left flex-auto">Annotated variant data for selected genes</div>
          </label>
          <label class="flex space-x-2 my-2 align-top">
            <input
              type="checkbox"
              data-testid="data-patient-checkbox"
              class="checkbox flex-none"
              disabled={!enableCheckboxes}
              bind:checked={dataType.patient}
            />
            <div class="text-left flex-auto">List of involved patients</div>
          </label>
          <SendDataModal {sendEnabled} onConfirm={handleSendData} />
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
              <i class="fa-solid fa-arrows-rotate fa-sm" class:spinning={isRefreshing}></i>
              <span class="sr-only">Refresh</span>
            </button>
          {/snippet}
          {#await statusPromise}
            <Loading ring />
          {:then statusInfo}
            <div class="flex flex-col gap-2 text-left">
              <StatusIndicator status={statusInfo?.phenotypic} label="Phenotypic Data" />
              <StatusIndicator
                status={statusInfo?.genomic}
                label="Annotated variant data for selected genes"
              />
              <StatusIndicator status={statusInfo?.patient} label="List of involved patients" />
            </div>
          {:catch}
            <div class="text-error-500">Failed to load status</div>
          {/await}
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
      disabled={!datasetId?.trim()}
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

  .spinning {
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(-180deg);
    }
  }
</style>

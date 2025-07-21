<script lang="ts">
  import { onMount } from 'svelte';
  import { branding } from '$lib/configuration';
  import { uuidInput } from '$lib/utilities/Forms';
  import type { QueryInterface } from '$lib/models/query/Query';
  import { type Status, type Metadata, type DataType } from '$lib/models/DataRequest';
  import { searchForDataset, getDatasetStatus, approveDataset, loadSites, sites } from '$lib/services/datarequest';

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
  let query: QueryInterface | undefined = $state(undefined);
  let approved: string | null = $state(null); // As a date string
  let requesterEmail: string | undefined = $state(undefined);
  let selectedSite: string | undefined = $state(undefined);
  let initialStatus: Status | undefined = $state(undefined);
  let isDataSent: boolean = $state(false);
  let isComplete: boolean = $state(false);
  let isRefreshing = $state(false);
  let refreshPromise: Promise<Status> | null = $state(null);
  let dataType: DataType = $state({
    genomic: false,
    phenotypic: false,
    patient: false,
  });
  const summaryModalOpen = $state(false);
    
  let isSearchActive = $derived(!datasetId || datasetId.trim() === '');
  let isReviewActive = $derived(approved === null);
  let enableCheckboxes = $derived(selectedSite !== undefined && selectedSite !== '');
  let sendEnabled = $derived(enableCheckboxes && (dataType.phenotypic || dataType.genomic || dataType.patient));
  
  async function search() {
    initialStatus = await getDatasetStatus(datasetId);
    if (initialStatus && initialStatus.approved) {
      approved = initialStatus.approved;
    }
    metadata = await searchForDataset(datasetId);
    if (metadata && metadata.resultMetadata) {
      if (metadata.resultMetadata.queryJson) {
        query = metadata.resultMetadata.queryJson.query as QueryInterface;
        requesterEmail = metadata.resultMetadata.queryJson.requesterEmail;
      }
    }
    return {
      approved,
      metadata,
      requesterEmail,
    };
  }

  function refreshStatus() {
    isRefreshing = true;
    setTimeout(() => {
      isRefreshing = false;
    }, 1000);
    try {
      refreshPromise = getDatasetStatus(datasetId);
      refreshPromise.then((status) => {
      if (status) {
        initialStatus = status;
        }
        return status;
      });
    } catch (error) {
      console.error(error);
    }
  }

  async function approve() {
    if (approved) {
      return approveDataset(datasetId, approved);
    }
  }

  function reset() {
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
  }

  onMount(async () => {
    await loadSites();
  });
</script>

<svelte:head>
  <title>{branding.applicationName} | Data Requests</title>
</svelte:head>
<!-- 094698d8-2c94-4435-8a99-c014ae34c595 -->
<Content title="Data Requests">
  <Step step={1} title="Search for Dataset Request ID" active={isSearchActive} showLine>
    <div class="flex flex-col items-center gap-3 mt-2 p-4 rounded bg-surface-100">
      <p>
        This should have some text about what this id is and what it is used for, how to find it,
        etc.
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
          disabled={isSearchActive || !datasetId.trim()}
          data-testid="search-dataset-btn"
          onclick={search}
        >
          <span>Search</span>
        </button>
      </div>
    </div>
  </Step>
  <Step step={2} title="Review Dataset Request" show={!!datasetId && metadata !== undefined} active={isReviewActive}>
    <div class="p-4 rounded bg-surface-100">
      <Grid columns={2}>
        <GridCell title="View Dataset Information">
          <div class="flex flex-row gap-2 mb-2">
            <label class="label flex flex-row items-center gap-2" for="requester">
              <span class="font-bold">Requester:</span>
              <span>{requesterEmail}</span>
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
    </div>
  </Step>
  <Step
    step={3}
    title="Share Patient-Level Data"
    show={approved !== null}
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
            class="select bg-surface-50"
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
          <SendDataModal {sendEnabled} {query} {selectedSite} {dataType} {datasetId} status={initialStatus} />
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
          {#await refreshPromise}
            <Loading ring />
          {:then statusInfo}
            <div class="flex space-x-2 my-2 align-top">
              <StatusIndicator
                status={statusInfo?.phenotypic}
                label="Phenotypic Data"
              />
            </div>
            <div class="flex space-x-2 my-2 align-top">
              <StatusIndicator
                status={statusInfo?.genomic}
                label="Annotated variant data for selected genes"
              />
            </div>
            <div class="flex space-x-2 my-2 align-top">
              <StatusIndicator
                status={statusInfo?.patient}
                label="List of involved patients"
              />
            </div>
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

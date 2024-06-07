<script lang="ts">
  import { onMount } from 'svelte';
  import { getModalStore, getToastStore } from '@skeletonlabs/skeleton';
  const modalStore = getModalStore();
  const toastStore = getToastStore();

  import { browser } from '$app/environment';

  import { branding } from '$lib/configuration';
  import { uuidInput } from '$lib/utilities/Validation';
  import Content from '$lib/components/Content.svelte';
  import Step from '$lib/components/steppers/vertical/Step.svelte';
  import Grid from '$lib/components/request/Grid.svelte';
  import GridCell from '$lib/components/request/GridCell.svelte';

  import DataTypeModal from '$lib/components/request/modals/DataTypeModal.svelte';
  import SendDataModal from '$lib/components/request/modals/SendDataModal.svelte';
  import DataLocModal from '$lib/components/request/modals/DataLocModal.svelte';
  import DataSummary from '$lib/components/request/modals/DataSummary.svelte';

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
    sendData,
    refreshStatus,
    loadSites,
    metadata,
    loadSubscriptions,
    unloadSubscribers,
    unsubscribers,
  } from '$lib/stores/DataRequest';

  // Steps
  $: search = {
    show: true,
    active: $queryError || (!$queryId && !$approved),
  };
  $: review = {
    show: !$queryError && !!$queryId,
    active: !$queryError && !!$queryId && !$approved,
  };
  $: share = {
    show: !$queryError && !!$queryId && !!$approved,
    active: !$queryError && !!$queryId && !!$approved,
  };
  $: sendEnabled =
    ($dataType.genomic && $status?.genomic === UploadStatus.Unsent) ||
    ($dataType.phenotypic && $status?.phenotypic === UploadStatus.Unsent);

  // Status icons
  function statusIcon(status: UploadStatus) {
    return (
      [
        {
          progress: [UploadStatus.Uploaded],
          icon: 'fa-regular fa-circle-check text-success-500-400-token',
          label: 'Upload Successful',
        },
        {
          progress: [UploadStatus.Queued, UploadStatus.Querying, UploadStatus.Uploading],
          icon: 'fa-regular fa-paper-plane text-tertiary-500-400-token',
          label: 'Uploading...',
        },
        {
          progress: [UploadStatus.Error, UploadStatus.Unknown],
          icon: 'fa-solid fa-circle-xmark text-error-500-400-token',
          label: 'Upload Failed',
        },
      ].find(({ progress }) => progress.includes(status)) || {
        icon: 'fa-regular fa-circle-xmark text-primary-500-400-token',
        label: 'Unsent',
      }
    );
  }
  $: statusInfo = {
    genomic: statusIcon($status?.genomic || UploadStatus.Unsent),
    phenotypic: statusIcon($status?.phenotypic || UploadStatus.Unsent),
  };

  // Modals
  function dataSummaryModal() {
    modalStore.trigger({
      type: 'component',
      title: 'Data Request Summary',
      component: 'modalWrapper',
      meta: {
        component: DataSummary,
        queryId: $metadata?.picsureResultId || '',
        query: $metadata?.resultMetadata.queryJson.query || {},
      },
    });
  }

  function dataLocationModal() {
    modalStore.trigger({
      type: 'component',
      title: 'Data Storage Location',
      component: 'modalWrapper',
      meta: { component: DataLocModal },
    });
  }

  function dataTypeModal() {
    modalStore.trigger({
      type: 'component',
      title: 'Data Types',
      component: 'modalWrapper',
      meta: { component: DataTypeModal },
    });
  }

  async function sendDataModal() {
    let prompt = true;
    if (browser) {
      const savedPrompt = localStorage.getItem('dataRequest-sendData-displayPrompt') || 'yes';
      prompt = savedPrompt !== 'no';
    }
    if (prompt) {
      modalStore.trigger({
        type: 'component',
        title: '',
        modalClasses: 'w-96',
        component: 'modalWrapper',
        meta: { component: SendDataModal, sendData },
      });
    } else {
      await sendData();
    }
  }

  onMount(() => {
    loadSubscriptions();
    unsubscribers.push(
      error.subscribe((error) => {
        if (error) {
          toastStore.trigger({
            message: error,
            background: 'variant-filled-error',
          });
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
</script>

<svelte:head>
  <title>{branding.applicationName} | Data Requests</title>
</svelte:head>

<Content title="Data Requests">
  <Step step={1} title="Search for Dataset Request ID" inline={true} active={search.active}>
    <label class="inline label required">
      <span class="sr-only">Dataset Id:</span>
      <input
        class="input w-3/4"
        placeholder="001234567-89ab-cdef-fedc-98765432100"
        bind:value={$queryId}
        pattern={uuidInput}
        disabled={!search.active}
      />
    </label>
  </Step>
  <Step step={2} title="Review Dataset Request" show={review.show} active={review.active}>
    <Grid columns={2}>
      <GridCell title="View Dataset Information">
        <div>
          <button
            data-testid="data-request-btn"
            class="text-primary-700-200-token hover:text-secondary-700-200-token inline-block mt-4"
            on:click={dataSummaryModal}
          >
            <i class="fa-regular fa-2xl fa-file-pdf"></i>
            <span>Data Request Summary</span>
          </button>
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
        <svelte:fragment slot="help">
          <button data-testid="data-loc-modal-btn" on:click={dataLocationModal}>
            <i class="fa-regular fa-circle-question fa-sm text-primary-500"></i>
          </button>
        </svelte:fragment>
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
      <GridCell title="Select &amp; Send Data">
        <svelte:fragment slot="help">
          <button data-testid="data-type-modal-btn" on:click={dataTypeModal}>
            <i class="fa-regular fa-circle-question fa-sm text-primary-500"></i>
          </button>
        </svelte:fragment>
        <label class="flex items-center space-x-2 my-2">
          <input
            type="checkbox"
            data-testid="data-pheno-checkbox"
            class="checkbox flex-none"
            disabled={$status?.phenotypic !== UploadStatus.Unsent}
            bind:checked={$dataType.phenotypic}
          />
          <p>Phenotypic Data</p>
        </label>
        <label class="flex space-x-2 my-2 align-top">
          <input
            type="checkbox"
            data-testid="data-geno-checkbox"
            class="checkbox flex-none"
            disabled={$status?.genomic !== UploadStatus.Unsent}
            bind:checked={$dataType.genomic}
          />
          <p class="text-left flex-auto">Annotated variant data for selected genes</p>
        </label>
        <button
          type="button"
          data-testid="send-data-btn"
          class="btn variant-ringed-success hover:variant-ghost-success"
          disabled={!sendEnabled}
          on:click={sendDataModal}>Send Data</button
        >
      </GridCell>
      <GridCell title="Status">
        <svelte:fragment slot="help">
          <button
            type="button"
            data-testid="status-refresh-btn"
            title="Refresh"
            class="text-primary-500 disabled:text-secondary-500"
            on:click={refreshStatus}
          >
            <i class="fa-solid fa-arrows-rotate fa-sm"></i>
            <span class="sr-only">Refresh</span>
          </button>
        </svelte:fragment>
        <div class="flex space-x-2 my-2 align-top">
          <i class={`${statusInfo.phenotypic.icon} flex-none`}></i>
          <p class="text-left flex-auto">
            Phenotypic Data: <span data-testid="status-pheno">{statusInfo.phenotypic.label}</span>
          </p>
        </div>
        <div class="flex space-x-2 my-2 align-top">
          <i class={`${statusInfo.genomic.icon} flex-none`}></i>
          <p class="text-left flex-auto">
            Annotated variant data for selected genes: <span data-testid="status-geno"
              >{statusInfo.genomic.label}</span
            >
          </p>
        </div>
      </GridCell>
    </Grid>
  </Step>
  {#if review.show || share.show}
    <button
      type="button"
      data-testid="reset-btn"
      class="btn variant-ghost-secondary float-right"
      on:click={reset}>Reset</button
    >
  {/if}
</Content>

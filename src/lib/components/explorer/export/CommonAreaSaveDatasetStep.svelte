<script lang="ts">
  import { onMount } from 'svelte';
  import type { QueryRequestInterface } from '$lib/models/api/Request';
  import { executeFederatedQuery } from '$lib/services/useFederatedQueryState.svelte';
  import Summary from './Summary.svelte';
  import Loading from '$lib/components/Loading.svelte';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';

  interface Props {
    query: QueryRequestInterface;
    datasetId: string;
    datasetNameInput: string;
    saveable: boolean;
  }

  let {
    query,
    datasetId = $bindable(),
    datasetNameInput = $bindable(),
    saveable = $bindable(),
  }: Props = $props();

  let isLoading = $state(true);
  let error = $state<string | null>(null);

  onMount(async () => {
    try {
      const result = await executeFederatedQuery(query);
      datasetId = result.datasetId;
      saveable = true;
      isLoading = false;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to execute federated query';
      isLoading = false;
      console.error('Federated query error:', err);
    }
  });
</script>

<section class="flex flex-col w-full h-full items-center">
  <Summary />

  {#if isLoading}
    <Loading ring size="medium" label="Preparing datasets..." />
  {:else if error}
    <ErrorAlert title="Failed to prepare federated query">
      {error}
    </ErrorAlert>
  {:else}
    <div class="w-full h-full m-2 card p-4">
      <header class="card-header">
        Common Area Save the information in your final data export by clicking the Save Dataset ID
        button. Navigate to the <a class="anchor" href="/dataset">Manage Datasets page</a> to view or
        manage your Dataset IDs.
      </header>
      <hr />
      <div class="card-body p-4 flex flex-col justify-center items-center">
        <div>
          <div class="flex items-center m-2">
            <label for="dataset-name" class="font-bold mr-2">Dataset Name:</label>
            <input
              type="text"
              id="dataset-name"
              class="input w-80"
              placeholder="Enter a name"
              bind:value={datasetNameInput}
              required
            />
          </div>
          <div class="flex items-center m-2">
            <div class="flex items-center">
              <label for="dataset-id" class="font-bold mr-2">Dataset ID:</label>
              {#if !datasetId}
                <Loading ring size="micro" label="Generating ID..." />
              {:else}
                <div id="dataset-id" class="mr-4">{datasetId}</div>
              {/if}
            </div>
          </div>
        </div>
      </div>
    </div>
  {/if}
</section>

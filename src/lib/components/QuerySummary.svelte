<script lang="ts">
  import type { Query } from '$lib/models/query/Query';
  import Modal from '$lib/components/Modal.svelte';
  import { toaster } from '$lib/toaster';
  interface Props {
    query?: Query;
  }

  let { query }: Props = $props();

  let modalOpen = $state(false);

  async function loadQuery() {
    if (query) {
      sessionStorage.removeItem('filters');
      sessionStorage.setItem('filters', JSON.stringify(query));
      toaster.success({
        title: 'Query loaded',
        description: 'All filters and variables have been replaced with the query.',
      });
    } else {
      toaster.error({
        title: 'No query to load',
        description: 'Please save a query to load it.',
      });
    }
  }
</script>

<section id="detail-filters-container" class="m-3">
  <p class="font-bold text-left my-1">Filters Applied</p>
  <ul data-testid="dataset-summary-filters" class="primary-list">
    <li>categoryFilters: {JSON.stringify(query?.categoryFilters)}</li>
    <li>numericFilters: {JSON.stringify(query?.numericFilters)}</li>
    <li>variantInfoFilters: {JSON.stringify(query?.variantInfoFilters)}</li>
  </ul>
</section>
<section id="detail-variables-container" class="m-3">
  <p class="font-bold text-left my-1">Additional Variables Included in Dataset</p>
  <ul data-testid="dataset-summary-variables" class="primary-list">
    <li>query.fields: {JSON.stringify(query?.fields)}</li>
  </ul>
</section>
<Modal bind:open={modalOpen}
  width="w-1/2"
  withDefault={false}
  footerButtons={false}
>
  {#snippet trigger()}
  <button class="btn preset-filled-primary-500 hover:preset-outlined-primary-500">
    Load Query
  </button>
  {/snippet}
  <div>
    <h1>Warning</h1>
    <p>This will replace all current filters and variables applied to the query.</p>
    <p>Some filters may include variables that you no longer have access to or that are no longer valid. If this is the case, you may be logged out of the application.</p>
    <p>Are you sure you want to continue?</p>
    <div class="flex gap-2">
      <button class="btn preset-filled-primary-500 hover:preset-outlined-primary-500" onclick={loadQuery}>Load Query</button>
      <button class="btn preset-outlined-surface-500 hover:preset-filled-surface-500" onclick={() => (modalOpen = false)}>Cancel</button>
    </div>
  </div>
</Modal>

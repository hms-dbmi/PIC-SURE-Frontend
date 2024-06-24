<script lang="ts">
  import { getModalStore } from '@skeletonlabs/skeleton';
  const modalStore = getModalStore();

  import QuerySummary from '$lib/components/QuerySummary.svelte';

  $: queryId = $modalStore[0]?.meta.queryId;
  $: query = $modalStore[0]?.meta.query;
</script>

<section id="detail-summary-container" class="m-3">
  <table class="table bg-transparent">
    <tr>
      <td>Dataset ID:</td>
      <td data-testid="dataset-summary-uuid">{queryId}</td>
    </tr>
  </table>
</section>

{#if query}
  <QuerySummary {query} />
{/if}

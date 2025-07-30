<script lang="ts">
  import QuerySummary from '$lib/components/QuerySummary.svelte';
  import type { Metadata } from '$lib/models/DataRequest';

  let { metadata }: { metadata: Metadata | undefined } = $props();

  let queryId = $derived(metadata?.picsureResultId || '');
  let query = $derived(metadata?.resultMetadata?.queryJson?.query);
</script>

<section id="detail-summary-container" class="m-3">
  <table class="table bg-transparent">
    <tbody>
      <tr>
        <td>Dataset ID:</td>
        <td data-testid="dataset-summary-uuid">{queryId || 'Error'}</td>
      </tr>
    </tbody>
  </table>
</section>

{#if query}
  <QuerySummary {query} />
{/if}

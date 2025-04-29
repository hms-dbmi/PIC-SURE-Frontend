<script lang="ts">
  import { metadata } from '$lib/stores/DataRequest';

  import QuerySummary from '$lib/components/QuerySummary.svelte';

  let queryId = $derived($metadata?.picsureResultId || '');
  let query = $derived($metadata?.resultMetadata.queryJson.query || {});
</script>

<section id="detail-summary-container" class="m-3">
  <table class="table bg-transparent">
    <tbody>
      <tr>
        <td>Dataset ID:</td>
        <td data-testid="dataset-summary-uuid">{queryId}</td>
      </tr>
    </tbody>
  </table>
</section>

{#if query}
  <QuerySummary {query} />
{/if}

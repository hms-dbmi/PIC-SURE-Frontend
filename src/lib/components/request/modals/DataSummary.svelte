<script lang="ts">
  import type { Metadata } from '$lib/models/DataRequest';
  import { QueryV2 } from '$lib/models/query/Query';
  import { QueryVersion } from '$lib/models/Dataset';
  import QuerySummary from '$lib/components/query/QuerySummary.svelte';

  let { metadata }: { metadata: Metadata | undefined } = $props();

  let queryId = $derived(metadata?.picsureId || '');
  // queryJson IS the stored query now -- the server strips the envelope.
  let query = $derived(metadata?.resultMetadata?.queryJson);
</script>

<section data-testid="dataset-summary-container" class="m-3">
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
  <QuerySummary version={QueryVersion.V2} query={query as QueryV2} />
{/if}

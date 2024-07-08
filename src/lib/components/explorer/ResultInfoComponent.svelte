<script lang="ts">
  import type { SearchResult } from '$lib/models/Search';

  export let data: SearchResult = {} as SearchResult;
</script>

<div class="card min-h-60 p-4">
  <header class="card-header">
    <h4>Variable Information for: {data.display}</h4>
  </header>
  <section class="card-body">
    <ul class="break-all">
      {#if data.display}
        <li>
          <strong>Name</strong>: {data.display}
        </li>
      {/if}
      {#if data.description}
        <li>
          <strong>Description</strong>: {data.description}
        </li>
      {/if}
      {#if data.type}
        <li>
          <strong>Type</strong>: {data.type}
        </li>
      {/if}
    </ul>
  </section>
</div>

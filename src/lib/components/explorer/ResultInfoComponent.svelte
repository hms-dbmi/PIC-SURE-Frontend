<script lang="ts">
  import type { SearchResult } from '$lib/models/Search';

  export let data: SearchResult = {} as SearchResult;
</script>

<div class="card min-h-60 p-4">
  <header class="card-header">
    <h4>Variable Information for: {data.name}</h4>
  </header>
  <section class="card-body">
    <ul class="break-all">
      {#each Object.keys(data) as key}
        {#if data[key] !== undefined}
          <li>
            <strong>{key}</strong>: {data[key]}
          </li>
        {/if}
      {/each}
    </ul>
  </section>
</div>

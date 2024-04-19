<script lang="ts">
  import type { SearchResult } from '$lib/models/Search';

  export let data: SearchResult = {} as SearchResult;
</script>

<div data-testid="hierarchy-component">
  Hello from hierarchyComponents.svelte
  {JSON.stringify(data)}
</div>

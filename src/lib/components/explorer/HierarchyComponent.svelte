<script lang="ts">
  import type { SearchResult } from '$lib/models/Search';

  interface Props {
    data?: SearchResult;
  }

  let { data = {} as SearchResult }: Props = $props();
</script>

<div data-testid="hierarchy-component">
  Hello from hierarchyComponents.svelte
  {JSON.stringify(data)}
</div>

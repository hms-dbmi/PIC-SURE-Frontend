<script lang="ts">
  import { filters } from '$lib/stores/Filter';
  import FilterComponent from '$lib/components/explorer/results/AddedFilter.svelte';
</script>

<div class="and-group">
  {#each $filters as filter, index}
    {#if filter}
      {#if index > 0}
        <!-- Dropdown -->
      {/if}
      <FilterComponent {filter} />
    {/if}
  {/each}
</div>

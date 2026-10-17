<script lang="ts">
  import { css } from '#lib/ui/style.ts';
  import SkeletonBar from '#lib/ui/skeleton/SkeletonBar.svelte';
  import SkeletonList from '#lib/ui/skeleton/SkeletonList.svelte';

  interface Props {
    numFacets?: number;
    fadeEffect?: boolean;
  }

  let { numFacets = 3, fadeEffect = false }: Props = $props();

  const showSearchAndButton = $derived(numFacets > 5);
</script>

<div data-testid="explorer-facet-placeholder" class="space-y-0 rounded-xl">
  <div
    data-testid="explorer-facet-placeholder-header"
    class="flex items-center justify-between h6 bg-surface-100-900 p-4 rounded-t-xl border-b border-surface-200-800"
  >
    <SkeletonBar class="h-5 w-32" />
    <SkeletonBar class="w-4 h-4" />
  </div>

  <div
    data-testid="explorer-facet-placeholder-content"
    class="p-4 rounded-b-xl {fadeEffect
      ? 'bg-gradient-to-b from-surface-100 via-surface-100/30 to-transparent'
      : 'bg-surface-100'}"
  >
    {#if showSearchAndButton}
      <SkeletonBar
        data-testid="explorer-facet-placeholder-search"
        class="h-8 w-full mb-3"
        shape="pill"
      />
    {/if}

    <SkeletonList
      class="mt-1"
      count={showSearchAndButton ? Math.min(numFacets, 5) : numFacets}
      marker
      fade={fadeEffect}
      data-testid="explorer-facet-placeholder-list"
    />

    {#if showSearchAndButton}
      <div
        data-testid="explorer-facet-placeholder-show-more"
        class="flex justify-center mt-3"
        {@attach css({ opacity: fadeEffect ? 0.1 : 1 })}
      >
        <SkeletonBar class="h-8 w-24" shape="pill" />
      </div>
    {/if}
  </div>
</div>

<script lang="ts">
  import { css } from '#lib/ui/style.ts';

  let {
    className = '',
    numFacets = 3,
    showSearchAndButton = numFacets > 5,
    fadeEffect = false,
  } = $props();

  const visualVarietyWidths = ['w-32', 'w-28', 'w-36', 'w-24', 'w-40', 'w-30'];
</script>

<div data-testid="explorer-facet-placeholder" class="space-y-0 rounded-xl {className}">
  <div
    data-testid="explorer-facet-placeholder-header"
    class="flex items-center justify-between h6 bg-surface-100-900 p-4 rounded-t-xl border-b border-surface-200-800"
  >
    <div class="placeholder h-5 w-32 animate-pulse rounded"></div>
    <div class="placeholder w-4 h-4 animate-pulse rounded"></div>
  </div>

  <div
    data-testid="explorer-facet-placeholder-content"
    class="p-4 rounded-b-xl {fadeEffect
      ? 'bg-gradient-to-b from-surface-100 via-surface-100/30 to-transparent'
      : 'bg-surface-100'}"
  >
    {#if showSearchAndButton}
      <div
        data-testid="explorer-facet-placeholder-search"
        class="placeholder h-8 w-full animate-pulse rounded-full mb-3"
      ></div>
    {/if}

    <div class="space-y-3 mt-1">
      <!-- eslint-disable-next-line @typescript-eslint/no-unused-vars -->
      {#each Array(showSearchAndButton ? Math.min(numFacets, 5) : numFacets) as _unused, i}
        {@const opacity = fadeEffect ? Math.max(0, 1 - (i / (numFacets - 1)) * 0.8) : 1}
        <div
          data-testid="explorer-facet-placeholder-item-{i}"
          class="flex items-center space-x-3"
          {@attach css({ opacity })}
        >
          <div class="placeholder size-4 animate-pulse rounded-sm"></div>
          <div
            class="placeholder h-4 {visualVarietyWidths[
              i % visualVarietyWidths.length
            ]} animate-pulse rounded"
          ></div>
        </div>
      {/each}
    </div>

    {#if showSearchAndButton}
      <div
        data-testid="explorer-facet-placeholder-show-more"
        class="flex justify-center mt-3"
        {@attach css({ opacity: fadeEffect ? 0.1 : 1 })}
      >
        <div class="placeholder h-8 w-24 animate-pulse rounded-full"></div>
      </div>
    {/if}
  </div>
</div>

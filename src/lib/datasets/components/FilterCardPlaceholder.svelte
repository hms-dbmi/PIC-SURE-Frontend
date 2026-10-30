<script lang="ts">
  import SkeletonBar from '#lib/ui/skeleton/SkeletonBar.svelte';
  import { cardClass } from '#lib/ui/surface.ts';

  interface Props {
    numCards?: number;
  }

  let { numCards = 3 }: Props = $props();

  const variableNameWidths = ['w-36', 'w-28', 'w-40', 'w-32', 'w-24'];
  const studyLabelWidths = ['w-24', 'w-20', 'w-28', 'w-16', 'w-22'];
  const descriptionWidths = ['w-32', 'w-40', 'w-28', 'w-36', 'w-30'];
</script>

<div data-testid="filter-card-placeholder" class="flex flex-col gap-1">
  {#each { length: numCards }, i}
    <div
      data-testid="filter-card-placeholder-item-{i}"
      class="{cardClass} bg-surface-100 flex flex-col ml-2 p-3 gap-0.5"
    >
      <SkeletonBar class="h-4 {variableNameWidths[i % variableNameWidths.length]}" />
      <SkeletonBar class="h-3 {studyLabelWidths[i % studyLabelWidths.length]} mt-0.5" />
      <SkeletonBar class="h-3 {descriptionWidths[i % descriptionWidths.length]} mt-1" />
    </div>
  {/each}
</div>

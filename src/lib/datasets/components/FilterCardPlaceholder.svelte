<script lang="ts">
  let { className = '', numCards = 3 } = $props();

  const variableNameWidths = ['w-36', 'w-28', 'w-40', 'w-32', 'w-24'];
  const studyLabelWidths = ['w-24', 'w-20', 'w-28', 'w-16', 'w-22'];
  const descriptionWidths = ['w-32', 'w-40', 'w-28', 'w-36', 'w-30'];
</script>

<div data-testid="filter-card-placeholder" class="flex flex-col gap-1 {className}">
  <!-- eslint-disable-next-line @typescript-eslint/no-unused-vars -->
  {#each Array(numCards) as _unused, i}
    <div
      data-testid="filter-card-placeholder-item-{i}"
      class="card bg-surface-100 flex flex-col ml-2 p-3 gap-0.5"
    >
      <div
        class="placeholder h-4 {variableNameWidths[
          i % variableNameWidths.length
        ]} animate-pulse rounded"
      ></div>
      <div
        class="placeholder h-3 {studyLabelWidths[
          i % studyLabelWidths.length
        ]} animate-pulse rounded mt-0.5"
      ></div>
      <div
        class="placeholder h-3 {descriptionWidths[
          i % descriptionWidths.length
        ]} animate-pulse rounded mt-1"
      ></div>
    </div>
  {/each}
</div>

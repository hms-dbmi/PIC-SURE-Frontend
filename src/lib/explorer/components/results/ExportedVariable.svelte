<script lang="ts">
  import IconButton from '#lib/ui/IconButton.svelte';
  import type { ExportInterface } from '#lib/explorer/export/types.ts';
  import { fade } from 'svelte/transition';
  import { removeExportByUuid } from '#lib/explorer/export/Export.ts';

  interface Props {
    variable: ExportInterface;
  }

  let { variable }: Props = $props();
  const remove = function () {
    removeExportByUuid(variable.id);
  };
</script>

<div
  data-testid="results-export-item-{variable.conceptPath}"
  class="flex flex-col card bg-surface-100 p-1 m-1"
  transition:fade={{ duration: 300 }}
>
  <header class="card-header p-1 flex">
    <div class="flex-auto">
      {variable.display || variable.searchResult?.display || variable.searchResult?.name}
    </div>
    <IconButton icon="fa-solid fa-times-circle" label="Remove Export" onclick={remove} />
  </header>
</div>

<script lang="ts">
  import type { ExportInterface } from '$lib/models/Export';
  import { fade } from 'svelte/transition';
  import ExportStore from '$lib/stores/Export';
  const { removeExport } = ExportStore;

  interface Props {
    variable: ExportInterface;
  }

  let { variable }: Props = $props();
  const remove = function () {
    removeExport(variable.id);
  };
</script>

<div
  id={variable.studyId ? `${variable.studyId}-${variable.conceptPath}` : variable.conceptPath}
  data-testid="added-export-{variable.conceptPath}"
  class="flex flex-col card p-1 m-1"
  transition:fade={{ duration: 300 }}
>
  <header class="card-header p-1 flex">
    <div class="flex-auto">
      {variable.display || variable.searchResult?.display || variable.searchResult?.name}
    </div>
    <button
      type="button"
      title="Remove Export"
      class="btn-icon-color"
      aria-label="Remove Export"
      onclick={remove}
    >
      <i class="fa-solid fa-times-circle"></i>
    </button>
  </header>
</div>

<style>
</style>

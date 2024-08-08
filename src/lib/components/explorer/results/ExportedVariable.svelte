<script lang="ts">
  import type { ExportInterface } from '$lib/models/Export';
  import { fade } from 'svelte/transition';
  import ExportStore from '$lib/stores/Export';
  const { removeExport } = ExportStore;

  export let variable: ExportInterface;
  const remove = function () {
    removeExport(variable.id);
  };
</script>

<div
  id={variable.studyId ? `${variable.studyId}-${variable.conceptPath}` : variable.conceptPath}
  data-testid="added-export-{variable.display}"
  class="flex flex-col card p-1 m-1"
  transition:fade={{ duration: 300 }}
>
  <header class="card-header p-1 flex">
    <div class="flex-auto font-bold">{variable.display}</div>
    <button type="button" title="Remove Export" class="btn-icon-color" on:click={remove}>
      <i class="fa-solid fa-times-circle"></i>
    </button>
  </header>
</div>

<style>
</style>

<script lang="ts">
  import type { Export } from '$lib/models/Export';
  import { fade } from 'svelte/transition';
  import ExportStore from '$lib/stores/Export';
  const { removeExport } = ExportStore;

  export let variable: Export;
  const remove = function () {
    removeExport(variable.variableId);
  };
</script>

<div
  id={variable.studyId ? `${variable.studyId}-${variable.variableId}` : variable.variableId}
  data-testid="added-export-{variable.variableName}"
  class="flex flex-col card p-1 m-1"
  transition:fade={{ duration: 300 }}
>
  <header class="card-header p-1 flex">
    <div class="flex-auto font-bold">{variable.variableName}</div>
    <button
      type="button"
      title="Remove Export"
      class="bg-initial text-black-500 hover:text-primary-600"
      on:click={remove}
    >
      <i class="fa-solid fa-times-circle"></i>
    </button>
  </header>
</div>

<style>
</style>

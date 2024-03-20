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
  class="flex justify-between items-center w-full"
  transition:fade={{ duration: 300 }}
>
  <span>{variable.variableName}</span>
  <button
    type="button"
    title="Remove Export"
    class="bg-initial text-black-500 hover:text-primary-600"
    on:click={remove}
  >
    <i class="fa-solid fa-times-circle"></i>
  </button>
</div>

<style>
</style>

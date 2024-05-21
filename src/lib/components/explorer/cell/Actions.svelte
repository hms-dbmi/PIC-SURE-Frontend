<script lang="ts">
  import type { SearchResult } from '$lib/models/Search';
  import { activeRow, expandableComponents, activeComponent } from '$lib/stores/ExpandableRow';
  import type { Export } from '$lib/models/Export';
  import ExportStore from '$lib/stores/Export';
  let { exports, addExport, removeExport } = ExportStore;
  export let data = {} as SearchResult;
  let exported: Export = {
    variableName: data.row.name,
    variableId: data.row.id,
  };
  function updateActiveRow(component: string) {
    if ($activeRow === data.index && $activeComponent === $expandableComponents[component]) {
      activeRow.set(-1);
      return;
    }
    (data.index !== undefined || data.index !== null) && activeRow.set(data.index);
  }
  function insertInfoContent() {
    updateActiveRow('info');
    activeComponent.set($expandableComponents['info']);
  }
  function insertFilterContent() {
    updateActiveRow('filter');
    activeComponent.set($expandableComponents['filter']);
  }
  function insertHierarchyContent() {
    updateActiveRow('hierarchy');
    activeComponent.set($expandableComponents['hierarchy']);
  }
  function insertExportContent() {
    if ($exports.includes(exported)) {
      removeExport(exported.variableId);
    } else {
      addExport(exported);
    }
  }
</script>

<button
  type="button"
  title="Information"
  class="bg-initial text-black-600 hover:text-primary-600"
  on:click|stopPropagation={insertInfoContent}
>
  <i class="fa-solid fa-circle-info fa-xl"></i>
  <span class="sr-only">View Information</span>
</button>
<button
  type="button"
  title="Filter"
  class="bg-initial text-black-600 hover:text-primary-600"
  on:click|stopPropagation={insertFilterContent}
>
  <i class="fa-solid fa-filter fa-xl"></i>
  <span class="sr-only">View Filters</span>
</button>
<button
  type="button"
  title="Data Hierarchy"
  class="bg-initial text-black-600 hover:text-primary-600"
  on:click|stopPropagation={insertHierarchyContent}
>
  <i class="fa-solid fa-sitemap fa-xl"></i>
  <span class="sr-only">View Data Hierarchy</span>
</button>
<button
  type="button"
  title="Data Export"
  class="bg-initial text-black-600 hover:text-primary-600"
  on:click|stopPropagation={insertExportContent}
>
  {#if $exports.includes(exported)}
    <i class="fa-regular fa-square-check fa-xl"></i>
  {:else}
    <i class="fa-solid fa-right-from-bracket fa-xl"></i>
  {/if}
</button>

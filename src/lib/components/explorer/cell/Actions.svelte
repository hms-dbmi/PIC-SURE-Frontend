<script lang="ts">
  import type { SearchResult } from '$lib/models/Search';
  import { activeTable, expandableComponents, setActiveRow } from '$lib/stores/ExpandableRow';
  import type { ExportInterface } from '$lib/models/Export';
  import ExportStore from '$lib/stores/Export';
  import { v4 as uuidv4 } from 'uuid';
  import { features } from '$lib/configuration';
  import { page } from '$app/stores';
  let { exports, addExport, removeExport } = ExportStore;
  export let data = {} as SearchResult;
  $: exportItem = {
    id: uuidv4(),
    searchResult: data.row,
    display: data.row.display,
    conceptPath: data.row.conceptPath,
  } as ExportInterface;
  function updateActiveRow(component: string) {
    return () => {
      setActiveRow({
        row: data.row.conceptPath,
        component: $expandableComponents[component],
        table: $activeTable,
      });
    };
  }

  const insertInfoContent = updateActiveRow('info');
  const insertFilterContent = updateActiveRow('filter');
  const insertHierarchyContent = updateActiveRow('hierarchy');

  function insertExportContent() {
    if ($exports.includes(exportItem)) {
      removeExport(exportItem.id);
    } else {
      addExport(exportItem);
    }
  }
  $: isOpenAccess = $page.url.pathname.includes('/discover');
  $: isExported = $exports.map((exp) => exp.conceptPath).includes(exportItem.conceptPath);
  $: shouldDisableFilter = isOpenAccess && !data.row.allowFiltering;
</script>

<button
  type="button"
  title="Information"
  class="btn-icon-color"
  on:click|stopPropagation={insertInfoContent}
>
  <i class="fa-solid fa-circle-info fa-xl"></i>
  <span class="sr-only">View Information</span>
</button>
<button
  type="button"
  title={shouldDisableFilter ? 'Filtering is not available for this variable' : 'Filter'}
  class="btn-icon-color"
  disabled={shouldDisableFilter}
  on:click|stopPropagation={insertFilterContent}
>
  <i class="fa-solid fa-filter fa-xl"></i>
  <span class="sr-only"
    >{shouldDisableFilter ? 'Filtering is not available for this variable' : 'View Filter'}</span
  >
</button>
{#if features.explorer.enableHierarchy}
  <button
    type="button"
    title="Data Hierarchy"
    class="btn-icon-color"
    on:click|stopPropagation={insertHierarchyContent}
  >
    <i class="fa-solid fa-sitemap fa-xl"></i>
    <span class="sr-only">View Data Hierarchy</span>
  </button>
{/if}
{#if features.explorer.exportsEnableExport && !isOpenAccess}
  <button
    type="button"
    title={isExported ? 'Remove from Analysis' : 'Add for Analysis'}
    class="btn-icon-color"
    on:click|stopPropagation={insertExportContent}
  >
    {#if isExported}
      <i class="fa-regular fa-square-check fa-xl"></i>
    {:else}
      <i class="fa-solid fa-right-from-bracket fa-xl"></i>
    {/if}
  </button>
{/if}

<script lang="ts">
  import IconButton from '#lib/ui/IconButton.svelte';
  import type { SearchResult } from '#lib/api/picsure/dictionary.types.ts';
  import { exportState, mapSearchResultAsExport } from '#lib/explorer/export/export.svelte.ts';
  import { explorerPanel, type RowView } from '#lib/explorer/panel.svelte.ts';
  import { config } from '#lib/config/config.svelte.ts';
  import { isOpenAccess } from '#lib/explorer/mode.ts';
  import { log, createLog, getPageContext } from '#lib/telemetry/logger.ts';

  interface Props {
    row: SearchResult;
  }

  let { row }: Props = $props();
  let exportItem = $derived(mapSearchResultAsExport(row));

  function updateActiveRow(view: RowView) {
    return (event: Event) => {
      event.stopPropagation();
      log(
        createLog('ACTION', `search_result.${view}`, {
          variable: row.display || row.name,
          conceptPath: row.conceptPath,
          pageContext: getPageContext(),
        }),
      );
      explorerPanel.toggleRow(row.conceptPath, view);
    };
  }

  const insertInfoContent = updateActiveRow('info');
  const insertFilterContent = updateActiveRow('filter');
  const insertHierarchyContent = updateActiveRow('hierarchy');

  function insertExportContent(e: Event) {
    e.stopPropagation();
    if (isExported) {
      log(
        createLog('ACTION', 'search_result.export_remove', {
          variable: row.display || row.name,
          conceptPath: row.conceptPath,
          pageContext: getPageContext(),
        }),
      );
      exportState.remove(exportItem);
    } else {
      log(
        createLog('ACTION', 'search_result.export_add', {
          variable: row.display || row.name,
          conceptPath: row.conceptPath,
          pageContext: getPageContext(),
        }),
      );
      exportState.add(exportItem);
    }
  }

  let isExported = $derived(exportState.has(exportItem.conceptPath));
  let shouldDisableFilter = $derived(isOpenAccess() && !row.allowFiltering);
</script>

<IconButton
  icon="fa-solid fa-circle-info fa-xl"
  label="Information (i)"
  shortcut="i"
  class="row-action-info"
  onclick={insertInfoContent}
/>
<IconButton
  icon="fa-solid fa-filter fa-xl"
  label={shouldDisableFilter ? 'Filtering is not available for this variable' : 'Filter (f)'}
  shortcut="f"
  class="row-action-filter"
  disabled={shouldDisableFilter}
  onclick={insertFilterContent}
/>
{#if config.features.explorer.enableHierarchy}
  <IconButton
    icon="fa-solid fa-sitemap fa-xl"
    label="Data Hierarchy (h)"
    shortcut="h"
    class="row-action-hierarchy"
    onclick={insertHierarchyContent}
  />
{/if}
{#if config.features.explorer.exportsEnableExport && !isOpenAccess()}
  <IconButton
    icon={isExported ? 'fa-regular fa-square-check fa-xl' : 'fa-solid fa-right-from-bracket fa-xl'}
    label={isExported ? 'Remove from Analysis (e)' : 'Add for Analysis (e)'}
    shortcut="e"
    class="row-action-export"
    onclick={insertExportContent}
  />
{/if}

<script lang="ts">
  import IconButton from '#lib/ui/IconButton.svelte';
  import type { SearchResult } from '#lib/explorer/types.ts';
  import {
    exports,
    addExport,
    removeExport,
    mapSearchResultAsExport,
  } from '#lib/explorer/export/Export.ts';
  import { explorerPanel, type RowView } from '#lib/explorer/panel.svelte.ts';
  import { config } from '#lib/config/config.svelte.ts';
  import { isOpenAccess } from '#lib/explorer/mode.ts';
  import { log, createLog, getPageContext } from '#lib/telemetry/logger.ts';

  interface Props {
    data: { row: SearchResult; tableName?: string };
  }

  let { data }: Props = $props();
  let exportItem = $derived(mapSearchResultAsExport(data.row));

  function updateActiveRow(view: RowView) {
    return (event: Event) => {
      event.stopPropagation();
      log(
        createLog('ACTION', `search_result.${view}`, {
          variable: data.row.display || data.row.name,
          conceptPath: data.row.conceptPath,
          pageContext: getPageContext(),
        }),
      );
      explorerPanel.toggleRow(data.row.conceptPath, { view, table: data.tableName });
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
          variable: data.row.display || data.row.name,
          conceptPath: data.row.conceptPath,
          pageContext: getPageContext(),
        }),
      );
      removeExport(exportItem);
    } else {
      log(
        createLog('ACTION', 'search_result.export_add', {
          variable: data.row.display || data.row.name,
          conceptPath: data.row.conceptPath,
          pageContext: getPageContext(),
        }),
      );
      addExport(exportItem);
      explorerPanel.show();
    }
  }

  let isExported = $derived(
    $exports.map((exp) => exp.conceptPath).includes(exportItem.conceptPath),
  );
  let shouldDisableFilter = $derived(isOpenAccess() && !data.row.allowFiltering);
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

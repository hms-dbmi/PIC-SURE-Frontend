<script lang="ts">
  import { genomicDraft } from '#lib/query/genomicDraft.svelte.ts';
  import variantData from '#lib/explorer/genomic/variant-data.json';
  import TreeView from '#lib/ui/tree/TreeView.svelte';
  import type { TreeNodeInit } from '#lib/ui/tree/treeModel.svelte.ts';
  import { log, createLog } from '#lib/telemetry/logger.ts';

  function loggedAddConsequence(value: string) {
    log(createLog('ACTION', 'genomic.consequence_select', { consequence: value }));
    genomicDraft.addConsequence(value);
  }

  function loggedRemoveConsequence(value: string) {
    log(createLog('ACTION', 'genomic.consequence_select', { consequence: value }));
    genomicDraft.removeConsequence(value);
  }

  // The tree owns the selection once built, so it reads the stored consequences only here.
  const nodes: TreeNodeInit<string>[] = variantData.map(({ key, children }) => {
    const leaves = children.map((child) => ({
      name: key,
      value: child,
      label: child,
      payload: child,
      selected: genomicDraft.consequenceSelection.includes(child),
    }));
    return {
      name: 'severity',
      value: key,
      label: key,
      payload: key,
      children: leaves,
      open: leaves.some((leaf) => leaf.selected),
    };
  });
</script>

<TreeView
  {nodes}
  label="Consequences"
  class="overflow-auto h-[350.75px]"
  expandOnSelect
  onselect={loggedAddConsequence}
  onunselect={loggedRemoveConsequence}
/>

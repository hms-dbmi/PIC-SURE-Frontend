<script lang="ts">
  import { get } from 'svelte/store';

  import type { NodeInterface } from '$lib/components/tree/types';
  import { geneDraftRevision, selectedConsequence } from '$lib/stores/GeneFilter';
  import { addConsquence, removeConsequence } from '$lib/stores/GeneFilter';
  import variantData from '$lib/components/explorer/genome-filter/variant-data.json';
  import Tree from '$lib/components/tree/Tree.svelte';
  import { log, createLog } from '$lib/logger';

  function loggedAddConsequence(value: string) {
    log(createLog('ACTION', 'genomic.consequence_select', { consequence: value }));
    addConsquence(value);
  }

  function loggedRemoveConsequence(value: string) {
    log(createLog('ACTION', 'genomic.consequence_select', { consequence: value }));
    removeConsequence(value);
  }

  // Reads the selection untracked, and is called once per tree: the tree owns its checkboxes
  // once it has them, and following every change would rebuild it on each click and lose which
  // severity groups the user had open.
  function nodesFromSelection(): NodeInterface[] {
    const selected = get(selectedConsequence);
    return variantData.map(({ key, children }) => ({
      name: 'severity',
      value: key,
      children: children.map((child) => ({
        name: key,
        value: child,
        children: [],
        open: false,
        selected: selected.includes(child),
      })),
      open: false,
      selected: false,
    }));
  }
</script>

<!-- Keyed on the one thing that has to rebuild the tree: the selection being replaced
     wholesale from outside these panels, which is what loading the cohort's applied filter
     into the tab and clearing it both do. -->
{#key $geneDraftRevision}
  <Tree
    nodes={nodesFromSelection()}
    onselect={loggedAddConsequence}
    onunselect={loggedRemoveConsequence}
  />
{/key}

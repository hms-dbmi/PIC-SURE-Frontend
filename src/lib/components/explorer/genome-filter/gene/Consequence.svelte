<script lang="ts">
  import { get } from 'svelte/store';

  import type { NodeInterface } from '$lib/components/tree/types';
  import { consequenceRevision, selectedConsequence } from '$lib/stores/GeneFilter';
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

  // The selection is read untracked, so the tree is built from it and then left to own its own
  // checkboxes: following every change would rebuild it on each click and lose which severity
  // groups the user had open. `consequenceRevision` is the one thing that does rebuild it -
  // the selection being replaced wholesale from outside these panels, which is what loading
  // the cohort's applied filter into the tab and clearing it both do.
  let nodes: NodeInterface[] = $derived.by(() => {
    void $consequenceRevision;
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
  });
</script>

<Tree {nodes} onselect={loggedAddConsequence} onunselect={loggedRemoveConsequence} />

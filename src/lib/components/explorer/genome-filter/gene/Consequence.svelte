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

  // Read untracked: the tree owns its checkboxes once built, and rebuilds only when the
  // selection is replaced from outside - see `consequenceRevision`.
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

<script lang="ts">
  import type { NodeInterface } from '$lib/components/tree/types';
  import { selectedConsequence } from '$lib/stores/GeneFilter';
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

  let nodes: NodeInterface[] = $state(
    variantData.map(({ key, children }) => ({
      name: 'severity',
      value: key,
      children: children.map((child) => ({
        name: key,
        value: child,
        children: [],
        open: false,
        selected: $selectedConsequence.includes(child),
      })),
      open: false,
      selected: false,
    })),
  );
</script>

<Tree {nodes} onselect={loggedAddConsequence} onunselect={loggedRemoveConsequence} />

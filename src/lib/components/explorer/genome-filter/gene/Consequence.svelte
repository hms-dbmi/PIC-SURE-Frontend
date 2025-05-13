<script lang="ts">
  import type { NodeInterface } from '$lib/components/tree/types';
  import { selectedConsequence } from '$lib/stores/GeneFilter';
  import { addConsquence, removeConsequence } from '$lib/stores/GeneFilter';
  import variantData from '$lib/components/explorer/genome-filter/variant-data.json';
  import Tree from '$lib/components/tree/Tree.svelte';

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

<Tree {nodes} onselect={addConsquence} onunselect={removeConsequence} />

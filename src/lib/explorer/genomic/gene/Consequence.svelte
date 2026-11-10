<script lang="ts">
  import type { NodeInterface } from '#lib/ui/tree/types.ts';
  import { selectedConsequence } from '#lib/query/GeneFilter.ts';
  import { addConsquence, removeConsequence } from '#lib/query/GeneFilter.ts';
  import variantData from '#lib/explorer/genomic/variant-data.json';
  import Tree from '#lib/ui/tree/Tree.svelte';
  import { log, createLog } from '#lib/telemetry/logger.ts';

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

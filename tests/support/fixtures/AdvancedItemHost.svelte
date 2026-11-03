<script lang="ts">
  import { untrack } from 'svelte';
  import AdvancedItem from '#lib/explorer/advanced/AdvancedItem.svelte';
  import {
    setFilterTreeEditor,
    type FilterTreeEditor,
  } from '#lib/explorer/advanced/FilterTreeEditor.svelte.ts';
  import type { FilterInterface } from '#lib/query/filter.svelte.ts';

  // Renders a filter card inside a FilterTreeEditor context, the way AdvancedFiltering does.
  interface Props {
    filter: FilterInterface;
    editor: FilterTreeEditor;
  }

  let { filter, editor }: Props = $props();
  setFilterTreeEditor(untrack(() => editor));
</script>

<AdvancedItem {filter} />

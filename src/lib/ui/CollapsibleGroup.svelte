<script lang="ts">
  import { Accordion } from '@skeletonlabs/skeleton-svelte';
  import type { Snippet } from 'svelte';

  interface Props {
    /** The `value`s of the open CollapsiblePanels. */
    value: string[];
    onchange: (value: string[]) => void;
    /** Lets more than one panel stay open. */
    multiple?: boolean;
    /** Lets the last open panel close (always true with `multiple`). */
    collapsible?: boolean;
    children: Snippet;
  }

  let { value, onchange, multiple = false, collapsible = false, children }: Props = $props();
</script>

<Accordion {value} onValueChange={(e) => onchange(e.value)} {multiple} {collapsible}>
  {#snippet iconOpen()}<i class="fa-solid fa-angle-up"></i>{/snippet}
  {#snippet iconClosed()}<i class="fa-solid fa-angle-down"></i>{/snippet}
  {@render children()}
</Accordion>

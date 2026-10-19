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
    /** Give the panels the same variant. */
    variant?: keyof typeof variants;
    children: Snippet;
  }

  const variants = {
    section: {
      spaceY: undefined,
      classes: undefined,
      open: 'fa-solid fa-angle-up',
      closed: 'fa-solid fa-angle-down',
    },
    card: {
      spaceY: 'space-y-4',
      classes: 'mt-4',
      open: 'fa-solid fa-angle-up text-xl',
      closed: 'fa-solid fa-angle-down text-xl',
    },
  };

  let {
    value,
    onchange,
    multiple = false,
    collapsible = false,
    variant = 'section',
    children,
  }: Props = $props();

  const look = $derived(variants[variant]);
</script>

<Accordion
  {value}
  onValueChange={(e) => onchange(e.value)}
  {multiple}
  {collapsible}
  spaceY={look.spaceY}
  classes={look.classes}
>
  {#snippet iconOpen()}<i class={look.open}></i>{/snippet}
  {#snippet iconClosed()}<i class={look.closed}></i>{/snippet}
  {@render children()}
</Accordion>

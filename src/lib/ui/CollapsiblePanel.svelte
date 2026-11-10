<script lang="ts">
  import { Accordion } from '@skeletonlabs/skeleton-svelte';
  import type { Snippet } from 'svelte';
  import { getCollapsibleVariant } from '#lib/ui/CollapsibleGroup.svelte';

  interface Props {
    /** Identifies the panel in its CollapsibleGroup's `value`. */
    value: string;
    heading: Snippet;
    children: Snippet;
  }

  const variants = {
    section: {
      headingLevel: 6,
      controlRounded: 'rounded-t-xl aria-expanded:rounded-b-none rounded-b-xl',
      controlClasses: 'h6 bg-primary-100-900 hover:bg-secondary-200-800',
      panelClasses: 'bg-surface-100',
      panelRounded: 'rounded-b-xl',
    },
    card: {
      base: 'rounded-container border border-surface-200 bg-white dark:bg-surface-950 data-[state=open]:border-primary-500',
      controlHover: 'hover:bg-surface-100-900',
      controlPadding: 'p-6',
      controlRounded: 'rounded-container',
      panelPadding: 'px-6 pb-6',
    },
  } as const;

  let { value, heading, children }: Props = $props();

  const variant = getCollapsibleVariant();
</script>

<!-- Must sit inside a CollapsibleGroup. -->
<Accordion.Item {value} {...variants[variant()]} control={heading} panel={children} />

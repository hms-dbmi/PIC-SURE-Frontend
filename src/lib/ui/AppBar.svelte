<script lang="ts">
  import { AppBar } from '@skeletonlabs/skeleton-svelte';
  import type { Snippet } from 'svelte';

  interface Props {
    /** Left end of the bar. */
    lead?: Snippet;
    /** Right end of the bar. */
    trail?: Snippet;
    /** Fills the middle. */
    children: Snippet;
  }

  let { lead, trail, children }: Props = $props();
</script>

<AppBar
  padding="py-0 pl-2 pr-5"
  background="bg-surface-50-950"
  toolbarClasses="flex-none z-10"
  {lead}
  {trail}
  {children}
/>

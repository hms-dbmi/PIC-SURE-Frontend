<script lang="ts">
  import { Accordion } from '@skeletonlabs/skeleton-svelte';
  import type { Snippet } from 'svelte';

  interface Props {
    /** Identifies the panel in its CollapsibleGroup's `value`. */
    value: string;
    heading: Snippet;
    children: Snippet;
  }

  let { value, heading, children }: Props = $props();
</script>

<!-- Must sit inside a CollapsibleGroup. -->
<Accordion.Item
  {value}
  headingLevel={6}
  controlRounded="rounded-t-xl aria-expanded:rounded-b-none rounded-b-xl"
  controlClasses="h6 bg-primary-100-900 hover:bg-secondary-200-800"
  panelClasses="bg-surface-100"
  panelRounded="rounded-b-xl"
  control={heading}
  panel={children}
/>

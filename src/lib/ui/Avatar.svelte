<script lang="ts">
  import { Avatar } from '@skeletonlabs/skeleton-svelte';
  import type { Snippet } from 'svelte';

  interface Props {
    class?: string;
    /** Shown in the circle, usually an initial. */
    children: Snippet;
  }

  let { class: className = '', children }: Props = $props();
</script>

<!-- Skeleton requires `name` but reads it only for an image or initials; children replace both. -->
<Avatar
  name=""
  background="preset-tonal-primary hover:preset-tonal-secondary"
  border="border hover:border-primary-400"
  font="text-2xl"
  size="size-12"
  classes={className}
  {children}
/>

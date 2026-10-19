<script lang="ts">
  import { Avatar } from '@skeletonlabs/skeleton-svelte';
  import type { Snippet } from 'svelte';

  interface Props {
    /** Whose avatar this is; the image's alt text. */
    name: string;
    class?: string;
    /** Shown in the circle, usually an initial. */
    children: Snippet;
  }

  let { name, class: className = '', children }: Props = $props();
</script>

<Avatar
  {name}
  background="preset-tonal-primary hover:preset-tonal-secondary"
  border="border hover:border-primary-400"
  font="text-2xl"
  size="size-12"
  classes={className}
  {children}
/>

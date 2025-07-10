<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    title?: string;
    help?: Snippet;
    children?: Snippet;
  }

  let { title = '', help, children }: Props = $props();
</script>

<div class="text-center p-4">
  <div class="border-b border-surface-200 text-center mb-2 flex flex-row gap-2">
    {title}
    {@render help?.()}
  </div>
  {@render children?.()}
</div>

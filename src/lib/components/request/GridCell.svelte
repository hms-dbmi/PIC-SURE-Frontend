<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    title?: string;
    help?: Snippet;
    children?: Snippet;
  }

  let { title = '', help, children }: Props = $props();
</script>

<div class="text-center border-surface-600-400 px-4">
  <div class="border-b border-primary-600-400 text-center mb-2">
    {title}
    {@render help?.()}
  </div>
  {@render children?.()}
</div>

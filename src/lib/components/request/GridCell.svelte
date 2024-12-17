<script lang="ts">
  interface Props {
    title?: string;
    help?: import('svelte').Snippet;
    children?: import('svelte').Snippet;
  }

  let { title = '', help, children }: Props = $props();
</script>

<div class="text-center border-surface-500-400-token px-4">
  <div class="border-b border-primary-500-400-token text-center mb-2">
    {title}
    {@render help?.()}
  </div>
  {@render children?.()}
</div>

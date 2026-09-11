<script lang="ts">
  let { children }: { children?: import('svelte').Snippet } = $props();
</script>

{#if children}{@render children()}{/if}

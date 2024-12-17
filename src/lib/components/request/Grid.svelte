<script lang="ts">
  interface Props {
    columns: number;
    children?: import('svelte').Snippet;
  }

  let { columns, children }: Props = $props();
</script>

<div class={`grid grid-cols-${columns} divide-x py-4`}>
  {@render children?.()}
</div>

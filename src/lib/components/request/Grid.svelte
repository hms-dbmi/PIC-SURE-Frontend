<script lang="ts">
  export let columns: number;
</script>

<div class={`grid grid-cols-${columns} divide-x py-4`}>
  <slot />
</div>

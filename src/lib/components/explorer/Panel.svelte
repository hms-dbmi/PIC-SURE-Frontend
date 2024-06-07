<script lang="ts">
  export let title: string = '';

  let clazz = '';
  export { clazz as class };
</script>

<div
  class="border rounded-md border-surface-300-600-token {clazz}"
  data-testid={title.replaceAll(' ', '-').toLowerCase()}
>
  <div class="bg-surface-300-600-token p-3 items-center font-bold flex">
    <span class="flex-auto">{title}</span>
    <span class="flex-none"><slot name="help" /></span>
  </div>
  <div class="p-2">
    <slot />
  </div>
</div>

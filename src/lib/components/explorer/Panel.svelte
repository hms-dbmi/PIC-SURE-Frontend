<script lang="ts">
  export let title: string = '';
  export let subtitle: string = '';
  export let required: boolean = false;

  let clazz = '';
  export { clazz as class };
</script>

<div
  class="border rounded-md border-surface-300-600-token {clazz}"
  data-testid={title.replaceAll(' ', '-').toLowerCase()}
>
  <div class="relative bg-surface-300-600-token p-3 items-center flex">
    {#if required}<span class="absolute top-0 left-0 text-error-500-400-token"
        >* Required field</span
      >{/if}
    <div class="flex-auto text-center">
      <div class="font-bold">{title}</div>
      {#if subtitle}<div>{subtitle}</div>{/if}
    </div>
    {#if $$slots.action}<span class="flex-none"><slot name="action" /></span>{/if}
    {#if $$slots.help}<span class="flex-none"><slot name="help" /></span>{/if}
  </div>
  <div class="p-2">
    <slot />
  </div>
</div>

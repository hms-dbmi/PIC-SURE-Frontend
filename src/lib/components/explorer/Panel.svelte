<script lang="ts">
  export let title: string = '';
  export let subtitle: string = '';
  export let required: boolean = false;
</script>

<div class={$$props.class ?? ''} data-testid={title.replaceAll(' ', '-').toLowerCase()}>
  <div class="relative rounded-t-2xl bg-primary-300-600-token p-4 items-center flex">
    {#if required}<span class="absolute top-0 left-1 p-1 text-error-500-400-token text-xs"
        >* Required</span
      >{/if}
    <div class="flex-auto text-center">
      <div class="font-bold">{title}</div>
      {#if subtitle}<div>{subtitle}</div>{/if}
    </div>
    {#if $$slots.action}<span class="flex-none ml-1"><slot name="action" /></span>{/if}
    {#if $$slots.help}<span class="flex-none ml-1"><slot name="help" /></span>{/if}
  </div>
  <div class="p-2 border rounded-b-2xl border-surface-300-600-token">
    <slot />
  </div>
</div>

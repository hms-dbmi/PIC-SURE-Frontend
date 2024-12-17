<!-- @migration-task Error while migrating Svelte code: $$props is used together with named props in a way that cannot be automatically migrated. -->
<script lang="ts">
  let {
    class: className,
    'data-testid': testId,
    title = '',
    subtitle = '',
    required = false,
  } = $props();
</script>

<div
  class="flex flex-col {className ?? ''}"
  data-testid={testId || title.replaceAll(' ', '-').toLowerCase()}
>
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
  <div class="h-full p-2 border rounded-b-2xl border-surface-300-600-token">
    <slot />
  </div>
</div>

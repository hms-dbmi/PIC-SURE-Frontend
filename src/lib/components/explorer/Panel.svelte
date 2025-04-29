<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    title?: string;
    subtitle?: string;
    required?: boolean;
    'data-testid'?: string;
    class?: string;
    action?: Snippet;
    help?: Snippet;
    children?: Snippet;
  }

  const {
    title = '',
    subtitle = '',
    required = false,
    'data-testid': testid = '',
    class: className = '',
    action,
    help,
    children,
  }: Props = $props();
</script>

<div
  class="flex flex-col {className}"
  data-testid={testid || title.replaceAll(' ', '-').toLowerCase()}
>
  <div class="relative rounded-t-2xl bg-primary-300-700 p-4 items-center flex">
    {#if required}<span class="absolute top-0 left-1 p-1 text-error-600-400 text-xs"
        >* Required</span
      >{/if}
    <div class="flex-auto text-center">
      <div class="font-bold">{title}</div>
      {#if subtitle}<div>{subtitle}</div>{/if}
    </div>
    {#if action}<span class="flex-none ml-1">{@render action()}</span>{/if}
    {#if help}<span class="flex-none ml-1">{@render help()}</span>{/if}
  </div>
  <div class="h-full p-2 border rounded-b-2xl border-surface-300-700">
    {@render children?.()}
  </div>
</div>

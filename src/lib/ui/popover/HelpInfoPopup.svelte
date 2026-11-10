<script lang="ts">
  import Popover from '#lib/ui/popover/Popover.svelte';
  import { sanitizeHTML } from '#lib/utils/html.ts';
  import type { Snippet } from 'svelte';

  interface Props {
    text?: string;
    'data-testid'?: string;
    type?: 'question' | 'info' | 'exclamation' | 'xmark';
    color?: 'primary' | 'warning';
    size?: string;
    popoverSize?: string;
    children?: Snippet;
  }

  const {
    text,
    'data-testid': testid,
    type = 'question',
    color = 'primary',
    size = '',
    popoverSize = '',
    children,
  }: Props = $props();

  const colors = {
    primary: 'text-primary-950-50 hover:text-primary-300-700',
    warning: 'text-warning-950-50 hover:text-warning-300-700',
  };
</script>

{#if text || children}
  <div data-testid={testid}>
    <Popover data-testid="{testid}-content" triggerTypes={['click', 'hover']} size={popoverSize}>
      {#snippet trigger()}
        <i class="fa-solid fa-circle-{type} {colors[color]} {size}"></i>
      {/snippet}
      {#if children}
        {@render children?.()}
      {:else if text}
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html sanitizeHTML(text)}
      {/if}
    </Popover>
  </div>
{/if}

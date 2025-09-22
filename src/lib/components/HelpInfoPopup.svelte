<script lang="ts">
  import Popover from '$lib/components/Popover.svelte';
  import { sanitizeHTML } from '$lib/utilities/HTML';
  import type { Snippet } from 'svelte';

  interface Props {
    text?: string;
    id?: string;
    type?: 'question' | 'info' | 'exclamation' | 'xmark';
    color?: string;
    size?: string;
    children?: Snippet;
  }

  const {
    text,
    id = '',
    type = 'question',
    color = 'primary',
    size = '',
    children,
  }: Props = $props();
</script>

{#if text || children}
  <div data-testid={id}>
    <Popover data-testid="{id}-content" triggerTypes={['click', 'hover']}>
      {#snippet trigger()}
        <i class="fa-solid fa-circle-{type} text-{color}-950-50 hover:text-{color}-300-700 {size}"
        ></i>
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
